const prisma = require('../config/prisma');
const fs = require('fs');
const path = require('path');

const uploadsDir = path.resolve(__dirname, '../../uploads');

const deleteProjectImageFiles = (record) => {
  const paths = [];
  if (record.image) {
    paths.push(record.image.replace(/^https?:\/\/[^/]+/, ''));
  }
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

const getProjects = async (req, res) => {
  try {
    const allProjects = await prisma.project.findMany({ orderBy: { position: 'asc' } });
    const projectsWithUrls = allProjects.map(p => ({
      ...p,
      image: p.image ? buildUrl(p.image, req) : p.image,
      video: p.video ? buildUrl(p.video, req) : p.video,
      sections: fixSections(p.sections, req),
    }));
    return res.json(projectsWithUrls);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getProjectByPath = async (req, res) => {
  try {
    const path = req.query.path || req.params.path;
    const project = await prisma.project.findUnique({ where: { path } });
    if (!project) return res.status(404).json({ message: 'Project not found' });
    const projectWithUrls = {
      ...project,
      image: project.image ? buildUrl(project.image, req) : project.image,
      video: project.video ? buildUrl(project.video, req) : project.video,
      sections: fixSections(project.sections, req),
    };
    return res.json(projectWithUrls);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createProject = async (req, res) => {
  try {
    const { title, metaTitle, metaDescription, category, image, video, path, description, sections } = req.body;
    const normalize = (val) => {
      if (!val) return val;
      if (/youtube\.com|youtu\.be/i.test(val)) return val;
      return val.replace(/^https?:\/\/[^/]+/, '');
    };
    await prisma.project.updateMany({ data: { position: { increment: 1 } } });
    const project = await prisma.project.create({
      data: {
        title,
        metaTitle: metaTitle || null,
        metaDescription: metaDescription || null,
        category,
        image: normalize(image),
        video: normalize(video),
        path,
        description: description || '',
        sections: sections || '[]',
        position: 0,
      }
    });
    res.status(201).json(project);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const normalize = (val) => {
      if (!val) return val;
      if (/youtube\.com|youtu\.be/i.test(val)) return val;
      return val.replace(/^https?:\/\/[^/]+/, '');
    };
    const cleanedData = {
      ...data,
      image: normalize(data.image),
      video: normalize(data.video),
    };
    const project = await prisma.project.update({
      where: { id: parseInt(id) },
      data: cleanedData,
    });
    res.json(project);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteProject = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) return res.status(404).json({ message: 'Project not found' });
    deleteProjectImageFiles(project);
    await prisma.project.delete({ where: { id } });
    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const reorderProjects = async (req, res) => {
  try {
    const { items } = req.body;
    if (!Array.isArray(items)) {
      return res.status(400).json({ message: 'items array is required' });
    }
    for (const item of items) {
      await prisma.project.update({
        where: { id: parseInt(item.id) },
        data: { position: parseInt(item.position) },
      });
    }
    const allProjects = await prisma.project.findMany({ orderBy: { position: 'asc' } });
    res.json(allProjects);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getProjects, getProjectByPath, createProject, updateProject, deleteProject, reorderProjects };
