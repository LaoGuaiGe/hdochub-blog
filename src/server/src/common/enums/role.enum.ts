// 用户角色枚举
// 角色继承关系：SUPER_ADMIN ⊃ ADMIN ⊃ USER
export enum Role {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  USER = 'USER',
}

// 角色权重，用于权限继承判断
export const ROLE_WEIGHT: Record<Role, number> = {
  [Role.SUPER_ADMIN]: 3,
  [Role.ADMIN]: 2,
  [Role.USER]: 1,
};

// 判断 actual 角色是否满足 required 要求
export function hasRole(actual: Role, required: Role): boolean {
  return ROLE_WEIGHT[actual] >= ROLE_WEIGHT[required];
}
