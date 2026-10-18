import { Schema, model } from 'mongoose';

interface InquiryRecord {
  listingId: Schema.Types.ObjectId;
  name: string;
  phone: string;
  message: string;
  status: 'new' | 'contacted' | 'closed';
}

const inquirySchema = new Schema<InquiryRecord>({
  listingId: { type: Schema.Types.ObjectId, ref: 'Listing', required: true, index: true },
  name: { type: String, required: true, trim: true, maxlength: 100 },
  phone: { type: String, required: true, trim: true, maxlength: 25 },
  message: { type: String, required: true, trim: true, maxlength: 2000 },
  status: { type: String, enum: ['new', 'contacted', 'closed'], default: 'new', index: true },
}, { timestamps: true });

export const Inquiry = model<InquiryRecord>('Inquiry', inquirySchema);