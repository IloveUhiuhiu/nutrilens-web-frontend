import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell, LoginLayout } from './layout/AppShell'
import { ProtectedRoute } from './layout/ProtectedRoute'
import { LoginPage } from './pages/LoginPage'
import { DashboardPage } from './pages/DashboardPage'
import { AccountDetailPage, AccountsPage, ActivityLevelsPage, SettingsPage } from './pages/AccountsPages'
import { AdviceRulesPage, FoodsPage, IngredientsPage, NutritionLayout, PackagedFoodsPage } from './pages/NutritionPages'
import { FeedbackPage, InferenceLayout, InferenceMetricsPage, JobDetailPage, JobsPage } from './pages/InferencePages'
import { AnalysisLayout, LogDetailPage, LogsPage, MealDetailPage, MealsPage } from './pages/AnalysisPages'

export default function App() {
  return (
    <Routes>
      <Route element={<LoginLayout />}>
        <Route path="/login" element={<LoginPage />} />
      </Route>
      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route index element={<DashboardPage />} />
          <Route path="accounts" element={<AccountsPage />} />
          <Route path="accounts/:id" element={<AccountDetailPage />} />
          <Route path="accounts/activity-levels" element={<ActivityLevelsPage />} />
          <Route path="nutrition" element={<NutritionLayout />}>
            <Route index element={<Navigate to="/nutrition/foods" replace />} />
            <Route path="foods" element={<FoodsPage />} />
            <Route path="ingredients" element={<IngredientsPage />} />
            <Route path="advice-rules" element={<AdviceRulesPage />} />
            <Route path="packaged-foods" element={<PackagedFoodsPage />} />
          </Route>
          <Route path="inference" element={<InferenceLayout />}>
            <Route index element={<Navigate to="/inference/jobs" replace />} />
            <Route path="jobs" element={<JobsPage />} />
            <Route path="jobs/:id" element={<JobDetailPage />} />
            <Route path="metrics" element={<InferenceMetricsPage />} />
            <Route path="feedback" element={<FeedbackPage />} />
          </Route>
          <Route path="analysis" element={<AnalysisLayout />}>
            <Route index element={<Navigate to="/analysis/meals" replace />} />
            <Route path="meals" element={<MealsPage />} />
            <Route path="meals/:id" element={<MealDetailPage />} />
            <Route path="logs" element={<LogsPage />} />
            <Route path="logs/:id" element={<LogDetailPage />} />
          </Route>
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
