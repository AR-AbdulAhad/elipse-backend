const prisma = require('../config/prisma');
const fs = require('fs');
const path = require('path');

const uploadsDir = path.resolve(__dirname, '../../uploads');

const deleteCaseStudyImageFiles = (record) => {
  const paths = [];
  if (record.largeBanner) paths.push(record.largeBanner.replace(/^https?:\/\/[^/]+/, ''));
  if (record.smallBanner) paths.push(record.smallBanner.replace(/^https?:\/\/[^/]+/, ''));
  paths.forEach((filePath) => {
    const absPath = path.join(uploadsDir, filePath.replace(/^\/uploads\//, ''));
    try { fs.unlinkSync(absPath); } catch {}
  });
};

const getBaseUrl = (req) => {
  return (process.env.VITE_BACKEND_URL || `${req.protocol}://${req.get('host')}`).replace(/\/+$/, '');
};

const buildUrl = (val, req) => {
  if (!val) return val;
  if (val.startsWith('http')) return val;
  const p = val.startsWith('/') ? val : `/${val}`;
  return `${getBaseUrl(req)}${p}`;
};

const getCaseStudies = async (req, res) => {
  try {
    const all = await prisma.caseStudy.findMany({ orderBy: { position: 'asc' } });
    const withUrls = all.map(c => ({
      ...c,
      largeBanner: c.largeBanner ? buildUrl(c.largeBanner, req) : c.largeBanner,
      smallBanner: c.smallBanner ? buildUrl(c.smallBanner, req) : c.smallBanner,
    }));
    return res.json(withUrls);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getCaseStudyBySlug = async (req, res) => {
  try {
    const slug = req.query.slug || req.params.slug;
    const cs = await prisma.caseStudy.findUnique({ where: { slug } });
    if (!cs) return res.status(404).json({ message: 'Case study not found' });
    const withUrls = {
      ...cs,
      largeBanner: cs.largeBanner ? buildUrl(cs.largeBanner, req) : cs.largeBanner,
      smallBanner: cs.smallBanner ? buildUrl(cs.smallBanner, req) : cs.smallBanner,
    };
    return res.json(withUrls);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createCaseStudy = async (req, res) => {
  try {
    const { title, metaTitle, metaDescription, slug, largeBanner, smallBanner, content, client, service, category, videoUrl } = req.body;
    const normalize = (val) => {
      if (!val) return val;
      return val.replace(/^https?:\/\/[^/]+/, '');
    };
    await prisma.caseStudy.updateMany({ data: { position: { increment: 1 } } });
    const cs = await prisma.caseStudy.create({
      data: {
        title,
        metaTitle: metaTitle || null,
        metaDescription: metaDescription || null,
        slug,
        largeBanner: normalize(largeBanner),
        smallBanner: normalize(smallBanner),
        content: content || '',
        client: client || null,
        service: service || null,
        category: category || null,
        videoUrl: videoUrl || null,
        position: 0,
      }
    });
    res.status(201).json(cs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateCaseStudy = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const normalize = (val) => {
      if (!val) return val;
      return val.replace(/^https?:\/\/[^/]+/, '');
    };
    const cleanedData = {
      ...data,
      largeBanner: data.largeBanner ? normalize(data.largeBanner) : data.largeBanner,
      smallBanner: data.smallBanner ? normalize(data.smallBanner) : data.smallBanner,
    };
    const cs = await prisma.caseStudy.update({
      where: { id: parseInt(id) },
      data: cleanedData,
    });
    res.json(cs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteCaseStudy = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const cs = await prisma.caseStudy.findUnique({ where: { id } });
    if (!cs) return res.status(404).json({ message: 'Case study not found' });
    deleteCaseStudyImageFiles(cs);
    await prisma.caseStudy.delete({ where: { id } });
    res.json({ message: 'Case study deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const reorderCaseStudies = async (req, res) => {
  try {
    const { items } = req.body;
    if (!Array.isArray(items)) {
      return res.status(400).json({ message: 'items array is required' });
    }
    for (const item of items) {
      await prisma.caseStudy.update({
        where: { id: parseInt(item.id) },
        data: { position: parseInt(item.position) },
      });
    }
    const all = await prisma.caseStudy.findMany({ orderBy: { position: 'asc' } });
    res.json(all);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getCaseStudies, getCaseStudyBySlug, createCaseStudy, updateCaseStudy, deleteCaseStudy, reorderCaseStudies };
