const prisma = require('../config/prisma');

const getProjects = async (req, res) => {
  try {
    const allProjects = await prisma.project.findMany({ orderBy: { position: 'asc' } });
    const baseUrl = (process.env.VITE_BACKEND_URL || `http://localhost:${process.env.PORT || 5001}`).replace(/\/+$/, '');
    const buildUrl = (val) => {
      if (!val) return val;
      if (val.startsWith('http')) return val;
      const path = val.startsWith('/') ? val : `/${val}`;
      return `${baseUrl}${path}`;
    };
    const fixSections = (sections) => {
      if (!sections) return sections;
      try {
        const arr = JSON.parse(sections);
        return JSON.stringify(arr.map(s => ({ ...s, image: s.image ? buildUrl(s.image) : s.image })));
      } catch { return sections; }
    };
    const projectsWithUrls = allProjects.map(p => ({
      ...p,
      image: p.image ? buildUrl(p.image) : p.image,
      video: p.video ? buildUrl(p.video) : p.video,
      sections: fixSections(p.sections),
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
    const baseUrl = (process.env.VITE_BACKEND_URL || `http://localhost:${process.env.PORT || 5001}`).replace(/\/+$/, '');
    const buildUrl = (val) => {
      if (!val) return val;
      if (val.startsWith('http')) return val;
      const path = val.startsWith('/') ? val : `/${val}`;
      return `${baseUrl}${path}`;
    };
    const fixSections = (sections) => {
      if (!sections) return sections;
      try {
        const arr = JSON.parse(sections);
        return JSON.stringify(arr.map(s => ({ ...s, image: s.image ? buildUrl(s.image) : s.image })));
      } catch { return sections; }
    };
    const projectWithUrls = {
      ...project,
      image: project.image ? buildUrl(project.image) : project.image,
      video: project.video ? buildUrl(project.video) : project.video,
      sections: fixSections(project.sections),
    };
    return res.json(projectWithUrls);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createProject = async (req, res) => {
  try {
    const { title, category, image, video, path, description, sections } = req.body;
    const normalize = (val) => {
      if (!val) return val;
      return val.replace(/^https?:\/\/[^/]+/, '');
    };
    await prisma.project.updateMany({ data: { position: { increment: 1 } } });
    const project = await prisma.project.create({
      data: {
        title,
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
    await prisma.project.delete({ where: { id: parseInt(req.params.id) } });
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
