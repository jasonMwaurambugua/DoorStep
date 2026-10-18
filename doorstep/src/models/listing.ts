import { Schema, model } from 'mongoose';

export interface ListingRecord {
    title: string;
    description: string;
    purpose: 'sale' | 'rent' | 'short_stay';
    price: number;
    pricePeriod: 'total' | 'monthly' | 'nightly';
    propertyType: 'Apartment' | 'House' | 'Townhouse' | 'Land' | 'Commercial';
    neighborhood: string;
    city: string;
    county: string;
    images: string[];
    bedrooms: number;
    bathrooms: number;
    area: number;
    maxGuests: number;
    minimumNights: number;
    stayType: 'entire_place' | 'private_room' | 'shared_room';
    availabilityStart?: Date;
    availabilityEnd?: Date;
    agentName: string;
    agentPhone: string;
    agency: string;
    agencyId?: Schema.Types.ObjectId;
    ownerId: Schema.Types.ObjectId;
    verified: boolean;
    status: 'pending' | 'active' | 'rejected' | 'paused' | 'expired';
    geoLocation?: { type: 'Point'; coordinates: [number, number] };
}

const listingSchema = new Schema<ListingRecord>({
    title: { type: String, required: true, trim: true, maxlength: 140 },
    description: { type: String, required: true, trim: true, maxlength: 4000 },
    purpose: { type: String, enum: ['sale', 'rent', 'short_stay'], required: true, index: true },
    price: { type: Number, required: true, min: 1, index: true },
    pricePeriod: { type: String, enum: ['total', 'monthly', 'nightly'], required: true },
    propertyType: { type: String, enum: ['Apartment', 'House', 'Townhouse', 'Land', 'Commercial'], required: true },
    neighborhood: { type: String, required: true, trim: true, index: true },
    city: { type: String, required: true, trim: true, index: true },
    county: { type: String, required: true, trim: true, index: true },
    images: { type: [String], required: true, validate: [(images: string[]) => images.length >= 1 && images.length <= 10, 'A listing needs 1 to 10 image URLs'] },
    bedrooms: { type: Number, min: 0, default: 0 },
    bathrooms: { type: Number, min: 0, default: 0 },
    area: { type: Number, min: 0, default: 0 },
    maxGuests: { type: Number, min: 1, max: 16, default: 1 },
    minimumNights: { type: Number, min: 1, max: 365, default: 1 },
    stayType: { type: String, enum: ['entire_place', 'private_room', 'shared_room'], default: 'entire_place' },
    availabilityStart: { type: Date },
    availabilityEnd: { type: Date },
    agentName: { type: String, required: true, trim: true, maxlength: 100 },
    agentPhone: { type: String, required: true, trim: true, maxlength: 25 },
    agency: { type: String, trim: true, maxlength: 120, default: 'Independent realtor' },
    agencyId: { type: Schema.Types.ObjectId, ref: 'Agency', index: true },
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    verified: { type: Boolean, default: false, index: true },
    status: { type: String, enum: ['pending', 'active', 'rejected', 'paused', 'expired'], default: 'pending', index: true },
    geoLocation: {
        type: { type: String, enum: ['Point'] },
        coordinates: { type: [Number] },
    },
}, { timestamps: true });

listingSchema.index({ geoLocation: '2dsphere' });
listingSchema.index({ title: 'text', description: 'text', neighborhood: 'text', city: 'text', county: 'text' });

export const Listing = model<ListingRecord>('Listing', listingSchema);