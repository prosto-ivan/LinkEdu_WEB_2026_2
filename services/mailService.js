const nodemailer = require('nodemailer');

function isMailConfigured() {
    return (
        process.env.MAIL_HOST &&
        process.env.MAIL_PORT &&
        process.env.MAIL_USER &&
        process.env.MAIL_PASS &&
        process.env.MAIL_FROM
    );
}

async function sendEmail({ to, subject, html }) {
    if (!isMailConfigured()) {
        return {
            sent: false,
            reason: 'Пошта не налаштована'
        };
    }

    try {
        const transporter = nodemailer.createTransport({
            host: process.env.MAIL_HOST,
            port: Number(process.env.MAIL_PORT),
            secure: false,
            auth: {
                user: process.env.MAIL_USER,
                pass: process.env.MAIL_PASS
            }
        });

        await transporter.sendMail({
            from: process.env.MAIL_FROM,
            to,
            subject,
            html
        });

        return {
            sent: true
        };
    } catch (error) {
        console.error('Помилка відправки email:', error.message);

        return {
            sent: false,
            reason: error.message
        };
    }
}

async function sendVerificationEmail(email, token) {
    return await sendEmail({
        to: email,
        subject: 'Підтвердження email',
        html: `
            <h2>Підтвердження email</h2>
            <p>Для підтвердження пошти використайте цей токен:</p>
            <h3>${token}</h3>
        `
    });
}

async function sendPasswordResetEmail(email, token) {
    return await sendEmail({
        to: email,
        subject: 'Відновлення пароля',
        html: `
            <h2>Відновлення пароля</h2>
            <p>Для скидання пароля використайте цей токен:</p>
            <h3>${token}</h3>
            <p>Токен діє 15 хвилин.</p>
        `
    });
}

module.exports = {
    sendVerificationEmail,
    sendPasswordResetEmail
};