const nodemailer = require('nodemailer');
const config = require('../config/emailConfig.json');

module.exports = emailPasswordReset;

const transporter = nodemailer.createTransport({
    service: config.emailService,
    auth: {
        user: config.email,
        pass: config.emailPassword
    }
});

async function emailPasswordReset(email, uuid) {
    const url = config.baseUrl + '/resetpassword/' + uuid;
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