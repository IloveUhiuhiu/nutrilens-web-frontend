import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { KeyRound, Plus, Search, ShieldCheck, UserCheck } from 'lucide-react'
import { toast } from 'sonner'
import { request } from '../api/client'
import type { AccountDetail, AccountListItem, AccountOTP, ActivityLevel, Page, QuotaConfig } from '../api/types'
import { DataTable, type Column } from '../components/DataTable'
import {
  Avatar,
  Badge,
  Button,
  Card,
  DateRangePicker,
  DrawerField,
  Drawer,
  IdCell,
  Input,
  Modal,
  PageHeader,
  Select,
  Skeleton,
} from '../components/ui'
import { ResourceForm } from '../components/ResourceForm'
import { ResourcePage, type ResourceConfig } from './ResourcePage'
import { formatCalories, formatDate, formatDateTime, formatMacro, formatNumber } from '../lib/format'
import { initials } from '../lib/utils'

// ─── helpers ─────────────────────────────────────────────────────────────────

function genderLabel(g?: string) {
  if (g === 'M') return 'Nam'
  if (g === 'F') return 'Nữ'
  if (g === 'O') return 'Khác'
  return '—'
}

function roleTone(role: AccountListItem['role']) {
  if (role === 'admin') return 'red' as const
  if (role === 'staff') return 'amber' as const
  return 'mint' as const
}

function roleLabel(role: string) {
  if (role === 'admin') return 'Quản trị viên'
  if (role === 'staff') return 'Nhân viên'
  return 'Người dùng'
}

// ─── AccountsPage (list) ──────────────────────────────────────────────────────

const accountColumns: Column<AccountListItem>[] = [
  {
    key: 'id_col',
    header: 'Mã Người dùng',
    render: (item) => <IdCell id={item.id} />,
  },
  {
    key: 'user',
    header: 'Thông tin',
    render: (item) => (
      <div className="flex items-center gap-2.5">
        <Avatar
          src={item.avatar_url}
          fallback={initials(item.full_name, item.email)}
          size={32}
        />
        <div>
          <Link
            className="text-[13px] font-extrabold text-primary hover:underline"
            to={`/accounts/${item.id}`}
          >
            {item.full_name || '—'}
          </Link>
          <p className="text-xs text-subtle">{item.email}</p>
        </div>
      </div>
    ),
  },
  { key: 'phone', header: 'Số điện thoại', render: (item) => item.phone_number || '—' },
  {
    key: 'gender',
    header: 'Giới tính',
    render: (item) => genderLabel(item.gender),
  },
  {
    key: 'role',
    header: 'Vai trò',
    render: (item) => <Badge tone={roleTone(item.role)}>{roleLabel(item.role)}</Badge>,
  },
  {
    key: 'status',
    header: 'Trạng thái',
    render: (item) => (
      <Badge tone={item.is_active ? 'mint' : 'red'}>
        {item.is_active ? 'Hoạt động' : 'Đã khóa'}
      </Badge>
    ),
  },
  {
    key: 'last_login',
    header: 'Đăng nhập cuối',
    render: (item) => formatDateTime(item.last_login),
  },
  { key: 'joined', header: 'Ngày tham gia', render: (item) => formatDate(item.date_joined) },
]

export function AccountsPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [role, setRole] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [drawerItem, setDrawerItem] = useState<AccountListItem | null>(null)

  const query = useQuery({
    queryKey: ['accounts', page, search, role, startDate, endDate],
    queryFn: () =>
      request<Page<AccountListItem>>({
        url: '/admin/accounts/',
        method: 'GET',
        params: {
          page,
          search: search || undefined,
          role: role || undefined,
          start_date: startDate || undefined,
          end_date: endDate || undefined,
        },
      }),
  })

  const columnsWithAction: Column<AccountListItem>[] = [
    ...accountColumns,
    {
      key: 'actions',
      header: '',
      className: 'px-4 py-3 text-right',
      render: (item) => (
        <Button variant="secondary" className="h-8 px-2.5 text-xs" onClick={() => setDrawerItem(item)}>
          Xem Chi tiết
        </Button>
      ),
    },
  ]

  return (
    <>
      <PageHeader
        title="Quản lý Tài khoản"
        description="Quản lý người dùng, vai trò, trạng thái tài khoản và định mức hoạt động."
      />
      <Card className="mb-4 p-4">
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_180px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" />
            <Input
              className="pl-9"
              placeholder="Tìm theo Mã ID, Email, Tên, Số điện thoại..."
              value={search}
              onChange={(e) => { setPage(1); setSearch(e.target.value) }}
            />
          </div>
          <Select value={role} onChange={(e) => { setPage(1); setRole(e.target.value) }}>
            <option value="">Tất cả vai trò</option>
            <option value="admin">Quản trị viên</option>
            <option value="staff">Nhân viên</option>
            <option value="user">Người dùng</option>
          </Select>
        </div>
        <div className="mt-3">
          <DateRangePicker
            startDate={startDate}
            endDate={endDate}
            onStartChange={(v) => { setPage(1); setStartDate(v) }}
            onEndChange={(v) => { setPage(1); setEndDate(v) }}
          />
        </div>
      </Card>

      <DataTable
        data={query.data}
        columns={columnsWithAction}
        isLoading={query.isLoading}
        error={query.error}
        page={page}
        onPageChange={setPage}
        emptyTitle="Chưa có tài khoản nào"
      />

      {/* ── Quick info drawer ── */}
      {drawerItem && (
        <AccountQuickDrawer
          id={drawerItem.id}
          onClose={() => setDrawerItem(null)}
        />
      )}
    </>
  )
}

// ─── Quick Drawer (opens from list) ──────────────────────────────────────────

function AccountQuickDrawer({ id, onClose }: { id: string; onClose: () => void }) {
  const query = useQuery({
    queryKey: ['account', id],
    queryFn: () => request<AccountDetail>({ url: `/admin/accounts/${id}/` }),
  })

  const account = query.data

  return (
    <Drawer
      open
      onClose={onClose}
      title={account?.full_name || account?.email || id}
      subtitle={`${id} · ${account ? roleLabel(account.role) : ''}`}
    >
      {query.isLoading && <Skeleton className="h-[480px]" />}
      {account && <AccountDetailContent account={account} />}
    </Drawer>
  )
}

// ─── AccountDetailPage (full page) ───────────────────────────────────────────

export function AccountDetailPage() {
  const { id = '' } = useParams()
  const queryClient = useQueryClient()
  const [roleOpen, setRoleOpen] = useState(false)
  const [resetOpen, setResetOpen] = useState(false)
  const query = useQuery({
    queryKey: ['account', id],
    queryFn: () => request<AccountDetail>({ url: `/admin/accounts/${id}/` }),
  })

  const statusMutation = useMutation({
    mutationFn: (is_active: boolean) =>
      request<AccountDetail>({ url: `/admin/accounts/${id}/status/`, method: 'PATCH', data: { is_active } }),
    onSuccess: async () => {
      toast.success('Đã cập nhật trạng thái tài khoản')
      await queryClient.invalidateQueries({ queryKey: ['account', id] })
      await queryClient.invalidateQueries({ queryKey: ['accounts'] })
    },
  })
  const roleMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      request<AccountDetail>({ url: `/admin/accounts/${id}/role/`, method: 'PATCH', data: payload }),
    onSuccess: async () => {
      toast.success('Đã cập nhật vai trò')
      setRoleOpen(false)
      await queryClient.invalidateQueries({ queryKey: ['account', id] })
    },
  })
  const resetMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      request<null>({ url: `/admin/accounts/${id}/reset/`, method: 'POST', data: payload }),
    onSuccess: () => {
      toast.success('Đã đặt lại mật khẩu')
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
        description={`${account.id} · Tham gia ${formatDateTime(account.date_joined)}`}
        action={
          <div className="flex flex-wrap gap-2">
            <Button
              variant={account.is_active ? 'secondary' : 'primary'}
              onClick={() => statusMutation.mutate(!account.is_active)}
            >
              <UserCheck className="h-4 w-4" />
              {account.is_active ? 'Khóa tài khoản' : 'Mở khóa'}
            </Button>
            <Button variant="secondary" onClick={() => setRoleOpen(true)}>
              <ShieldCheck className="h-4 w-4" />
              Đổi vai trò
            </Button>
            <Button variant="secondary" onClick={() => setResetOpen(true)}>
              <KeyRound className="h-4 w-4" />
              Đặt lại mật khẩu
            </Button>
          </div>
        }
      />
      <AccountDetailContent account={account} />

      <Modal title="Thay đổi vai trò" open={roleOpen} onClose={() => setRoleOpen(false)}>
        <ResourceForm
          fields={[
            {
              name: 'role',
              label: 'Vai trò',
              type: 'select',
              options: [
                { label: 'Người dùng', value: 'user' },
                { label: 'Nhân viên', value: 'staff' },
                { label: 'Quản trị viên', value: 'admin' },
              ],
            },
          ]}
          initialValues={{ role: account.role }}
          onSubmit={(payload) => roleMutation.mutate(payload)}
          isSubmitting={roleMutation.isPending}
        />
      </Modal>
      <Modal title="Đặt lại mật khẩu" open={resetOpen} onClose={() => setResetOpen(false)}>
        <ResourceForm
          fields={[{ name: 'new_password', label: 'Mật khẩu mới', required: false }]}
          onSubmit={(payload) => resetMutation.mutate(payload)}
          submitLabel="Đặt lại"
          isSubmitting={resetMutation.isPending}
        />
      </Modal>
    </>
  )
}

// ─── Shared detail body ───────────────────────────────────────────────────────

function AccountDetailContent({ account }: { account: AccountDetail }) {
  return (
    <div className="space-y-4">
      {/* Avatar + basic info */}
      <Card className="p-5">
        <div className="flex items-start gap-4">
          <Avatar
            src={account.avatar_url}
            fallback={initials(account.full_name, account.email)}
            size={72}
            className="shrink-0"
          />
          <div className="min-w-0 flex-1">
            <p className="text-lg font-extrabold text-ink">{account.full_name || '—'}</p>
            <p className="text-sm text-subtle">{account.email}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge tone={roleTone(account.role)}>{roleLabel(account.role)}</Badge>
              <Badge tone={account.is_active ? 'mint' : 'red'}>
                {account.is_active ? 'Hoạt động' : 'Đã khóa'}
              </Badge>
            </div>
          </div>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <DrawerField label="Mã Người dùng" value={<IdCell id={account.id} />} />
          <DrawerField label="Địa chỉ Email" value={account.email} />
          <DrawerField label="Giới tính" value={genderLabel(account.gender)} />
          <DrawerField label="Ngày sinh" value={formatDate(account.birth_date)} />
          <DrawerField label="Chiều cao" value={account.height ? `${formatNumber(account.height, 1)} cm` : '—'} />
          <DrawerField label="Cân nặng hiện tại" value={account.current_weight ? `${formatNumber(account.current_weight, 1)} kg` : '—'} />
          <DrawerField label="BMI" value={account.bmi ? formatNumber(account.bmi, 2) : '—'} />
          <DrawerField label="TDEE" value={formatCalories(account.tdee)} />
          <DrawerField label="Đăng nhập cuối" value={formatDateTime(account.last_login)} />
          <DrawerField label="Ngày tham gia" value={formatDateTime(account.date_joined)} />
          <DrawerField
            label="Mức vận động"
            value={account.activity_level?.level_name || '—'}
          />
          <DrawerField label="Số điện thoại" value={account.phone_number || '—'} />
        </div>
      </Card>

      {/* Weight history + Daily logs */}
      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="p-5">
          <p className="mb-3 font-extrabold text-ink">Lịch sử cân nặng</p>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {account.weight_histories.length === 0 ? (
              <p className="text-sm text-subtle">Chưa có bản ghi.</p>
            ) : (
              account.weight_histories
                .slice()
                .sort((a, b) => new Date(b.measured_at).getTime() - new Date(a.measured_at).getTime())
                .map((h) => (
                  <div
                    key={h.measured_at}
                    className="flex justify-between rounded-[10px] bg-muted/60 px-3 py-2 text-sm"
                  >
                    <span className="text-subtle">{formatDateTime(h.measured_at)}</span>
                    <span className="font-extrabold text-ink">{formatNumber(h.weight, 1)} kg</span>
                  </div>
                ))
            )}
          </div>
        </Card>

        <Card className="p-5">
          <p className="mb-3 font-extrabold text-ink">Nhật ký gần đây</p>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {account.daily_logs.length === 0 ? (
              <p className="text-sm text-subtle">Chưa có nhật ký.</p>
            ) : (
              account.daily_logs.map((log) => (
                <div
                  key={log.id}
                  className="rounded-[10px] border border-border p-2.5 text-sm"
                >
                  <div className="flex justify-between gap-2">
                    <span className="font-bold">{formatDate(log.date)}</span>
                    <span className="font-extrabold text-mint">{formatCalories(log.total_calories)}</span>
                  </div>
                  <p className="mt-0.5 text-xs text-subtle">
                    {formatMacro(log.total_protein)} P &middot; {formatMacro(log.total_carbs)} C &middot; {formatMacro(log.total_fat)} F
                  </p>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}

// ─── Activity Levels ──────────────────────────────────────────────────────────

const activityConfig: ResourceConfig<ActivityLevel> = {
  title: 'Mức độ Vận động',
  description: 'Quản lý hệ số PAL dùng để tính TDEE người dùng.',
  endpoint: '/admin/accounts/activity-levels/',
  columns: [
    {
      key: 'name',
      header: 'Tên mức vận động',
      render: (item) => <span className="font-bold">{item.level_name}</span>,
    },
    { key: 'ratio', header: 'Hệ số PAL', render: (item) => formatNumber(item.ratio, 2) },
    { key: 'description', header: 'Mô tả', render: (item) => item.description || '—' },
  ],
  fields: [
    { name: 'level_name', label: 'Tên mức vận động', required: true },
    { name: 'ratio', label: 'Hệ số PAL', type: 'number', required: true },
    { name: 'description', label: 'Mô tả', type: 'textarea' },
  ],
}

export function ActivityLevelsPage() {
  return <ResourcePage config={activityConfig} />
}

// ─── Settings / Quota ─────────────────────────────────────────────────────────

export function SettingsPage() {
  const queryClient = useQueryClient()
  const quotaQuery = useQuery({
    queryKey: ['quota'],
    queryFn: () => request<QuotaConfig>({ url: '/admin/accounts/quota/', method: 'GET' }),
  })
  const mutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      request<QuotaConfig>({ url: '/admin/accounts/quota/', method: 'PUT', data: payload }),
    onSuccess: async () => {
      toast.success('Đã cập nhật định mức')
      await queryClient.invalidateQueries({ queryKey: ['quota'] })
    },
  })

  return (
    <>
      <PageHeader
        title="Cài đặt Hệ thống"
        description="Định mức quét cho khách và các tham số toàn cục."
      />
      <Card className="max-w-2xl p-5">
        <h2 className="mb-1 text-base font-extrabold">Giới hạn quét khách</h2>
        <p className="mb-4 text-sm text-subtle">
          Số lần AI inference tối đa mỗi phiên cho tài khoản khách (chưa đăng nhập).
        </p>
        {quotaQuery.isLoading ? (
          <Skeleton className="h-32" />
        ) : (
          <>
            <ResourceForm
              fields={[{ name: 'guest_scan_limit', label: 'Giới hạn quét khách', type: 'number', required: true }]}
              initialValues={quotaQuery.data || { guest_scan_limit: 2 }}
              onSubmit={(payload) => mutation.mutate(payload)}
              isSubmitting={mutation.isPending}
            />
            {quotaQuery.data && (
              <p className="mt-3 text-xs text-subtle">
                Cập nhật lần cuối: {formatDateTime(quotaQuery.data.updated_at)}
              </p>
            )}
          </>
        )}
      </Card>
    </>
  )
}

// ─── AccountOTP Page ──────────────────────────────────────────────────────────

function purposeLabel(p: string) {
  if (p === 'account_verify') return 'Xác thực tài khoản'
  if (p === 'password_reset') return 'Đặt lại mật khẩu'
  return p
}

const otpColumns: Column<AccountOTP>[] = [
  { key: 'id', header: 'ID', render: (item) => <span className="font-mono text-xs">{item.id}</span> },
  { key: 'contact', header: 'Thông tin liên hệ', render: (item) => item.contact_info },
  { key: 'code', header: 'Mã OTP', render: (item) => <span className="font-mono font-bold">{item.otp_code}</span> },
  {
    key: 'purpose',
    header: 'Mục đích',
    render: (item) => (
      <Badge tone={item.purpose === 'password_reset' ? 'amber' : 'blue'}>
        {purposeLabel(item.purpose)}
      </Badge>
    ),
  },
  { key: 'expired', header: 'Hết hạn', render: (item) => formatDateTime(item.expired_at) },
  {
    key: 'verified',
    header: 'Trạng thái',
    render: (item) => (
      <Badge tone={item.is_verified ? 'mint' : 'neutral'}>
        {item.is_verified ? 'Đã xác thực' : 'Chờ xác thực'}
      </Badge>
    ),
  },
]

export function AccountOTPPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [purpose, setPurpose] = useState('')
  const [drawerItem, setDrawerItem] = useState<AccountOTP | null>(null)

  const query = useQuery({
    queryKey: ['otp', page, search, purpose],
    queryFn: () =>
      request<Page<AccountOTP>>({
        url: '/admin/accounts/otp/',
        params: { page, search: search || undefined, purpose: purpose || undefined },
      }),
  })

  const columns: Column<AccountOTP>[] = [
    ...otpColumns,
    {
      key: 'actions',
      header: '',
      className: 'px-4 py-3 text-right',
      render: (item) => (
        <Button variant="secondary" className="h-8 px-2.5 text-xs" onClick={() => setDrawerItem(item)}>
          Xem Chi tiết
        </Button>
      ),
    },
  ]

  return (
    <>
      <PageHeader title="Quản lý OTP" description="Danh sách mã xác thực OTP của hệ thống." />
      <Card className="mb-4 p-4">
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" />
            <Input
              className="pl-9"
              placeholder="Tìm theo email hoặc mã OTP..."
              value={search}
              onChange={(e) => { setPage(1); setSearch(e.target.value) }}
            />
          </div>
          <Select value={purpose} onChange={(e) => { setPage(1); setPurpose(e.target.value) }}>
            <option value="">Tất cả mục đích</option>
            <option value="account_verify">Xác thực tài khoản</option>
            <option value="password_reset">Đặt lại mật khẩu</option>
          </Select>
        </div>
      </Card>
      <DataTable
        data={query.data}
        columns={columns}
        isLoading={query.isLoading}
        error={query.error}
        page={page}
        onPageChange={setPage}
        emptyTitle="Chưa có bản ghi OTP"
      />
      {drawerItem && (
        <Drawer
          open
          onClose={() => setDrawerItem(null)}
          title="Chi tiết OTP"
          subtitle={drawerItem.contact_info}
          width={480}
        >
          <div className="grid grid-cols-2 gap-3">
            <DrawerField label="ID" value={String(drawerItem.id)} />
            <DrawerField label="Mã OTP" value={<span className="font-mono font-extrabold">{drawerItem.otp_code}</span>} />
            <DrawerField label="Thông tin liên hệ" value={drawerItem.contact_info} fullWidth />
            <DrawerField label="Mục đích" value={purposeLabel(drawerItem.purpose)} />
            <DrawerField label="Hết hạn lúc" value={formatDateTime(drawerItem.expired_at)} />
            <DrawerField
              label="Trạng thái xác thực"
              value={
                <Badge tone={drawerItem.is_verified ? 'mint' : 'neutral'}>
                  {drawerItem.is_verified ? 'Đã xác thực' : 'Chờ xác thực'}
                </Badge>
              }
            />
          </div>
        </Drawer>
      )}
    </>
  )
}

// ─── Info block (used in detail page) ────────────────────────────────────────

export function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[10px] bg-background p-3">
      <p className="text-[10px] font-extrabold uppercase tracking-widest text-subtle/70">{label}</p>
      <p className="mt-1 break-words text-sm font-extrabold text-ink">{value}</p>
    </div>
  )
}
