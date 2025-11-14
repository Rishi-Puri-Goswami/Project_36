import React, { useState, useEffect } from 'react';
import { useAdmin } from '../../context/AdminContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getAdminAuthHeader } from '../../utils/adminAuth';
import { API_URL } from '../../config/api';
import ClientManagement from './ClientManagement';
import WorkerManagement from './WorkerManagement';
import WorkerPostManagement from './WorkerPostManagement';
import {
  LayoutDashboard,
  Users,
  Briefcase,
  FileText,
  CreditCard,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  User,
  TrendingUp,
  Loader2,
  AlertCircle
} from 'lucide-react';

const AdminDashboard = () => {
  const { admin, logout } = useAdmin();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeSection, setActiveSection] = useState('overview');
  const secretPath = import.meta.env.VITE_ADMIN_PANEL_SECRET || 'secure';

  // Fetch dashboard overview data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await axios.get(`${API_URL}/admin/dashboard/overview`, {
          headers: getAdminAuthHeader()
        });

        setDashboardData(response.data.data);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError(err.response?.data?.error || 'Failed to load dashboard data');
        
        // If unauthorized, logout
        if (err.response?.status === 401) {
          logout();
          navigate(`/admin/${secretPath}/login`);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [logout, navigate, secretPath]);

  const handleLogout = () => {
    logout();
    navigate(`/admin/${secretPath}/login`);
  };

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: 'overview', badge: null },
    { icon: Users, label: 'Clients', path: 'clients', badge: null },
    { icon: Briefcase, label: 'Workers', path: 'workers', badge: 'pending' },
    { icon: FileText, label: 'Worker Posts', path: 'worker-posts', badge: null },
    { icon: FileText, label: 'Job Posts', path: 'jobs', badge: null },
    { icon: CreditCard, label: 'Plans & Subscriptions', path: 'plans', badge: null },
    { icon: Settings, label: 'Settings', path: 'settings', badge: null },
  ];

  const handleMenuClick = (path) => {
    setActiveSection(path);
    setSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation Bar */}
      <nav className="bg-white border-b border-gray-200 fixed w-full z-30 top-0">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left: Logo & Menu Toggle */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                {sidebarOpen ? (
                  <X className="w-6 h-6 text-gray-600" />
                ) : (
                  <Menu className="w-6 h-6 text-gray-600" />
                )}
              </button>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <LayoutDashboard className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-gray-900 hidden sm:block">
                  Admin Panel
                </span>
              </div>
            </div>

            {/* Right: User Info & Notifications */}
            <div className="flex items-center gap-4">
              {/* Notifications */}
              <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors relative">
                <Bell className="w-5 h-5 text-gray-600" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>

              {/* User Dropdown */}
              <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-gray-50">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-semibold text-gray-900">{admin?.name}</p>
                  <p className="text-xs text-gray-500 capitalize">{admin?.role}</p>
                </div>
              </div>

              {/* Logout */}
              <button
                onClick={handleLogout}
                className="p-2 rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors text-gray-600"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Sidebar */}
      <aside
        className={`
          fixed top-16 left-0 z-20 w-64 h-full bg-white border-r border-gray-200 transition-transform duration-300
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <nav className="p-4 space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.path}
              onClick={() => handleMenuClick(item.path)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-gray-700 group ${
                activeSection === item.path
                  ? 'bg-blue-50 text-blue-600'
                  : 'hover:bg-blue-50 hover:text-blue-600'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="flex-1 text-left font-medium">{item.label}</span>
              {item.badge && (
                <span className="px-2 py-1 text-xs bg-red-100 text-red-600 rounded-full">
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className={`pt-16 transition-all duration-300 ${sidebarOpen ? 'lg:pl-64' : 'lg:pl-64'}`}>
        <div className="p-4 sm:p-6 lg:p-8">
          {/* Render different sections based on activeSection */}
          {activeSection === 'overview' && (
            <>
              {/* Welcome Section */}
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Welcome back, {admin?.name}! 👋
                </h1>
                <p className="text-gray-600">
                  Here's what's happening with your platform today.
                </p>
              </div>

          {/* Stats Cards */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse">
                  <div className="w-12 h-12 bg-gray-200 rounded-lg mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-16"></div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-8">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-6 h-6 text-red-600" />
                <div>
                  <h3 className="text-red-900 font-semibold">Failed to load dashboard</h3>
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {/* Total Users */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-green-600 text-xs font-medium">
                      <TrendingUp className="w-3 h-3" />
                      <span>+{dashboardData?.recentRegistrations?.total || 0} this week</span>
                    </div>
                  </div>
                </div>
                <p className="text-gray-600 text-sm mb-1">Total Users</p>
                <p className="text-3xl font-bold text-gray-900">
                  {dashboardData?.totalUsers?.total?.toLocaleString() || 0}
                </p>
                <div className="mt-3 flex gap-4 text-xs text-gray-500">
                  <span>Clients: {dashboardData?.totalUsers?.clients || 0}</span>
                  <span>Workers: {dashboardData?.totalUsers?.workers || 0}</span>
                </div>
              </div>

              {/* Total Jobs */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <Briefcase className="w-6 h-6 text-green-600" />
                  </div>
                </div>
                <p className="text-gray-600 text-sm mb-1">Total Jobs Posted</p>
                <p className="text-3xl font-bold text-gray-900">
                  {dashboardData?.totalJobs?.toLocaleString() || 0}
                </p>
                <p className="mt-3 text-xs text-gray-500">All time job postings</p>
              </div>

              {/* Total Revenue */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <CreditCard className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
                <p className="text-gray-600 text-sm mb-1">Total Revenue</p>
                <p className="text-3xl font-bold text-gray-900">
                  ₹{(dashboardData?.totalRevenue || 0).toLocaleString()}
                </p>
                <p className="mt-3 text-xs text-gray-500">From subscriptions</p>
              </div>

              {/* Active Subscriptions */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <FileText className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
                <p className="text-gray-600 text-sm mb-1">Active Subscriptions</p>
                <p className="text-3xl font-bold text-gray-900">
                  {dashboardData?.activeSubscriptions?.toLocaleString() || 0}
                </p>
                <p className="mt-3 text-xs text-gray-500">Currently active plans</p>
              </div>
            </div>
          )}

          {/* Content Area */}
          {!loading && !error && dashboardData && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Popular Work Types */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Popular Work Types</h2>
                {dashboardData.popularWorkTypes && dashboardData.popularWorkTypes.length > 0 ? (
                  <div className="space-y-3">
                    {dashboardData.popularWorkTypes.slice(0, 5).map((type, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 font-semibold text-sm">
                            {index + 1}
                          </div>
                          <span className="text-gray-700 font-medium">{type.workType}</span>
                        </div>
                        <span className="text-gray-500 text-sm">{type.count} workers</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm text-center py-8">No data available</p>
                )}
              </div>

              {/* Top Locations */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Top Locations</h2>
                {dashboardData.topLocations && dashboardData.topLocations.length > 0 ? (
                  <div className="space-y-3">
                    {dashboardData.topLocations.slice(0, 5).map((loc, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center text-green-600 font-semibold text-sm">
                            {index + 1}
                          </div>
                          <span className="text-gray-700 font-medium">{loc.location}</span>
                        </div>
                        <span className="text-gray-500 text-sm">{loc.count} users</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm text-center py-8">No data available</p>
                )}
              </div>

              {/* Recent Registrations */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Recent Registrations (Last 7 Days)</h2>
                {dashboardData.recentRegistrations && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                      <div>
                        <p className="text-sm text-gray-600">New Clients</p>
                        <p className="text-2xl font-bold text-blue-600">
                          {dashboardData.recentRegistrations.clients || 0}
                        </p>
                      </div>
                      <Users className="w-10 h-10 text-blue-600 opacity-50" />
                    </div>
                    <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                      <div>
                        <p className="text-sm text-gray-600">New Workers</p>
                        <p className="text-2xl font-bold text-green-600">
                          {dashboardData.recentRegistrations.workers || 0}
                        </p>
                      </div>
                      <Briefcase className="w-10 h-10 text-green-600 opacity-50" />
                    </div>
                    <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                      <div>
                        <p className="text-sm text-gray-600">Total New Users</p>
                        <p className="text-2xl font-bold text-purple-600">
                          {dashboardData.recentRegistrations.total || 0}
                        </p>
                      </div>
                      <TrendingUp className="w-10 h-10 text-purple-600 opacity-50" />
                    </div>
                  </div>
                )}
              </div>

              {/* Payment Statistics */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Payment Statistics</h2>
                {dashboardData.paymentStatistics?.byStatus && (
                  <div className="space-y-3">
                    {dashboardData.paymentStatistics.byStatus.map((stat, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${
                            stat.status === 'completed' ? 'bg-green-500' : 
                            stat.status === 'pending' ? 'bg-yellow-500' : 'bg-red-500'
                          }`}></div>
                          <span className="text-gray-700 font-medium capitalize">{stat.status}</span>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-gray-900">{stat.count} orders</p>
                          <p className="text-xs text-gray-500">₹{stat.totalAmount?.toLocaleString() || 0}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
            </>
          )}

          {/* Client Management Section */}
          {activeSection === 'clients' && <ClientManagement />}

          {/* Worker Management Section */}
          {activeSection === 'workers' && <WorkerManagement />}

          {/* Worker Posts Management Section */}
          {activeSection === 'worker-posts' && <WorkerPostManagement />}

          {/* Other sections - placeholders for now */}
          {activeSection === 'jobs' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Job Posts Management</h2>
              <p className="text-gray-500">Job posts management section coming soon...</p>
            </div>
          )}

          {activeSection === 'plans' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Plans & Subscriptions</h2>
              <p className="text-gray-500">Plans management section coming soon...</p>
            </div>
          )}

          {activeSection === 'settings' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Settings</h2>
              <p className="text-gray-500">Settings section coming soon...</p>
            </div>
          )}
        </div>
      </main>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-10 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default AdminDashboard;
