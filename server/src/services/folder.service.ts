import { folderRepository } from '../repositories/folder.repository';
import { CreateFolderDto } from '../types';

export const folderService = {
  async getAllFolders(userId: string) {
    return folderRepository.findAll(userId);
  },

  async getFolderById(id: string, userId: string) {
    const folder = await folderRepository.findById(id, userId);
    if (!folder) {
      throw new Error('Folder not found or you do not have access');
    }
    return folder;
  },

  async getFlashcardsByFolderId(id: string, userId: string) {
    // verify folder access first
    await this.getFolderById(id, userId);
    const { flashcardRepository } = await import('../repositories/flashcard.repository');
    return flashcardRepository.findByFolderId(id);
  },

  async createFolder(data: CreateFolderDto, userId: string) {
    return folderRepository.create(data, userId);
  },

  async deleteFolder(id: string, userId: string) {
    await this.getFolderById(id, userId); // Check access
    return folderRepository.delete(id);
  },
};
