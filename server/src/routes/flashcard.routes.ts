import { Router } from 'express';
import { flashcardController } from '../controllers/flashcard.controller';
import { requireAuth } from '../middlewares/auth.middleware';

const router = Router();

router.use(requireAuth);

// Flashcards by project
router.get('/projects/:projectId/flashcards', flashcardController.getByProject);
router.post('/projects/:projectId/flashcards', flashcardController.create);

// Individual flashcard ops
router.put('/flashcards/:id', flashcardController.update);
router.delete('/flashcards/:id', flashcardController.delete);

export default router;
