import { Schema, model } from 'mongoose';

export interface AgencyRecord {
    name: string;
    registrationNumber: string;
    county: string;
    status: 'pending' | 'active' | 'rejected';
    ownerId: Schema.Types.ObjectId;
}

export interface AgencyMembershipRecord {
    agencyId: Schema.Types.ObjectId;
    userId: Schema.Types.ObjectId;
    role: 'owner' | 'agent';
    status: 'pending' | 'active' | 'rejected';
}

const agencySchema = new Schema<AgencyRecord>({
    name: { type: String, required: true, trim: true, maxlength: 140 },
    registrationNumber: { type: String, required: true, trim: true, maxlength: 80, unique: true },
    county: { type: String, required: true, trim: true, maxlength: 80 },
    status: { type: String, enum: ['pending', 'active', 'rejected'], default: 'pending', index: true },
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
}, { timestamps: true });

const membershipSchema = new Schema<AgencyMembershipRecord>({
    agencyId: { type: Schema.Types.ObjectId, ref: 'Agency', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    role: { type: String, enum: ['owner', 'agent'], required: true },
    status: { type: String, enum: ['pending', 'active', 'rejected'], default: 'pending', index: true },
}, { timestamps: true });
membershipSchema.index({ agencyId: 1, userId: 1 }, { unique: true });

export const Agency = model<AgencyRecord>('Agency', agencySchema);
export const AgencyMembership = model<AgencyMembershipRecord>('AgencyMembership', membershipSchema);