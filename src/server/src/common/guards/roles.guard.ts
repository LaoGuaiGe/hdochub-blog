// 角色权限守卫：校验角色权限矩阵
// 配合 @Roles() 装饰器使用
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY, ROLES_KEY } from '../decorators';
import { Role, hasRole } from '../enums/role.enum';
import { ErrorCode } from '../enums/error-code.enum';
import { BusinessException } from '../exceptions/business.exception';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // @Public() 接口直接放行，不做角色校验
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // 未声明 @Roles() 的接口，默认需要登录（USER 角色）
    const roles = requiredRoles && requiredRoles.length > 0 ? requiredRoles : [Role.USER];

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new BusinessException(ErrorCode.UNAUTHORIZED);
    }

    const userRole = user.role as Role;
    const required = roles[0];

    if (!hasRole(userRole, required)) {
      if (required === Role.SUPER_ADMIN) {
        throw new BusinessException(ErrorCode.REQUIRE_SUPER_ADMIN);
      }
      if (required === Role.ADMIN) {
        throw new BusinessException(ErrorCode.REQUIRE_ADMIN);
      }
      throw new BusinessException(ErrorCode.FORBIDDEN_RESOURCE);
    }

    return true;
  }
}
