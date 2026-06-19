const prisma = require('../config/prisma');

const getProjects = async (req, res) => {
  try {
    const prioritizedPaths = ['/project/ahmed-food', '/project/volvo-configurator', '/project/lahore-zoo'];
    // Fetch prioritized and other projects
    const prioritizedProjects = await prisma.project.findMany({ where: { path: { in: prioritizedPaths } } });
    const otherProjects = await prisma.project.findMany({ where: { path: { notIn: prioritizedPaths } }, orderBy: { createdAt: 'desc' } });
    const allProjects = [...prioritizedProjects, ...otherProjects];
    const baseUrl = process.env.VITE_BACKEND_URL || (process.env.PORT ? `http://localhost:${process.env.PORT}` : 'http://localhost:5003');
    const buildUrl = (val) => {
      if (!val) return val;
      if (val.startsWith('http')) return val;
      const path = val.startsWith('/') ? val : `/${val}`;
      return `${baseUrl}${path}`;
    };
    const projectsWithUrls = allProjects.map(p => ({
      ...p,
      image: p.image ? buildUrl(p.image) : p.image,
      video: p.video ? buildUrl(p.video) : p.video,
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
    const baseUrl = process.env.VITE_BACKEND_URL || (process.env.PORT ? `http://localhost:${process.env.PORT}` : 'http://localhost:5003');
    const buildUrl = (val) => {
      if (!val) return val;
      if (val.startsWith('http')) return val;
      const path = val.startsWith('/') ? val : `/${val}`;
      return `${baseUrl}${path}`;
    };
    const projectWithUrls = {
      ...project,
      image: project.image ? buildUrl(project.image) : project.image,
      video: project.video ? buildUrl(project.video) : project.video,
    };
    return res.json(projectWithUrls);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createProject = async (req, res) => {
  try {
    const { title, category, image, video, path } = req.body;
    const normalize = (val) => {
      if (!val) return val;
      // Remove origin if present, keep the /uploads/... path
      return val.replace(/^https?:\/\/[^/]+/, '');
    };
    const project = await prisma.project.create({
      data: {
        title,
        category,
        image: normalize(image),
        video: normalize(video),
        path,
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

module.exports = { getProjects, getProjectByPath, createProject, updateProject, deleteProject };
