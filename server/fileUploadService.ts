import multer from 'multer';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import express from 'express';

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Ensure upload directories exist
const UPLOAD_DIR = path.join(__dirname, 'uploads');
const FREELANCER_UPLOAD_DIR = path.join(UPLOAD_DIR, 'freelancers');

// Create directories if they don't exist
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}
if (!fs.existsSync(FREELANCER_UPLOAD_DIR)) {
  fs.mkdirSync(FREELANCER_UPLOAD_DIR, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, FREELANCER_UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueId = uuidv4();
    const timestamp = Date.now();
    const extension = path.extname(file.originalname);
    const filename = `profile_${timestamp}_${uniqueId}${extension}`;
    cb(null, filename);
  }
});

// File filter for image validation
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Check file type
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPG, PNG, and WebP images are allowed.'));
  }
};

// Configure multer
export const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB limit
    files: 1 // Only one file at a time
  }
});

// Image processing service
export class ImageProcessingService {
  /**
   * Process and optimize uploaded image
   * @param inputPath - Path to the uploaded image
   * @param outputPath - Path where processed image should be saved
   * @param options - Processing options
   */
  static async processImage(
    inputPath: string,
    outputPath: string,
    options: {
      width?: number;
      height?: number;
      quality?: number;
      format?: 'jpeg' | 'png' | 'webp';
    } = {}
  ): Promise<void> {
    const {
      width = 300,
      height = 300,
      quality = 85,
      format = 'jpeg'
    } = options;

    try {
      await sharp(inputPath)
        .resize(width, height, {
          fit: 'cover',
          position: 'center'
        })
        .jpeg({ quality })
        .toFile(outputPath);
    } catch (error) {
      console.error('Error processing image:', error);
      throw new Error('Failed to process image');
    }
  }

  /**
   * Generate thumbnail for profile photo
   * @param inputPath - Path to the original image
   * @param freelancerId - Freelancer ID for unique naming
   * @returns Path to the generated thumbnail
   */
  static async generateProfileThumbnail(
    inputPath: string,
    freelancerId: string
  ): Promise<string> {
    const timestamp = Date.now();
    const thumbnailFilename = `thumb_${freelancerId}_${timestamp}.jpg`;
    const thumbnailPath = path.join(FREELANCER_UPLOAD_DIR, thumbnailFilename);

    await this.processImage(inputPath, thumbnailPath, {
      width: 300,
      height: 300,
      quality: 85,
      format: 'jpeg'
    });

    return `/uploads/freelancers/${thumbnailFilename}`;
  }

  /**
   * Delete old profile photo if it exists
   * @param photoUrl - URL of the photo to delete
   */
  static async deleteOldPhoto(photoUrl: string): Promise<void> {
    if (!photoUrl) return;

    try {
      // Extract filename from URL
      const filename = path.basename(photoUrl);
      const filePath = path.join(FREELANCER_UPLOAD_DIR, filename);
      
      // Check if file exists and delete it
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`Deleted old photo: ${filename}`);
      }
    } catch (error) {
      console.error('Error deleting old photo:', error);
      // Don't throw error as this is not critical
    }
  }

  /**
   * Validate image file
   * @param file - Multer file object
   * @returns Validation result
   */
  static validateImageFile(file: Express.Multer.File): { valid: boolean; error?: string } {
    // Check file size (2MB limit)
    if (file.size > 2 * 1024 * 1024) {
      return { valid: false, error: 'File size exceeds 2MB limit' };
    }

    // Check file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.mimetype)) {
      return { valid: false, error: 'Invalid file type. Only JPG, PNG, and WebP images are allowed.' };
    }

    // Check file extension
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
    const fileExtension = path.extname(file.originalname).toLowerCase();
    if (!allowedExtensions.includes(fileExtension)) {
      return { valid: false, error: 'Invalid file extension.' };
    }

    return { valid: true };
  }
}

// Middleware for handling file upload errors
export const handleUploadError = (error: any, req: any, res: any, next: any) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File size exceeds 2MB limit'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files. Only one file allowed.'
      });
    }
  }
  
  if (error.message.includes('Invalid file type')) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }

  console.error('Upload error:', error);
  res.status(500).json({
    success: false,
    message: 'File upload failed'
  });
};

// Serve static files
export const serveStaticFiles = (app: any) => {
  app.use('/uploads', (req: any, res: any, next: any) => {
    // Add security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
  });
  
  app.use('/uploads', express.static(UPLOAD_DIR));
};
