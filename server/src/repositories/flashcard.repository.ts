import prisma from '../lib/prisma';
import { CreateFlashcardDto, UpdateFlashcardDto } from '../types';

export const flashcardRepository = {
  findByProjectId(projectId: string) {
    return prisma.flashcard.findMany({
      where: { projectId },
      orderBy: { order: 'asc' },
    });
  },

  findByFolderId(folderId: string) {
    return prisma.flashcard.findMany({
      where: {
        project: {
          folderId: folderId
        }
      },
      orderBy: { order: 'asc' },
    });
  },

  findById(id: string) {
    return prisma.flashcard.findUnique({
      where: { id },
    });
  },

  create(data: CreateFlashcardDto) {
    return prisma.flashcard.create({ data });
  },

  update(id: string, data: UpdateFlashcardDto) {
    return prisma.flashcard.update({
      where: { id },
      data,
    });
  },

  delete(id: string) {
    return prisma.flashcard.delete({
      where: { id },
    });
  },
};
