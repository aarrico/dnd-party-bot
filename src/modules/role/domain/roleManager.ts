import { Role, RoleType } from '#generated/prisma/client.js';

/**
 * RoleManager - Singleton class for managing role cache and queries
 * Provides centralized access to role data throughout the application
 */
class RoleManager {
  private static instance: RoleManager;
  private roleCache: Role[] = [];
  private isInitialized = false;

  private constructor() {}

  public static getInstance(): RoleManager {
    if (!RoleManager.instance) {
      RoleManager.instance = new RoleManager();
    }
    return RoleManager.instance;
  }

  /**
   * Initialize the role cache with roles from the database
   * Should be called once during application startup
   */
  public initialize(roles: Role[]): void {
    if (this.isInitialized) {
      throw new Error('RoleManager is already initialized');
    }
    this.roleCache = [...roles];
    this.isInitialized = true;
  }

  /**
   * Get all cached roles
   */
  public getAllRoles(): Role[] {
    this.ensureInitialized();
    return [...this.roleCache];
  }

  /**
   * Get all role type IDs
   */
  public getRoleTypes(): RoleType[] {
    this.ensureInitialized();
    return this.roleCache.map((r) => r.id);
  }

  /**
   * Check if a string is a valid RoleType
   */
  public isValidRoleType(value: string): value is RoleType {
    return Object.values(RoleType).includes(value as RoleType);
  }

  /**
   * Get a role by its RoleType
   */
  public getRoleByType(type: RoleType): Role | undefined {
    this.ensureInitialized();
    return this.roleCache.find((r) => r.id === type);
  }

  /**
   * Get a role by string (case-insensitive, handles spaces)
   * Converts string to UPPER_SNAKE_CASE format
   * @throws Error if role not found
   */
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

/**
 * Initialize the role cache
 */
export function setRoleCache(roles: Role[]): void {
  roleManager.initialize(roles);
}

/**
 * Get all roles from cache
 */
export function getAllRoles(): Role[] {
  return roleManager.getAllRoles();
}

/**
 * Get all role types
 */
export function getRoleTypes(): RoleType[] {
  return roleManager.getRoleTypes();
}

/**
 * Check if a string is a valid role type
 */
export function isValidRoleType(value: string): value is RoleType {
  return roleManager.isValidRoleType(value);
}

/**
 * Get a role by its type
 */
export function getRoleByType(type: RoleType): Role | undefined {
  return roleManager.getRoleByType(type);
}

/**
 * Get a role by string (flexible parsing)
 */
export function getRoleByString(raw: string): Role {
  return roleManager.getRoleByString(raw);
}

export { RoleType };
