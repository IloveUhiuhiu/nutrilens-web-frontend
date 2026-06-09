import {
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  useEffect,
  useRef,
  useState,
} from 'react'
import { Check, Copy, X } from 'lucide-react'
import { cn } from '../lib/utils'

// ─── Button ──────────────────────────────────────────────────────────────────

export function Button({
  className,
  variant = 'primary',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'amber'
}) {
  return (
    <button
      className={cn(
        'btn',
        variant === 'primary' && 'btn-primary',
        variant === 'secondary' && 'btn-secondary',
        variant === 'danger' && 'btn-danger',
        variant === 'amber' && 'btn-amber',
        variant === 'ghost' && 'h-9 w-9 rounded-xl p-0 text-subtle hover:bg-muted',
        className,
      )}
      {...props}
    />
  )
}

// ─── Form inputs ─────────────────────────────────────────────────────────────

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn('field', props.className)} />
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={cn('field', props.className)} />
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cn('textarea-field', props.className)} />
}

// ─── DateRangePicker ─────────────────────────────────────────────────────────

export function DateRangePicker({
  startDate,
  endDate,
  onStartChange,
  onEndChange,
  className,
}: {
  startDate: string
  endDate: string
  onStartChange: (v: string) => void
  onEndChange: (v: string) => void
  className?: string
}) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="relative flex-1">
        <label className="absolute -top-2 left-2.5 bg-white px-1 text-[10px] font-bold uppercase tracking-wide text-subtle/70">
          Từ ngày
        </label>
        <input
          type="date"
          value={startDate}
          onChange={(e) => onStartChange(e.target.value)}
          className="field pr-2 text-sm"
        />
      </div>
      <span className="text-subtle">—</span>
      <div className="relative flex-1">
        <label className="absolute -top-2 left-2.5 bg-white px-1 text-[10px] font-bold uppercase tracking-wide text-subtle/70">
          Đến ngày
        </label>
        <input
          type="date"
          value={endDate}
          onChange={(e) => onEndChange(e.target.value)}
          className="field pr-2 text-sm"
        />
      </div>
    </div>
  )
}

// ─── CopyButton ──────────────────────────────────────────────────────────────

export function CopyButton({ value, className }: { value: string; className?: string }) {
  const [copied, setCopied] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  function handleCopy() {
    void navigator.clipboard.writeText(value)
    setCopied(true)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => setCopied(false), 1800)
  }

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current) }, [])

  return (
    <button
      type="button"
      onClick={handleCopy}
      title="Sao chép"
      className={cn(
        'inline-flex h-5 w-5 items-center justify-center rounded-md text-subtle transition hover:text-primary',
        className,
      )}
    >
      {copied ? <Check className="h-3 w-3 text-mint" /> : <Copy className="h-3 w-3" />}
    </button>
  )
}

// ─── ID display with copy ─────────────────────────────────────────────────────

export function IdCell({ id }: { id: string }) {
  return (
    <span className="flex items-center gap-1.5 font-mono text-xs">
      <span className="rounded-md bg-muted px-1.5 py-0.5 text-subtle">{id}</span>
      <CopyButton value={id} />
    </span>
  )
}

// ─── Card ─────────────────────────────────────────────────────────────────────

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <section className={cn('panel', className)}>{children}</section>
}

export function BentoCard({ className, children }: { className?: string; children: ReactNode }) {
  return <section className={cn('bento-card p-5', className)}>{children}</section>
}

// ─── Badge ───────────────────────────────────────────────────────────────────

export function Badge({
  children,
  tone = 'neutral',
}: {
  children: ReactNode
  tone?: 'green' | 'amber' | 'red' | 'blue' | 'neutral' | 'mint'
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold',
        tone === 'green' && 'bg-primarySoft text-primary',
        tone === 'mint' && 'bg-mintSoft text-mint',
        tone === 'amber' && 'bg-accentSoft text-accent',
        tone === 'red' && 'bg-dangerSoft text-danger',
        tone === 'blue' && 'bg-sky-100 text-sky-700',
        tone === 'neutral' && 'bg-muted text-subtle',
      )}
    >
      {children}
    </span>
  )
}

// ─── Dot indicator ────────────────────────────────────────────────────────────

export function StatusDot({ tone }: { tone: 'green' | 'amber' | 'red' | 'neutral' }) {
  return (
    <span
      className={cn(
        'inline-block h-2 w-2 rounded-full',
        tone === 'green' && 'bg-mint',
        tone === 'amber' && 'bg-accent',
        tone === 'red' && 'bg-danger',
        tone === 'neutral' && 'bg-subtle/40',
      )}
    />
  )
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn('animate-pulse rounded-[12px] bg-muted', className)} />
  )
}

// ─── Empty & Error States ─────────────────────────────────────────────────────

export function EmptyState({
  title,
  description = 'Không có dữ liệu phù hợp với bộ lọc hiện tại.',
}: {
  title: string
  description?: string
}) {
  return (
    <div className="flex min-h-52 flex-col items-center justify-center rounded-[16px] border border-dashed border-border bg-white p-8 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primarySoft text-primary font-extrabold text-sm">
        NL
      </div>
      <h3 className="text-sm font-extrabold text-ink">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-subtle">{description}</p>
    </div>
  )
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div className="rounded-[12px] border border-dangerSoft bg-dangerSoft/60 p-4 text-sm text-danger">
      <p className="font-bold">Không tải được dữ liệu</p>
      <p className="mt-1 opacity-80">{message}</p>
    </div>
  )
}

// ─── Modal (overlay dialog) ───────────────────────────────────────────────────

export function Modal({
  title,
  open,
  onClose,
  children,
  width = 'max-w-2xl',
}: {
  title: string
  open: boolean
  onClose: () => void
  children: ReactNode
  width?: string
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-ink/30 p-4 pt-16 backdrop-blur-[3px]">
      <div
        className={cn(
          'w-full rounded-[16px] border border-border bg-white shadow-2xl',
          width,
        )}
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-base font-extrabold text-ink">{title}</h2>
          <Button variant="ghost" onClick={onClose} aria-label="Đóng">
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="max-h-[76vh] overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  )
}

// ─── Drawer (slide-out from right) ────────────────────────────────────────────

export function Drawer({
  open,
  onClose,
  title,
  subtitle,
  children,
  width = 580,
}: {
  open: boolean
  onClose: () => void
  title: string
  subtitle?: string
  children: ReactNode
  width?: number
}) {
  useEffect(() => {
    if (!open) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <>
      <div className="drawer-overlay" onClick={onClose} />
      <div
        className="drawer-panel"
        style={{ width: '100%', maxWidth: `${width}px` }}
      >
        {/* Header */}
        <div className="flex shrink-0 items-start justify-between border-b border-border bg-white px-5 py-4 sticky top-0 z-10">
          <div className="min-w-0 flex-1 pr-4">
            <h2 className="truncate text-base font-extrabold text-ink">{title}</h2>
            {subtitle && (
              <p className="mt-0.5 truncate text-xs text-subtle">{subtitle}</p>
            )}
          </div>
          <Button variant="ghost" onClick={onClose} aria-label="Đóng">
            <X className="h-4 w-4" />
          </Button>
        </div>
        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
      </div>
    </>
  )
}

// ─── DrawerRow helper ─────────────────────────────────────────────────────────

export function DrawerField({
  label,
  value,
  fullWidth,
}: {
  label: string
  value: ReactNode
  fullWidth?: boolean
}) {
  return (
    <div className={cn('rounded-[10px] bg-background p-3', fullWidth && 'col-span-2')}>
      <p className="mb-1 text-[10px] font-extrabold uppercase tracking-wider text-subtle/70">
        {label}
      </p>
      <div className="break-words text-sm font-bold text-ink">{value || '—'}</div>
    </div>
  )
}

// ─── JSON Viewer ──────────────────────────────────────────────────────────────

export function JsonViewer({ data, maxHeight = 320 }: { data: unknown; maxHeight?: number }) {
  return (
    <pre
      className="overflow-auto rounded-[10px] bg-ink px-4 py-3 text-xs leading-relaxed text-emerald-300 font-mono"
      style={{ maxHeight }}
    >
      {JSON.stringify(data, null, 2)}
    </pre>
  )
}

// ─── MacroBadge ──────────────────────────────────────────────────────────────

export function MacroBadge({
  label,
  value,
  unit = 'g',
  tone,
}: {
  label: string
  value: number | string
  unit?: string
  tone: 'protein' | 'carbs' | 'fat' | 'cal' | 'weight'
}) {
  const styles: Record<string, string> = {
    protein: 'bg-sky-50 text-sky-700 border-sky-200',
    carbs: 'bg-accentSoft text-accent border-amber-200',
    fat: 'bg-rose-50 text-rose-700 border-rose-200',
    cal: 'bg-mintSoft text-mint border-green-200',
    weight: 'bg-muted text-subtle border-border',
  }
  return (
    <span
      className={cn(
        'inline-flex flex-col items-center rounded-[10px] border px-2.5 py-1.5 text-center',
        styles[tone],
      )}
    >
      <span className="text-[10px] font-extrabold uppercase tracking-wider opacity-70">{label}</span>
      <span className="text-sm font-extrabold">
        {typeof value === 'number' ? value.toFixed(1) : value}
        <span className="ml-0.5 text-[10px] font-bold opacity-60">{unit}</span>
      </span>
    </span>
  )
}

// ─── PageHeader ───────────────────────────────────────────────────────────────

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-ink">{title}</h1>
        <p className="mt-1 text-sm text-subtle">{description}</p>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}

// ─── SectionHeader ────────────────────────────────────────────────────────────

export function SectionHeader({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h3 className="text-sm font-extrabold text-ink">{title}</h3>
      {action}
    </div>
  )
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

export function Avatar({
  src,
  fallback,
  size = 40,
  className,
}: {
  src?: string | null
  fallback: string
  size?: number
  className?: string
}) {
  const [broken, setBroken] = useState(false)

  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-primarySoft font-extrabold text-primary',
        className,
      )}
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {src && !broken ? (
        <img
          src={src}
          alt={fallback}
          className="h-full w-full object-cover"
          onError={() => setBroken(true)}
        />
      ) : (
        fallback
      )}
    </span>
  )
}

// ─── ImagePreview ─────────────────────────────────────────────────────────────

export function ImagePreview({
  src,
  alt,
  className,
  height = 240,
}: {
  src?: string | null
  alt: string
  className?: string
  height?: number
}) {
  const [broken, setBroken] = useState(false)

  if (!src || broken) {
    return (
      <div
        className={cn(
          'flex items-center justify-center rounded-[12px] bg-muted text-sm text-subtle',
          className,
        )}
        style={{ height }}
      >
        Không có ảnh
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={alt}
      className={cn('rounded-[12px] object-cover w-full', className)}
      style={{ height }}
      onError={() => setBroken(true)}
    />
  )
}

// ─── TabBar ───────────────────────────────────────────────────────────────────

export function TabBar({
  tabs,
  active,
  onChange,
}: {
  tabs: { key: string; label: string }[]
  active: string
  onChange: (key: string) => void
}) {
  return (
    <div className="flex gap-1.5 rounded-[12px] border border-border bg-muted p-1">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className={cn(
            'rounded-[9px] px-3.5 py-1.5 text-xs font-bold transition',
            active === tab.key
              ? 'bg-white text-ink shadow-sm'
              : 'text-subtle hover:text-ink',
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
