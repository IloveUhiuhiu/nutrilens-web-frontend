import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, Shield, Trash2, Users } from 'lucide-react'
import { toast } from 'sonner'
import { request } from '../api/client'
import type {
  AccountDetail,
  AccountListItem,
  GroupDetail,
  GroupListItem,
  Page,
  PermissionItem,
  UserPermissions,
} from '../api/types'
import { DataTable, type Column } from '../components/DataTable'
import {
  Avatar,
  Badge,
  Button,
  Card,
  DeleteConfirmModal,
  DetailModal,
  DrawerField,
  Input,
  Modal,
  PageHeader,
  Select,
  Skeleton,
  TabBar,
} from '../components/ui'
import { ResourceForm } from '../components/ResourceForm'
import { initials } from '../lib/utils'

// ─── Constants ────────────────────────────────────────────────────────────────

const APP_LABELS = ['accounts', 'analysis', 'nutrients', 'inference', 'auth']

// ─── RoleBadge helper ─────────────────────────────────────────────────────────

function RoleBadge({ role }: { role: 'admin' | 'staff' | 'user' }) {
  const config: Record<string, { tone: 'mint' | 'amber' | 'neutral'; label: string }> = {
    admin: { tone: 'mint', label: 'Admin' },
    staff: { tone: 'amber', label: 'Staff' },
    user: { tone: 'neutral', label: 'Người dùng' },
  }
  const { tone, label } = config[role] ?? { tone: 'neutral' as const, label: role }
  return <Badge tone={tone}>{label}</Badge>
}

// ─── AuthMatrixPage ───────────────────────────────────────────────────────────

export function AuthMatrixPage() {
  const [activeTab, setActiveTab] = useState('groups')

  return (
    <>
      <PageHeader
        title="Vai trò & Quyền"
        description="Quản lý Django Groups, phân quyền và gán nhóm quyền cho tài khoản."
      />
      <div className="mb-5">
        <TabBar
          tabs={[
            { key: 'groups', label: 'Nhóm quyền' },
            { key: 'permissions', label: 'Danh sách quyền' },
            { key: 'users', label: 'Phân quyền người dùng' },
          ]}
          active={activeTab}
          onChange={setActiveTab}
        />
      </div>
      {activeTab === 'groups' && <GroupsTab />}
      {activeTab === 'permissions' && <PermissionsTab />}
      {activeTab === 'users' && <UsersTab />}
    </>
  )
}

// ─── GroupsTab ────────────────────────────────────────────────────────────────

function GroupsTab() {
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
      <div className="mb-4 flex items-center gap-3">
        <Card className="flex-1 p-4">
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
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" />
          Tạo nhóm mới
        </Button>
      </div>

      <DataTable
        data={groupQuery.data}
        columns={columns}
        isLoading={groupQuery.isLoading}
        error={groupQuery.error}
        page={page}
        onPageChange={setPage}
        emptyTitle="Chưa có nhóm quyền nào"
      />

      <Modal title="Tạo nhóm quyền mới" open={createOpen} onClose={() => setCreateOpen(false)}>
        <ResourceForm
          fields={[{ name: 'name', label: 'Tên nhóm', required: true }]}
          onSubmit={(payload) => createMutation.mutate(payload)}
          isSubmitting={createMutation.isPending}
          submitLabel="Tạo nhóm"
        />
      </Modal>

      {detailGroup && (
        <GroupDetailModal
          groupId={detailGroup.id}
          onClose={() => setDetailGroup(null)}
        />
      )}

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

// ─── PermissionsTab ───────────────────────────────────────────────────────────

function PermissionsTab() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [appLabel, setAppLabel] = useState('')

  const permQuery = useQuery({
    queryKey: ['all-permissions', page, search, appLabel],
    queryFn: () =>
      request<Page<PermissionItem>>({
        url: '/admin/auth/permissions/',
        params: {
          page,
          search: search || undefined,
          app_label: appLabel || undefined,
          page_size: 50,
        },
      }),
  })

  const columns: Column<PermissionItem>[] = [
    {
      key: 'name',
      header: 'Tên quyền',
      render: (item) => (
        <div>
          <p className="text-sm text-ink">{item.name}</p>
          {item.description && (
            <p className="mt-0.5 text-xs text-subtle">{item.description}</p>
          )}
        </div>
      ),
    },
    {
      key: 'app',
      header: 'Module',
      render: (item) => (
        <Badge tone="blue">{item.content_type_label.split('.')[0]}</Badge>
      ),
    },
    {
      key: 'model',
      header: 'Model',
      render: (item) => (
        <span className="text-xs text-subtle">{item.content_type_label.split('.')[1]}</span>
      ),
    },
    {
      key: 'codename',
      header: 'Mã quyền',
      render: (item) => (
        <span className="font-mono text-xs text-subtle">{item.codename}</span>
      ),
    },
  ]

  return (
    <>
      <Card className="mb-4 p-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1 max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" />
            <Input
              className="pl-9"
              placeholder="Tìm theo tên hoặc mã quyền..."
              value={search}
              onChange={(e) => { setPage(1); setSearch(e.target.value) }}
            />
          </div>
          <Select
            value={appLabel}
            onChange={(e) => { setPage(1); setAppLabel(e.target.value) }}
            className="w-full sm:w-48"
          >
            <option value="">Tất cả module</option>
            {APP_LABELS.map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </Select>
        </div>
      </Card>

      <DataTable
        data={permQuery.data}
        columns={columns}
        isLoading={permQuery.isLoading}
        error={permQuery.error}
        page={page}
        onPageChange={setPage}
        emptyTitle="Không tìm thấy quyền nào"
      />
    </>
  )
}

// ─── UsersTab ─────────────────────────────────────────────────────────────────

function UsersTab() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [assignTarget, setAssignTarget] = useState<AccountListItem | null>(null)
  const [permsTarget, setPermsTarget] = useState<AccountListItem | null>(null)

  const usersQuery = useQuery({
    queryKey: ['admin-users-rbac', page, search],
    queryFn: () =>
      request<Page<AccountListItem>>({
        url: '/admin/accounts/',
        params: { page, search: search || undefined },
      }),
  })

  const columns: Column<AccountListItem>[] = [
    {
      key: 'user',
      header: 'Người dùng',
      render: (item) => (
        <div className="flex items-center gap-2.5">
          <Avatar
            src={item.avatar_url}
            fallback={initials(item.full_name, item.email)}
            size={34}
          />
          <div className="min-w-0">
            <p className="truncate font-bold text-ink">{item.full_name || '—'}</p>
            <p className="truncate text-xs text-subtle">{item.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Vai trò',
      render: (item) => <RoleBadge role={item.role} />,
    },
    {
      key: 'status',
      header: 'Trạng thái',
      render: (item) => (
        <Badge tone={item.is_active ? 'mint' : 'neutral'}>
          {item.is_active ? 'Hoạt động' : 'Bị khóa'}
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
            onClick={() => setAssignTarget(item)}
          >
            Phân nhóm
          </Button>
          <Button
            variant="secondary"
            className="h-8 px-2.5 text-xs"
            onClick={() => setPermsTarget(item)}
          >
            Xem quyền
          </Button>
        </div>
      ),
    },
  ]

  return (
    <>
      <Card className="mb-4 p-4">
        <div className="relative max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" />
          <Input
            className="pl-9"
            placeholder="Tìm theo tên hoặc email..."
            value={search}
            onChange={(e) => { setPage(1); setSearch(e.target.value) }}
          />
        </div>
      </Card>

      <DataTable
        data={usersQuery.data}
        columns={columns}
        isLoading={usersQuery.isLoading}
        error={usersQuery.error}
        page={page}
        onPageChange={setPage}
        emptyTitle="Không tìm thấy tài khoản nào"
      />

      {assignTarget && (
        <GroupAssignModal
          user={assignTarget}
          onClose={() => setAssignTarget(null)}
        />
      )}

      {permsTarget && (
        <UserEffectivePermsModal
          user={permsTarget}
          onClose={() => setPermsTarget(null)}
        />
      )}
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

          <Button variant="secondary" className="w-full" onClick={() => setEditOpen(true)}>
            Đổi tên nhóm
          </Button>

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
                          className="flex cursor-pointer items-start gap-2.5 rounded-[8px] px-2 py-1.5 hover:bg-muted/60"
                        >
                          <input
                            type="checkbox"
                            className="mt-0.5 h-3.5 w-3.5 shrink-0 accent-primary"
                            checked={currentPermIds.has(perm.id)}
                            onChange={() => togglePermission(perm.id)}
                            disabled={updateMutation.isPending}
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs text-ink">{perm.name}</p>
                            {perm.description && (
                              <p className="text-[10px] text-subtle">{perm.description}</p>
                            )}
                          </div>
                          <span className="shrink-0 font-mono text-[10px] text-subtle">{perm.codename}</span>
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

// ─── GroupAssignModal ─────────────────────────────────────────────────────────

function GroupAssignModal({ user, onClose }: { user: AccountListItem; onClose: () => void }) {
  const queryClient = useQueryClient()
  const [selectedGroupIds, setSelectedGroupIds] = useState<Set<number>>(new Set())

  const userDetailQuery = useQuery({
    queryKey: ['account-detail', user.id],
    queryFn: () => request<AccountDetail>({ url: `/admin/accounts/${user.id}/` }),
  })

  const allGroupsQuery = useQuery({
    queryKey: ['auth-groups-all'],
    queryFn: () =>
      request<Page<GroupListItem>>({
        url: '/admin/auth/groups/',
        params: { page_size: 100 },
      }),
  })

  useEffect(() => {
    if (userDetailQuery.data) {
      setSelectedGroupIds(new Set(userDetailQuery.data.groups))
    }
  }, [userDetailQuery.data])

  const assignMutation = useMutation({
    mutationFn: () =>
      request<AccountDetail>({
        url: `/admin/accounts/${user.id}/role/`,
        method: 'PATCH',
        data: { group_ids: [...selectedGroupIds] },
      }),
    onSuccess: async () => {
      toast.success('Đã cập nhật nhóm quyền cho người dùng')
      await queryClient.invalidateQueries({ queryKey: ['admin-users-rbac'] })
      onClose()
    },
  })

  const allGroups = allGroupsQuery.data?.results ?? []
  const isLoading = userDetailQuery.isLoading || allGroupsQuery.isLoading

  function toggleGroup(groupId: number) {
    setSelectedGroupIds((prev) => {
      const next = new Set(prev)
      if (next.has(groupId)) next.delete(groupId)
      else next.add(groupId)
      return next
    })
  }

  return (
    <Modal
      title={`Phân nhóm quyền: ${user.full_name || user.email}`}
      open
      onClose={onClose}
      width="max-w-lg"
    >
      {isLoading ? (
        <Skeleton className="h-40" />
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-subtle">
            Chọn nhóm quyền cho người dùng này. Mỗi nhóm cấp một tập hợp quyền riêng.
          </p>
          <div className="space-y-1.5 rounded-[12px] border border-border p-3">
            {allGroups.length === 0 ? (
              <p className="py-4 text-center text-sm text-subtle">Không có nhóm quyền nào.</p>
            ) : (
              allGroups.map((group) => (
                <label
                  key={group.id}
                  className="flex cursor-pointer items-center gap-2.5 rounded-[8px] px-2 py-2 hover:bg-muted/60"
                >
                  <input
                    type="checkbox"
                    className="h-3.5 w-3.5 accent-primary"
                    checked={selectedGroupIds.has(group.id)}
                    onChange={() => toggleGroup(group.id)}
                  />
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <Shield className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <span className="flex-1 text-sm font-medium text-ink">{group.name}</span>
                  <span className="text-xs text-subtle">
                    {group.member_count} người · {group.permission_count} quyền
                  </span>
                </label>
              ))
            )}
          </div>
          <Button
            className="w-full"
            onClick={() => assignMutation.mutate()}
            disabled={assignMutation.isPending}
          >
            {assignMutation.isPending ? 'Đang lưu...' : 'Lưu phân nhóm'}
          </Button>
        </div>
      )}
    </Modal>
  )
}

// ─── UserEffectivePermsModal ──────────────────────────────────────────────────

function UserEffectivePermsModal({ user, onClose }: { user: AccountListItem; onClose: () => void }) {
  const permsQuery = useQuery({
    queryKey: ['user-effective-perms', user.id],
    queryFn: () =>
      request<UserPermissions>({ url: `/admin/accounts/${user.id}/permissions/` }),
  })

  const data = permsQuery.data

  const permsByApp = (data?.effective_permissions ?? []).reduce<Record<string, string[]>>(
    (acc, perm) => {
      const app = perm.split('.')[0]
      if (!acc[app]) acc[app] = []
      acc[app].push(perm.split('.')[1])
      return acc
    },
    {},
  )

  return (
    <DetailModal
      open
      onClose={onClose}
      title={`Quyền hiệu lực: ${user.full_name || user.email}`}
      subtitle={
        data
          ? `${data.effective_permissions.length} quyền · ${data.groups.length} nhóm`
          : undefined
      }
    >
      {permsQuery.isLoading && <Skeleton className="h-64" />}
      {data && (
        <div className="space-y-5">
          <div className="grid grid-cols-3 gap-3">
            <DrawerField label="Email" value={data.email} />
            <DrawerField label="Staff" value={data.is_staff ? 'Có' : 'Không'} />
            <DrawerField label="Superuser" value={data.is_superuser ? 'Có' : 'Không'} />
          </div>

          <div>
            <p className="mb-2 text-[10px] font-extrabold uppercase tracking-widest text-subtle/70">
              Nhóm quyền
            </p>
            <div className="flex flex-wrap gap-1.5">
              {data.groups.length > 0 ? (
                data.groups.map((g) => (
                  <Badge key={g.id} tone="mint">{g.name}</Badge>
                ))
              ) : (
                <span className="text-sm text-subtle">Không có nhóm quyền nào</span>
              )}
            </div>
          </div>

          <div>
            <p className="mb-2 text-[10px] font-extrabold uppercase tracking-widest text-subtle/70">
              Quyền hiệu lực ({data.effective_permissions.length})
            </p>
            {data.is_superuser ? (
              <Badge tone="amber">Superuser — có toàn quyền hệ thống</Badge>
            ) : data.effective_permissions.length === 0 ? (
              <p className="text-sm text-subtle">Không có quyền nào.</p>
            ) : (
              <div className="max-h-64 overflow-y-auto space-y-3 rounded-[12px] border border-border p-3">
                {Object.entries(permsByApp).map(([app, codenames]) => (
                  <div key={app}>
                    <p className="mb-1.5 text-[10px] font-extrabold uppercase tracking-widest text-subtle/60">
                      {app}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {codenames.map((codename) => (
                        <span
                          key={codename}
                          className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-subtle"
                        >
                          {codename}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </DetailModal>
  )
}
