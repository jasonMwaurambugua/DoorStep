import { randomInt, randomUUID } from 'node:crypto';
import { Response, Router } from 'express';
import rateLimit from 'express-rate-limit';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { requireAuth, requireRole } from '../middleware/auth';
import { User } from '../models/user';
import { sendLoginCode } from '../services/email-service';

const router = Router();
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 12, standardHeaders: 'draft-8', legacyHeaders: false });
const jwtSecret = process.env.JWT_SECRET || 'development-only-change-me-before-deploy-32-chars';
const secureCookie = process.env.COOKIE_SECURE ? process.env.COOKIE_SECURE === 'true' : process.env.NODE_ENV === 'production';

function publicUser(user: InstanceType<typeof User>) {
    return { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role, emailVerified: user.emailVerified, realtorVerified: user.realtorVerified };
}

async function issueLoginCode(user: InstanceType<typeof User>, res: Response) {
    const code = String(randomInt(100000, 1000000));
    const challengeId = randomUUID();
    user.loginChallengeId = challengeId;
    user.loginOtpHash = await bcrypt.hash(code, 10);
    user.loginOtpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
    user.loginOtpAttempts = 0;
    await user.save();

    try {
        const developmentMode = await sendLoginCode(user.email, code);
        return res.status(200).json({ requiresOtp: true, challengeId, expiresInSeconds: 600, ...(developmentMode ? { developmentCode: code } : {}) });
    } catch {
        user.loginChallengeId = undefined;
        user.loginOtpHash = undefined;
        user.loginOtpExpiresAt = undefined;
        await user.save();
        return res.status(503).json({ message: 'Email delivery is unavailable. Please try again later.' });
    }
}

router.post('/register', authLimiter, async (req, res) => {
    if (mongoose.connection.readyState !== 1) return res.status(503).json({ message: 'Account service is unavailable. Please try again shortly.' });
    const { name, email, phone, password, role } = req.body as Record<string, unknown>;
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    const normalizedRole = role === 'realtor' ? 'realtor' : 'seeker';
    if (typeof name !== 'string' || name.trim().length < 2 || !/^\S+@\S+\.\S+$/.test(normalizedEmail) || typeof phone !== 'string' || phone.trim().length < 7 || typeof password !== 'string' || password.length < 10) {
        return res.status(400).json({ message: 'Provide your name, valid email, phone number and a password of at least 10 characters.' });
    }

    try {
        const passwordHash = await bcrypt.hash(password, 12);
        const user = await User.create({ name, email: normalizedEmail, phone, passwordHash, role: normalizedRole });
        return issueLoginCode(user, res);
    } catch (error) {
        if (error && typeof error === 'object' && 'code' in error && error.code === 11000) return res.status(409).json({ message: 'An account with that email already exists.' });
        return res.status(500).json({ message: 'Could not create your account.' });
    }
});

router.post('/login', authLimiter, async (req, res) => {
    if (mongoose.connection.readyState !== 1) return res.status(503).json({ message: 'Sign-in is unavailable. Please try again shortly.' });
    const { email, password } = req.body as Record<string, unknown>;
    if (typeof email !== 'string' || typeof password !== 'string') return res.status(400).json({ message: 'Email and password are required.' });
    try {
        const user = await User.findOne({ email: email.trim().toLowerCase() }).select('+passwordHash').exec();
        if (!user || !await bcrypt.compare(password, user.passwordHash)) return res.status(401).json({ message: 'Email or password is incorrect.' });
        return issueLoginCode(user, res);
    } catch {
        return res.status(500).json({ message: 'Could not start sign-in. Please try again.' });
    }
});

router.post('/verify-otp', authLimiter, async (req, res) => {
    if (mongoose.connection.readyState !== 1) return res.status(503).json({ message: 'Code verification is unavailable. Please try again shortly.' });
    const { challengeId, code } = req.body as Record<string, unknown>;
    if (typeof challengeId !== 'string' || typeof code !== 'string' || !/^\d{6}$/.test(code)) return res.status(400).json({ message: 'Enter the six-digit code sent to your email.' });
    try {
        const user = await User.findOne({ loginChallengeId: challengeId, loginOtpExpiresAt: { $gt: new Date() }, loginOtpAttempts: { $lt: 5 } }).select('+loginOtpHash +loginOtpExpiresAt +loginOtpAttempts').exec();
        if (!user || !user.loginOtpHash) return res.status(401).json({ message: 'That code has expired or is invalid. Sign in again to get a new code.' });
        if (!await bcrypt.compare(code, user.loginOtpHash)) {
            user.loginOtpAttempts += 1;
            if (user.loginOtpAttempts >= 5) user.loginChallengeId = undefined;
            await user.save();
            return res.status(401).json({ message: 'That code is incorrect or expired.' });
        }

        user.emailVerified = true;
        user.loginChallengeId = undefined;
        user.loginOtpHash = undefined;
        user.loginOtpExpiresAt = undefined;
        user.loginOtpAttempts = 0;
        await user.save();
        const token = jwt.sign({ role: user.role }, jwtSecret, { subject: user.id, expiresIn: '8h', issuer: 'doorstep-api', audience: 'doorstep-web' });
        res.cookie('doorstep_session', token, { httpOnly: true, secure: secureCookie, sameSite: 'lax', maxAge: 8 * 60 * 60 * 1000, path: '/' });
        return res.json({ user: publicUser(user) });
    } catch {
        return res.status(500).json({ message: 'Could not verify the sign-in code.' });
    }
});

router.post('/logout', (_req, res) => {
    res.clearCookie('doorstep_session', { httpOnly: true, secure: secureCookie, sameSite: 'lax', path: '/' });
    return res.status(204).end();
});

router.post('/become-realtor', requireAuth, requireRole('seeker'), async (req, res) => {
    if (mongoose.connection.readyState !== 1) return res.status(503).json({ message: 'Account service is unavailable. Please try again shortly.' });
    const user = await User.findByIdAndUpdate(req.authUser!.id, { role: 'realtor', realtorVerified: false }, { new: true }).exec();
    if (!user) return res.status(404).json({ message: 'Account not found.' });
    const token = jwt.sign({ role: 'realtor' }, jwtSecret, { subject: user.id, expiresIn: '8h', issuer: 'doorstep-api', audience: 'doorstep-web' });
    res.cookie('doorstep_session', token, { httpOnly: true, secure: secureCookie, sameSite: 'lax', maxAge: 8 * 60 * 60 * 1000, path: '/' });
    return res.json({ user: publicUser(user) });
});

export default router;