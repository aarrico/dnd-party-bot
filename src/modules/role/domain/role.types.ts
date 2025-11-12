import { Role } from '@prisma/client';
import { getRoleImagePath } from '@shared/constants/roleImages.js';

/**
 * Get the absolute path to a role's display image
 */
export function getRoleImage(role: Role): string {
  return getRoleImagePath(role.id);
}

/**
 * Get the display name of a role
 */
export function getRoleName(role: Role): string {
  return role.displayName;
}

/**
 * Get the description of a role
 */
export function getRoleDescription(role: Role): string {
  return role.description || '';
}
