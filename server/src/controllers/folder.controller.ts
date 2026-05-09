import { Response } from 'express';
import { folderService } from '../services/folder.service';
import { AuthRequest } from '../middlewares/auth.middleware';

export const folderController = {
  async getAll(req: AuthRequest, res: Response) {
    try {
      const folders = await folderService.getAllFolders(req.userId!);
      res.json(folders);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  async getById(req: AuthRequest, res: Response) {
    try {
      const folder = await folderService.getFolderById(req.params.id, req.userId!);
      res.json(folder);
    } catch (error: any) {
      res.status(404).json({ error: error.message });
    }
  },

  async getFlashcards(req: AuthRequest, res: Response) {
    try {
      const flashcards = await folderService.getFlashcardsByFolderId(req.params.id, req.userId!);
      res.json(flashcards);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  async create(req: AuthRequest, res: Response) {
    try {
      const folder = await folderService.createFolder(req.body, req.userId!);
      res.status(201).json(folder);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },

  async delete(req: AuthRequest, res: Response) {
    try {
      await folderService.deleteFolder(req.params.id, req.userId!);
      res.status(204).send();
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },
};
