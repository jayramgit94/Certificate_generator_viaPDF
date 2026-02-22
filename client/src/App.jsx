import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./context/AuthContext";

// Layout
import ProtectedRoute from "./components/auth/ProtectedRoute";
import DashboardLayout from "./components/layout/DashboardLayout";

// Auth pages
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";

// Dashboard pages
import AnalyticsPage from "./pages/analytics/AnalyticsPage";
import CertificatesPage from "./pages/certificates/CertificatesPage";
import DashboardPage from "./pages/dashboard/DashboardPage";
import EmailsPage from "./pages/emails/EmailsPage";
import RecipientsPage from "./pages/recipients/RecipientsPage";
import SettingsPage from "./pages/settings/SettingsPage";
import TemplateEditorPage from "./pages/templates/TemplateEditorPage";
import TemplatesPage from "./pages/templates/TemplatesPage";

// Public pages
import NotFoundPage from "./pages/NotFoundPage";
import VerifyPage from "./pages/verify/VerifyPage";

export default function App() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      {/* Public routes */}
      <Route
        path="/login"
        element={
          isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />
        }
      />
      <Route
        path="/register"
        element={
          isAuthenticated ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <RegisterPage />
          )
        }
      />
      <Route path="/verify" element={<VerifyPage />} />
      <Route path="/verify/:certId" element={<VerifyPage />} />

      {/* Protected routes */}
      <Route
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/templates" element={<TemplatesPage />} />
        <Route path="/templates/new" element={<TemplateEditorPage />} />
        <Route path="/templates/:id/edit" element={<TemplateEditorPage />} />
        <Route path="/recipients" element={<RecipientsPage />} />
        <Route path="/certificates" element={<CertificatesPage />} />
        <Route path="/emails" element={<EmailsPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>

      {/* Redirects */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
