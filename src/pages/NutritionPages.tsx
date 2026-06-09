import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import type { AdviceRule, Food, Ingredient, PackagedFood } from '../api/types'
import {
  Badge,
  Drawer,
  DrawerField,
  ImagePreview,
  JsonViewer,
  MacroBadge,
} from '../components/ui'
import type { Column } from '../components/DataTable'
import { formatDateTime, formatMacro, formatNumber } from '../lib/format'
import { cn } from '../lib/utils'
import { ResourcePage, type ResourceConfig } from './ResourcePage'

const tabs = [
  { to: '/nutrition/foods', label: 'Danh mục Món ăn' },
  { to: '/nutrition/ingredients', label: 'Nguyên liệu Dinh dưỡng' },
  { to: '/nutrition/advice-rules', label: 'Quy tắc Lời khuyên' },
  { to: '/nutrition/packaged-foods', label: 'Thực phẩm Đóng gói' },
]

export function NutritionLayout() {
  return (
    <>
      <div className="mb-5 flex gap-1.5 overflow-x-auto rounded-[12px] border border-border bg-muted p-1">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={({ isActive }) =>
              cn(
                'shrink-0 rounded-[9px] px-3.5 py-1.5 text-xs font-bold transition whitespace-nowrap',
                isActive ? 'bg-white text-ink shadow-sm' : 'text-subtle hover:text-ink',
              )
            }
          >
            {tab.label}
          </NavLink>
        ))}
      </div>
      <Outlet />
    </>
  )
}

// ─── Food ─────────────────────────────────────────────────────────────────────

function FoodDrawer({ food, onClose }: { food: Food; onClose: () => void }) {
  return (
    <Drawer
      open
      onClose={onClose}
      title={food.vi_name}
      subtitle={`${food.id} · ${food.en_name}`}
    >
      <div className="space-y-4">
        <ImagePreview src={food.image_url} alt={food.vi_name} height={220} />
        <div className="grid grid-cols-2 gap-3">
          <DrawerField label="Tên tiếng Việt" value={food.vi_name} fullWidth />
          <DrawerField label="Tên tiếng Anh" value={food.en_name} />
          <DrawerField label="Mã USDA FDC" value={food.fdc_id} />
          <DrawerField label="Danh mục" value={<Badge tone="blue">{food.category}</Badge>} />
          <DrawerField label="Nguồn gốc" value={food.external_source || '—'} />
          <DrawerField label="Đồng bộ lần cuối" value={formatDateTime(food.last_synced_at)} />
        </div>
      </div>
    </Drawer>
  )
}

const foodColumns: Column<Food>[] = [
  {
    key: 'vi_name',
    header: 'Tên Việt',
    render: (item) => <span className="font-bold">{item.vi_name}</span>,
  },
  { key: 'en_name', header: 'Tên Anh', render: (item) => item.en_name },
  { key: 'category', header: 'Danh mục', render: (item) => <Badge tone="blue">{item.category}</Badge> },
  { key: 'fdc', header: 'Mã USDA FDC', render: (item) => <span className="font-mono text-xs">{item.fdc_id}</span> },
  { key: 'sync', header: 'Đồng bộ', render: (item) => formatDateTime(item.last_synced_at) },
]

const foodConfig: ResourceConfig<Food> = {
  title: 'Danh mục Món ăn',
  description: 'Cơ sở dữ liệu món ăn chuẩn hóa từ USDA và nguồn nội bộ.',
  endpoint: '/admin/nutrients/foods/',
  searchPlaceholder: 'Tìm theo tên Việt, Anh hoặc mã FDC...',
  filters: [{ name: 'category', label: 'Tất cả danh mục', options: [] }],
  columns: foodColumns,
  fields: [
    { name: 'vi_name', label: 'Tên tiếng Việt', required: true },
    { name: 'en_name', label: 'Tên tiếng Anh', required: true },
    { name: 'fdc_id', label: 'Mã USDA FDC', required: true },
    { name: 'category', label: 'Danh mục', required: true },
    { name: 'image_url', label: 'URL Hình ảnh', type: 'url' },
  ],
  renderDetail: (item, onClose) => <FoodDrawer food={item} onClose={onClose} />,
}

// ─── Ingredient ───────────────────────────────────────────────────────────────

function IngredientDrawer({ ingredient, onClose }: { ingredient: Ingredient; onClose: () => void }) {
  return (
    <Drawer
      open
      onClose={onClose}
      title={ingredient.vi_name}
      subtitle={`${ingredient.id} · ${ingredient.en_name}`}
    >
      <div className="space-y-4">
        <ImagePreview src={ingredient.image_url} alt={ingredient.vi_name} height={200} />
        <div className="grid grid-cols-2 gap-3">
          <DrawerField label="Tên tiếng Việt" value={ingredient.vi_name} />
          <DrawerField label="Tên tiếng Anh" value={ingredient.en_name} />
          <DrawerField
            label="Khối lượng riêng (g/cm³)"
            value={
              <span className="font-mono font-extrabold text-primary">
                {formatNumber(ingredient.density, 3)}
              </span>
            }
          />
          <DrawerField label="Mã USDA FDC" value={ingredient.fdc_id_ref || '—'} />
        </div>
        <div>
          <p className="mb-2 text-[10px] font-extrabold uppercase tracking-widest text-subtle/70">
            Dinh dưỡng / 100g
          </p>
          <div className="grid grid-cols-4 gap-2">
            <MacroBadge label="Calories" value={ingredient.cal_per_100g} unit="kcal" tone="cal" />
            <MacroBadge label="Chất đạm" value={ingredient.protein_per_100g} tone="protein" />
            <MacroBadge label="Tinh bột" value={ingredient.carb_per_100g} tone="carbs" />
            <MacroBadge label="Chất béo" value={ingredient.fat_per_100g} tone="fat" />
          </div>
        </div>
      </div>
    </Drawer>
  )
}

const ingredientConfig: ResourceConfig<Ingredient> = {
  title: 'Nguyên liệu Dinh dưỡng',
  description: 'Khối lượng riêng và macro chuẩn / 100g dùng cho AI volume-to-weight.',
  endpoint: '/admin/nutrients/ingredients/',
  searchPlaceholder: 'Tìm theo tên hoặc mã USDA...',
  columns: [
    {
      key: 'vi_name',
      header: 'Tên Việt',
      render: (item) => <span className="font-bold">{item.vi_name}</span>,
    },
    { key: 'en_name', header: 'Tên Anh', render: (item) => item.en_name },
    {
      key: 'density',
      header: 'Khối lượng riêng (g/cm³)',
      render: (item) => <span className="font-mono">{formatNumber(item.density, 3)}</span>,
    },
    {
      key: 'cal',
      header: 'Năng lượng (kcal)',
      render: (item) => `${formatNumber(item.cal_per_100g)} kcal`,
    },
    {
      key: 'macro',
      header: 'Macro P · C · F',
      render: (item) =>
        `${formatMacro(item.protein_per_100g)} P · ${formatMacro(item.carb_per_100g)} C · ${formatMacro(item.fat_per_100g)} F`,
    },
  ],
  fields: [
    { name: 'vi_name', label: 'Tên tiếng Việt', required: true },
    { name: 'en_name', label: 'Tên tiếng Anh', required: true },
    { name: 'density', label: 'Khối lượng riêng (g/cm³)', type: 'number', required: true },
    { name: 'cal_per_100g', label: 'Năng lượng / 100g (kcal)', type: 'number', required: true },
    { name: 'protein_per_100g', label: 'Chất đạm / 100g (g)', type: 'number', required: true },
    { name: 'carb_per_100g', label: 'Tinh bột / 100g (g)', type: 'number', required: true },
    { name: 'fat_per_100g', label: 'Chất béo / 100g (g)', type: 'number', required: true },
    { name: 'fdc_id_ref', label: 'Mã tham chiếu USDA' },
    { name: 'image_url', label: 'URL Hình ảnh', type: 'url' },
  ],
  renderDetail: (item, onClose) => <IngredientDrawer ingredient={item} onClose={onClose} />,
}

// ─── Advice Rules ─────────────────────────────────────────────────────────────

const ALERT_LABELS: Record<string, string> = {
  normal: 'Thường',
  warning: 'Cảnh báo',
  danger: 'Nguy hiểm',
}

function alertTone(level: string): 'green' | 'amber' | 'red' {
  if (level === 'danger') return 'red'
  if (level === 'warning') return 'amber'
  return 'green'
}

function AdviceDrawer({ rule, onClose }: { rule: AdviceRule; onClose: () => void }) {
  return (
    <Drawer
      open
      onClose={onClose}
      title="Chi tiết Quy tắc Lời khuyên"
      subtitle={`${formatNumber(rule.min_percent)}% – ${formatNumber(rule.max_percent)}% TDEE`}
      width={500}
    >
      <div className="grid grid-cols-2 gap-3">
        <DrawerField label="Ngưỡng TDEE tối thiểu (%)" value={`${formatNumber(rule.min_percent, 1)}%`} />
        <DrawerField label="Ngưỡng TDEE tối đa (%)" value={`${formatNumber(rule.max_percent, 1)}%`} />
        <DrawerField
          label="Mức cảnh báo"
          value={
            <Badge tone={alertTone(rule.alert_level)}>
              {ALERT_LABELS[rule.alert_level] || rule.alert_level}
            </Badge>
          }
        />
        <div />
        <DrawerField
          label="Nội dung lời khuyên"
          value={<span className="whitespace-pre-wrap">{rule.advice_content}</span>}
          fullWidth
        />
      </div>
    </Drawer>
  )
}

const adviceConfig: ResourceConfig<AdviceRule> = {
  title: 'Quy tắc Lời khuyên',
  description: 'Quy tắc tư vấn dinh dưỡng dựa trên phần trăm TDEE nạp vào.',
  endpoint: '/admin/nutrients/advice-rules/',
  searchPlaceholder: 'Backend không hỗ trợ tìm kiếm cho rule',
  columns: [
    {
      key: 'range',
      header: 'Khoảng TDEE (%)',
      render: (item) => `${formatNumber(item.min_percent, 1)}% – ${formatNumber(item.max_percent, 1)}%`,
    },
    {
      key: 'level',
      header: 'Mức cảnh báo',
      render: (item) => (
        <Badge tone={alertTone(item.alert_level)}>
          {ALERT_LABELS[item.alert_level] || item.alert_level}
        </Badge>
      ),
    },
    {
      key: 'content',
      header: 'Nội dung',
      render: (item) => <span className="line-clamp-2 max-w-xl">{item.advice_content}</span>,
    },
  ],
  fields: [
    { name: 'min_percent', label: 'Ngưỡng tối thiểu (%)', type: 'number', required: true },
    { name: 'max_percent', label: 'Ngưỡng tối đa (%)', type: 'number', required: true },
    {
      name: 'alert_level',
      label: 'Mức cảnh báo',
      type: 'select',
      required: true,
      options: [
        { label: 'Thường', value: 'normal' },
        { label: 'Cảnh báo', value: 'warning' },
        { label: 'Nguy hiểm', value: 'danger' },
      ],
    },
    { name: 'advice_content', label: 'Nội dung lời khuyên', type: 'textarea', required: true },
  ],
  renderDetail: (item, onClose) => <AdviceDrawer rule={item} onClose={onClose} />,
}

// ─── Packaged Foods ───────────────────────────────────────────────────────────

function PackagedFoodDrawer({ food, onClose }: { food: PackagedFood; onClose: () => void }) {
  return (
    <Drawer
      open
      onClose={onClose}
      title={food.name}
      subtitle={`${food.id} · Barcode: ${food.barcode}`}
    >
      <div className="space-y-4">
        <ImagePreview src={food.image_url} alt={food.name} height={200} />
        <div className="grid grid-cols-2 gap-3">
          <DrawerField label="Tên sản phẩm" value={food.name} fullWidth />
          <DrawerField label="Thương hiệu" value={food.brand || '—'} />
          <DrawerField label="Mã vạch (Barcode)" value={<span className="font-mono font-bold">{food.barcode}</span>} />
          <DrawerField label="Khẩu phần" value={`${formatNumber(food.serving_size, 1)} ${food.serving_unit}`} />
          <DrawerField label="Đơn vị khẩu phần" value={food.serving_unit} />
          <DrawerField
            label="Trạng thái"
            value={
              <Badge tone={food.is_active ? 'mint' : 'neutral'}>
                {food.is_active ? 'Đang hoạt động' : 'Đã ẩn'}
              </Badge>
            }
          />
          <DrawerField label="Cập nhật lúc" value={formatDateTime(food.updated_at)} />
          <DrawerField label="Nguồn gốc" value={food.external_source || '—'} />
        </div>
        <div>
          <p className="mb-2 text-[10px] font-extrabold uppercase tracking-widest text-subtle/70">
            Dinh dưỡng / khẩu phần
          </p>
          <div className="grid grid-cols-4 gap-2">
            <MacroBadge label="Calories" value={food.cal_per_serving} unit="kcal" tone="cal" />
            <MacroBadge label="Chất đạm" value={food.protein_per_serving} tone="protein" />
            <MacroBadge label="Tinh bột" value={food.carb_per_serving} tone="carbs" />
            <MacroBadge label="Chất béo" value={food.fat_per_serving} tone="fat" />
          </div>
        </div>
      </div>
    </Drawer>
  )
}

const packagedConfig: ResourceConfig<PackagedFood> = {
  title: 'Thực phẩm Đóng gói',
  description: 'Dữ liệu sản phẩm đóng gói cho tra cứu mã vạch barcode.',
  endpoint: '/admin/nutrients/packaged-foods/',
  searchPlaceholder: 'Tìm theo mã vạch, tên sản phẩm hoặc thương hiệu...',
  columns: [
    {
      key: 'name',
      header: 'Tên sản phẩm',
      render: (item) => <span className="font-bold">{item.name}</span>,
    },
    { key: 'brand', header: 'Thương hiệu', render: (item) => item.brand || '—' },
    {
      key: 'barcode',
      header: 'Mã vạch',
      render: (item) => <span className="font-mono text-xs">{item.barcode}</span>,
    },
    {
      key: 'serving',
      header: 'Khẩu phần',
      render: (item) => `${formatNumber(item.serving_size, 0)} ${item.serving_unit}`,
    },
    {
      key: 'cal',
      header: 'Năng lượng (kcal)',
      render: (item) => `${formatNumber(item.cal_per_serving, 0)} kcal`,
    },
    {
      key: 'active',
      header: 'Trạng thái',
      render: (item) => (
        <Badge tone={item.is_active ? 'mint' : 'neutral'}>
          {item.is_active ? 'Hoạt động' : 'Đã ẩn'}
        </Badge>
      ),
    },
  ],
  fields: [
    { name: 'barcode', label: 'Mã vạch', required: true },
    { name: 'name', label: 'Tên sản phẩm', required: true },
    { name: 'brand', label: 'Thương hiệu' },
    { name: 'serving_size', label: 'Khẩu phần (g/ml)', type: 'number', required: true },
    { name: 'serving_unit', label: 'Đơn vị khẩu phần', required: true },
    { name: 'cal_per_serving', label: 'Năng lượng / khẩu phần (kcal)', type: 'number', required: true },
    { name: 'protein_per_serving', label: 'Chất đạm / khẩu phần (g)', type: 'number', required: true },
    { name: 'carb_per_serving', label: 'Tinh bột / khẩu phần (g)', type: 'number', required: true },
    { name: 'fat_per_serving', label: 'Chất béo / khẩu phần (g)', type: 'number', required: true },
    { name: 'image_url', label: 'URL Hình ảnh', type: 'url' },
    { name: 'is_active', label: 'Kích hoạt', type: 'boolean' },
  ],
  renderDetail: (item, onClose) => <PackagedFoodDrawer food={item} onClose={onClose} />,
}

// ─── Exports ──────────────────────────────────────────────────────────────────

export function FoodsPage() {
  return <ResourcePage config={foodConfig} />
}

export function IngredientsPage() {
  return <ResourcePage config={ingredientConfig} />
}

export function AdviceRulesPage() {
  return <ResourcePage config={adviceConfig} />
}

export function PackagedFoodsPage() {
  return <ResourcePage config={packagedConfig} />
}

// suppress unused-import warnings for JsonViewer (referenced in Ingredient drawer raw_payload expansion if needed)
void JsonViewer
