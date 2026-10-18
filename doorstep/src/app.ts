import 'dotenv/config';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import express from 'express';
import { NextFunction, Request, Response } from 'express';
import helmet from 'helmet';
import path from 'node:path';
import mongoose from 'mongoose';
import rateLimit from 'express-rate-limit';
import adminRouter from './routes/admin';
import agenciesRouter from './routes/agencies';
import authRouter from './routes/auth';
import inquiriesRouter from './routes/inquiries';
import listingsRouter from './routes/listings';
import uploadsRouter from './routes/uploads';
import usersRouter from './routes/users';

const app = express();
const port = Number(process.env.PORT || 3000);
const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/doorstep';
app.set('trust proxy', process.env.NODE_ENV === 'production' ? 1 : false);

const clientOrigins = process.env.CLIENT_URL?.split(',').map((origin) => origin.trim()).filter(Boolean);
const trustedOrigins = clientOrigins?.length ? clientOrigins : ['http://localhost:5173', 'http://127.0.0.1:5173'];
if (process.env.NODE_ENV === 'production') {
    const required = ['MONGODB_URI', 'JWT_SECRET', 'CLIENT_URL', 'SMTP_HOST', 'SMTP_FROM', 'CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'];
    const missing = required.filter((key) => !process.env[key]);
    if (missing.length) throw new Error(`Missing production configuration: ${missing.join(', ')}`);
    if ((process.env.JWT_SECRET || '').length < 32) throw new Error('JWT_SECRET must be at least 32 characters in production.');
    if (!clientOrigins?.length) throw new Error('CLIENT_URL must contain at least one allowed browser origin.');
    if (process.env.COOKIE_SECURE === 'false') throw new Error('COOKIE_SECURE must be true in production.');
}
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: clientOrigins?.length ? clientOrigins : true, credentials: true, maxAge: 600 }));
app.use(cookieParser());
app.use('/media', express.static(path.resolve('uploads'), { dotfiles: 'deny', index: false, maxAge: '7d', setHeaders: (res) => res.setHeader('X-Content-Type-Options', 'nosniff') }));
app.use((req, res, next) => {
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method) || !req.cookies?.doorstep_session) return next();
    const origin = req.get('origin');
    if (!origin || !trustedOrigins.includes(origin)) return res.status(403).json({ message: 'Request origin is not allowed.' });
    return next();
});
app.use(express.json({ limit: '256kb' }));
app.use('/api', rateLimit({ windowMs: 60 * 1000, limit: 120, standardHeaders: 'draft-8', legacyHeaders: false }));

app.get('/api/health', (_req, res) => {
    const connected = mongoose.connection.readyState === 1;
    return res.status(connected ? 200 : 503).json({ status: connected ? 'ok' : 'degraded', database: connected ? 'connected' : 'disconnected' });
});
app.use('/api', (req, res, next) => {
    if (req.path === '/auth/logout' || mongoose.connection.readyState === 1) return next();
    return res.status(503).json({ message: 'Database service is unavailable. Please try again shortly.' });
});
app.use('/api/listings', listingsRouter);
app.use('/api/inquiries', inquiriesRouter);
app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/agencies', agenciesRouter);
app.use('/api/uploads', uploadsRouter);
app.use('/api/admin', adminRouter);
app.use((_req, res) => res.status(404).json({ message: 'Route not found' }));
app.use((error: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error(`API request failed: ${error.message}`);
    return res.status(500).json({ message: 'An unexpected server error occurred.' });
});

app.listen(port, () => {
    console.log(`Doorstep API listening on http://localhost:${port}`);
    const connectMongo = () => mongoose.connect(mongoUri).catch((error: Error) => {
        console.error(`MongoDB connection failed: ${error.message}. Retrying in 5 seconds.`);
        const retry = setTimeout(() => void connectMongo(), 5000);
        retry.unref();
    });
    void connectMongo();
});