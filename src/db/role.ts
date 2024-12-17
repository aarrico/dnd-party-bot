import { prisma } from '../index';

export const getRoles = async () => {
  return prisma.role.findMany();
};
