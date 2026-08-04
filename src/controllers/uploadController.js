const multer = require('multer');
const path = require('path');
const fs = require('fs');

const baseUploadDir = process.env.UPLOADS_PATH || path.resolve(__dirname, '../../uploads');

['blogs', 'projects', 'reviews', 'case-studies'].forEach(sub => {
  const dir = path.join(baseUploadDir, sub);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log('Created upload dir:', dir);
  }
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const type = req.query.type || 'blogs';
    const dest = path.join(baseUploadDir, type);
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, unique + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|gif|webp|svg|avif|mp4|mov|avi|mkv|webm/;
  const ext = allowed.test(path.extname(file.originalname).toLowerCase());
  const mime = allowed.test(file.mimetype);
  if (ext || mime) cb(null, true);
  else cb(new Error('Only image and video files are allowed'));
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 200 * 1024 * 1024 } });

const uploadImage = (req, res) => {
  try {
    const file = req.file || (req.files && req.files[0]);
    if (!file) return res.status(400).json({ message: 'No file uploaded' });

    const type = req.query.type || 'blogs';
    const url = `/uploads/${type}/${file.filename}`;

    console.log('Upload saved:', file.path);
    res.json({ url });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: 'Upload failed', error: error.message });
  }
};

module.exports = { upload, uploadImage };
