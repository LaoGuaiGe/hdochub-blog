// 统一响应接口类型
export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
}

// 分页请求 DTO
export class PaginationDto {
  page?: number = 1;
  pageSize?: number = 10;

  // 计算跳过条数
  get skip(): number {
    const page = Number(this.page) || 1;
    const pageSize = Number(this.pageSize) || 10;
    return (page - 1) * pageSize;
  }

  get take(): number {
    return Number(this.pageSize) || 10;
  }

  // 限制 pageSize 最大 50
  get safePageSize(): number {
    const size = Number(this.pageSize) || 10;
    return Math.min(Math.max(size, 1), 50);
  }

  get safePage(): number {
    const p = Number(this.page) || 1;
    return Math.max(p, 1);
  }

  get safeSkip(): number {
    return (this.safePage - 1) * this.safePageSize;
  }

  get safeTake(): number {
    return this.safePageSize;
  }
}

// 分页响应数据结构
export interface PaginatedData<T> {
  list: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

// 构造分页响应
export function paginate<T>(
  list: T[],
  total: number,
  page: number,
  pageSize: number,
): PaginatedData<T> {
  return {
    list,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize) || 0,
    },
  };
}
