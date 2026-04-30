import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Edit3, Plus, Search, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { request } from '../api/client'
import type { Page } from '../api/types'
import { DataTable, type Column } from '../components/DataTable'
import { Button, Card, Input, Modal, PageHeader, Select } from '../components/ui'
import { ResourceForm, type FieldConfig } from '../components/ResourceForm'

export type ResourceConfig<T extends { id: string | number }> = {
  title: string
  description: string
  endpoint: string
  detailPath?: (item: T) => string
  searchPlaceholder?: string
  filters?: { name: string; label: string; options: { label: string; value: string }[] }[]
  columns: Column<T>[]
  fields: FieldConfig[]
  emptyTitle?: string
}

export function ResourcePage<T extends { id: string | number }>({ config }: { config: ResourceConfig<T> }) {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState<Record<string, string>>({})
  const [editing, setEditing] = useState<T | null>(null)
  const [isCreateOpen, setCreateOpen] = useState(false)

  const params = useMemo(() => ({ page, search: search || undefined, ...filters }), [filters, page, search])
  const queryKey = ['resource', config.endpoint, params]
  const listQuery = useQuery({
    queryKey,
    queryFn: () => request<Page<T>>({ url: config.endpoint, method: 'GET', params }),
  })

  const createMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) => request<T>({ url: config.endpoint, method: 'POST', data: payload }),
    onSuccess: async () => {
      toast.success('Đã tạo bản ghi')
      setCreateOpen(false)
      await queryClient.invalidateQueries({ queryKey: ['resource', config.endpoint] })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string | number; payload: Record<string, unknown> }) =>
      request<T>({ url: `${config.endpoint}${id}/`, method: 'PATCH', data: payload }),
    onSuccess: async () => {
      toast.success('Đã cập nhật')
      setEditing(null)
      await queryClient.invalidateQueries({ queryKey: ['resource', config.endpoint] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string | number) => request<null>({ url: `${config.endpoint}${id}/`, method: 'DELETE' }),
    onSuccess: async () => {
      toast.success('Đã xóa bản ghi')
      await queryClient.invalidateQueries({ queryKey: ['resource', config.endpoint] })
    },
  })

  const columns = useMemo<Column<T>[]>(
    () => [
      ...config.columns,
      {
        key: 'actions',
        header: '',
        className: 'px-4 py-3 text-right align-middle',
        render: (item) => {
          const id = item.id as string | number
          return (
            <div className="flex justify-end gap-2">
              {config.detailPath ? (
                <Link className="btn-secondary btn" to={config.detailPath(item)}>
                  Detail
                </Link>
              ) : null}
              <Button variant="secondary" onClick={() => setEditing(item)}>
                <Edit3 className="h-4 w-4" />
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  if (window.confirm('Xóa bản ghi này?')) deleteMutation.mutate(id)
                }}
              >
                <Trash2 className="h-4 w-4 text-danger" />
              </Button>
            </div>
          )
        },
      },
    ],
    [config, deleteMutation],
  )

  return (
    <>
      <PageHeader
        title={config.title}
        description={config.description}
        action={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            Create
          </Button>
        }
      />
      <Card className="mb-4 p-4">
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_repeat(2,220px)]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" />
            <Input
              className="pl-9"
              placeholder={config.searchPlaceholder || 'Search...'}
              value={search}
              onChange={(event) => {
                setPage(1)
                setSearch(event.target.value)
              }}
            />
          </div>
          {config.filters?.map((filter) => (
            <Select
              key={filter.name}
              value={filters[filter.name] || ''}
              onChange={(event) => {
                setPage(1)
                setFilters((current) => ({ ...current, [filter.name]: event.target.value }))
              }}
            >
              <option value="">{filter.label}</option>
              {filter.options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          ))}
        </div>
      </Card>
      <DataTable
        data={listQuery.data}
        columns={columns}
        isLoading={listQuery.isLoading}
        error={listQuery.error}
        page={page}
        onPageChange={setPage}
        emptyTitle={config.emptyTitle}
      />
      <Modal title={`Create ${config.title}`} open={isCreateOpen} onClose={() => setCreateOpen(false)}>
        <ResourceForm fields={config.fields} onSubmit={(payload) => createMutation.mutate(payload)} isSubmitting={createMutation.isPending} />
      </Modal>
      <Modal title={`Edit ${config.title}`} open={Boolean(editing)} onClose={() => setEditing(null)}>
        <ResourceForm
          fields={config.fields}
          initialValues={editing || undefined}
          onSubmit={(payload) => {
            if (editing?.id) updateMutation.mutate({ id: editing.id as string | number, payload })
          }}
          isSubmitting={updateMutation.isPending}
        />
      </Modal>
    </>
  )
}
