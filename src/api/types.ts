export type ApiEnvelope<T> = {
  status_code: number
  message: string
  data: T
  errors: Record<string, unknown> | null
}

export type Page<T> = {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export type Tokens = {
  access: string
  refresh: string
}

export type ActivityLevel = {
  id: number
  level_name: string
  description: string
  ratio: number
}

export type Profile = {
  id: string
  full_name: string | null
  email: string
  avatar_url?: string | null
  phone_number?: string | null
  gender?: 'M' | 'F' | 'O'
  birth_date?: string | null
  height?: number
  current_weight?: number
  bmi?: number
  activity_level?: ActivityLevel | null
  tdee?: number
}

export type AccountListItem = {
  id: string
  full_name: string | null
  email: string
  phone_number: string | null
  gender: 'M' | 'F' | 'O'
  avatar_url: string | null
  role: 'admin' | 'staff' | 'user'
  is_active: boolean
  date_joined: string
  last_login: string | null
}

export type AccountDetail = Profile & {
  role: 'admin' | 'staff' | 'user'
  is_active: boolean
  is_staff: boolean
  is_superuser: boolean
  groups: number[]
  weight_histories: { weight: number; measured_at: string }[]
  daily_logs: DailyLogSummary[]
  date_joined: string
  last_login: string | null
}

export type QuotaConfig = {
  key: string
  guest_scan_limit: number
  updated_at: string
}

export type AccountOTP = {
  id: number
  contact_info: string
  otp_code: string
  purpose: 'account_verify' | 'password_reset'
  expired_at: string
  is_verified: boolean
}

export type Food = {
  id: string
  vi_name: string
  en_name: string
  fdc_id: string
  category: string
  image_url?: string | null
  external_source?: string
  last_synced_at?: string | null
}

export type Ingredient = {
  id: string
  vi_name: string
  en_name: string
  density: number
  cal_per_100g: number
  fat_per_100g: number
  carb_per_100g: number
  protein_per_100g: number
  image_url?: string | null
  fdc_id_ref?: string | null
}

export type AdviceRule = {
  id: number
  min_percent: number
  max_percent: number
  alert_level: 'normal' | 'warning' | 'danger'
  advice_content: string
}

export type PackagedFood = {
  id: string
  barcode: string
  name: string
  brand?: string | null
  serving_size: number
  serving_unit: string
  cal_per_serving: number
  fat_per_serving: number
  carb_per_serving: number
  protein_per_serving: number
  image_url?: string | null
  external_source?: string
  external_id?: string | null
  last_synced_at?: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export type InferenceResult = {
  id: string
  job: string
  total_calories: number
  total_protein: number
  total_carbs: number
  total_fat: number
  total_weight: number
  components: unknown[]
  created_at: string
}

export type InferenceJob = {
  id: string
  image: string | null
  depth_map?: string | null
  camera_metadata: Record<string, unknown>
  status: 'pending' | 'running' | 'succeeded' | 'failed'
  model_version: string
  latency_ms: number
  error_message: string
  raw_output: Record<string, unknown>
  result?: InferenceResult | null
  created_at: string
  updated_at: string
  user?: string
}

export type InferenceFeedback = {
  id: string
  job: string
  user: string
  issue_type: string
  comment: string
  corrected_data: Record<string, unknown>
  status: 'open' | 'reviewed' | 'resolved'
  created_at: string
  reviewed_at?: string | null
}

export type MealComponent = {
  id: string
  physical_data: string
  physical_data_name?: string
  component_name: string
  mask_path?: string | null
  volume: number
  calculated_weight: number
  calories: number
  protein: number
  carbs: number
  fat: number
}

export type MealEntry = {
  id: string
  log: string
  food?: Food | null
  packaged_food?: PackagedFood | null
  meal_time: string
  image_path?: string | null
  source_type: 'image' | 'barcode' | 'text' | 'voice' | 'manual'
  barcode?: string | null
  search_query?: string | null
  inference_job_id?: string | null
  serving_amount?: number | null
  serving_unit_label?: string | null
  is_confirmed: boolean
  confirmed_at?: string | null
  notes: string
  total_calories: number
  total_protein: number
  total_carbs: number
  total_fat: number
  total_weight: number
  components: MealComponent[]
}

export type AdminMealListItem = {
  id: string
  user_id: string
  user_email: string
  log_date: string
  meal_time: string
  source_type: 'image' | 'barcode' | 'text' | 'voice' | 'manual'
  barcode?: string | null
  search_query?: string | null
  serving_amount?: number | null
  serving_unit_label?: string | null
  is_confirmed: boolean
  total_calories: number
  total_protein: number
  total_carbs: number
  total_fat: number
  total_weight: number
}

export type DailyLogSummary = {
  id: string
  date: string
  total_calories: number
  total_protein: number
  total_carbs: number
  total_fat: number
  total_weight: number
}

export type AdminDailyLogItem = DailyLogSummary & {
  user_id: string
  user_email: string
  meal_count: number
}

export type DailyLog = DailyLogSummary & {
  meals: MealEntry[]
}

export type UserMetrics = {
  total_users: number
  active_users: number
  staff_users: number
  admins: number
}

export type NutritionMetrics = {
  log_count: number
  meal_count: number
  totals: {
    sum_calories: number
    total_protein: number
    total_carbs: number
    total_fat: number
    total_weight: number
    average_calories: number
  }
}

export type InferenceMetrics = {
  total_jobs: number
  jobs_by_status?: Record<string, number>
  by_status?: Record<string, number>
  average_latency_ms: number
  open_feedback?: number
  feedback_open?: number
}

export type SystemUsageMetrics = {
  meals_by_source: Record<string, number>
  total_meals: number
  total_daily_logs: number
  total_inference_jobs: number
}

export type PermissionItem = {
  id: number
  name: string
  codename: string
  content_type: number
  content_type_label: string
  description: string
}

export type GroupListItem = {
  id: number
  name: string
  member_count: number
  permission_count: number
}

export type GroupDetail = {
  id: number
  name: string
  member_count: number
  permissions: PermissionItem[]
}

export type UserPermissions = {
  user_id: string
  email: string
  is_staff: boolean
  is_superuser: boolean
  groups: { id: number; name: string }[]
  effective_permissions: string[]
}
