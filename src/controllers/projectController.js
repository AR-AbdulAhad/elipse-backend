const prisma = require('../config/prisma');

const getProjects = async (req, res) => {
  try {
    const projects = await prisma.project.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(projects);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getProjectByPath = async (req, res) => {
  try {
    const path = req.query.path || req.params.path;
    const project = await prisma.project.findUnique({ where: { path } });
    if (!project) return res.status(404).json({ message: 'Project not found' });
    res.json(project);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createProject = async (req, res) => {
  try {
    const { title, category, image, path } = req.body;
    const project = await prisma.project.create({
      data: { title, category, image, path }
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
    const project = await prisma.project.update({
      where: { id: parseInt(id) },
      data
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
