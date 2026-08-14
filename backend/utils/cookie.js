// Prevents JavaScript from accessing the cookie.
// Plain HTTP deployment (192.168.22.44, no TLS) — secure: true would stop the
// browser from ever sending the cookie at all.
// Sends the cookie only for same-site requests.
function getAuthCookieOptions() {
    return {
        httpOnly: true,
        secure: false,
        sameSite: 'strict'
    };
}
module.exports = { getAuthCookieOptions };

