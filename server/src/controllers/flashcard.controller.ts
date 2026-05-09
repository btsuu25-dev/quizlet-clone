import { Response } from 'express';
import { flashcardService } from '../services/flashcard.service';
import { AuthRequest } from '../middlewares/auth.middleware';

export const flashcardController = {
  async getByProject(req: AuthRequest, res: Response) {
    try {
      const flashcards = await flashcardService.getFlashcardsByProject(req.params.projectId, req.userId!);
      res.json(flashcards);
    } catch (error: any) {
      res.status(404).json({ error: error.message });
    }
  },

  async create(req: AuthRequest, res: Response) {
    try {
      const flashcard = await flashcardService.createFlashcard(req.params.projectId, req.body, req.userId!);
      res.status(201).json(flashcard);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },

  async update(req: AuthRequest, res: Response) {
    try {
      const flashcard = await flashcardService.updateFlashcard(req.params.id, req.body, req.userId!);
      res.json(flashcard);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },

  async delete(req: AuthRequest, res: Response) {
    try {
      await flashcardService.deleteFlashcard(req.params.id, req.userId!);
      res.status(204).send();
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },
};
