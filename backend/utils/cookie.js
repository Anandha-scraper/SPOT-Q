// Cookie flags are deliberately decoupled from NODE_ENV; a bad combo looks like a silent login bounce, so this is validated at startup — see backend.md.

const VALID_SAME_SITE = ['lax', 'strict', 'none'];

const readSecure = () => process.env.COOKIE_SECURE === 'true';
const readSameSite = () => (process.env.COOKIE_SAMESITE || 'lax').toLowerCase();

// Must be spread into both res.cookie and res.clearCookie — a cookie only clears via matching flags.
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

    // NODE_ENV=production no longer implies secure cookies — COOKIE_SECURE must be set explicitly.
    if (process.env.NODE_ENV === 'production' && process.env.COOKIE_SECURE === undefined) {
        throw new Error(
            'NODE_ENV=production no longer implies secure cookies. Set COOKIE_SECURE explicitly ' +
            '(true when users reach the app over HTTPS, false for a plain-HTTP LAN deployment).'
        );
    }

    return { secure, sameSite };
}

module.exports = { getAuthCookieOptions, assertCookieConfig };
