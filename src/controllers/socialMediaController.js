const prisma = require('../config/prisma');

const getSocialMedia = async (req, res) => {
  try {
    const items = await prisma.socialMedia.findMany({ orderBy: { position: 'asc' } });
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createSocialMedia = async (req, res) => {
  try {
    const { videoUrl, projectName, projectLink } = req.body;
    await prisma.socialMedia.updateMany({ data: { position: { increment: 1 } } });
    const item = await prisma.socialMedia.create({
      data: { videoUrl, projectName: projectName || null, projectLink: projectLink || null, position: 0 },
    });
    res.status(201).json(item);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateSocialMedia = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const item = await prisma.socialMedia.update({
      where: { id: parseInt(id) },
      data,
    });
    res.json(item);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteSocialMedia = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const item = await prisma.socialMedia.findUnique({ where: { id } });
    if (!item) return res.status(404).json({ message: 'Social media item not found' });
    await prisma.socialMedia.delete({ where: { id } });
    res.json({ message: 'Social media item deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const reorderSocialMedia = async (req, res) => {
  try {
    const { items } = req.body;
    if (!Array.isArray(items)) {
      return res.status(400).json({ message: 'items array is required' });
    }
    for (const item of items) {
      await prisma.socialMedia.update({
        where: { id: parseInt(item.id) },
        data: { position: parseInt(item.position) },
      });
    }
    const allItems = await prisma.socialMedia.findMany({ orderBy: { position: 'asc' } });
    res.json(allItems);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getSocialMedia, createSocialMedia, updateSocialMedia, deleteSocialMedia, reorderSocialMedia };
