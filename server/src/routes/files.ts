import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';
import { FileModel } from '../models/File';
import { ProjectModel } from '../models/Project';
import { ActivityLogger } from '../utils/activityLogger';

const router = express.Router();

// Ensure upload directories exist
const uploadDir = path.join(process.cwd(), 'uploads');
const thumbnailDir = path.join(uploadDir, 'thumbnails');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
if (!fs.existsSync(thumbnailDir)) {
  fs.mkdirSync(thumbnailDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'), // 10MB default
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, and WebP are allowed.'));
    }
  }
});

// Helper function to create thumbnail
const createThumbnail = async (inputPath: string, outputPath: string, size: number = 300): Promise<void> => {
  try {
    await sharp(inputPath)
      .resize(size, size, { 
        fit: 'cover',
        position: 'center'
      })
      .jpeg({ quality: 85 })
      .toFile(outputPath);
  } catch (error) {
    console.error('Error creating thumbnail:', error);
    throw error;
  }
};

// POST /api/files/upload
router.post('/upload', upload.array('files', 10), async (req, res) => {
  try {
    console.log('File upload request received');
    console.log('Body:', req.body);
    console.log('Files:', req.files);

    const userId = req.user!.id;
    const projectId = parseInt(req.body.projectId);
    const files = req.files as Express.Multer.File[];

    if (!projectId) {
      return res.status(400).json({ error: 'Project ID is required' });
    }

    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    // Verify project exists and belongs to user
    const project = ProjectModel.findById(projectId, userId);
    if (!project) {
      // Clean up uploaded files
      files.forEach(file => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
      return res.status(404).json({ error: 'Project not found' });
    }

    console.log('Processing', files.length, 'files for project', projectId);

    const processedFiles = [];
    const errors = [];

    for (const file of files) {
      try {
        // Create thumbnail
        const thumbnailName = `thumb-${file.filename}`;
        const thumbnailPath = path.join(thumbnailDir, thumbnailName);
        
        await createThumbnail(file.path, thumbnailPath);

        // Create file record in database
        const fileRecord = await FileModel.create({
          project_id: projectId,
          user_id: userId,
          filename: file.filename,
          original_filename: file.originalname,
          file_size: file.size,
          file_path: file.path,
          thumbnail_path: thumbnailPath,
          mime_type: file.mimetype,
          status: 'queued'
        });

        processedFiles.push({
          id: fileRecord.id,
          filename: file.filename,
          originalName: file.originalname,
          size: file.size,
          thumbnail: `/uploads/thumbnails/${thumbnailName}`,
          status: 'queued'
        });

        console.log('File processed successfully:', file.originalname);
      } catch (error) {
        console.error('Error processing file:', file.originalname, error);
        errors.push(`${file.originalname}: ${error.message}`);
        
        // Clean up file if processing failed
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      }
    }

    // Update project file count
    ProjectModel.updateStats(projectId);

    // Log activity
    ActivityLogger.log(userId, 'files_uploaded', 'project', projectId, {
      fileCount: processedFiles.length,
      totalSize: files.reduce((sum, file) => sum + file.size, 0)
    });

    console.log('Upload completed. Processed:', processedFiles.length, 'Errors:', errors.length);

    res.json({
      message: `${processedFiles.length} files uploaded successfully`,
      files: processedFiles,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('Upload error:', error);
    
    // Clean up any uploaded files on error
    if (req.files) {
      (req.files as Express.Multer.File[]).forEach(file => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
    }

    res.status(500).json({ 
      error: 'File upload failed',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/files/project/:projectId
router.get('/project/:projectId', async (req, res) => {
  try {
    const userId = req.user!.id;
    const projectId = parseInt(req.params.projectId);
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const status = req.query.status as string;

    // Verify project access
    const project = ProjectModel.findById(projectId, userId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const files = await FileModel.findByProject(projectId, { page, limit, status });

    // Формируем абсолютные ссылки
    const baseUrl = req.protocol + '://' + req.get('host');
    const filesWithThumbnails = files.map(f => ({
      ...f,
      thumbnail: f.thumbnail_path
        ? baseUrl + f.thumbnail_path.replace(/\\/g, '/').replace(/^.*\/uploads/, '/uploads')
        : '',
      url: f.file_path
        ? baseUrl + f.file_path.replace(/\\/g, '/').replace(/^.*\/uploads/, '/uploads')
        : ''
    }));

    res.json(filesWithThumbnails);
  } catch (error) {
    console.error('Get project files error:', error);
    res.status(500).json({ error: 'Failed to fetch files' });
  }
});

// PUT /api/files/:id
router.put('/:id', async (req, res) => {
  try {
    const userId = req.user!.id;
    const fileId = parseInt(req.params.id);
    
    const file = await FileModel.update(fileId, userId, req.body);
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    ActivityLogger.log(userId, 'file_updated', 'file', fileId, {
      changes: Object.keys(req.body)
    });

    res.json(file);
  } catch (error) {
    console.error('Update file error:', error);
    res.status(500).json({ error: 'Failed to update file' });
  }
});

// DELETE /api/files/:id
router.delete('/:id', async (req, res) => {
  try {
    const userId = req.user!.id;
    const fileId = parseInt(req.params.id);
    
    const success = await FileModel.delete(fileId, userId);
    if (!success) {
      return res.status(404).json({ error: 'File not found' });
    }

    ActivityLogger.log(userId, 'file_deleted', 'file', fileId);
    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Delete file error:', error);
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

// POST /api/files/:id/reprocess
router.post('/:id/reprocess', async (req, res) => {
  try {
    const userId = req.user!.id;
    const fileId = parseInt(req.params.id);
    
    const file = await FileModel.reprocess(fileId, userId);
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    ActivityLogger.log(userId, 'file_reprocessed', 'file', fileId);
    res.json({ message: 'File queued for reprocessing', file });
  } catch (error) {
    console.error('Reprocess file error:', error);
    res.status(500).json({ error: 'Failed to reprocess file' });
  }
});

export default router;