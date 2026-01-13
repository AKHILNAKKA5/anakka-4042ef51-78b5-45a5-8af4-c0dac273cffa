import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from './role.enum.js';
import { ROLES_KEY } from './roles.decorator.js';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.role) {
      throw new ForbiddenException('User role not found');
    }

    const hasRole = this.checkRoleAccess(user.role, requiredRoles);

    if (!hasRole) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }

  private checkRoleAccess(userRole: Role, requiredRoles: Role[]): boolean {
    // Check if user has any of the required roles with inheritance
    return requiredRoles.some((requiredRole) =>
      this.hasRoleOrHigher(userRole, requiredRole)
    );
  }

  private hasRoleOrHigher(userRole: Role, requiredRole: Role): boolean {
    const roleHierarchy = {
      [Role.OWNER]: [Role.OWNER, Role.ADMIN, Role.VIEWER],
      [Role.ADMIN]: [Role.ADMIN, Role.VIEWER],
      [Role.VIEWER]: [Role.VIEWER],
    };

    return roleHierarchy[userRole]?.includes(requiredRole) ?? false;
  }
}
