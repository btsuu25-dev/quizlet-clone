import prisma from '../lib/prisma';
import { CreateProjectDto, UpdateProjectDto } from '../types';

export const projectRepository = {
  findAll(userId: string) {
    return prisma.project.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  },

  findById(id: string, userId: string) {
    return prisma.project.findFirst({
      where: { id, userId },
    });
  },

  create(data: CreateProjectDto, userId: string) {
    return prisma.project.create({ 
      data: { ...data, userId } 
    });
  },

  update(id: string, data: UpdateProjectDto) {
    return prisma.project.update({
      where: { id },
      data,
    });
  },

  delete(id: string) {
    return prisma.project.delete({
      where: { id },
    });
  },
};
