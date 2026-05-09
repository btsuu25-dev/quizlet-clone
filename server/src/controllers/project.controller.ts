import { Response } from 'express';
import { projectService } from '../services/project.service';
import { AuthRequest } from '../middlewares/auth.middleware';

export const projectController = {
  async getAll(req: AuthRequest, res: Response) {
    try {
      const projects = await projectService.getAllProjects(req.userId!);
      res.json(projects);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  async getById(req: AuthRequest, res: Response) {
    try {
      const project = await projectService.getProjectById(req.params.id, req.userId!);
      res.json(project);
    } catch (error: any) {
      res.status(404).json({ error: error.message });
    }
  },

  async create(req: AuthRequest, res: Response) {
    try {
      const project = await projectService.createProject(req.body, req.userId!);
      res.status(201).json(project);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },

  async update(req: AuthRequest, res: Response) {
    try {
      const project = await projectService.updateProject(req.params.id, req.body, req.userId!);
      res.json(project);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },

  async delete(req: AuthRequest, res: Response) {
    try {
      await projectService.deleteProject(req.params.id, req.userId!);
      res.status(204).send();
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },
};
