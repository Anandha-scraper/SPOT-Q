// Prevents JavaScript from accessing the cookie.
// Sends the cookie only over HTTPS.
// Sends the cookie only for same-site requests.
function getAuthCookieOptions() {
    return {
        httpOnly: true,
        secure: true,
        sameSite: 'strict'
    };
}
module.exports = { getAuthCookieOptions };

