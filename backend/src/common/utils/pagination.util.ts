export interface PaginationQuery {
  page?: number;
  limit?: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: PaginationMeta;
}

export function getPagination(query?: PaginationQuery) {
  const page = Math.max(1, Number(query?.page) || 1);
  const limit = Math.min(500, Math.max(1, Number(query?.limit) || 50));
  return {
    page,
    limit,
    skip: (page - 1) * limit,
  };
}

export function paginatedResult<T>(data: T[], total: number, page: number, limit: number): PaginatedResult<T> {
  return {
    data,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  };
}
