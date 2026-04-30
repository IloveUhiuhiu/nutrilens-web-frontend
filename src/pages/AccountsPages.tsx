import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { KeyRound, Search, ShieldCheck, UserCheck } from 'lucide-react'
import { toast } from 'sonner'
import { request } from '../api/client'
import type { AccountDetail, AccountListItem, ActivityLevel, Page, QuotaConfig } from '../api/types'
import { DataTable, type Column } from '../components/DataTable'
import { Badge, Button, Card, Input, Modal, PageHeader, Select, Skeleton } from '../components/ui'
import { ResourceForm } from '../components/ResourceForm'
import { ResourcePage, type ResourceConfig } from './ResourcePage'
import { formatCalories, formatDate, formatDateTime, formatMacro, formatNumber } from '../lib/format'

function roleTone(role: AccountListItem['role']) {
  if (role === 'admin') return 'red'
  if (role === 'staff') return 'amber'
  return 'green'
}

const accountColumns: Column<AccountListItem>[] = [
  {
    key: 'user',
    header: 'User',
    render: (item) => (
      <div>
        <Link className="font-extrabold text-primary hover:underline" to={`/accounts/${item.id}`}>
          {item.full_name || item.email}
        </Link>
        <p className="text-xs text-subtle">{item.email}</p>
      </div>
    ),
  },
  { key: 'phone', header: 'Phone', render: (item) => item.phone_number || '—' },
  { key: 'role', header: 'Role', render: (item) => <Badge tone={roleTone(item.role)}>{item.role}</Badge> },
  { key: 'status', header: 'Status', render: (item) => <Badge tone={item.is_active ? 'green' : 'red'}>{item.is_active ? 'Active' : 'Blocked'}</Badge> },
  { key: 'joined', header: 'Joined', render: (item) => formatDateTime(item.date_joined) },
]

export function AccountsPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [role, setRole] = useState('')
  const query = useQuery({
    queryKey: ['accounts', page, search, role],
    queryFn: () =>
      request<Page<AccountListItem>>({
        url: '/admin/accounts/',
        method: 'GET',
        params: { page, search: search || undefined, role: role || undefined },
      }),
  })

  return (
    <>
      <PageHeader title="Accounts" description="Quản lý user, role, trạng thái và quota hoạt động." />
      <Card className="mb-4 p-4">
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" />
            <Input
              className="pl-9"
              placeholder="Search email or phone"
              value={search}
              onChange={(event) => {
                setPage(1)
                setSearch(event.target.value)
              }}
            />
          </div>
          <Select
            value={role}
            onChange={(event) => {
              setPage(1)
              setRole(event.target.value)
            }}
          >
            <option value="">All roles</option>
            <option value="admin">Admin</option>
            <option value="staff">Staff</option>
            <option value="user">User</option>
          </Select>
        </div>
      </Card>
      <DataTable data={query.data} columns={accountColumns} isLoading={query.isLoading} error={query.error} page={page} onPageChange={setPage} />
    </>
  )
}

export function AccountDetailPage() {
  const { id = '' } = useParams()
  const queryClient = useQueryClient()
  const [roleOpen, setRoleOpen] = useState(false)
  const [resetOpen, setResetOpen] = useState(false)
  const query = useQuery({ queryKey: ['account', id], queryFn: () => request<AccountDetail>({ url: `/admin/accounts/${id}/` }) })

  const statusMutation = useMutation({
    mutationFn: (is_active: boolean) => request<AccountDetail>({ url: `/admin/accounts/${id}/status/`, method: 'PATCH', data: { is_active } }),
    onSuccess: async () => {
      toast.success('Đã cập nhật trạng thái')
      await queryClient.invalidateQueries({ queryKey: ['account', id] })
      await queryClient.invalidateQueries({ queryKey: ['accounts'] })
    },
  })
  const roleMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) => request<AccountDetail>({ url: `/admin/accounts/${id}/role/`, method: 'PATCH', data: payload }),
    onSuccess: async () => {
      toast.success('Đã cập nhật role')
      setRoleOpen(false)
      await queryClient.invalidateQueries({ queryKey: ['account', id] })
    },
  })
  const resetMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) => request<null>({ url: `/admin/accounts/${id}/reset/`, method: 'POST', data: payload }),
    onSuccess: () => {
      toast.success('Đã reset mật khẩu')
      setResetOpen(false)
    },
  })

  if (query.isLoading) return <Skeleton className="h-[520px]" />
  if (!query.data) return null
  const account = query.data

  return (
    <>
      <PageHeader
        title={account.full_name || account.email}
        description={`${account.id} · joined ${formatDateTime(account.date_joined)}`}
        action={
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => statusMutation.mutate(!account.is_active)}>
              <UserCheck className="h-4 w-4" />
              {account.is_active ? 'Block' : 'Activate'}
            </Button>
            <Button variant="secondary" onClick={() => setRoleOpen(true)}>
              <ShieldCheck className="h-4 w-4" />
              Role
            </Button>
            <Button variant="secondary" onClick={() => setResetOpen(true)}>
              <KeyRound className="h-4 w-4" />
              Reset password
            </Button>
          </div>
        }
      />
      <div className="grid gap-4 xl:grid-cols-[1fr_380px]">
        <Card className="p-5">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Info label="Email" value={account.email} />
            <Info label="Phone" value={account.phone_number || '—'} />
            <Info label="Role" value={account.role} />
            <Info label="Status" value={account.is_active ? 'Active' : 'Blocked'} />
            <Info label="Height" value={`${formatNumber(account.height)} cm`} />
            <Info label="Weight" value={`${formatNumber(account.current_weight, 1)} kg`} />
            <Info label="BMI" value={formatNumber(account.bmi, 2)} />
            <Info label="TDEE" value={formatCalories(account.tdee)} />
          </div>
        </Card>
        <Card className="p-5">
          <h2 className="font-extrabold">Activity profile</h2>
          <p className="mt-3 text-sm text-subtle">{account.activity_level?.level_name || 'No activity level'}</p>
          <p className="mt-1 text-sm text-subtle">{account.activity_level?.description}</p>
          <p className="mt-4 text-sm font-bold">Birth date: {formatDate(account.birth_date)}</p>
        </Card>
      </div>
      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <Card className="p-5">
          <h2 className="mb-4 font-extrabold">Recent daily logs</h2>
          <div className="space-y-3">
            {account.daily_logs.length === 0 ? (
              <p className="text-sm text-subtle">No logs.</p>
            ) : (
              account.daily_logs.map((log) => (
                <div key={log.id} className="rounded-xl border border-border p-3 text-sm">
                  <div className="flex justify-between gap-3">
                    <span className="font-bold">{formatDate(log.date)}</span>
                    <span>{formatCalories(log.total_calories)}</span>
                  </div>
                  <p className="mt-1 text-xs text-subtle">
                    {formatMacro(log.total_protein)} P · {formatMacro(log.total_carbs)} C · {formatMacro(log.total_fat)} F
                  </p>
                </div>
              ))
            )}
          </div>
        </Card>
        <Card className="p-5">
          <h2 className="mb-4 font-extrabold">Weight history</h2>
          <div className="space-y-3">
            {account.weight_histories.length === 0 ? (
              <p className="text-sm text-subtle">No weight records.</p>
            ) : (
              account.weight_histories.map((history) => (
                <div key={history.measured_at} className="flex justify-between rounded-xl border border-border p-3 text-sm">
                  <span>{formatDateTime(history.measured_at)}</span>
                  <span className="font-bold">{formatNumber(history.weight, 1)} kg</span>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
      <Modal title="Change role" open={roleOpen} onClose={() => setRoleOpen(false)}>
        <ResourceForm
          fields={[
            {
              name: 'role',
              label: 'Role',
              type: 'select',
              options: [
                { label: 'User', value: 'user' },
                { label: 'Staff', value: 'staff' },
                { label: 'Admin', value: 'admin' },
              ],
            },
          ]}
          initialValues={{ role: account.role }}
          onSubmit={(payload) => roleMutation.mutate(payload)}
          isSubmitting={roleMutation.isPending}
        />
      </Modal>
      <Modal title="Reset password" open={resetOpen} onClose={() => setResetOpen(false)}>
        <ResourceForm
          fields={[{ name: 'new_password', label: 'New password', required: false }]}
          onSubmit={(payload) => resetMutation.mutate(payload)}
          submitLabel="Reset"
          isSubmitting={resetMutation.isPending}
        />
      </Modal>
    </>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-background p-3">
      <p className="text-xs font-bold uppercase tracking-wide text-subtle">{label}</p>
      <p className="mt-1 break-words text-sm font-extrabold text-ink">{value}</p>
    </div>
  )
}

const activityConfig: ResourceConfig<ActivityLevel> = {
  title: 'Activity Levels',
  description: 'CRUD mức độ vận động dùng để tính TDEE.',
  endpoint: '/admin/accounts/activity-levels/',
  columns: [
    { key: 'name', header: 'Name', render: (item) => <span className="font-bold">{item.level_name}</span> },
    { key: 'ratio', header: 'Ratio', render: (item) => formatNumber(item.ratio, 2) },
    { key: 'description', header: 'Description', render: (item) => item.description || '—' },
  ],
  fields: [
    { name: 'level_name', label: 'Level name', required: true },
    { name: 'ratio', label: 'PAL ratio', type: 'number', required: true },
    { name: 'description', label: 'Description', type: 'textarea' },
  ],
}

export function ActivityLevelsPage() {
  return <ResourcePage config={activityConfig} />
}

export function SettingsPage() {
  const queryClient = useQueryClient()
  const [lastQuota, setLastQuota] = useState<QuotaConfig | null>(null)
  const mutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) => request<QuotaConfig>({ url: '/admin/accounts/quota/', method: 'PUT', data: payload }),
    onSuccess: async (data) => {
      setLastQuota(data)
      toast.success('Đã cập nhật quota')
      await queryClient.invalidateQueries({ queryKey: ['quota'] })
    },
  })

  return (
    <>
      <PageHeader title="Settings" description="Backend hiện hỗ trợ quota guest scan và thông tin admin profile qua /accounts/profile/." />
      <Card className="max-w-2xl p-5">
        <h2 className="mb-4 text-base font-extrabold">Guest scan quota</h2>
        <p className="mb-4 text-sm text-subtle">
          Backend chỉ expose `PUT /admin/accounts/quota/`, chưa có endpoint GET quota. Giá trị mặc định trong form là assumption an toàn từ model.
        </p>
        <ResourceForm
          fields={[{ name: 'guest_scan_limit', label: 'Guest scan limit', type: 'number', required: true }]}
          initialValues={lastQuota || { guest_scan_limit: 2 }}
          onSubmit={(payload) => mutation.mutate(payload)}
          isSubmitting={mutation.isPending}
        />
        {lastQuota && <p className="mt-3 text-sm text-subtle">Updated at {formatDateTime(lastQuota.updated_at)}</p>}
      </Card>
    </>
  )
}
