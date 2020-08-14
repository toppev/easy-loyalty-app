const request = require("request");
const StatusError = require("../helpers/statusError");

const VERIFY_CAPTCHA = false

function verifyCAPTCHA(req, res, next) {
    if (process.env.NODE_ENV === 'test' || !VERIFY_CAPTCHA) {
        return next()
    }
    const secret = process.env.CAPTCHA_SECRET_KEY;
    const token = req.body.token;
    const url = `https://www.google.com/recaptcha/api/siteverify?secret=${secret}&response=${token}`;

    request.post({ url }, function (error, response, body) {
        if (JSON.parse(body).success === true) {
            next()
        } else {
            next(error || new StatusError('Invalid CAPTCHA token', 400))
        }
    })

}

module.exports = {
    verifyCAPTCHA
}