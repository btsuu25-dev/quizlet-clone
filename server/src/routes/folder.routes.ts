import { Router } from 'express';
import { folderController } from '../controllers/folder.controller';
import { requireAuth } from '../middlewares/auth.middleware';

const router = Router();

router.use(requireAuth);

router.get('/', folderController.getAll);
router.get('/:id', folderController.getById);
router.get('/:id/flashcards', folderController.getFlashcards);
router.post('/', folderController.create);
router.delete('/:id', folderController.delete);

export default router;
