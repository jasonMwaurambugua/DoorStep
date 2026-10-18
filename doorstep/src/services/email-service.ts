import nodemailer from 'nodemailer';

export async function sendLoginCode(email: string, code: string): Promise<boolean> {
    const host = process.env.SMTP_HOST;
    const from = process.env.SMTP_FROM;
    if (host && from) {
        const transporter = nodemailer.createTransport({
            host,
            port: Number(process.env.SMTP_PORT || 587),
            secure: Number(process.env.SMTP_PORT) === 465,
            auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD } : undefined,
        });
        await transporter.sendMail({
            from,
            to: email,
            subject: 'Your Doorstep sign-in code',
            text: `Your Doorstep sign-in code is ${code}. It expires in 10 minutes. If you did not request this, you can ignore this email.`,
        });
        return false;
    }
    if (process.env.NODE_ENV === 'production') throw new Error('Email delivery is not configured.');
    console.info(`[Doorstep development OTP] ${email}: ${code}`);
    return true;
}