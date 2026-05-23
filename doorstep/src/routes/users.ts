import { Router } from 'express';
import { UsersController } from '../controllers/users';

const router = Router();
const usersController = new UsersController();

export function setUsersRoutes(app) {
    app.use('/api/users', router);
    
    router.get('/profile', usersController.getUserProfile.bind(usersController));
    router.put('/profile', usersController.updateUserProfile.bind(usersController));
    router.delete('/profile', usersController.deleteUser.bind(usersController));
}