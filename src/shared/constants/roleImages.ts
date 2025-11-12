import { RoleType } from '@prisma/client';
import { getAbsolutePath } from '../files/getAbsolutePath.js';

// Role display image paths
export const controlImage = './resources/images/control-display.png';
export const faceImage = './resources/images/face-display.png';
export const meleeDPSImage = './resources/images/melee-dps-display.png';
export const rangeDPSImage = './resources/images/range-dps-display.png';
export const tankImage = './resources/images/tank-display.png';
export const supportImage = './resources/images/support-display.png';

/**
 * Map role types to their display images
 */
export const roleImageMap: Record<RoleType, string> = {
  [RoleType.CONTROL]: controlImage,
  [RoleType.FACE]: faceImage,
  [RoleType.MELEE_DPS]: meleeDPSImage,
  [RoleType.RANGE_DPS]: rangeDPSImage,
  [RoleType.TANK]: tankImage,
  [RoleType.SUPPORT]: supportImage,
  [RoleType.GAME_MASTER]: tankImage, // Default for GM
};

/**
 * Get the absolute path to a role's display image
 */
export function getRoleImagePath(roleType: RoleType): string {
  const imagePath = roleImageMap[roleType] || tankImage;
  return getAbsolutePath(imagePath);
}
