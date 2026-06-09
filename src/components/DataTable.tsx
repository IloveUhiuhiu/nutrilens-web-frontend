import type { ReactNode } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { Page } from '../api/types'
import { getErrorMessage } from '../api/client'
import { Button, EmptyState, ErrorState, Skeleton } from './ui'

export type Column<T> = {
  key: string
  header: string
  render: (item: T) => ReactNode
  className?: string
}

export function DataTable<T>({
  data,
  columns,
  isLoading,
  error,
  page,
  onPageChange,
  emptyTitle = 'Chưa có dữ liệu',
}: {
  data?: Page<T>
  columns: Column<T>[]
  isLoading: boolean
  error: unknown
  page: number
  onPageChange: (page: number) => void
  emptyTitle?: string
}) {
  if (error) return <ErrorState message={getErrorMessage(error)} />
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-14 w-full" />
        ))}
      </div>
    )
  }
  const results = Array.isArray(data) ? (data as unknown as T[]) : data?.results
  if (!results || results.length === 0) return <EmptyState title={emptyTitle} />

  const count = Array.isArray(data) ? (data as unknown as T[]).length : (data?.count ?? 0)
  const maxPage = Math.max(1, Math.ceil(count / 20))

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-white">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-border text-left text-sm">
          <thead className="bg-muted/70 text-xs uppercase tracking-wide text-subtle">
            <tr>
              {columns.map((column) => (
                <th key={column.key} className="whitespace-nowrap px-4 py-3 font-extrabold">
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {results.map((item, rowIndex) => (
              <tr key={rowIndex} className="hover:bg-background/70">
                {columns.map((column) => (
                  <td key={column.key} className={column.className || 'px-4 py-3 align-middle'}>
                    {column.render(item)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-col gap-3 border-t border-border px-4 py-3 text-sm text-subtle sm:flex-row sm:items-center sm:justify-between">
        <span>
          {count} bản ghi · Trang {page}/{maxPage}
        </span>
        <div className="flex gap-2">
          <Button variant="secondary" disabled={Array.isArray(data) || !data?.previous} onClick={() => onPageChange(Math.max(1, page - 1))}>
            <ChevronLeft className="h-4 w-4" />
            Trước
          </Button>
          <Button variant="secondary" disabled={Array.isArray(data) || !data?.next} onClick={() => onPageChange(page + 1)}>
            Sau
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
