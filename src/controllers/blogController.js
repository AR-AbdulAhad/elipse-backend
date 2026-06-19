const prisma = require('../config/prisma');

const getBlogs = async (req, res) => {
  try {
    const blogs = await prisma.blog.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(blogs);
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
    const { title, slug, excerpt, content, image, image2, image3, image4, category, date } = req.body;
    const blog = await prisma.blog.create({
      data: { title, slug, excerpt, content, image, image2, image3, image4, category, date }
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
    const blog = await prisma.blog.update({
      where: { id: parseInt(id) },
      data
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
