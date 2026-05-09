import { flashcardRepository } from '../repositories/flashcard.repository';
import { projectService } from './project.service';
import { CreateFlashcardDto, UpdateFlashcardDto } from '../types';

export const flashcardService = {
  async getFlashcardsByProject(projectId: string, userId: string) {
    await projectService.getProjectById(projectId, userId); // verify project exists and belongs to user
    return flashcardRepository.findByProjectId(projectId);
  },

  async getFlashcardById(id: string, userId: string) {
    const flashcard = await flashcardRepository.findById(id);
    if (!flashcard) {
      throw new Error('Flashcard not found');
    }
    // Verify user owns the project this flashcard belongs to
    await projectService.getProjectById(flashcard.projectId, userId);
    return flashcard;
  },

  async createFlashcard(projectId: string, data: Omit<CreateFlashcardDto, 'projectId'>, userId: string) {
    await projectService.getProjectById(projectId, userId); // verify project exists and belongs to user
    return flashcardRepository.create({ ...data, projectId });
  },

  async updateFlashcard(id: string, data: UpdateFlashcardDto, userId: string) {
    await this.getFlashcardById(id, userId); // verify exists and belongs to user
    return flashcardRepository.update(id, data);
  },

  async deleteFlashcard(id: string, userId: string) {
    await this.getFlashcardById(id, userId); // verify exists and belongs to user
    return flashcardRepository.delete(id);
  },
};
