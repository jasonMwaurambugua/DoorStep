import { Router } from 'express';
import mongoose from 'mongoose';
import { Listing } from '../models/listing';
import { User } from '../models/user';
import { Agency, AgencyMembership } from '../models/agency';
import { requireAuth, requireRole } from '../middleware/auth';

const router = Router();
const allowedPropertyTypes = ['Apartment', 'House', 'Townhouse', 'Land', 'Commercial'];

function hasStoredImages(images: unknown): images is string[] {
    return Array.isArray(images) && images.length >= 1 && images.length <= 10 && images.every((image) => {
        if (typeof image !== 'string') return false;
        try {
            const url = new URL(image);
            const isCloudinary = url.protocol === 'https:' && url.hostname === 'res.cloudinary.com';
            const isLocalMedia = url.protocol === 'http:'
                && (url.hostname === 'localhost' || url.hostname === '127.0.0.1')
                && url.pathname.startsWith('/media/');
            return isCloudinary || isLocalMedia;
        } catch {
            return false;
        }
    });
}

router.get('/mine', requireAuth, async (req, res) => {
    if (mongoose.connection.readyState !== 1) return res.status(503).json({ message: 'Your listings are temporarily unavailable.' });
    try {
        const listings = await Listing.find({ ownerId: req.authUser!.id }).sort({ createdAt: -1 }).lean().exec();
        return res.json({ listings, total: listings.length });
    } catch {
        return res.status(500).json({ message: 'Could not retrieve your listings.' });
    }
});

router.get('/', async (req, res) => {
    if (mongoose.connection.readyState !== 1) return res.status(503).json({ message: 'Property search is temporarily unavailable.' });

    const filter: Record<string, unknown> = { status: 'active', verified: true };
    const purpose = String(req.query.purpose || '');
    if (['sale', 'rent', 'short_stay'].includes(purpose)) filter.purpose = purpose;

    const location = String(req.query.location || '').trim();
    if (location) {
        const safeLocation = location.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const matcher = new RegExp(safeLocation, 'i');
        filter.$or = [{ neighborhood: matcher }, { city: matcher }, { county: matcher }];
    }

    const propertyType = String(req.query.propertyType || '');
    if (allowedPropertyTypes.includes(propertyType)) filter.propertyType = propertyType;
    const minBedrooms = Number(req.query.minBedrooms);
    if (Number.isFinite(minBedrooms) && minBedrooms > 0) filter.bedrooms = { $gte: minBedrooms };
    const maxPrice = Number(req.query.maxPrice);
    if (Number.isFinite(maxPrice) && maxPrice > 0) filter.price = { $lte: maxPrice };

    if (purpose === 'short_stay') {
        const guests = Number(req.query.guests || 1);
        if (!Number.isInteger(guests) || guests < 1 || guests > 16) return res.status(400).json({ message: 'Guest count must be between 1 and 16.' });
        filter.maxGuests = { $gte: guests };

        const checkIn = typeof req.query.checkIn === 'string' ? new Date(req.query.checkIn) : undefined;
        const checkOut = typeof req.query.checkOut === 'string' ? new Date(req.query.checkOut) : undefined;
        if ((checkIn && Number.isNaN(checkIn.getTime())) || (checkOut && Number.isNaN(checkOut.getTime()))) {
            return res.status(400).json({ message: 'Enter valid check-in and check-out dates.' });
        }
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (checkIn && checkIn < today) return res.status(400).json({ message: 'Check-in cannot be in the past.' });
        if (checkIn && checkOut) {
            const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / 86400000);
            if (nights < 1) return res.status(400).json({ message: 'Check-out must be after check-in.' });
            filter.minimumNights = { $lte: nights };
        }
        const availabilityFilters: Record<string, unknown>[] = [];
        if (checkIn) availabilityFilters.push({ $or: [{ availabilityStart: { $exists: false } }, { availabilityStart: null }, { availabilityStart: { $lte: checkIn } }] });
        if (checkOut) availabilityFilters.push({ $or: [{ availabilityEnd: { $exists: false } }, { availabilityEnd: null }, { availabilityEnd: { $gte: checkOut } }] });
        if (availabilityFilters.length) filter.$and = availabilityFilters;
    }

    try {
        const listings = await Listing.find(filter).sort({ verified: -1, createdAt: -1 }).limit(100).lean().exec();
        return res.json({ listings, total: listings.length });
    } catch {
        return res.status(500).json({ message: 'Could not retrieve properties.' });
    }
});

router.get('/:id', async (req, res) => {
    if (mongoose.connection.readyState !== 1) return res.status(503).json({ message: 'Property details are temporarily unavailable.' });
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid property ID.' });

    try {
        const listing = await Listing.findOne({ _id: req.params.id, status: 'active', verified: true }).lean().exec();
        if (!listing) return res.status(404).json({ message: 'Property not found.' });
        return res.json(listing);
    } catch {
        return res.status(500).json({ message: 'Could not retrieve property details.' });
    }
});

router.post('/', requireAuth, requireRole('realtor'), async (req, res) => {
    if (mongoose.connection.readyState !== 1) return res.status(503).json({ message: 'Publishing is temporarily unavailable.' });
    try {
        const owner = await User.findById(req.authUser!.id).exec();
        if (!owner) return res.status(401).json({ message: 'Your account is unavailable. Sign in again.' });
        const { agencyId, ...details } = req.body as Record<string, unknown>;
        if (!hasStoredImages(details.images)) return res.status(400).json({ message: 'Upload 1 to 10 property photos before submitting.' });
        if (!['sale', 'rent', 'short_stay'].includes(String(details.purpose))) return res.status(400).json({ message: 'Choose sale, rent, or short stay.' });
        const pricePeriod = details.purpose === 'sale' ? 'total' : details.purpose === 'rent' ? 'monthly' : 'nightly';
        if (details.purpose === 'short_stay') {
            const maxGuests = Number(details.maxGuests);
            const minimumNights = Number(details.minimumNights);
            if (!Number.isInteger(maxGuests) || maxGuests < 1 || maxGuests > 16) return res.status(400).json({ message: 'Guest capacity must be between 1 and 16.' });
            if (!Number.isInteger(minimumNights) || minimumNights < 1 || minimumNights > 365) return res.status(400).json({ message: 'Minimum stay must be between 1 and 365 nights.' });
            const availabilityStart = details.availabilityStart ? new Date(String(details.availabilityStart)) : undefined;
            const availabilityEnd = details.availabilityEnd ? new Date(String(details.availabilityEnd)) : undefined;
            if ((availabilityStart && Number.isNaN(availabilityStart.getTime())) || (availabilityEnd && Number.isNaN(availabilityEnd.getTime()))) {
                return res.status(400).json({ message: 'Enter valid availability dates.' });
            }
            if (availabilityStart && availabilityEnd && availabilityEnd < availabilityStart) return res.status(400).json({ message: 'Availability end must be after its start.' });
        }
        let agency: InstanceType<typeof Agency> | null = null;
        if (agencyId) {
            if (!mongoose.isValidObjectId(String(agencyId))) return res.status(400).json({ message: 'Choose a valid agency.' });
            const membership = await AgencyMembership.findOne({ agencyId, userId: owner.id, status: 'active' }).exec();
            agency = await Agency.findOne({ _id: agencyId, status: 'active' }).exec();
            if (!membership || !agency) return res.status(403).json({ message: 'You need an approved membership in that agency.' });
        }
        const listing = await Listing.create({
            ...details,
            pricePeriod,
            ownerId: owner.id,
            agentName: owner.name,
            agentPhone: owner.phone,
            agency: agency?.name || 'Independent realtor',
            agencyId: agency?.id,
            verified: false,
            status: 'pending',
        });
        return res.status(201).json(listing);
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Invalid property details.';
        return res.status(400).json({ message });
    }
});

router.patch('/:id', requireAuth, requireRole('realtor'), async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid property ID.' });
    const allowedFields = ['title', 'description', 'purpose', 'price', 'propertyType', 'neighborhood', 'city', 'county', 'images', 'bedrooms', 'bathrooms', 'area', 'maxGuests', 'minimumNights', 'stayType', 'availabilityStart', 'availabilityEnd'];
    const changes = Object.fromEntries(Object.entries(req.body as Record<string, unknown>).filter(([key]) => allowedFields.includes(key)));
    if (changes.purpose) changes.pricePeriod = changes.purpose === 'sale' ? 'total' : changes.purpose === 'rent' ? 'monthly' : 'nightly';
    if ('images' in changes && !hasStoredImages(changes.images)) return res.status(400).json({ message: 'Use 1 to 10 uploaded Cloudinary image URLs.' });
    try {
        const listing = await Listing.findOneAndUpdate(
            { _id: req.params.id, ownerId: req.authUser!.id },
            { $set: { ...changes, status: 'pending', verified: false } },
            { new: true, runValidators: true },
        ).exec();
        if (!listing) return res.status(404).json({ message: 'Property not found in your account.' });
        return res.json(listing);
    } catch (error) {
        return res.status(400).json({ message: error instanceof Error ? error.message : 'Could not update property.' });
    }
});

router.delete('/:id', requireAuth, requireRole('realtor'), async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid property ID.' });
    try {
        const listing = await Listing.findOneAndDelete({ _id: req.params.id, ownerId: req.authUser!.id }).exec();
        if (!listing) return res.status(404).json({ message: 'Property not found in your account.' });
        return res.status(204).end();
    } catch {
        return res.status(500).json({ message: 'Could not delete property.' });
    }
});

export default router;