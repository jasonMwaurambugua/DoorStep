import { Router } from 'express';
import AuthController from '../controllers/auth';

const router = Router();
const authController = new AuthController();

export function setAuthRoutes(app) {
    app.post('/api/auth/register', authController.register);
    app.post('/api/auth/login', authController.login);
    app.post('/api/auth/logout', authController.logout);
}