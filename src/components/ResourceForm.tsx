import { useEffect, useState } from 'react'
import { Button, Input, Select, Textarea } from './ui'

export type FieldConfig = {
  name: string
  label: string
  type?: 'text' | 'number' | 'url' | 'textarea' | 'select' | 'boolean'
  required?: boolean
  options?: { label: string; value: string | boolean }[]
}

type FormValues = Record<string, string | number | boolean>

export function ResourceForm({
  fields,
  initialValues,
  onSubmit,
  submitLabel = 'Lưu',
  isSubmitting,
}: {
  fields: FieldConfig[]
  initialValues?: Record<string, unknown>
  onSubmit: (values: Record<string, unknown>) => void
  submitLabel?: string
  isSubmitting?: boolean
}) {
  const [values, setValues] = useState<FormValues>({})

  useEffect(() => {
    const next: FormValues = {}
    fields.forEach((field) => {
      const value = initialValues?.[field.name]
      next[field.name] =
        typeof value === 'boolean'
          ? value
          : typeof value === 'number'
            ? value
            : value === null || value === undefined
              ? field.type === 'boolean'
                ? false
                : ''
              : String(value)
    })
    setValues(next)
  }, [fields, initialValues])

  function setValue(name: string, value: string | number | boolean) {
    setValues((current) => ({ ...current, [name]: value }))
  }

  return (
    <form
      className="grid gap-4 sm:grid-cols-2"
      onSubmit={(event) => {
        event.preventDefault()
        const payload: Record<string, unknown> = {}
        fields.forEach((field) => {
          const value = values[field.name]
          if (field.type === 'number') payload[field.name] = value === '' ? null : Number(value)
          else payload[field.name] = value
        })
        onSubmit(payload)
      }}
    >
      {fields.map((field) => (
        <label key={field.name} className={field.type === 'textarea' ? 'sm:col-span-2' : undefined}>
          <span className="mb-1 block text-xs font-extrabold uppercase tracking-wide text-subtle">{field.label}</span>
          {field.type === 'textarea' ? (
            <Textarea
              required={field.required}
              value={String(values[field.name] ?? '')}
              onChange={(event) => setValue(field.name, event.target.value)}
            />
          ) : field.type === 'select' ? (
            <Select
              required={field.required}
              value={String(values[field.name] ?? '')}
              onChange={(event) => setValue(field.name, event.target.value)}
            >
              <option value="">Chọn</option>
              {field.options?.map((option) => (
                <option key={String(option.value)} value={String(option.value)}>
                  {option.label}
                </option>
              ))}
            </Select>
          ) : field.type === 'boolean' ? (
            <Select value={String(values[field.name] ?? false)} onChange={(event) => setValue(field.name, event.target.value === 'true')}>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </Select>
          ) : (
            <Input
              required={field.required}
              type={field.type || 'text'}
              value={String(values[field.name] ?? '')}
              onChange={(event) => setValue(field.name, event.target.value)}
            />
          )}
        </label>
      ))}
      <div className="flex justify-end sm:col-span-2">
        <Button disabled={isSubmitting} type="submit">
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}
