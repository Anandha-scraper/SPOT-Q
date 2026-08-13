# Deploying SPOT-Q to the company server — step by step

This is the plain-language, do-it-yourself version of getting this project running on the
company's Ubuntu web server. If you already know Linux servers cold, `CLAUDE.md`'s "Deploying"
section is the terse version. This one explains *why* each step exists, not just what to type.

Company setup, for reference throughout this doc:

| Role | Host | What runs there |
|---|---|---|
| Web server | Ubuntu Linux, `192.168.22.44` | nginx + the Node API |
| DB server | MS SQL Server 2022, `192.168.7.56:1433` | the `spotq` database |

---

## 1. What you're actually building

```
Browser ──http://192.168.22.44/──> [ nginx :80 ]   Ubuntu web server
                                     ├── /      → frontend/dist (the built React app)
                                     └── /api/  → http://127.0.0.1:5000
                                                    [ node :5000, loopback only ]
                                                       └──TDS 1433──> SQL Server 192.168.7.56
```

Three pieces run on the Ubuntu box: **nginx** (the thing the browser actually talks to, on port
80), the **Node API** (`node server.js`, listening on `127.0.0.1:5000` — not reachable from
outside the box directly), and the **frontend** (a folder of static files, `frontend/dist`, that
nginx just serves like any other website).

**Why nginx sits in front of everything, instead of the browser talking to Node directly:**
When the browser and the API are on the exact same origin (same protocol+host+port, which is
what "the browser only ever talks to `http://192.168.22.44/`" gives you), the browser treats
every request as same-origin. That means no CORS, no preflight `OPTIONS` request before every
login/save, and cookies (which is how login sessions work here) behave normally. If the frontend
called `http://192.168.22.44:5000` directly instead, that's a *different* origin as far as the
browser is concerned, and everything gets more fragile. nginx routing `/api/*` to Node and
everything else to the static files is what makes "one address, `192.168.22.44`" actually work.

This is also why Node binds to `127.0.0.1` (loopback) instead of `0.0.0.0`: nothing on the LAN
should be able to reach port 5000 directly, only nginx, running on the same machine, should.

---

## 2. One-time server setup

Everything in this section you do **once**, the first time this project ever runs on this
machine. Later releases skip straight to section 4.

### 2.1 Install Node and nginx

```bash
sudo apt update
sudo apt install -y nginx
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node -v    # confirm 18 or newer
nginx -v
```

### 2.2 Create a dedicated, unprivileged user

Don't run the app as `root` or your own login user. Create one just for this:

```bash
sudo useradd --system --shell /usr/sbin/nologin --home /opt/spotq spotq
sudo mkdir -p /opt/spotq
sudo chown spotq:spotq /opt/spotq
```

### 2.3 Where things live

| What | Where | Why |
|---|---|---|
| The code | `/opt/spotq/` | Owned by the `spotq` user, not your login user |
| The real `.env` file | `/etc/spotq/.env` | **Never inside `/opt/spotq/`** — see below |
| nginx site config | `/etc/nginx/sites-available/spotq` | Standard nginx location |
| systemd service | `/etc/systemd/system/spotq-api.service` | Standard systemd location |

**Why `.env` lives outside the code folder, in `/etc/spotq/`:** `.env` holds the database
password and the JWT signing secret. It's excluded from every zip you build (see section 3) and
it's not in git history either — so there's no copy of it anywhere except this one file you
create by hand on the server. Keeping it in `/etc/spotq/` instead of inside `/opt/spotq/` means a
future "delete the old release folder and unzip the new one" never accidentally deletes it.

```bash
sudo mkdir -p /etc/spotq
sudo touch /etc/spotq/.env
sudo chown spotq:spotq /etc/spotq/.env
sudo chmod 600 /etc/spotq/.env
```

Fill it in using the variable table in `CLAUDE.md` ("Environment variables"). At minimum you
need: `PORT=5000`, `DATABASE_URL=...` (the real SQL Server connection string), `JWT_SECRET=...`
(a long random string), `JWT_EXPIRE=1d`, `HOST=127.0.0.1`, `FRONTEND_URL=http://192.168.22.44`,
`COOKIE_SECURE=false` (this is plain HTTP on the LAN, not HTTPS), `COOKIE_SAMESITE=lax`.

### 2.4 nginx site config

Create `/etc/nginx/sites-available/spotq`:

```nginx
server {
    listen 80;
    server_name 192.168.22.44;

    root /opt/spotq/frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

**Why `try_files $uri $uri/ /index.html` matters:** this is a React app using client-side
routing. A URL like `/melting/cupola-holder-log-sheet/report` isn't a real file on disk —
React Router only knows what to do with it *after* `index.html` has loaded and its JavaScript
has run. Without this line, nginx looks for a file at that exact path, doesn't find one, and
returns a 404 — which means **every hard refresh on any page except the home page breaks**.
`try_files` says: if the exact file isn't there, and the directory isn't there either, just
serve `index.html` and let React Router figure out the rest.

**Why the `X-Forwarded-For` / `X-Real-IP` headers matter:** the Node app logs the IP address of
every login (`LoginActivity.ip`). Without nginx forwarding the real client IP in these headers,
Node only ever sees nginx's own address — every single login in the audit log would show
`127.0.0.1`, which is useless for actually knowing who logged in from where.

Enable it:

```bash
sudo ln -s /etc/nginx/sites-available/spotq /etc/nginx/sites-enabled/spotq
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t          # should print "syntax is ok" / "test is successful"
sudo systemctl reload nginx
```

### 2.5 systemd service (keeps the Node API running)

Create `/etc/systemd/system/spotq-api.service`:

```ini
[Unit]
Description=SPOT-Q backend API
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=spotq
WorkingDirectory=/opt/spotq/backend
EnvironmentFile=/etc/spotq/.env
ExecStart=/usr/bin/node server.js
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
```

**Why `Restart=on-failure` is not optional:** `backend/server.js` calls `process.exit(1)` if it
can't connect to the database when it starts up. That's deliberate — better to fail loudly than
silently serve broken requests. But it means if SQL Server has a brief network hiccup at the
exact moment the API is starting (e.g. after a server reboot), the API just dies and stays dead
forever *unless* systemd is told to restart it. `RestartSec=5` gives it a 5-second gap before
each retry so it doesn't hammer a database that's still coming back up.

```bash
sudo systemctl daemon-reload
sudo systemctl enable spotq-api
```
(Don't `start` it yet — there's no code in `/opt/spotq` until section 3.)

---

## 3. Getting the code onto the server

Pick **one** of these two methods.

### Method 1 — manual zip (recommended if you want full control over what ships)

There's no packaging script for this anymore (the earlier one was written for an automated
release flow that no longer exists in this branch's history) — so you build the zip by hand.
The rule is simple:

**Exclude these before zipping:**
- `node_modules/` (in both `backend/` and `frontend/` — huge, and gets reinstalled on the server
  anyway with `npm ci`/`npm install`)
- `frontend/dist/` (the built output — you rebuild it on the server in section 5, don't ship a
  stale copy)
- `.git/` (the whole git history — no reason to ship it)
- **every `.env*` file** — `.env`, `.env.local`, `.env.production`, anything matching. This one
  is not optional: these files hold the real database password and JWT secret. `zip`/`tar`
  **do not read `.gitignore`** — a careless `zip -r . -o spotq.zip` from the repo root will
  happily include `.env` if it exists in your working copy, and now the DB password is sitting
  in a zip file that gets emailed around or dropped on a shared drive. Always double-check.

**Include this even though it's normally gitignored:**
- `package-lock.json` in **both** `backend/` and `frontend/`. These are gitignored in the repo
  (so a plain `git archive` would drop them), but the server needs them for `npm ci`, which
  installs the *exact* dependency versions you tested with. Without the lockfile, the server
  falls back to `npm install`, which can silently resolve newer package versions than what you
  actually tested — works on your machine, breaks on the server, for no visible reason.

From the repo root:

```bash
zip -r spotq.zip . \
  -x 'node_modules/*' -x '*/node_modules/*' \
  -x 'frontend/dist/*' \
  -x '.git/*' \
  -x '*.env' -x '*.env.*'
```

**Verify it's clean before you send it anywhere:**

```bash
unzip -l spotq.zip | grep -i env      # should print NOTHING
unzip -l spotq.zip | grep node_modules  # should print NOTHING
unzip -l spotq.zip | grep package-lock.json  # should print TWO lines (backend + frontend)
```

Then transfer it (`scp spotq.zip user@192.168.22.44:~/`) and on the server:

```bash
unzip spotq.zip -d /tmp/spotq-release
sudo rsync -a --delete /tmp/spotq-release/ /opt/spotq/ --exclude=.env
sudo chown -R spotq:spotq /opt/spotq
```

### Method 2 — `git clone` directly on the server

Simpler day-to-day (later updates are just `git pull`), but has one real tradeoff you should
know going in: **`package-lock.json` is gitignored in this repo**, so a fresh clone doesn't have
it. That means this method uses `npm install` instead of `npm ci` unless you separately copy the
lockfiles over — same "may resolve different versions" risk described above, just less visible
because there's no zip-building step to remind you.

Also needs the server to actually reach GitHub — either an SSH deploy key or a personal access
token, since this is presumably a private repo.

```bash
sudo -u spotq git clone git@github.com:Anandha-scraper/SPOT-Q.git /opt/spotq
cd /opt/spotq
sudo -u spotq git checkout production
```

For later updates: `cd /opt/spotq && sudo -u spotq git pull origin production`, then repeat
section 5 below.

---

## 4. The SQL Server migration — blocked right now, don't skip past this

**This step cannot actually be done yet.** The company database at `192.168.7.56` needs a real
Prisma migration baseline before `npx prisma migrate deploy` will create any tables at all —
and that baseline has to be generated by running `npx prisma migrate dev` against a SQL Server
that's actually reachable, which right now, none is (the local VM's SQL Server isn't responding
to connections; running it against Docker is a possible alternative, not yet done either). See
`CLAUDE.md`'s "Merging from sql" and "Known gaps" sections for the current state of this.

This isn't a step to improvise around — running `prisma migrate deploy` with `migrations/` empty
just creates zero tables and everything after it fails. Come back to this section once that's
sorted; everything in section 5 assumes it is.

---

## 5. Each release (repeatable — do this every time you deploy new code)

Once the code is on the server (section 3) and a real `.env` exists (section 2.3):

```bash
sudo -u spotq cp /etc/spotq/.env /opt/spotq/backend/.env

cd /opt/spotq/backend
sudo -u spotq npm ci              # or `npm install` if using the git-clone method
sudo -u spotq npx prisma migrate deploy

cd /opt/spotq/frontend
sudo -u spotq npm ci              # or `npm install`
sudo -u spotq npm run build       # produces frontend/dist — this is what nginx serves

sudo systemctl restart spotq-api
```

---

## 6. Smoke test — confirm it actually works before walking away

```bash
journalctl -u spotq-api -n 30
```
Look for `Server active on 127.0.0.1:5000` — if the host shown isn't `127.0.0.1`, `HOST` is
misconfigured in `.env`.

```bash
ss -lntp | grep 5000
```
Should show it listening on `127.0.0.1:5000` only — if you see `0.0.0.0:5000`, the API is
directly reachable from the LAN, which it shouldn't be.

```bash
curl -si localhost/api/health
```
Should return `200` with `"database":"connected"`. A `503` means nginx and Node are fine but the
database isn't reachable — check `DATABASE_URL`.

Then in an actual browser, from another machine on the LAN, go to `http://192.168.22.44/`:
- Log in.
- Navigate to any department page, then **hard refresh** (Ctrl+Shift+R) on a deep URL like
  `/melting/cupola-holder-log-sheet/report`. It should load normally, not 404. (This is the
  `try_files` line from section 2.4 doing its job.)
- Open DevTools → Network tab, do a few actions (save an entry, view a report). You should see
  **no `OPTIONS` preflight requests** — if you do, something is cross-origin when it shouldn't
  be (check `VITE_API_BASE` wasn't accidentally set when `frontend` was built).

---

## 7. Rolling back

There's no automatic rollback — if a release goes bad:
- **Code**: keep the previous zip (or previous git commit) around; re-deploy it the same way.
- **Database**: Prisma migrations have **no down-migration**. If a release includes a schema
  change, take a SQL Server backup of `spotq` *before* running `prisma migrate deploy` for that
  release. Rolling back the code does **not** undo a migration that already ran.
