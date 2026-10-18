import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import nodemailer from 'nodemailer';
import { Inquiry } from '../models/inquiry';
import { Listing } from '../models/listing';
import { User } from '../models/user';

const router = Router();
const inquiryLimiter = rateLimit({ windowMs: 60 * 60 * 1000, limit: 8, standardHeaders: 'draft-8', legacyHeaders: false });

router.post('/', inquiryLimiter, async (req, res) => {
  if (mongoose.connection.readyState !== 1) return res.status(503).json({ message: 'Inquiries are temporarily unavailable.' });
  const { listingId, name, phone, message } = req.body as Record<string, unknown>;
  if (!mongoose.isValidObjectId(String(listingId || '')) || typeof name !== 'string' || !name.trim() || typeof phone !== 'string' || !phone.trim() || typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ message: 'A property, name, phone number and message are required.' });
  }

  try {
    const listing = await Listing.findOne({ _id: listingId, status: 'active', verified: true }).select('_id title ownerId').lean().exec();
    if (!listing) return res.status(404).json({ message: 'Property not found.' });
    const inquiry = await Inquiry.create({ listingId, name, phone, message });
    if (process.env.SMTP_HOST && process.env.SMTP_FROM) {
      try {
        const owner = await User.findById(listing.ownerId).select('email').lean().exec();
        if (owner) {
          const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT || 587),
            secure: Number(process.env.SMTP_PORT) === 465,
            auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD } : undefined,
          });
          await transporter.sendMail({ from: process.env.SMTP_FROM, to: owner.email, subject: `New Doorstep inquiry for ${listing.title}`, text: `${name} (${phone}) is interested in your property.\n\n${message}` });
        }
      } catch (error) {
        console.error(`Inquiry email failed: ${error instanceof Error ? error.message : 'unknown error'}`);
      }
    }
    return res.status(201).json({ id: inquiry.id, message: 'Your inquiry has been sent to the realtor.' });
  } catch {
    return res.status(500).json({ message: 'Could not send your inquiry.' });
  }
});

export default router;