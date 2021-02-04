// NODE MODULES
const nodemailer = require('nodemailer');

// CONFIG > ENVIRONMENT
const { EMAIL_PASSWORD } = require('../../_config/environment');

async function sendMail(package) {

    try {

        let transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'ruzgarata6@gmail.com', // generated ethereal user
                pass: EMAIL_PASSWORD, // generated ethereal password
            },
        });

        await transporter.sendMail({
            from: package.from, // sender address
            to: package.to, // list of receivers
            subject: package.subject, // Subject line
            text: package.text, // plain text body
            html: package.html, // html body
        });

    } catch (error) {
        console.log(` ! Error in sendEmail.js`, error.message);
    }
    
}

module.exports = {
    sendMail
}
