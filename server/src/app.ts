import express from 'express';
import cors from 'cors';
import projectRoutes from './routes/project.routes';
import flashcardRoutes from './routes/flashcard.routes';
import authRoutes from './routes/auth.routes';
import folderRoutes from './routes/folder.routes';

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api', flashcardRoutes);
app.use('/api/folders', folderRoutes);

export default app;
