# SPOT-Q — `production` branch

Quality-control and process-management system for a foundry (Sakthi Auto). One page per
department (Tensile, Impact, Micro Tensile, Micro Structure, QC Production, Process, Melting,
Moulding, Sand Lab) plus Admin. Two independent packages, `backend/` and `frontend/`; there is
no root `package.json`.

## What this branch is for

`production` is the **deployment branch**. It runs on **MS SQL Server 2022**.
`sql` is the feature branch and stays on **Postgres**. UI work, features and bug fixes happen
on `sql` and are merged here; nothing about the database provider or deployment is ever
developed on `sql`.

That split is only safe because of the four invariants below. **Read "Merging from `sql`"
before merging anything into this branch.**

---

## The four invariants

| # | Invariant | File |
|---|---|---|
| 1 | `datasource db { provider = "sqlserver" }` | `backend/prisma/schema.prisma` |
| 2 | Runtime adapter is `PrismaMssql` | `backend/database/prisma.js` |
| 3 | `@prisma/adapter-mssql` present; `@prisma/adapter-pg` and `pg` absent | `backend/package.json` |
| 4 | `migrations/` holds the SQL Server baseline; no Postgres DDL | `backend/prisma/migrations/` |

Plus one frontend invariant: **`VITE_API_BASE` must stay unset** (see Topology).

`scripts/package-release.sh` re-checks all of these and refuses to build a release ZIP if any
has been reverted.

## Merging from `sql`

```bash
git checkout production
git merge sql
bash scripts/package-release.sh   # refuses to package if an invariant was reverted
```

If it refuses, restore the invariants by hand, then re-run. If the merge changed any **model**
in `schema.prisma`, do not keep `sql`'s Postgres migration — regenerate against SQL Server:

```bash
rm -rf backend/prisma/migrations
cd backend && npx prisma migrate dev --name <change_name>   # against the LOCAL VM first
```

**Why this is procedure and not automation.** A `.gitattributes` `merge=ours` driver looks like
the obvious fix but does not work: merge drivers fire only on *conflicting* files, and a new
Postgres migration on `sql` arrives here as an *added* path, which merges cleanly and silently.
The script is the guard, not git.

Merges stay cheap because the schema's portability contract keeps model bodies byte-identical
across both branches — only the one-line `datasource` block differs.

### Schema portability contract

Anything added to `schema.prisma` on **either** branch must be valid on both providers:

- no `enum` (unsupported on sqlserver) — use `String` validated in the service layer against
  `backend/utils/constants.js`
- no `Json` columns, no scalar list fields
- no provider-specific `@db.*` beyond what the file already uses
- `@db.VarChar(n)` on every primary key, foreign key and indexed string. This is mandatory, not
  cosmetic: an un-annotated `String` becomes `NVARCHAR(1000)` on SQL Server, and an index key
  over 900 bytes is rejected.
- primary keys are client-side `String @id @default(uuid()) @db.VarChar(36)` — no identity/sequence
- exactly **one** cascade path into `users` (`LoginActivity`). Every other `createdBy` relation
  uses `onDelete: NoAction`, because SQL Server rejects multiple cascade paths to one table.

---

## Topology

```
Browser ──http://192.168.22.44/──> [ nginx :80 ]   Ubuntu web server, 192.168.22.44
                                     ├── /      → /opt/spotq/frontend/dist
                                     └── /api/  → http://127.0.0.1:5000
                                                    [ node :5000, loopback-bound ]
                                                       └──TDS 1433──> MS SQL Server 2022
                                                                      192.168.7.56
```

The SPA and API share **one origin**. Deployment steps are in "Deploying" below; nginx and
systemd are configured by hand on the server.

**`VITE_API_BASE` is a build-time substitution, not runtime config.** Vite bakes it into the
bundle at `npm run build`. Unset ⇒ `API_BASE = ''` ⇒ relative URLs ⇒ nginx routes `/api`.
Setting it produces absolute URLs, moves every call cross-origin, adds a preflight to every
request, and breaks the cookie story. Leave it unset in both dev and production — the Vite dev
proxy reproduces what nginx does.

Local mirror for development: this Ubuntu box → VirtualBox VM (Windows Server 2022 + SQL Server
+ SSMS) on `127.0.0.1:1433` via NAT port-forward, self-signed cert
(`TrustServerCertificate=true`). Always run `prisma migrate dev` against the VM first, never
against 192.168.7.56.

---

## Environment variables

There is **no `.env.example`** anywhere in the repo — it was deleted. This section and
`backend/.env.local` / `backend/.env.production` are the only record.

Fail-fast (server exits if missing): `PORT`, `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRE`.
Warn-only: `HOST`, `EDIT_TIME`, `FRONTEND_URL`, `DLOG`.
Also validated at boot by `assertCookieConfig()`: `COOKIE_SECURE`, `COOKIE_SAMESITE`.

| Var | Notes |
|---|---|
| `DATABASE_URL` | **Classic ADO string, not a URL**: `Server=host,1433;Database=spotq;User Id=..;Password=..;Encrypt=true;TrustServerCertificate=..`. A `;` or `=` in the password breaks parsing. |
| `HOST` | Defaults to `127.0.0.1`. Only nginx should reach the API. `0.0.0.0` exposes it to the LAN. |
| `FRONTEND_URL` | Required **even same-origin** — browsers attach `Origin` to same-origin POST/PUT/DELETE, so a wrong value 403s every mutation while GETs keep working. Exact scheme, no trailing slash. |
| `COOKIE_SECURE` | Keyed to transport, **not** `NODE_ENV`. `false` on plain-HTTP LAN, `true` under HTTPS. Wrong value = silent login bounce. `NODE_ENV=production` with this unset refuses to boot. |
| `COOKIE_SAMESITE` | `lax` same-origin. `none` requires `COOKIE_SECURE=true`. |
| `EDIT_TIME` | Non-admin edit window, e.g. `1h`, `30min`, or a bare number (seconds). Default 1 hour. |
| `DLOG` | Per-user download-log retention. Must be a positive integer; anything else falls back to 200. |
| `PRISMA_LOG` | `true` adds query logging. |
| `ADMIN_*` | Only read by `prisma/seed.js` (`npm run create-admin`). |

`DIRECT_URL` is gone — it existed only for Supabase's `:6543` transaction pooler. SQL Server
has no pooler/session split, so the CLI and runtime share one connection string.

## Commands

Run from each package directory.

```bash
# backend/
npm run dev            # nodemon
npm start
npm run create-admin   # seeds the admin from ADMIN_* env
npm run prisma:migrate # migrate dev  — LOCAL VM only
npm run prisma:deploy  # migrate deploy — used on the server
npm run prisma:studio

# frontend/
npm run dev            # :3000, proxies /api -> :5000
npm run build          # -> dist/  (VITE_API_BASE must not be set)
npm run lint           # currently broken: no ESLint config exists
```

There is **no test suite**. Verification is manual — curl plus the browser. See the smoke
checklist under "Deploying".

---

## Deploying

Releases are handed to the company as a ZIP; the server has no git and builds from the archive.

```bash
bash scripts/package-release.sh      # -> dist-release/spotq-<date>-<sha>.zip
```

It excludes `node_modules/`, `dist/`, `.git/` and — critically — **`.env*`**. `zip` does not
respect `.gitignore`, so a hand-rolled `zip -r` ships the production DB password and
`JWT_SECRET` to everyone the file passes through. It includes `package-lock.json` (so the
server can `npm ci`) and writes `BUILD-INFO.txt`, which is the only version record on a box
with no git.

On the server, first time only: install `nginx` + Node 18+, create an unprivileged `spotq`
user, write `/etc/nginx/sites-available/spotq` (serve `frontend/dist`, `try_files $uri $uri/
/index.html` for the SPA, proxy `/api/` to `127.0.0.1:5000` forwarding `X-Forwarded-For`), and
a systemd unit for `node server.js` with `Restart=on-failure`. Both are load-bearing:
without `try_files` a refresh on any deep route 404s; without `X-Forwarded-For` every login is
audited as `127.0.0.1`; without `Restart=on-failure` a brief DB outage leaves the API dead,
since `server.js` exits on a failed connection.

Each release:

```bash
unzip spotq-<date>-<sha>.zip && cd spotq-<date>-<sha>
cp /etc/spotq/.env backend/.env            # kept on the server, NOT in the ZIP
cd backend  && npm ci && npx prisma migrate deploy
cd ../frontend && npm ci && npm run build
sudo systemctl restart spotq-api
```

Smoke test: `journalctl -u spotq-api -n 30` shows `Server active on 127.0.0.1:5000`;
`ss -lntp | grep 5000` shows loopback only; `curl -si localhost/api/health` returns 200
`connected`; in a browser, log in, hard-refresh a deep route such as
`/melting/cupola-holder-log-sheet/report`, and confirm no `OPTIONS` preflights in DevTools.

Rollback is the previous ZIP — but a code rollback does **not** undo a migration. There are no
down-migrations; take a SQL Server backup before any release containing one.

## Architecture

Mandatory layering, no shortcuts:

```
Route → Controller → Middleware → Service → Repository → Prisma → Database
```

- **Controllers** do HTTP only. No Prisma import, no `try/catch` — wrap in `utils/asyncHandler`.
- **Services** hold business logic and validation, throw `AppError`.
- **Repositories** are the only layer that touches Prisma, and never throw `AppError`.
- `database/prisma.js` is the only `new PrismaClient` in the codebase. Grep invariant: exactly
  one hit.

Auth: JWT in the httpOnly cookie `__session`; the token carries only `{ id }` and the user is
re-read on every request. `GET /api/v1/auth/verify` is the frontend's entire session-invalidation
mechanism. Department access is gated by `middleware/access.js`; per-entry edit ownership and the
edit window by `middleware/entryAccess.js`.

Frontend: routing via a single `routeMap` in `app.jsx` behind `DepartmentRouteGuard`;
`AuthContext` re-verifies on mount and tab focus; all API URLs come from
`src/config/api.js` — never hardcode a path.

---

## SQL Server watch-items

The codebase is provider-clean (no Postgres SQL, no `ILIKE`, no `mode:'insensitive'`, no
`skipDuplicates`, every `skip`/`take` paired with `orderBy`). These are behavioural differences
rather than bugs — worth knowing when something misbehaves in production:

- **`upsert` compiles to `MERGE`**, not `INSERT … ON CONFLICT` (~25 sites). `MERGE` is not
  atomic against a concurrent insert without `HOLDLOCK`, so the race-closing guarantee the
  repository comments describe is weaker here. Two simultaneous first-writes for the same new
  date can surface `P2002`. The highest-value thing to load-test.
- **2100-parameter cap** per statement (Postgres allows 65535). `createMany` batches are sized
  by request payload in `sandRecordRepository.js`, `disaReportRepository.js` and
  `cupolaLogRepository.js` — a maximum-size DISA report is the realistic trigger.
- **Interactive `$transaction`** (`qcProductionRepository.js`) now spans a cross-host LAN hop.
  Prisma defaults to `timeout` 5s / `maxWait` 2s → `P2028` under congestion.
- **`distinct` is resolved client-side** on mssql (`processRepository.js`,
  `qcProductionRepository.js`) — every matching row crosses the wire before dedupe.
- **Clock skew matters.** `@default(now())` resolves on the DB host (192.168.7.56) but
  `EDIT_TIME` compares it to `Date.now()` on the web host (192.168.22.44). Keep both on NTP.
- `userRepository.deleteById` fails with an FK error for any user who authored entries. That is
  by design (`onDelete: NoAction`), not a bug.

## Known gaps

- **`scripts/package-release.sh` does not exist in this checkout** — not on disk, not anywhere in
  git history (`git log --all -- scripts/package-release.sh` is empty). This doc still describes
  it as the merge/release guard (see "Merging from `sql`" and "Deploying") because that's the
  intended procedure; the script itself apparently never actually got committed, the same gap
  `CLAUDE.md` itself had until it was fixed. Until it's rebuilt, `npx prisma validate` plus a
  manual check of the four invariants is the only guard after a merge.
- `backend/prisma/migrations/` is **empty again** after merging in `sql`'s deviation/edit-option
  work (2026-08-12): `sql` added real `createdBy`/`updatedAt` columns to `MeltingLogPrimary`,
  `CupolaLogEntry`, and `DmmParameterEntry`, each with its own Postgres migration. Those were
  deleted per invariant 4 rather than kept. The next `npx prisma migrate dev` against the local
  VM needs to produce a baseline covering the full current schema (not just these three columns)
  — still blocked on the same VM/SQL Server connectivity issue as before.
- That merge also surfaced a real mssql-specific schema bug, now fixed: adding
  `MeltingLogPrimary.creator` gave `User` two cascade paths into `MeltingLogEntry` (direct, and
  via `MeltingLogPrimary`'s cascade to its entries) because `onUpdate` defaults to `Cascade` even
  when `onDelete: NoAction` is set explicitly. Postgres allows this, so `sql` never surfaces it;
  SQL Server doesn't. Fixed with an explicit `onUpdate: NoAction` on the new relation
  (`schema.prisma` around the `MeltingLogPrimary.creator` field). Worth remembering as a pattern:
  any new `creator` relation added on `sql` that creates a second path to a model already reached
  another way needs the same explicit `onUpdate: NoAction`, and `sql`'s own Postgres testing will
  never catch it.
- `backend/prisma/schema.prisma` header cites `INFO.md` for its decision record. **That file has
  never existed** in any checkout; the content lives in `backend.md` in a sibling working copy.
  The pointer is left untouched on purpose so `schema.prisma` differs from `sql` by exactly one
  line (the `datasource` block), keeping merges trivial.
- `utils/prismaError.js` maps `P2002` index names to field names via `INDEX_TO_FIELDS`, keyed on
  **Postgres** names — `users_employeeId_key`, and now also
  `melting_log_primaries_meltingLogId_shift_furnaceNo_panel_key` and
  `cupola_log_primaries_cupolaLogId_shift_holderNumber_key` (added by the same `sql` merge). SQL
  Server generates different constraint names, so these lookups currently miss and fall back to
  the generic "A record with these values already exists" message. Fix by reading the real names
  from the generated migration once the baseline exists. Cosmetic only — no data risk.
- `package-lock.json` is gitignored, so a `git clone` of this repo cannot use `npm ci`. This
  does not affect the company deployment: releases ship as a ZIP, and `package-release.sh` (once
  it exists again) includes the lockfiles deliberately, so the server gets reproducible installs.
  It does mean a fresh clone and a release ZIP can resolve different dependency versions.
- `npm run lint` is configured but no ESLint config exists, and `npm run build` will not catch a
  dangling identifier.
- `backend.md` / `frontend.md` are referenced by ~12 source comments but are gitignored and
  absent here.
