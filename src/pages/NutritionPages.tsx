import { NavLink, Outlet } from 'react-router-dom'
import type { AdviceRule, Food, Ingredient, PackagedFood } from '../api/types'
import { Badge } from '../components/ui'
import type { Column } from '../components/DataTable'
import { formatDateTime, formatMacro, formatNumber } from '../lib/format'
import { cn } from '../lib/utils'
import { ResourcePage, type ResourceConfig } from './ResourcePage'

const tabs = [
  { to: '/nutrition/foods', label: 'Foods' },
  { to: '/nutrition/ingredients', label: 'Ingredients' },
  { to: '/nutrition/advice-rules', label: 'Advice Rules' },
  { to: '/nutrition/packaged-foods', label: 'Packaged Foods' },
]

export function NutritionLayout() {
  return (
    <>
      <div className="mb-5 flex gap-2 overflow-x-auto">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={({ isActive }) => cn('btn-secondary btn shrink-0', isActive && 'bg-primary text-white hover:bg-primary/90')}
          >
            {tab.label}
          </NavLink>
        ))}
      </div>
      <Outlet />
    </>
  )
}

const foodColumns: Column<Food>[] = [
  { key: 'vi_name', header: 'Vietnamese', render: (item) => <span className="font-bold">{item.vi_name}</span> },
  { key: 'en_name', header: 'English', render: (item) => item.en_name },
  { key: 'category', header: 'Category', render: (item) => <Badge>{item.category}</Badge> },
  { key: 'fdc', header: 'FDC ID', render: (item) => item.fdc_id },
  { key: 'sync', header: 'Synced', render: (item) => formatDateTime(item.last_synced_at) },
]

const foodConfig: ResourceConfig<Food> = {
  title: 'Foods',
  description: 'Danh mục món ăn chuẩn hóa từ USDA/local.',
  endpoint: '/admin/nutrients/foods/',
  searchPlaceholder: 'Search by Vietnamese, English name or FDC ID',
  filters: [{ name: 'category', label: 'All categories', options: [] }],
  columns: foodColumns,
  fields: [
    { name: 'vi_name', label: 'Tên tiếng Việt', required: true },
    { name: 'en_name', label: 'English name', required: true },
    { name: 'fdc_id', label: 'FDC ID', required: true },
    { name: 'category', label: 'Category', required: true },
    { name: 'image_url', label: 'Image URL', type: 'url' },
  ],
}

const ingredientConfig: ResourceConfig<Ingredient> = {
  title: 'Ingredients',
  description: 'Dữ liệu vật lý và macro theo 100g cho AI volume-to-weight.',
  endpoint: '/admin/nutrients/ingredients/',
  searchPlaceholder: 'Search by name or USDA reference',
  columns: [
    { key: 'vi_name', header: 'Vietnamese', render: (item) => <span className="font-bold">{item.vi_name}</span> },
    { key: 'en_name', header: 'English', render: (item) => item.en_name },
    { key: 'density', header: 'Density', render: (item) => `${formatNumber(item.density, 2)} g/cm3` },
    { key: 'cal', header: 'Calories', render: (item) => `${formatNumber(item.cal_per_100g)} kcal/100g` },
    { key: 'macro', header: 'Macro', render: (item) => `${formatMacro(item.protein_per_100g)} P · ${formatMacro(item.carb_per_100g)} C · ${formatMacro(item.fat_per_100g)} F` },
  ],
  fields: [
    { name: 'vi_name', label: 'Tên tiếng Việt', required: true },
    { name: 'en_name', label: 'English name', required: true },
    { name: 'density', label: 'Density', type: 'number', required: true },
    { name: 'cal_per_100g', label: 'Calories / 100g', type: 'number', required: true },
    { name: 'protein_per_100g', label: 'Protein / 100g', type: 'number', required: true },
    { name: 'carb_per_100g', label: 'Carb / 100g', type: 'number', required: true },
    { name: 'fat_per_100g', label: 'Fat / 100g', type: 'number', required: true },
    { name: 'fdc_id_ref', label: 'FDC ID ref' },
  ],
}

const adviceConfig: ResourceConfig<AdviceRule> = {
  title: 'Advice Rules',
  description: 'Rule tư vấn dựa trên phần trăm TDEE nạp vào.',
  endpoint: '/admin/nutrients/advice-rules/',
  searchPlaceholder: 'Search is not supported by backend for rules',
  columns: [
    { key: 'range', header: 'Range', render: (item) => `${formatNumber(item.min_percent)}% - ${formatNumber(item.max_percent)}%` },
    {
      key: 'level',
      header: 'Alert',
      render: (item) => <Badge tone={item.alert_level === 'danger' ? 'red' : item.alert_level === 'warning' ? 'amber' : 'green'}>{item.alert_level}</Badge>,
    },
    { key: 'content', header: 'Advice', render: (item) => <span className="line-clamp-2 max-w-xl">{item.advice_content}</span> },
  ],
  fields: [
    { name: 'min_percent', label: 'Min %', type: 'number', required: true },
    { name: 'max_percent', label: 'Max %', type: 'number', required: true },
    {
      name: 'alert_level',
      label: 'Alert level',
      type: 'select',
      required: true,
      options: [
        { label: 'Normal', value: 'normal' },
        { label: 'Warning', value: 'warning' },
        { label: 'Danger', value: 'danger' },
      ],
    },
    { name: 'advice_content', label: 'Advice content', type: 'textarea', required: true },
  ],
}

const packagedConfig: ResourceConfig<PackagedFood> = {
  title: 'Packaged Foods',
  description: 'Dữ liệu thực phẩm đóng gói cho barcode lookup.',
  endpoint: '/admin/nutrients/packaged-foods/',
  searchPlaceholder: 'Search by barcode, name or brand',
  columns: [
    { key: 'name', header: 'Name', render: (item) => <span className="font-bold">{item.name}</span> },
    { key: 'brand', header: 'Brand', render: (item) => item.brand || '—' },
    { key: 'barcode', header: 'Barcode', render: (item) => item.barcode },
    { key: 'serving', header: 'Serving', render: (item) => `${formatNumber(item.serving_size)} ${item.serving_unit}` },
    { key: 'cal', header: 'Calories', render: (item) => `${formatNumber(item.cal_per_serving)} kcal` },
    { key: 'active', header: 'Status', render: (item) => <Badge tone={item.is_active ? 'green' : 'neutral'}>{item.is_active ? 'Active' : 'Inactive'}</Badge> },
  ],
  fields: [
    { name: 'barcode', label: 'Barcode', required: true },
    { name: 'name', label: 'Name', required: true },
    { name: 'brand', label: 'Brand' },
    { name: 'serving_size', label: 'Serving size', type: 'number', required: true },
    { name: 'serving_unit', label: 'Serving unit', required: true },
    { name: 'cal_per_serving', label: 'Calories / serving', type: 'number', required: true },
    { name: 'protein_per_serving', label: 'Protein / serving', type: 'number', required: true },
    { name: 'carb_per_serving', label: 'Carb / serving', type: 'number', required: true },
    { name: 'fat_per_serving', label: 'Fat / serving', type: 'number', required: true },
    { name: 'image_url', label: 'Image URL', type: 'url' },
    { name: 'is_active', label: 'Status', type: 'boolean' },
  ],
}

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
