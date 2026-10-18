import { Schema, model } from 'mongoose';

export type UserRole = 'seeker' | 'realtor' | 'admin';

export interface UserRecord {
    name: string;
    email: string;
    phone: string;
    passwordHash: string;
    role: UserRole;
    emailVerified: boolean;
    realtorVerified: boolean;
    savedListingIds: string[];
    loginChallengeId?: string;
    loginOtpHash?: string;
    loginOtpExpiresAt?: Date;
    loginOtpAttempts: number;
}

const userSchema = new Schema<UserRecord>({
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: { type: String, required: true, trim: true, lowercase: true, unique: true, index: true },
    phone: { type: String, required: true, trim: true, maxlength: 25 },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ['seeker', 'realtor', 'admin'], required: true, default: 'seeker', index: true },
    emailVerified: { type: Boolean, default: false },
    realtorVerified: { type: Boolean, default: false },
    savedListingIds: [{ type: Schema.Types.ObjectId, ref: 'Listing' }],
    loginChallengeId: { type: String, select: false },
    loginOtpHash: { type: String, select: false },
    loginOtpExpiresAt: { type: Date, select: false },
    loginOtpAttempts: { type: Number, default: 0, select: false },
}, { timestamps: true });

export const User = model<UserRecord>('User', userSchema);