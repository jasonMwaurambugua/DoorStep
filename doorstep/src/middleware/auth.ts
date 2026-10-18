import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

export type AuthRole = 'seeker' | 'realtor' | 'admin';
export interface AuthenticatedUser { id: string; role: AuthRole; }

declare global {
    namespace Express {
        interface Request { authUser?: AuthenticatedUser; }
    }
}

const secretKey = process.env.JWT_SECRET || 'development-only-change-me-before-deploy-32-chars';
if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET must be configured in production.');
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
    const [scheme, token] = (req.headers.authorization || '').split(' ');
    const sessionToken = req.cookies?.doorstep_session || (scheme === 'Bearer' ? token : undefined);
    if (!sessionToken) return res.status(401).json({ message: 'Sign in to continue.' });
    try {
        const payload = jwt.verify(sessionToken, secretKey, { issuer: 'doorstep-api', audience: 'doorstep-web' }) as jwt.JwtPayload;
        if (typeof payload.sub !== 'string' || !['seeker', 'realtor', 'admin'].includes(String(payload.role))) {
            return res.status(401).json({ message: 'Your session is invalid. Sign in again.' });
        }
        req.authUser = { id: payload.sub, role: payload.role as AuthRole };
        return next();
    } catch {
        return res.status(401).json({ message: 'Your session has expired. Sign in again.' });
    }
};

export function requireRole(...roles: AuthRole[]) {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.authUser || !roles.includes(req.authUser.role)) return res.status(403).json({ message: 'You do not have permission to do that.' });
        return next();
    };
}