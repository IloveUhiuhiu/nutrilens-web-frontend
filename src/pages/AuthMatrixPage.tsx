import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, Shield, Trash2, Users } from 'lucide-react'
import { toast } from 'sonner'
import { request } from '../api/client'
import type { Page } from '../api/types'
import { DataTable, type Column } from '../components/DataTable'
import {
  Badge,
  Button,
  Card,
  DeleteConfirmModal,
  DetailModal,
  DrawerField,
  Input,
  Modal,
  PageHeader,
  Skeleton,
} from '../components/ui'
import { ResourceForm } from '../components/ResourceForm'

// ─── Types ────────────────────────────────────────────────────────────────────

type PermissionItem = {
  id: number
  name: string
  codename: string
  content_type: number
  content_type_label: string
}

type GroupListItem = {
  id: number
  name: string
  member_count: number
  permission_count: number
}

type GroupDetail = {
  id: number
  name: string
  member_count: number
  permissions: PermissionItem[]
}

// ─── AuthMatrixPage ───────────────────────────────────────────────────────────

export function AuthMatrixPage() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [detailGroup, setDetailGroup] = useState<GroupListItem | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null)

  const groupQuery = useQuery({
    queryKey: ['auth-groups', page, search],
    queryFn: () =>
      request<Page<GroupListItem>>({
        url: '/admin/auth/groups/',
        params: { page, search: search || undefined },
      }),
  })

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      request<GroupDetail>({ url: '/admin/auth/groups/', method: 'POST', data }),
    onSuccess: async () => {
      toast.success('Đã tạo nhóm quyền')
      setCreateOpen(false)
      await queryClient.invalidateQueries({ queryKey: ['auth-groups'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) =>
      request<null>({ url: `/admin/auth/groups/${id}/`, method: 'DELETE' }),
    onSuccess: async () => {
      toast.success('Đã xóa nhóm quyền')
      setDeleteTarget(null)
      await queryClient.invalidateQueries({ queryKey: ['auth-groups'] })
    },
  })

  const columns: Column<GroupListItem>[] = [
    {
      key: 'name',
      header: 'Tên nhóm',
      render: (item) => (
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <Shield className="h-4 w-4 text-primary" />
          </div>
          <span className="font-bold text-ink">{item.name}</span>
        </div>
      ),
    },
    {
      key: 'members',
      header: 'Thành viên',
      render: (item) => (
        <div className="flex items-center gap-1.5 text-sm text-subtle">
          <Users className="h-3.5 w-3.5" />
          {item.member_count} người dùng
        </div>
      ),
    },
    {
      key: 'permissions',
      header: 'Số quyền',
      render: (item) => (
        <Badge tone={item.permission_count > 0 ? 'mint' : 'neutral'}>
          {item.permission_count} quyền
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'px-4 py-3 text-right',
      render: (item) => (
        <div className="flex justify-end gap-1.5">
          <Button
            variant="secondary"
            className="h-8 px-2.5 text-xs"
            onClick={() => setDetailGroup(item)}
          >
            Chi tiết
          </Button>
          <Button
            variant="secondary"
            className="h-8 w-8 p-0"
            title="Xóa nhóm"
            onClick={() => setDeleteTarget(item.id)}
          >
            <Trash2 className="h-3.5 w-3.5 text-danger" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <>
      <PageHeader
        title="Ma trận Vai trò & Quyền"
        description="Quản lý Django Groups và phân quyền cho tài khoản admin."
        action={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            Tạo nhóm mới
          </Button>
        }
      />

      <Card className="mb-4 p-4">
        <div className="relative max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" />
          <Input
            className="pl-9"
            placeholder="Tìm theo tên nhóm..."
            value={search}
            onChange={(e) => { setPage(1); setSearch(e.target.value) }}
          />
        </div>
      </Card>

      <DataTable
        data={groupQuery.data}
        columns={columns}
        isLoading={groupQuery.isLoading}
        error={groupQuery.error}
        page={page}
        onPageChange={setPage}
        emptyTitle="Chưa có nhóm quyền nào"
      />

      {/* Create modal */}
      <Modal title="Tạo nhóm quyền mới" open={createOpen} onClose={() => setCreateOpen(false)}>
        <ResourceForm
          fields={[{ name: 'name', label: 'Tên nhóm', required: true }]}
          onSubmit={(payload) => createMutation.mutate(payload)}
          isSubmitting={createMutation.isPending}
          submitLabel="Tạo nhóm"
        />
      </Modal>

      {/* Group detail modal */}
      {detailGroup && (
        <GroupDetailModal
          groupId={detailGroup.id}
          onClose={() => setDetailGroup(null)}
        />
      )}

      {/* Delete confirm */}
      <DeleteConfirmModal
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => { if (deleteTarget !== null) deleteMutation.mutate(deleteTarget) }}
        isDeleting={deleteMutation.isPending}
        description="Nhóm quyền này sẽ bị xóa vĩnh viễn. Người dùng trong nhóm sẽ mất các quyền liên quan."
      />
    </>
  )
}

// ─── GroupDetailModal ─────────────────────────────────────────────────────────

function GroupDetailModal({ groupId, onClose }: { groupId: number; onClose: () => void }) {
  const queryClient = useQueryClient()
  const [permSearch, setPermSearch] = useState('')
  const [editOpen, setEditOpen] = useState(false)

  const groupQuery = useQuery({
    queryKey: ['auth-group', groupId],
    queryFn: () => request<GroupDetail>({ url: `/admin/auth/groups/${groupId}/` }),
  })

  const permQuery = useQuery({
    queryKey: ['auth-permissions', permSearch],
    queryFn: () =>
      request<Page<PermissionItem>>({
        url: '/admin/auth/permissions/',
        params: { search: permSearch || undefined, page_size: 100 },
      }),
  })

  const updateMutation = useMutation({
    mutationFn: (data: { name?: string; permission_ids?: number[] }) =>
      request<GroupDetail>({ url: `/admin/auth/groups/${groupId}/`, method: 'PATCH', data }),
    onSuccess: async () => {
      toast.success('Đã cập nhật nhóm quyền')
      setEditOpen(false)
      await queryClient.invalidateQueries({ queryKey: ['auth-group', groupId] })
      await queryClient.invalidateQueries({ queryKey: ['auth-groups'] })
    },
  })

  const group = groupQuery.data
  const allPerms = permQuery.data?.results ?? []

  const currentPermIds = new Set(group?.permissions.map((p) => p.id) ?? [])

  function togglePermission(permId: number) {
    const next = new Set(currentPermIds)
    if (next.has(permId)) next.delete(permId)
    else next.add(permId)
    updateMutation.mutate({ permission_ids: [...next] })
  }

  // Group permissions by app label for display
  const permsByApp = allPerms.reduce<Record<string, PermissionItem[]>>((acc, p) => {
    const app = p.content_type_label.split('.')[0]
    if (!acc[app]) acc[app] = []
    acc[app].push(p)
    return acc
  }, {})

  return (
    <DetailModal
      open
      onClose={onClose}
      title={group?.name ?? 'Nhóm quyền'}
      subtitle={group ? `${group.member_count} thành viên · ${group.permissions.length} quyền` : undefined}
    >
      {groupQuery.isLoading && <Skeleton className="h-96" />}
      {group && (
        <div className="space-y-5">
          {/* Summary row */}
          <div className="grid grid-cols-2 gap-3">
            <DrawerField label="Tên nhóm" value={group.name} />
            <DrawerField
              label="Thành viên"
              value={
                <div className="flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 text-subtle" />
                  <span>{group.member_count} người dùng</span>
                </div>
              }
            />
          </div>

          {/* Rename button */}
          <Button variant="secondary" className="w-full" onClick={() => setEditOpen(true)}>
            Đổi tên nhóm
          </Button>

          {/* Permission assignment */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-subtle/70">
                Gán quyền cho nhóm
              </p>
              <span className="text-xs text-subtle">{currentPermIds.size} đã chọn</span>
            </div>
            <div className="relative mb-3">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-subtle" />
              <Input
                className="pl-8 text-xs"
                placeholder="Lọc quyền theo tên..."
                value={permSearch}
                onChange={(e) => setPermSearch(e.target.value)}
              />
            </div>
            {permQuery.isLoading ? (
              <Skeleton className="h-48" />
            ) : (
              <div className="max-h-72 overflow-y-auto space-y-4 rounded-[12px] border border-border p-3">
                {Object.entries(permsByApp).map(([app, perms]) => (
                  <div key={app}>
                    <p className="mb-2 text-[10px] font-extrabold uppercase tracking-widest text-subtle/60">{app}</p>
                    <div className="space-y-1">
                      {perms.map((perm) => (
                        <label
                          key={perm.id}
                          className="flex cursor-pointer items-center gap-2.5 rounded-[8px] px-2 py-1.5 hover:bg-muted/60"
                        >
                          <input
                            type="checkbox"
                            className="h-3.5 w-3.5 accent-primary"
                            checked={currentPermIds.has(perm.id)}
                            onChange={() => togglePermission(perm.id)}
                            disabled={updateMutation.isPending}
                          />
                          <span className="flex-1 text-xs text-ink">{perm.name}</span>
                          <span className="font-mono text-[10px] text-subtle">{perm.codename}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
                {Object.keys(permsByApp).length === 0 && (
                  <p className="py-4 text-center text-sm text-subtle">Không tìm thấy quyền nào.</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Rename modal */}
      <Modal title="Đổi tên nhóm" open={editOpen} onClose={() => setEditOpen(false)}>
        <ResourceForm
          fields={[{ name: 'name', label: 'Tên nhóm mới', required: true }]}
          initialValues={group ? { name: group.name } : undefined}
          onSubmit={(payload) => updateMutation.mutate({ name: payload.name as string })}
          isSubmitting={updateMutation.isPending}
          submitLabel="Lưu"
        />
      </Modal>
    </DetailModal>
  )
}
