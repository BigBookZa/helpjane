import express from 'express';
import { ProjectModel } from '../models/Project';
import { ActivityLogger } from '../utils/activityLogger';

const router = express.Router();

// GET /api/projects
router.get('/', (req, res) => {
  try {
    const userId = req.user!.id;
    const projects = ProjectModel.findByUser(userId);
    res.json(projects);
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// POST /api/projects
router.post('/', (req, res) => {
  try {
    const userId = req.user!.id;
    const projectData = { ...req.body, user_id: userId };
    
    const project = ProjectModel.create(projectData);
    
    ActivityLogger.log(userId, 'project_created', 'project', project.id, {
      name: project.name,
      category: project.category
    });

    res.status(201).json(project);
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

// GET /api/projects/:id
router.get('/:id', (req, res) => {
  try {
    const userId = req.user!.id;
    const projectId = parseInt(req.params.id);
    
    const project = ProjectModel.findById(projectId, userId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json(project);
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({ error: 'Failed to fetch project' });
  }
});

// PUT /api/projects/:id
router.put('/:id', (req, res) => {
  try {
    const userId = req.user!.id;
    const projectId = parseInt(req.params.id);
    
    const project = ProjectModel.update(projectId, userId, req.body);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    ActivityLogger.log(userId, 'project_updated', 'project', project.id, {
      changes: Object.keys(req.body)
    });

    res.json(project);
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({ error: 'Failed to update project' });
  }
});

// DELETE /api/projects/:id
router.delete('/:id', (req, res) => {
  try {
    const userId = req.user!.id;
    const projectId = parseInt(req.params.id);
    
    const success = ProjectModel.delete(projectId, userId);
    if (!success) {
      return res.status(404).json({ error: 'Project not found' });
    }

    ActivityLogger.log(userId, 'project_deleted', 'project', projectId);

    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

export default router;