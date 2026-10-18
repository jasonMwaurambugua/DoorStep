import { Router } from 'express';
import mongoose from 'mongoose';
import { requireAuth } from '../middleware/auth';
import { Listing } from '../models/listing';
import { User } from '../models/user';

const router = Router();
router.use(requireAuth);

router.get('/me', async (req, res) => {
    if (mongoose.connection.readyState !== 1) return res.status(503).json({ message: 'Your account is temporarily unavailable.' });
    const user = await User.findById(req.authUser!.id).select('name email phone role emailVerified realtorVerified').lean().exec();
    if (!user) return res.status(404).json({ message: 'Account not found.' });
    return res.json({ user });
});

router.get('/saved', async (req, res) => {
    if (mongoose.connection.readyState !== 1) return res.status(503).json({ message: 'Saved properties are temporarily unavailable.' });
    const user = await User.findById(req.authUser!.id).select('savedListingIds').lean().exec();
    if (!user) return res.status(404).json({ message: 'Account not found.' });
    const listings = await Listing.find({ _id: { $in: user.savedListingIds }, status: 'active', verified: true }).lean().exec();
    return res.json({ listings });
});

router.put('/saved/:listingId', async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.listingId)) return res.status(400).json({ message: 'Invalid property ID.' });
    const listing = await Listing.findOne({ _id: req.params.listingId, status: 'active', verified: true }).select('_id').lean().exec();
    if (!listing) return res.status(404).json({ message: 'Verified property not found.' });
    const saved = req.body.saved === true;
    await User.updateOne({ _id: req.authUser!.id }, saved
        ? { $addToSet: { savedListingIds: listing._id } }
        : { $pull: { savedListingIds: listing._id } }).exec();
    return res.json({ saved });
});

export default router;