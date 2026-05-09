import { projectRepository } from '../repositories/project.repository';
import { CreateProjectDto, UpdateProjectDto } from '../types';

export const projectService = {
  async getAllProjects(userId: string) {
    return projectRepository.findAll(userId);
  },

  async getProjectById(id: string, userId: string) {
    const project = await projectRepository.findById(id, userId);
    if (!project) {
      throw new Error('Project not found or you do not have access');
    }
    return project;
  },

  async createProject(data: CreateProjectDto, userId: string) {
    return projectRepository.create(data, userId);
  },

  async updateProject(id: string, data: UpdateProjectDto, userId: string) {
    await this.getProjectById(id, userId); // Check if exists and belongs to user
    return projectRepository.update(id, data);
  },

  async deleteProject(id: string, userId: string) {
    await this.getProjectById(id, userId); // Check if exists and belongs to user
    return projectRepository.delete(id);
  },
};
