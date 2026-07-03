import './App.css'
import '@/lib/i18n'
import { ThemeProvider } from 'next-themes'
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import NavigationTracker from '@/lib/NavigationTracker'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';

// Shared authenticated shell (Fase 3)
import AppLayout from '@/components/layout/AppLayout';

// Auth / public pages
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Landing from './pages/Landing';
import About from './pages/About';
import Features from './pages/Features';
import Plans from './pages/Plans';
import Onboarding from './pages/Onboarding';
import DesignSystem from './pages/DesignSystem';
import AcceptInvite from './pages/AcceptInvite';

// App pages (rendered inside AppShell via AppLayout)
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import ClientProfile from './pages/ClientProfile';
import Team from './pages/Team';
import TeamMemberProfile from './pages/TeamMemberProfile';
import Projects from './pages/Projects';
import ProjectProfile from './pages/ProjectProfile';
import Messages from './pages/Messages';
import Tasks from './pages/Tasks';
import TaskDetail from './pages/TaskDetail';
import Agenda from './pages/Agenda';
import Services from './pages/Services';
import Documents from './pages/Documents';
import Stock from './pages/Stock';
import Invoices from './pages/Invoices';
import Receipts from './pages/Receipts';
import CashRegister from './pages/CashRegister';
import Banks from './pages/Banks';
import Reports from './pages/Reports';
import Financials from './pages/Financials';
import TransactionHistory from './pages/TransactionHistory';
import Assignments from './pages/Assignments';
import FeedbackCenter from './pages/FeedbackCenter';
import CustomerSupport from './pages/CustomerSupport';
import WorkspaceSettings from './pages/WorkspaceSettings';
import Profile from './pages/Profile';

// Platform admin pages
import ProductAnalytics from './pages/ProductAnalytics';
import AdminFeedback from './pages/AdminFeedback';
import UserManagement from './pages/admin/UserManagement';
import SubscriptionManagement from './pages/admin/SubscriptionManagement';
import PlatformSettings from './pages/admin/PlatformSettings';
import FeatureManagement from './pages/admin/FeatureManagement';
import AuditLogs from './pages/admin/AuditLogs';
import SystemMonitoring from './pages/admin/SystemMonitoring';

const { Pages, Layout } = pagesConfig;

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

// Pages served by the pagesConfig loop that are fully public (no auth needed)
const PUBLIC_PAGE_NAMES = ['Landing', 'Home', 'About', 'Features', 'Plans'];
// Pages in the loop that handle their own auth (login/register/onboarding)
const AUTH_PAGE_NAMES = ['Register', 'Onboarding'];
// Pages migrated to the new AppShell (routed explicitly below) — skip in loop
const MIGRATED_PAGE_NAMES = [
  'Dashboard', 'Clients', 'ClientProfile', 'Team', 'Messages', 'Tasks', 'Agenda',
  'Services', 'Documents', 'Stock', 'Invoices', 'Receipts', 'CashRegister', 'Banks',
  'Reports', 'Financials', 'CustomerSupport', 'WorkspaceSettings', 'Profile',
];

// For authenticated users visiting auth/public pages → redirect to dashboard
const AuthRedirect = ({ children }) => {
  const { isAuthenticated, isLoadingAuth } = useAuth();
  if (isLoadingAuth) return null;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return children;
};

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, isAuthenticated, onboardingCompleted } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center" style={{ backgroundColor: '#1c2d5f' }}>
        <div className="w-8 h-8 border-4 border-border border-t-white rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    }
  }

  // Render the main app
  return (
    <Routes>
      {/* Root "/" → Landing for guests, Dashboard for authenticated users */}
      <Route path="/" element={
        isAuthenticated
          ? <Navigate to="/dashboard" replace />
          : <Landing />
      } />

      {/* Design system preview (Fase 1) — public, no auth */}
      <Route path="/design" element={<DesignSystem />} />

      {/* Auth pages — redirect to dashboard if already logged in */}
      <Route path="/login" element={<AuthRedirect><Login /></AuthRedirect>} />
      <Route path="/register" element={<AuthRedirect><Register /></AuthRedirect>} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/AcceptInvite" element={<AcceptInvite />} />

      {/* Onboarding — must be authenticated, but skip if already completed */}
      <Route path="/onboarding" element={
        !isAuthenticated
          ? <Navigate to="/login" replace />
          : onboardingCompleted === true
            ? <Navigate to="/dashboard" replace />
            : <Onboarding />
      } />

      {/* Public marketing pages (REST paths) */}
      <Route path="/about" element={<About />} />
      <Route path="/features" element={<Features />} />
      <Route path="/plans" element={<Plans />} />
      <Route path="/home" element={<Navigate to="/" replace />} />
      {/* Legacy capitalized → new paths */}
      <Route path="/Landing" element={<Navigate to="/" replace />} />
      <Route path="/Home" element={<Navigate to="/" replace />} />

      {/* ── Authenticated app (new AppShell via AppLayout) ── */}
      <Route element={<AppLayout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/clients" element={<Clients />} />
        <Route path="/clientprofile" element={<ClientProfile />} />
        <Route path="/team" element={<Team />} />
        <Route path="/teammemberprofile" element={<TeamMemberProfile />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/projectprofile" element={<ProjectProfile />} />
        <Route path="/messages" element={<Messages />} />
        <Route path="/tasks" element={<Tasks />} />
        <Route path="/taskdetail" element={<TaskDetail />} />
        <Route path="/agenda" element={<Agenda />} />
        <Route path="/services" element={<Services />} />
        <Route path="/documents" element={<Documents />} />
        <Route path="/stock" element={<Stock />} />
        <Route path="/invoices" element={<Invoices />} />
        <Route path="/receipts" element={<Receipts />} />
        <Route path="/cash-register" element={<CashRegister />} />
        <Route path="/banks" element={<Banks />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/financials" element={<Financials />} />
        <Route path="/transactionhistory" element={<TransactionHistory />} />
        <Route path="/assignments" element={<Assignments />} />
        <Route path="/feedback" element={<FeedbackCenter />} />
        <Route path="/support" element={<CustomerSupport />} />
        <Route path="/settings" element={<WorkspaceSettings />} />
        <Route path="/profile" element={<Profile />} />

        {/* Platform admin */}
        <Route path="/admin/analytics" element={<ProductAnalytics />} />
        <Route path="/admin/users" element={<UserManagement />} />
        <Route path="/admin/feedback" element={<AdminFeedback />} />
        <Route path="/admin/subscriptions" element={<SubscriptionManagement />} />
        <Route path="/admin/settings" element={<PlatformSettings />} />
        <Route path="/admin/features" element={<FeatureManagement />} />
        <Route path="/admin/audit-logs" element={<AuditLogs />} />
        <Route path="/admin/monitoring" element={<SystemMonitoring />} />
      </Route>

      {/* createPageUrl-style aliases → canonical REST paths */}
      <Route path="/cashregister" element={<Navigate to="/cash-register" replace />} />
      <Route path="/feedbackcenter" element={<Navigate to="/feedback" replace />} />
      <Route path="/customersupport" element={<Navigate to="/support" replace />} />
      <Route path="/workspacesettings" element={<Navigate to="/settings" replace />} />
      <Route path="/productanalytics" element={<Navigate to="/admin/analytics" replace />} />
      <Route path="/usermanagement" element={<Navigate to="/admin/users" replace />} />
      <Route path="/adminfeedback" element={<Navigate to="/admin/feedback" replace />} />
      <Route path="/subscriptionmanagement" element={<Navigate to="/admin/subscriptions" replace />} />
      <Route path="/platformsettings" element={<Navigate to="/admin/settings" replace />} />
      <Route path="/featuremanagement" element={<Navigate to="/admin/features" replace />} />
      <Route path="/auditlogs" element={<Navigate to="/admin/audit-logs" replace />} />
      <Route path="/systemmonitoring" element={<Navigate to="/admin/monitoring" replace />} />

      {/* Remaining loop pages (e.g. OAuth callbacks) via legacy Layout */}
      {Object.entries(Pages)
        .filter(([name]) =>
          !PUBLIC_PAGE_NAMES.includes(name) &&
          !AUTH_PAGE_NAMES.includes(name) &&
          !MIGRATED_PAGE_NAMES.includes(name))
        .map(([path, Page]) => (
          <Route key={path} path={`/${path}`} element={
            <LayoutWrapper currentPageName={path}><Page /></LayoutWrapper>
          } />
        ))
      }

      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
      <AuthProvider>
        <QueryClientProvider client={queryClientInstance}>
          <Router>
            <NavigationTracker />
            <AuthenticatedApp />
          </Router>
          <Toaster />
        </QueryClientProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
