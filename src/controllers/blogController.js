const prisma = require('../config/prisma');

// Helper to strip any origin (e.g., http://localhost:5003) from stored paths
const normalize = (val) => {
  if (!val) return val;
  return val.replace(/^https?:\/\/[^/]+/, '');
};

// Get all blogs with proper URLs
const getBlogs = async (req, res) => {
  try {
    const blogs = await prisma.blog.findMany();
    const baseUrl = process.env.VITE_BACKEND_URL || (process.env.PORT ? `http://localhost:${process.env.PORT}` : 'http://localhost:5003');
    const buildUrl = (val) => {
      if (!val) return val;
      if (val.startsWith('http')) return val;
      const path = val.startsWith('/') ? val : `/${val}`;
      return `${baseUrl}${path}`;
    };
    const blogsWithUrls = blogs.map(b => ({
      ...b,
      image: b.image ? buildUrl(b.image) : b.image,
      image2: b.image2 ? buildUrl(b.image2) : b.image2,
      image3: b.image3 ? buildUrl(b.image3) : b.image3,
      image4: b.image4 ? buildUrl(b.image4) : b.image4,
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
    res.json(blog);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createBlog = async (req, res) => {
  try {
    const {
      title,
      slug,
      excerpt,
      content,
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
    const blog = await prisma.blog.create({
      data: {
        title,
        slug,
        excerpt,
        content,
        image: normalize(image),
        image2: normalize(image2),
        image3: normalize(image3),
        image4: normalize(image4),
        video,
        video2,
        video3,
        category,
        date,
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
    await prisma.blog.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ message: 'Blog deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getBlogs, getBlogBySlug, createBlog, updateBlog, deleteBlog };
