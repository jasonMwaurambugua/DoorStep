import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import multer from 'multer';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { requireAuth, requireRole } from '../middleware/auth';

const router = Router();
const localImageExtensions: Record<string, string> = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
    'image/avif': '.avif',
};
const imageUploadLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: 'draft-8', legacyHeaders: false });
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 8 * 1024 * 1024, files: 10, fieldSize: 1024 },
    fileFilter: (_req, file, callback) => {
        if (!['image/jpeg', 'image/png', 'image/webp', 'image/avif'].includes(file.mimetype)) return callback(new Error('Use JPG, PNG, WebP or AVIF image files.'));
        return callback(null, true);
    },
});

function uploadToCloudinary(file: Express.Multer.File, userId: string): Promise<UploadApiResponse> {
    cloudinary.config({ cloud_name: process.env.CLOUDINARY_CLOUD_NAME, api_key: process.env.CLOUDINARY_API_KEY, api_secret: process.env.CLOUDINARY_API_SECRET });
    return new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream({ folder: `doorstep/listings/${userId}`, resource_type: 'image' }, (error, result) => {
            if (error || !result) return reject(error || new Error('Image upload failed.'));
            return resolve(result);
        }).end(file.buffer);
    });
}

router.post('/images', requireAuth, requireRole('realtor'), imageUploadLimiter, (req, res, next) => {
    upload.array('images', 10)(req, res, (error) => {
        if (!error) return next();
        if (error instanceof multer.MulterError) return res.status(400).json({ message: error.code === 'LIMIT_FILE_SIZE' ? 'Each image must be smaller than 8 MB.' : 'Upload up to 10 images per property.' });
        return res.status(400).json({ message: error instanceof Error ? error.message : 'Invalid image upload.' });
    });
}, async (req, res) => {
    const files = req.files as Express.Multer.File[] | undefined;
    if (!files?.length) return res.status(400).json({ message: 'Choose at least one image.' });
    try {
        const hasCloudinary = Boolean(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);
        if (hasCloudinary) {
            const uploaded = await Promise.all(files.map((file) => uploadToCloudinary(file, req.authUser!.id)));
            return res.status(201).json({ images: uploaded.map((image) => ({ url: image.secure_url, publicId: image.public_id, width: image.width, height: image.height })) });
        }
        if (process.env.NODE_ENV === 'production') return res.status(503).json({ message: 'Production image storage is not configured.' });
        const directory = path.join(process.cwd(), 'uploads', req.authUser!.id);
        await mkdir(directory, { recursive: true });
        const images = await Promise.all(files.map(async (file) => {
            const filename = `${randomUUID()}${localImageExtensions[file.mimetype]}`;
            await writeFile(path.join(directory, filename), file.buffer, { flag: 'wx' });
            return { url: `${req.protocol}://${req.get('host')}/media/${req.authUser!.id}/${filename}`, publicId: filename };
        }));
        return res.status(201).json({ images });
    } catch {
        return res.status(502).json({ message: 'Could not store images. Please try again.' });
    }
});

export default router;