const multer = require('multer');
const prisma = require('../config/prisma');

// Images are stored as bytes directly in the database (Media table) so they
// survive backend redeploys — the app server's local disk is wiped on every
// deploy, but the database is persistent.
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|gif|webp|svg|avif|mp4|mov|avi|mkv|webm/;
  const ext = allowed.test(file.originalname.split('.').pop().toLowerCase());
  const mime = allowed.test(file.mimetype);
  if (ext || mime) cb(null, true);
  else cb(new Error('Only image and video files are allowed'));
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 20 * 1024 * 1024 } });

const uploadImage = async (req, res) => {
  try {
    const file = req.file || (req.files && req.files[0]);
    if (!file) return res.status(400).json({ message: 'No file uploaded' });

    const folder = req.query.type || 'blogs';
    const media = await prisma.media.create({
      data: {
        filename: file.originalname,
        mimeType: file.mimetype,
        folder,
        data: file.buffer,
      },
      select: { id: true },
    });

    const url = `/media/${media.id}`;
    console.log('Upload saved to database:', url, `(${file.size} bytes)`);
    res.json({ url });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: 'Upload failed', error: error.message });
  }
};

const getMedia = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(404).send('Not found');
    const media = await prisma.media.findUnique({ where: { id } });
    if (!media) return res.status(404).send('Not found');
    res.set('Content-Type', media.mimeType);
    res.set('Cache-Control', 'public, max-age=31536000, immutable');
    res.end(Buffer.from(media.data));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { upload, uploadImage, getMedia };
