import { Navigate, Route, Routes } from 'react-router-dom'
import { LoginPage } from '@/features/auth/login-page'
import { RegisterPage } from '@/features/auth/register-page'
import { OnboardingWizard } from '@/features/onboarding/onboarding-wizard'
import { RequireAuth } from '@/routes/require-auth'
import { RequireBusiness } from '@/routes/require-business'
import { AppShell } from '@/components/layout/app-shell'
import { DashboardPage } from '@/features/dashboard/dashboard-page'
import { SettingsPage } from '@/features/settings/settings-page'
import { CustomersListPage } from '@/features/customers/customers-list-page'
import { CustomerProfilePage } from '@/features/customers/customer-profile-page'
import { EmployeesListPage } from '@/features/employees/employees-list-page'
import { ProductsListPage } from '@/features/products/products-list-page'
import { OrdersListPage } from '@/features/orders/orders-list-page'
import { NewOrderPage } from '@/features/orders/new-order-page'
import { OrderDetailPage } from '@/features/orders/order-detail-page'
import { FinancePage } from '@/features/finance/finance-page'
import { ReportsPage } from '@/features/reports/reports-page'
import { NotificationsPage } from '@/features/notifications/notifications-page'
import { PlaceholderPage } from '@/components/placeholder-page'
import { MODULE_ROUTES } from '@/components/layout/nav-config'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route element={<RequireAuth />}>
        <Route path="/onboarding" element={<OnboardingWizard />} />

        <Route element={<RequireBusiness />}>
          <Route path="/app" element={<AppShell />}>
            <Route index element={<DashboardPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="customers" element={<CustomersListPage />} />
            <Route path="customers/:id" element={<CustomerProfilePage />} />
            <Route path="employees" element={<EmployeesListPage />} />
            <Route path="products" element={<ProductsListPage />} />
            <Route path="sales" element={<OrdersListPage />} />
            <Route path="sales/new" element={<NewOrderPage />} />
            <Route path="sales/:id" element={<OrderDetailPage />} />
            <Route path="finance" element={<FinancePage />} />
            <Route path="reports" element={<ReportsPage />} />
            {Object.entries(MODULE_ROUTES)
              .filter(
                ([key]) =>
                  ![
                    'customers',
                    'employees',
                    'products',
                    'sales_orders',
                    'finance',
                    'reports',
                  ].includes(key),
              )
              .map(([key, { path }]) => (
                <Route
                  key={key}
                  path={path.replace('/app/', '')}
                  element={<PlaceholderPage title={key.replace(/_/g, ' ')} />}
                />
              ))}
          </Route>
        </Route>

        <Route path="/" element={<Navigate to="/app" replace />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
