import { format, parseISO } from 'date-fns'

export function formatDate(value?: string | null) {
  if (!value) return '—'
  try {
    return format(parseISO(value), 'dd/MM/yyyy')
  } catch {
    return value
  }
}

export function formatDateTime(value?: string | null) {
  if (!value) return '—'
  try {
    return format(parseISO(value), 'dd/MM/yyyy HH:mm')
  } catch {
    return value
  }
}

export function formatNumber(value?: number | string | null, digits = 0) {
  if (value === null || value === undefined || value === '') return '—'
  const number = Number(value)
  if (Number.isNaN(number)) return String(value)
  return new Intl.NumberFormat('vi-VN', {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(number)
}

export function formatMacro(value?: number | string | null) {
  return `${formatNumber(value, 1)} g`
}

export function formatCalories(value?: number | string | null) {
  return `${formatNumber(value, 0)} kcal`
}
