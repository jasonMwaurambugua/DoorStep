import 'dotenv/config';
import mongoose from 'mongoose';
import { User } from '../models/user';

async function main() {
    const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    if (!email) throw new Error('Set ADMIN_EMAIL to an existing account email.');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/doorstep');
    const user = await User.findOneAndUpdate({ email }, { role: 'admin' }, { new: true }).select('email role').lean().exec();
    if (!user) throw new Error('No account found for ADMIN_EMAIL. Register the account first.');
    console.info(`Granted admin role to ${user.email}. Sign in again to refresh the session.`);
    await mongoose.disconnect();
}

main().catch(async (error: Error) => {
    console.error(error.message);
    await mongoose.disconnect();
    process.exitCode = 1;
});
