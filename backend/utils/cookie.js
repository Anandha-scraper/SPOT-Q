// Auth cookie flags, deliberately decoupled from NODE_ENV.
//
// The browser only cares about two facts, both properties of the deployment
// rather than the build mode:
//   - `Secure` cookies are silently dropped over plain HTTP.
//   - `SameSite=None` is silently rejected unless `Secure` is also set.
// Both failures look like "login succeeded, then bounced back to the login
// screen", so the config is validated at startup rather than at first login.

const VALID_SAME_SITE = ['lax', 'strict', 'none'];

const readSecure = () => process.env.COOKIE_SECURE === 'true';
const readSameSite = () => (process.env.COOKIE_SAMESITE || 'lax').toLowerCase();

// Must be spread into both res.cookie and res.clearCookie: a cookie is only
// cleared by a Set-Cookie whose flags match the one that set it.
function getAuthCookieOptions() {
    return {
        httpOnly: true,
        secure: readSecure(),
        sameSite: readSameSite()
    };
}

function assertCookieConfig() {
    const secure = readSecure();
    const sameSite = readSameSite();

    if (!VALID_SAME_SITE.includes(sameSite)) {
        throw new Error(
            `COOKIE_SAMESITE must be one of: ${VALID_SAME_SITE.join(', ')} — got "${process.env.COOKIE_SAMESITE}".`
        );
    }

    if (sameSite === 'none' && !secure) {
        throw new Error(
            'COOKIE_SAMESITE=none requires COOKIE_SECURE=true — browsers reject SameSite=None without Secure.'
        );
    }

    // Guard the migration: NODE_ENV used to drive these flags, so a deployment
    // carrying NODE_ENV=production without the new vars would silently downgrade.
    if (process.env.NODE_ENV === 'production' && process.env.COOKIE_SECURE === undefined) {
        throw new Error(
            'NODE_ENV=production no longer implies secure cookies. Set COOKIE_SECURE explicitly ' +
            '(true when users reach the app over HTTPS, false for a plain-HTTP LAN deployment).'
        );
    }

    return { secure, sameSite };
}

module.exports = { getAuthCookieOptions, assertCookieConfig };
