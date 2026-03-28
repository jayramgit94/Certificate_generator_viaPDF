import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./context/AuthContext";

// Layout
import ProtectedRoute from "./components/auth/ProtectedRoute";
import DashboardLayout from "./components/layout/DashboardLayout";
import { PageLoader } from "./components/ui/Spinner";

// Auth pages (eager — needed immediately)
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
const LandingPage = lazy(() => import("./pages/LandingPage"));

// Dashboard pages (lazy — loaded on demand)
const AnalyticsPage = lazy(() => import("./pages/analytics/AnalyticsPage"));
const CertificatesPage = lazy(() => import("./pages/certificates/CertificatesPage"));
const DashboardPage = lazy(() => import("./pages/dashboard/DashboardPage"));
const EmailsPage = lazy(() => import("./pages/emails/EmailsPage"));
const RecipientsPage = lazy(() => import("./pages/recipients/RecipientsPage"));
const SettingsPage = lazy(() => import("./pages/settings/SettingsPage"));
const TemplateEditorPage = lazy(() => import("./pages/templates/TemplateEditorPage"));
const TemplatesPage = lazy(() => import("./pages/templates/TemplatesPage"));

// Public pages
const NotFoundPage = lazy(() => import("./pages/NotFoundPage"));
const VerifyPage = lazy(() => import("./pages/verify/VerifyPage"));

function SuspenseWrapper({ children }) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>;
}

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
      <Route path="/verify" element={<SuspenseWrapper><VerifyPage /></SuspenseWrapper>} />
      <Route path="/verify/:certId" element={<SuspenseWrapper><VerifyPage /></SuspenseWrapper>} />

      {/* Protected routes */}
      <Route
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<SuspenseWrapper><DashboardPage /></SuspenseWrapper>} />
        <Route path="/templates" element={<SuspenseWrapper><TemplatesPage /></SuspenseWrapper>} />
        <Route path="/templates/new" element={<SuspenseWrapper><TemplateEditorPage /></SuspenseWrapper>} />
        <Route path="/templates/:id/edit" element={<SuspenseWrapper><TemplateEditorPage /></SuspenseWrapper>} />
        <Route path="/recipients" element={<SuspenseWrapper><RecipientsPage /></SuspenseWrapper>} />
        <Route path="/certificates" element={<SuspenseWrapper><CertificatesPage /></SuspenseWrapper>} />
        <Route path="/emails" element={<SuspenseWrapper><EmailsPage /></SuspenseWrapper>} />
        <Route path="/analytics" element={<SuspenseWrapper><AnalyticsPage /></SuspenseWrapper>} />
        <Route path="/settings" element={<SuspenseWrapper><SettingsPage /></SuspenseWrapper>} />
      </Route>

      {/* Marketing landing */}
      <Route path="/" element={<SuspenseWrapper><LandingPage /></SuspenseWrapper>} />
      <Route path="*" element={<SuspenseWrapper><NotFoundPage /></SuspenseWrapper>} />
    </Routes>
  );
}
