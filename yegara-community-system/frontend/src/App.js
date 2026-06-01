import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';

// Layout Components
import Navbar from './components/Layout/Navbar';
import Sidebar from './components/Layout/Sidebar';
import Footer from './components/Layout/Footer';
import ResidentChatbotWidget from './components/Chatbot/ResidentChatbotWidget';

// Auth Pages
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import ForgotPassword from './pages/Auth/ForgotPassword';
import ResetPassword from './pages/Auth/ResetPassword';
import ActivateAccount from './pages/Auth/ActivateAccount';

// Resident Pages
import ResidentDashboard from './pages/Resident/Dashboard';
import ReportIssue from './pages/Resident/ReportIssue';
import MyReports from './pages/Resident/MyReports';
import TrackReport from './pages/Resident/TrackReport';
import PublicUpdates from './pages/Resident/PublicUpdates';
import ResidentAnnouncements from './pages/Resident/Announcements';

// Officer Pages
import OfficerDashboard from './pages/Officer/Dashboard';
import ManageReports from './pages/Officer/ManageReports';
import UploadResource from './pages/Officer/UploadResource';
import PostUpdates from './pages/Officer/PostUpdates';
import OfficerAnnouncements from './pages/Officer/Announcements';

// Woreda Admin Pages
import WoredaAdminDashboard from './pages/WoredaAdmin/Dashboard';
import WoredaAdminReports from './pages/WoredaAdmin/Reports';
import ManageOfficers from './pages/WoredaAdmin/ManageOfficers';
import ManageEvents from './pages/WoredaAdmin/ManageEvents';
import VirtualMeetings from './pages/WoredaAdmin/VirtualMeetings';
import WoredaAdminAnalytics from './pages/WoredaAdmin/Analytics';

// Sub-City Admin Pages
import AnalyticsDashboard from './pages/SubCityAdmin/AnalyticsDashboard';
import SubCityAdminEvents from './pages/SubCityAdmin/ManageEvents';
import ManageWoredaAdmins from './pages/SubCityAdmin/ManageWoredaAdmins';
import SubCityAdminReports from './pages/SubCityAdmin/Reports';
import UserManagement from './pages/SubCityAdmin/UserManagement';
import SystemSettings from './pages/SubCityAdmin/SystemSettings';

// Shared Pages
import Events from './pages/Shared/Events';
import Resources from './pages/Shared/Resources';
import Profile from './pages/Shared/Profile';
import EditProfile from './pages/Shared/EditProfile';
import Home from './pages/Shared/Home';
import Announcements from './pages/Shared/Announcements';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" />;
  }

  return children;
};

// Layout Component
const Layout = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();

  const compactFooterPrefixes = [
    '/resident',
    '/officer',
    '/woreda-admin',
    '/subcity-admin',
  ];

  const compactFooterRoles = new Set([
    'resident',
    'officer',
    'woreda_admin',
    'subcity_admin',
  ]);

  const compactSharedRoutes = new Set(['/profile', '/profile/edit']);
  const residentSharedRoutes = new Set(['/resident/announcements', '/resident/public-updates', '/resources', '/events']);

  const isRoleSectionRoute = compactFooterPrefixes.some((prefix) =>
    location.pathname === prefix || location.pathname.startsWith(`${prefix}/`)
  );

  const isCompactSharedRouteForRole =
    compactFooterRoles.has(user?.role) && compactSharedRoutes.has(location.pathname);

  const isResidentSharedRoute =
    user?.role === 'resident' && residentSharedRoutes.has(location.pathname);

  const useCompactFooter = isRoleSectionRoute || isCompactSharedRouteForRole || isResidentSharedRoute;

  if (!user) {
    return children;
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />
        <main className={`flex-1 overflow-y-auto p-6 ${useCompactFooter ? 'pb-2' : ''}`}>
          {children}
        </main>
        <Footer compact={useCompactFooter} />
      </div>
    </div>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <Toaster position="top-right" />
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/resetpassword/:token" element={<ResetPassword />} />
          <Route path="/activate" element={<ActivateAccount />} />
          <Route path="/" element={<Home />} />
          <Route path="/events" element={<Events />} />
          <Route path="/resources" element={<Resources />} />
          <Route path="/announcements" element={<Announcements />} />

          {/* Protected Routes with Layout */}
          <Route
            path="/resident/*"
            element={
              <ProtectedRoute allowedRoles={['resident']}>
                <Layout>
                  <Routes>
                    <Route path="dashboard" element={<ResidentDashboard />} />
                    <Route path="announcements" element={<ResidentAnnouncements />} />
                    <Route path="public-updates" element={<PublicUpdates />} />
                    <Route path="reports" element={<MyReports />} />
                    <Route path="reports/new" element={<ReportIssue />} />
                    <Route path="reports/:id" element={<TrackReport />} />
                    <Route path="events" element={<Events />} />
                    <Route path="resources" element={<Resources />} />
                    <Route path="meetings" element={<VirtualMeetings />} />
                    <Route path="profile" element={<Profile />} />
                  </Routes>
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/officer/*"
            element={
              <ProtectedRoute allowedRoles={['officer']}>
                <Layout>
                  <Routes>
                    <Route path="dashboard" element={<OfficerDashboard />} />
                    <Route path="reports" element={<ManageReports />} />
                    <Route path="resources" element={<UploadResource />} />
                    <Route path="updates" element={<PostUpdates />} />
                    <Route path="events" element={<Events />} />
                    <Route path="meetings" element={<VirtualMeetings />} />
                    <Route path="announcements" element={<OfficerAnnouncements />} />
                    <Route path="profile" element={<Profile />} />
                  </Routes>
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/woreda-admin/*"
            element={
              <ProtectedRoute allowedRoles={['woreda_admin']}>
                <Layout>
                  <Routes>
                    <Route path="dashboard" element={<WoredaAdminDashboard />} />
                    <Route path="reports" element={<WoredaAdminReports />} />
                    <Route path="officers" element={<ManageOfficers />} />
                    <Route path="events" element={<ManageEvents />} />
                    <Route path="meetings" element={<VirtualMeetings />} />
                    <Route path="announcements" element={<OfficerAnnouncements />} />
                    <Route path="analytics" element={<WoredaAdminAnalytics />} />
                    <Route path="profile" element={<Profile />} />
                  </Routes>
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/subcity-admin/*"
            element={
              <ProtectedRoute allowedRoles={['subcity_admin']}>
                <Layout>
                  <Routes>
                    <Route path="dashboard" element={<AnalyticsDashboard />} />
                    <Route path="reports" element={<SubCityAdminReports />} />
                    <Route path="events" element={<SubCityAdminEvents />} />
                    <Route path="meetings" element={<VirtualMeetings />} />
                    <Route path="admins" element={<ManageWoredaAdmins />} />
                    <Route path="users" element={<UserManagement />} />
                    <Route path="announcements" element={<OfficerAnnouncements />} />
                    <Route path="system" element={<SystemSettings />} />
                    <Route path="profile" element={<Profile />} />
                  </Routes>
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* Shared Protected Routes */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Layout>
                  <Profile />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/profile/edit"
            element={
              <ProtectedRoute>
                <Layout>
                  <EditProfile />
                </Layout>
              </ProtectedRoute>
            }
          />

        </Routes>
        <ResidentChatbotWidget />
      </AuthProvider>
    </Router>
  );
}

export default App;