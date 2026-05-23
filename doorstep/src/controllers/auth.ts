import { Request, Response } from 'express';
import UserService from '../services/user-service';

class AuthController {
    private userService: UserService;

    constructor() {
        this.userService = new UserService();
    }

    public async register(req: Request, res: Response): Promise<void> {
        try {
            const user = await this.userService.register(req.body);
            res.status(201).json(user);
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    }

    public async login(req: Request, res: Response): Promise<void> {
        try {
            const token = await this.userService.login(req.body);
            res.status(200).json({ token });
        } catch (error) {
            res.status(401).json({ message: error.message });
        }
    }

    public async logout(req: Request, res: Response): Promise<void> {
        // Implement logout logic if necessary
        res.status(200).json({ message: 'Logged out successfully' });
    }
}

export default AuthController;