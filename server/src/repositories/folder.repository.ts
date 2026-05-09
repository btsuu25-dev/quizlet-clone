import prisma from '../lib/prisma';
import { CreateFolderDto } from '../types';

export const folderRepository = {
  findAll(userId: string) {
    return prisma.folder.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        projects: true
      }
    });
  },

  findById(id: string, userId: string) {
    return prisma.folder.findFirst({
      where: { id, userId },
      include: {
        projects: true
      }
    });
  },

  create(data: CreateFolderDto, userId: string) {
    return prisma.folder.create({ 
      data: { ...data, userId } 
    });
  },

  delete(id: string) {
    return prisma.folder.delete({
      where: { id },
    });
  },
};
