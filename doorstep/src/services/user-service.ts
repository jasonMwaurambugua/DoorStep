import { User } from '../models/user';
import { User as UserType } from '../types';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export class UserService {
    private users: User[] = [];

    async register(userData: UserType): Promise<User> {
        const hashedPassword = await bcrypt.hash(userData.password, 10);
        const newUser = new User({ ...userData, password: hashedPassword });
        this.users.push(newUser);
        return newUser;
    }

    async login(email: string, password: string): Promise<string | null> {
        const user = this.users.find(user => user.email === email);
        if (user && await bcrypt.compare(password, user.password)) {
            return jwt.sign({ id: user.id, email: user.email }, 'your_jwt_secret', { expiresIn: '1h' });
        }
        return null;
    }

    getUserProfile(userId: string): User | undefined {
        return this.users.find(user => user.id === userId);
    }

    updateUserProfile(userId: string, updatedData: Partial<UserType>): User | undefined {
        const userIndex = this.users.findIndex(user => user.id === userId);
        if (userIndex !== -1) {
            this.users[userIndex] = { ...this.users[userIndex], ...updatedData };
            return this.users[userIndex];
        }
        return undefined;
    }

    deleteUser(userId: string): boolean {
        const userIndex = this.users.findIndex(user => user.id === userId);
        if (userIndex !== -1) {
            this.users.splice(userIndex, 1);
            return true;
        }
        return false;
    }
}