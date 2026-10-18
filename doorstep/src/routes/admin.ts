import { Router } from 'express';
import mongoose from 'mongoose';
import { Agency, AgencyMembership } from '../models/agency';
import { Listing } from '../models/listing';
import { User } from '../models/user';
import { requireAuth, requireRole } from '../middleware/auth';

const router = Router();
router.use(requireAuth, requireRole('admin'));

router.get('/queue', async (_req, res) => {
    if (mongoose.connection.readyState !== 1) return res.status(503).json({ message: 'Moderation queue is temporarily unavailable.' });
    const [listings, agencies, realtors, memberships] = await Promise.all([
        Listing.find({ status: 'pending' }).populate('ownerId', 'name email realtorVerified').sort({ createdAt: 1 }).limit(100).lean().exec(),
        Agency.find({ status: 'pending' }).populate('ownerId', 'name email').sort({ createdAt: 1 }).limit(100).lean().exec(),
        User.find({ role: 'realtor', emailVerified: true, realtorVerified: false }).select('name email phone createdAt').sort({ createdAt: 1 }).limit(100).lean().exec(),
        AgencyMembership.find({ status: 'pending' }).populate('agencyId', 'name').populate('userId', 'name email').limit(100).lean().exec(),
    ]);
    return res.json({ listings, agencies, realtors, memberships });
});

router.patch('/realtors/:id/verify', async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid realtor ID.' });
    if (typeof req.body.approved !== 'boolean') return res.status(400).json({ message: 'Set approved to true or false.' });
    const user = await User.findOneAndUpdate({ _id: req.params.id, role: 'realtor', emailVerified: true }, { realtorVerified: req.body.approved }, { new: true }).select('name email realtorVerified').lean().exec();
    if (!user) return res.status(404).json({ message: 'Realtor not found.' });
    if (!req.body.approved) await Listing.updateMany({ ownerId: user._id, status: 'active' }, { status: 'paused', verified: false }).exec();
    return res.json({ user });
});

router.patch('/listings/:id/review', async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid property ID.' });
    if (!['approve', 'reject'].includes(req.body.action)) return res.status(400).json({ message: 'Choose approve or reject.' });
    const approved = req.body.action === 'approve';
    const pendingListing = await Listing.findOne({ _id: req.params.id, status: 'pending' }).select('ownerId').lean().exec();
    if (!pendingListing) return res.status(404).json({ message: 'Pending property not found.' });
    if (approved) {
        const owner = await User.findOne({ _id: pendingListing.ownerId, role: 'realtor', realtorVerified: true }).select('_id').lean().exec();
        if (!owner) return res.status(409).json({ message: 'Verify the listing realtor before approving this property.' });
    }
    const listing = await Listing.findOneAndUpdate(
        { _id: req.params.id, status: 'pending' },
        { status: approved ? 'active' : 'rejected', verified: approved },
        { new: true },
    ).lean().exec();
    if (!listing) return res.status(404).json({ message: 'Pending property not found.' });
    return res.json({ listing });
});

router.patch('/agencies/:id/review', async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid agency ID.' });
    if (!['approve', 'reject'].includes(req.body.action)) return res.status(400).json({ message: 'Choose approve or reject.' });
    const approved = req.body.action === 'approve';
    const agency = await Agency.findOneAndUpdate({ _id: req.params.id, status: 'pending' }, { status: approved ? 'active' : 'rejected' }, { new: true }).lean().exec();
    if (!agency) return res.status(404).json({ message: 'Pending agency not found.' });
    return res.json({ agency });
});

router.patch('/memberships/:id/review', async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid membership ID.' });
    if (!['approve', 'reject'].includes(req.body.action)) return res.status(400).json({ message: 'Choose approve or reject.' });
    const membership = await AgencyMembership.findOneAndUpdate(
        { _id: req.params.id, status: 'pending' },
        { status: req.body.action === 'approve' ? 'active' : 'rejected' },
        { new: true },
    ).lean().exec();
    if (!membership) return res.status(404).json({ message: 'Pending membership not found.' });
    return res.json({ membership });
});

export default router;