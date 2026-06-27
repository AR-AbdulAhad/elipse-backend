const prisma = require('../config/prisma');

const normalize = (val) => {
  if (!val) return val;
  return val.replace(/^https?:\/\/[^/]+/, '');
};

const getReviews = async (req, res) => {
  try {
    const reviews = await prisma.review.findMany({ orderBy: { position: 'asc' } });
    const baseUrl = (process.env.VITE_BACKEND_URL || `http://localhost:${process.env.PORT || 5001}`).replace(/\/+$/, '');
    const buildUrl = (val) => {
      if (!val) return val;
      if (val.startsWith('http')) return val;
      const path = val.startsWith('/') ? val : `/${val}`;
      return `${baseUrl}${path}`;
    };
    const reviewsWithUrls = reviews.map(r => ({
      ...r,
      video: r.video ? buildUrl(r.video) : r.video,
    }));
    res.json(reviewsWithUrls);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createReview = async (req, res) => {
  try {
    const { clientName, company, projectName, projectLink, video } = req.body;
    await prisma.review.updateMany({ data: { position: { increment: 1 } } });
    const review = await prisma.review.create({
      data: {
        clientName,
        company: company || null,
        projectName: projectName || null,
        projectLink: projectLink || null,
        video: normalize(video),
        position: 0,
      },
    });
    res.status(201).json(review);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateReview = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const review = await prisma.review.update({
      where: { id: parseInt(id) },
      data: {
        ...data,
        video: normalize(data.video),
      },
    });
    res.json(review);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteReview = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const review = await prisma.review.findUnique({ where: { id } });
    if (!review) return res.status(404).json({ message: 'Review not found' });
    await prisma.review.delete({ where: { id } });
    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const reorderReviews = async (req, res) => {
  try {
    const { items } = req.body;
    if (!Array.isArray(items)) {
      return res.status(400).json({ message: 'items array is required' });
    }
    for (const item of items) {
      await prisma.review.update({
        where: { id: parseInt(item.id) },
        data: { position: parseInt(item.position) },
      });
    }
    const allReviews = await prisma.review.findMany({ orderBy: { position: 'asc' } });
    res.json(allReviews);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getReviews, createReview, updateReview, deleteReview, reorderReviews };
