const prisma = require('../config/prisma');
const fs = require('fs');
const path = require('path');

const uploadsDir = path.resolve(__dirname, '../../uploads');

const getBaseUrl = (req) => {
  return (process.env.VITE_BACKEND_URL || `${req.protocol}://${req.get('host')}`).replace(/\/+$/, '');
};

const buildUrl = (val, req) => {
  if (!val) return val;
  if (val.startsWith('http')) return val;
  const p = val.startsWith('/') ? val : `/${val}`;
  return `${getBaseUrl(req)}${p}`;
};

const fixSections = (sections, req) => {
  if (!sections) return sections;
  try {
    const arr = JSON.parse(sections);
    return JSON.stringify(arr.map(s => ({ ...s, image: s.image ? buildUrl(s.image, req) : s.image })));
  } catch { return sections; }
};

const deleteImageFiles = (record) => {
  const imageFields = ['image', 'image2', 'image3', 'image4'];
  const paths = [];
  imageFields.forEach((field) => {
    if (record[field]) {
      paths.push(record[field].replace(/^https?:\/\/[^/]+/, ''));
    }
  });
  try {
    const sections = JSON.parse(record.sections || '[]');
    sections.forEach((s) => {
      if (s.image) paths.push(s.image.replace(/^https?:\/\/[^/]+/, ''));
    });
  } catch {}
  paths.forEach((filePath) => {
    const absPath = path.join(uploadsDir, filePath.replace(/^\/uploads\//, ''));
    try { fs.unlinkSync(absPath); } catch {}
  });
};

const normalize = (val) => {
  if (!val) return val;
  return val.replace(/^https?:\/\/[^/]+/, '');
};

const getBlogs = async (req, res) => {
  try {
    const blogs = await prisma.blog.findMany({ orderBy: { position: 'asc' } });
    const blogsWithUrls = blogs.map(b => ({
      ...b,
      image: b.image ? buildUrl(b.image, req) : b.image,
      image2: b.image2 ? buildUrl(b.image2, req) : b.image2,
      image3: b.image3 ? buildUrl(b.image3, req) : b.image3,
      image4: b.image4 ? buildUrl(b.image4, req) : b.image4,
      sections: fixSections(b.sections, req),
    }));
    res.json(blogsWithUrls);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getBlogBySlug = async (req, res) => {
  try {
    const blog = await prisma.blog.findUnique({ where: { slug: req.params.slug } });
    if (!blog) return res.status(404).json({ message: 'Blog not found' });
    res.json({
      ...blog,
      image: blog.image ? buildUrl(blog.image, req) : blog.image,
      image2: blog.image2 ? buildUrl(blog.image2, req) : blog.image2,
      image3: blog.image3 ? buildUrl(blog.image3, req) : blog.image3,
      image4: blog.image4 ? buildUrl(blog.image4, req) : blog.image4,
      sections: fixSections(blog.sections, req),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createBlog = async (req, res) => {
  try {
    const {
      title,
      metaTitle,
      metaDescription,
      slug,
      excerpt,
      content,
      sections,
      image,
      image2,
      image3,
      image4,
      video,
      video2,
      video3,
      category,
      date,
    } = req.body;
    await prisma.blog.updateMany({ data: { position: { increment: 1 } } });
    const blog = await prisma.blog.create({
      data: {
        title,
        metaTitle: metaTitle || null,
        metaDescription: metaDescription || null,
        slug,
        excerpt,
        content,
        sections: sections || '[]',
        image: normalize(image),
        image2: normalize(image2),
        image3: normalize(image3),
        image4: normalize(image4),
        video,
        video2,
        video3,
        category,
        date,
        position: 0,
      },
    });
    res.status(201).json(blog);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateBlog = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const cleanedData = {
      ...data,
      image: normalize(data.image),
      image2: normalize(data.image2),
      image3: normalize(data.image3),
      image4: normalize(data.image4),
    };
    const blog = await prisma.blog.update({
      where: { id: parseInt(id) },
      data: cleanedData,
    });
    res.json(blog);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteBlog = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const blog = await prisma.blog.findUnique({ where: { id } });
    if (!blog) return res.status(404).json({ message: 'Blog not found' });
    deleteImageFiles(blog);
    await prisma.blog.delete({ where: { id } });
    res.json({ message: 'Blog deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const reorderBlogs = async (req, res) => {
  try {
    const { items } = req.body;
    if (!Array.isArray(items)) {
      return res.status(400).json({ message: 'items array is required' });
    }
    for (const item of items) {
      await prisma.blog.update({
        where: { id: parseInt(item.id) },
        data: { position: parseInt(item.position) },
      });
    }
    const allBlogs = await prisma.blog.findMany({ orderBy: { position: 'asc' } });
    res.json(allBlogs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getBlogs, getBlogBySlug, createBlog, updateBlog, deleteBlog, reorderBlogs };
