export interface CursorPaginatedResponse<T> {
  data: T[]
  meta: {
    nextCursor: string | null
    limit: number
  }
}
