// NODE MODULES
const nodemailer = require('nodemailer');

// CONFIG > ENVIRONMENT
const { EMAIL_PASSWORD } = require('../../_config/environment');

async function sendMail({ from, to, subject, text, html }) {

    try {

        let transporter = nodemailer.createTransport({
            direct: true,
            host: 'smtp.yandex.ru',
            port: 465,
            secure: true,
            auth: {
                user: 'uitwaaien6@yandex.com', // generated ethereal user
                pass: EMAIL_PASSWORD, // generated ethereal password
            },
        });

        await transporter.sendMail({
            from, // sender address
            to, // list of receivers
            subject, // Subject line
            text: text ? text : '', // plain text body
            html: html ? html : undefined, // html body
        });

    } catch (error) {
        console.log(` ! Error in sendEmail.js`, error.message);
    }
    
}

module.exports = {
    sendMail
}
