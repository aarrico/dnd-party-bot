import { prisma } from '../index.js';

export const getRoles = async () => {
  return prisma.role.findMany();
};
