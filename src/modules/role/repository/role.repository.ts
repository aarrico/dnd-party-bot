import { prisma } from '@app/index.js';

export const getRoles = async () => {
  return prisma.role.findMany();
};
