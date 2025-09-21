import { Role, RoleType } from '@prisma/client';
import { getAbsolutePath } from '../utils/getAbsolutePath.js';

// Role display images
export const controlImage = "./resources/images/control-display.png";
export const faceImage = "./resources/images/face-display.png";
export const meleeDPSImage = "./resources/images/melee-dps-display.png";
export const rangeDPSImage = "./resources/images/range-dps-display.png";
export const tankImage = "./resources/images/tank-display.png";
export const supportImage = "./resources/images/support-display.png";

// Map role types to their display images
const roleImageMap: Record<RoleType, string> = {
  [RoleType.CONTROL]: controlImage,
  [RoleType.FACE]: faceImage,
  [RoleType.MELEE_DPS]: meleeDPSImage,
  [RoleType.RANGE_DPS]: rangeDPSImage,
  [RoleType.TANK]: tankImage,
  [RoleType.SUPPORT]: supportImage,
  [RoleType.GAME_MASTER]: tankImage, // Default for GM
};


class RoleManager {
  private static instance: RoleManager;
  private roleCache: Role[] = [];
  private isInitialized = false;

  private constructor() { }

  public static getInstance(): RoleManager {
    if (!RoleManager.instance) {
      RoleManager.instance = new RoleManager();
    }
    return RoleManager.instance;
  }

  public initialize(roles: Role[]): void {
    if (this.isInitialized) {
      throw new Error('RoleManager is already initialized');
    }
    this.roleCache = [...roles];
    this.isInitialized = true;
  }

  public getAllRoles(): Role[] {
    this.ensureInitialized();
    return [...this.roleCache];
  }

  public getRoleTypes(): RoleType[] {
    this.ensureInitialized();
    return this.roleCache.map((r) => r.id);
  }

  public isValidRoleType(value: string): value is RoleType {
    return Object.values(RoleType).includes(value as RoleType);
  }

  public getRoleByType(type: RoleType): Role | undefined {
    this.ensureInitialized();
    return this.roleCache.find((r) => r.id === type);
  }

  public getRoleByString(raw: string): Role {
    this.ensureInitialized();
    const value = raw.trim().toLowerCase().replaceAll(' ', '_').toUpperCase();

    if (this.isValidRoleType(value)) {
      const byType = this.getRoleByType(value);
      if (byType) return byType;
    }

    throw new Error(
      `Unknown role string: "${raw}". Expected RoleType or exact role name / displayName.`
    );
  }

  private ensureInitialized(): void {
    if (!this.isInitialized) {
      throw new Error('RoleManager not initialized. Call initialize() first.');
    }
  }
}

// Export singleton instance and convenience functions
const roleManager = RoleManager.getInstance();

export function setRoleCache(roles: Role[]): void {
  roleManager.initialize(roles);
}

export function getAllRoles(): Role[] {
  return roleManager.getAllRoles();
}

export function getRoleTypes(): RoleType[] {
  return roleManager.getRoleTypes();
}

export function isValidRoleType(value: string): value is RoleType {
  return roleManager.isValidRoleType(value);
}

export function getRoleByType(type: RoleType): Role | undefined {
  return roleManager.getRoleByType(type);
}

export function getRoleByString(raw: string): Role {
  return roleManager.getRoleByString(raw);
}

export function getRoleImage(role: Role): string {
  const imagePath = roleImageMap[role.id] || tankImage;
  return getAbsolutePath(imagePath);
}

export function getRoleName(role: Role): string {
  return role.displayName;
}

export function getRoleDescription(role: Role): string {
  return role.description || '';
}

export { RoleType };
