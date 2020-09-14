// See src/config/mailerConfig.js for configuration

const nodemailer = require('nodemailer');
const config = require('../config/mailerConfig.js');

module.exports = {
    emailPasswordReset
}

const transporter = nodemailer.createTransport({
    service: config.emailService,
    auth: {
        user: config.email,
        pass: config.emailPassword
    }
});

async function emailPasswordReset(email, token, redirectUrl) {
    if (process.env.NODE_ENV === 'test') return;

    const redirect = redirectUrl || process.env.FRONTEND_ORIGIN;
    const url = `${process.env.PUBLIC_URL}/user/resetpassword/${token}?redirect${redirect}`;

    const mailOptions = {
        from: config.email,
        to: email,
        subject: config.emailSubject,
        text: config.emailText.replace('{url}', url),
    };

    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            console.log(error);
        } else {
            console.log('Password reset email was sent to ' + email + '\nInfo: ' + info);
        }
    });
}