import { Router } from 'express';
import mongoose from 'mongoose';
import { Agency, AgencyMembership } from '../models/agency';
import { requireAuth, requireRole } from '../middleware/auth';

const router = Router();

router.get('/', async (_req, res) => {
    if (mongoose.connection.readyState !== 1) return res.status(503).json({ message: 'Agency directory is temporarily unavailable.' });
    const agencies = await Agency.find({ status: 'active' }).select('name county').sort({ name: 1 }).limit(100).lean().exec();
    return res.json({ agencies });
});

router.get('/mine', requireAuth, requireRole('realtor'), async (req, res) => {
    if (mongoose.connection.readyState !== 1) return res.status(503).json({ message: 'Agency memberships are temporarily unavailable.' });
    const memberships = await AgencyMembership.find({ userId: req.authUser!.id }).populate('agencyId', 'name county status').lean().exec();
    return res.json({ memberships });
});

router.post('/', requireAuth, requireRole('realtor'), async (req, res) => {
    const { name, registrationNumber, county } = req.body as Record<string, unknown>;
    if (typeof name !== 'string' || name.trim().length < 2 || typeof registrationNumber !== 'string' || !registrationNumber.trim() || typeof county !== 'string' || !county.trim()) {
        return res.status(400).json({ message: 'Agency name, registration number and county are required.' });
    }
    try {
        const agency = await Agency.create({ name, registrationNumber, county, ownerId: req.authUser!.id, status: 'pending' });
        await AgencyMembership.create({ agencyId: agency.id, userId: req.authUser!.id, role: 'owner', status: 'active' });
        return res.status(201).json({ agency, message: 'Agency submitted for verification.' });
    } catch (error) {
        if (error && typeof error === 'object' && 'code' in error && error.code === 11000) return res.status(409).json({ message: 'That registration number is already registered.' });
        return res.status(400).json({ message: error instanceof Error ? error.message : 'Could not submit agency.' });
    }
});

router.post('/:id/join', requireAuth, requireRole('realtor'), async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid agency ID.' });
    const agency = await Agency.findOne({ _id: req.params.id, status: 'active' }).select('_id').lean().exec();
    if (!agency) return res.status(404).json({ message: 'Active agency not found.' });
    try {
        const membership = await AgencyMembership.create({ agencyId: agency._id, userId: req.authUser!.id, role: 'agent', status: 'pending' });
        return res.status(201).json({ membership, message: 'Membership request sent.' });
    } catch (error) {
        if (error && typeof error === 'object' && 'code' in error && error.code === 11000) return res.status(409).json({ message: 'You already belong to or have requested this agency.' });
        return res.status(400).json({ message: 'Could not request agency membership.' });
    }
});

export default router;