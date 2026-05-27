import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import {
  getAssignments,
  getAssignment,
  createAssignment,
  updateAssignment,
  deleteAssignment,
  downloadPDF,
  regenerateAssignment,
  getJobStatus,
} from '../controllers/assignment.controller';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

// Ensure uploads directory exists
const uploadDir = process.env.UPLOAD_DIR || './uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => cb(null, `${uuidv4()}${path.extname(file.originalname)}`),
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (_req, file, cb) => {
    const allowedMimetypes = ['application/pdf', 'text/plain'];
    if (allowedMimetypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and TXT files are allowed'));
    }
  },
});

const router = Router();

// All routes require authentication
router.use(authenticate);

router.get('/', getAssignments);
router.get('/:id', getAssignment);
router.get('/:id/status', getJobStatus);
router.get('/:id/pdf', downloadPDF);
router.post('/', upload.single('file'), createAssignment);
router.patch('/:id', updateAssignment);
router.delete('/:id', deleteAssignment);
router.post('/:id/regenerate', regenerateAssignment);

export default router;
