import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { getAdminAuthHeader } from '../../utils/adminAuth';
import { API_URL } from '../../config/api';
import {
  Users,
  Search,
  Filter,
  Eye,
  Ban,
  Trash2,
  RefreshCw,
  CheckCircle,
  XCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Mail,
  Phone,
  Building,
  CreditCard,
  FileText,
  Calendar,
  AlertCircle,
  X
} from 'lucide-react';

const ClientManagement = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalClients, setTotalClients] = useState(0);
  const [selectedClient, setSelectedClient] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const limit = 10;

  // Fetch clients
  const fetchClients = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: currentPage,
        limit: limit
      });

      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter) params.append('status', statusFilter);

      const response = await axios.get(
        `${API_URL}/admin/clients?${params.toString()}`,
        { headers: getAdminAuthHeader() }
      );

      setClients(response.data.clients);
      setTotalPages(response.data.pagination.totalPages);
      setTotalClients(response.data.pagination.total);
    } catch (err) {
      console.error('Error fetching clients:', err);
      setError(err.response?.data?.error || 'Failed to load clients');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, [currentPage, statusFilter]);

  // Handle search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentPage === 1) {
        fetchClients();
      } else {
        setCurrentPage(1);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // View client details
  const viewClientDetails = async (clientId) => {
    try {
      setActionLoading(true);
      const response = await axios.get(
        `${API_URL}/admin/clients/${clientId}`,
        { headers: getAdminAuthHeader() }
      );
      setSelectedClient(response.data.client);
      setShowDetailsModal(true);
    } catch (err) {
      console.error('Error fetching client details:', err);
      alert(err.response?.data?.error || 'Failed to load client details');
    } finally {
      setActionLoading(false);
    }
  };

  // Block/Unblock client
  const toggleClientStatus = async (clientId, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'blocked' : 'active';
    const confirmMessage = newStatus === 'blocked' 
      ? 'Are you sure you want to block this client?' 
      : 'Are you sure you want to unblock this client?';

    if (!confirm(confirmMessage)) return;

    try {
      setActionLoading(true);
      await axios.patch(
        `${API_URL}/admin/clients/${clientId}/status`,
        { status: newStatus },
        { headers: getAdminAuthHeader() }
      );

      alert(`Client ${newStatus === 'blocked' ? 'blocked' : 'unblocked'} successfully`);
      fetchClients();
      if (showDetailsModal) {
        setShowDetailsModal(false);
      }
    } catch (err) {
      console.error('Error toggling client status:', err);
      alert(err.response?.data?.error || 'Failed to update client status');
    } finally {
      setActionLoading(false);
    }
  };

  // Delete client
  const deleteClient = async (clientId) => {
    if (!confirm('Are you sure you want to delete this client? This action cannot be undone.')) {
      return;
    }

    try {
      setActionLoading(true);
      await axios.delete(
        `${API_URL}/admin/clients/${clientId}`,
        { headers: getAdminAuthHeader() }
      );

      alert('Client deleted successfully');
      fetchClients();
      if (showDetailsModal) {
        setShowDetailsModal(false);
      }
    } catch (err) {
      console.error('Error deleting client:', err);
      alert(err.response?.data?.error || 'Failed to delete client');
    } finally {
      setActionLoading(false);
    }
  };

  // Reset credits
  const resetCredits = async (clientId) => {
    const credits = prompt('Enter new credits amount:');
    if (credits === null) return;

    const creditsNum = parseInt(credits);
    if (isNaN(creditsNum) || creditsNum < 0) {
      alert('Please enter a valid number');
      return;
    }

    try {
      setActionLoading(true);
      await axios.post(
        `${API_URL}/admin/clients/${clientId}/reset-credits`,
        { credits: creditsNum },
        { headers: getAdminAuthHeader() }
      );

      alert('Credits reset successfully');
      viewClientDetails(clientId);
    } catch (err) {
      console.error('Error resetting credits:', err);
      alert(err.response?.data?.error || 'Failed to reset credits');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Client Management</h1>
          <p className="text-gray-600 mt-1">Manage all client accounts and subscriptions</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">Total Clients</p>
          <p className="text-2xl font-bold text-blue-600">{totalClients}</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email, company, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white min-w-[150px]"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="blocked">Blocked</option>
            </select>
          </div>
        </div>
      </div>

      {/* Clients Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
        ) : error ? (
          <div className="p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
            <p className="text-red-600">{error}</p>
          </div>
        ) : clients.length === 0 ? (
          <div className="p-6 text-center">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No clients found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Client Info
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Company
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Credits
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {clients.map((client) => (
                    <tr key={client._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-gray-900">{client.name}</p>
                          <p className="text-sm text-gray-500">ID: {client._id.slice(-8)}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Mail className="w-4 h-4" />
                            <span>{client.email}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Phone className="w-4 h-4" />
                            <span>{client.phone || 'N/A'}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Building className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-900">{client.companyName || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-4 h-4 text-gray-400" />
                          <span className="text-sm font-semibold text-gray-900">
                            {client.subscription?.creditsRemaining ?? 'N/A'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          client.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {client.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => viewClientDetails(client._id)}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => toggleClientStatus(client._id, client.status)}
                            className={`p-1 rounded ${
                              client.status === 'active'
                                ? 'text-red-600 hover:bg-red-50'
                                : 'text-green-600 hover:bg-green-50'
                            }`}
                            title={client.status === 'active' ? 'Block' : 'Unblock'}
                          >
                            {client.status === 'active' ? <Ban className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => deleteClient(client._id)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Showing {((currentPage - 1) * limit) + 1} to {Math.min(currentPage * limit, totalClients)} of {totalClients} clients
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-4 py-1 text-sm text-gray-600">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Client Details Modal */}
      {showDetailsModal && selectedClient && (
        <ClientDetailsModal
          client={selectedClient}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedClient(null);
          }}
          onBlock={() => toggleClientStatus(selectedClient._id, selectedClient.status)}
          onDelete={() => deleteClient(selectedClient._id)}
          onResetCredits={() => resetCredits(selectedClient._id)}
          actionLoading={actionLoading}
        />
      )}
    </div>
  );
};

// Client Details Modal Component
const ClientDetailsModal = ({ client, onClose, onBlock, onDelete, onResetCredits, actionLoading }) => {
  const [activeTab, setActiveTab] = useState('details');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-blue-600 to-blue-700">
          <div className="text-white">
            <h2 className="text-xl font-bold">{client.name}</h2>
            <p className="text-blue-100 text-sm">{client.email}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-blue-600 rounded-lg text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 px-6">
          <div className="flex gap-4">
            {['details', 'subscription', 'jobs', 'payments'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-3 px-4 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {activeTab === 'details' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoItem icon={Mail} label="Email" value={client.email} />
                <InfoItem icon={Phone} label="Phone" value={client.phone || 'N/A'} />
                <InfoItem icon={Building} label="Company" value={client.companyName || 'N/A'} />
                <InfoItem 
                  icon={Calendar} 
                  label="Joined" 
                  value={new Date(client.createdAt).toLocaleDateString()} 
                />
                <InfoItem 
                  icon={CheckCircle} 
                  label="Status" 
                  value={
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      client.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {client.status}
                    </span>
                  } 
                />
              </div>

              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                <StatCard 
                  label="Job Posts" 
                  value={client.stats?.totalJobPosts || 0}
                  icon={FileText}
                  color="blue"
                />
                <StatCard 
                  label="Total Spent" 
                  value={`₹${client.stats?.totalSpent || 0}`}
                  icon={CreditCard}
                  color="green"
                />
                <StatCard 
                  label="Payments" 
                  value={client.stats?.totalPayments || 0}
                  icon={FileText}
                  color="purple"
                />
              </div>
            </div>
          )}

          {activeTab === 'subscription' && (
            <div>
              {client.subscription ? (
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {client.subscription.planName} Plan
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        client.subscription.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {client.subscription.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Credits Remaining</p>
                        <p className="text-2xl font-bold text-blue-600">
                          {client.subscription.creditsRemaining}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Credits Used</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {client.subscription.creditsUsed}
                        </p>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={onResetCredits}
                    disabled={actionLoading}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className="w-4 h-4 inline mr-2" />
                    Reset Credits
                  </button>
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No active subscription</p>
              )}
            </div>
          )}

          {activeTab === 'jobs' && (
            <div>
              {client.jobPosts && client.jobPosts.length > 0 ? (
                <div className="space-y-3">
                  {client.jobPosts.map((job) => (
                    <div key={job._id} className="border border-gray-200 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900">{job.workType}</h4>
                      <p className="text-sm text-gray-600 mt-1">{job.location}</p>
                      <p className="text-xs text-gray-500 mt-2">
                        Posted: {new Date(job.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No job posts yet</p>
              )}
            </div>
          )}

          {activeTab === 'payments' && (
            <div>
              {client.payments && client.payments.length > 0 ? (
                <div className="space-y-3">
                  {client.payments.map((payment) => (
                    <div key={payment._id} className="border border-gray-200 rounded-lg p-4 flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-gray-900">₹{payment.amount}</p>
                        <p className="text-sm text-gray-600">Order: {payment.orderId}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(payment.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        payment.status === 'completed' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {payment.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No payment history</p>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="px-6 py-4 border-t border-gray-200 flex gap-3 bg-gray-50">
          <button
            onClick={onBlock}
            disabled={actionLoading}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 ${
              client.status === 'active'
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {actionLoading ? (
              <Loader2 className="w-4 h-4 animate-spin inline" />
            ) : client.status === 'active' ? (
              <>
                <Ban className="w-4 h-4 inline mr-2" />
                Block Client
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 inline mr-2" />
                Unblock Client
              </>
            )}
          </button>
          <button
            onClick={onDelete}
            disabled={actionLoading}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4 inline mr-2" />
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

// Helper Components
const InfoItem = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-3">
    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
      <Icon className="w-5 h-5 text-gray-600" />
    </div>
    <div>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-gray-900 font-medium">{value}</p>
    </div>
  </div>
);

const StatCard = ({ label, value, icon: Icon, color }) => (
  <div className={`bg-${color}-50 border border-${color}-200 rounded-lg p-4`}>
    <div className="flex items-center justify-between mb-2">
      <Icon className={`w-5 h-5 text-${color}-600`} />
    </div>
    <p className="text-sm text-gray-600">{label}</p>
    <p className={`text-2xl font-bold text-${color}-600`}>{value}</p>
  </div>
);

export default ClientManagement;
