const multer = require('multer');
const path = require('path');
const fs = require('fs');

const baseUploadDir = path.join(__dirname, '../../uploads');

['blogs', 'projects', 'reviews'].forEach(sub => {
  const dir = path.join(baseUploadDir, sub);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

const getDestination = (req) => {
  // Multer's destination runs before body fields are parsed, so we must read the type from the query string.
  const type = req.query.type || 'blogs';
  const dest = path.join(baseUploadDir, type);
  console.log('📁  Destination for type', type, ':', dest);
  return dest;
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Use the query‑based getDestination helper.
    cb(null, getDestination(req));
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
  // Support both single file (req.file) and any file (req.files)
  const file = req.file || (req.files && req.files[0]);
  if (!file) return res.status(400).json({ message: 'No file uploaded' });
  // Use query param for type (fallback to 'blogs') because body fields are not parsed yet.
  const type = req.query.type || 'blogs';
  console.log('🔍  Upload received. Type (query):', type);
  console.log('🗂️  File info:', file);
  console.log('🖼️  Saved to path:', file.path);
  // Return a relative path; the frontend will prepend the backend origin.
  const url = `/uploads/${type}/${file.filename}`;
  res.json({ url });
};

module.exports = { upload, uploadImage };
