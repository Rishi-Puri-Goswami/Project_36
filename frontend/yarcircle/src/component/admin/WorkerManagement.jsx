import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { getAdminAuthHeader } from '../../utils/adminAuth';
import { API_URL } from '../../config/api';
import {
  Briefcase,
  Search,
  Filter,
  Eye,
  Ban,
  Trash2,
  CheckCircle,
  XCircle,
  Star,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Mail,
  Phone,
  MapPin,
  Award,
  FileText,
  Calendar,
  AlertCircle,
  X,
  Clock,
  UserCheck
} from 'lucide-react';

const WorkerManagement = () => {
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [workTypeFilter, setWorkTypeFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalWorkers, setTotalWorkers] = useState(0);
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const limit = 10;

  // Fetch workers
  const fetchWorkers = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: currentPage,
        limit: limit
      });

      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter) params.append('status', statusFilter);
      if (workTypeFilter) params.append('workType', workTypeFilter);

      const response = await axios.get(
        `${API_URL}/admin/workers?${params.toString()}`,
        { headers: getAdminAuthHeader() }
      );

      setWorkers(response.data.workers);
      setTotalPages(response.data.pagination.totalPages);
      setTotalWorkers(response.data.pagination.total);
    } catch (err) {
      console.error('Error fetching workers:', err);
      setError(err.response?.data?.error || 'Failed to load workers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkers();
  }, [currentPage, statusFilter, workTypeFilter]);

  // Handle search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentPage === 1) {
        fetchWorkers();
      } else {
        setCurrentPage(1);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // View worker details
  const viewWorkerDetails = async (workerId) => {
    try {
      setActionLoading(true);
      const response = await axios.get(
        `${API_URL}/admin/workers/${workerId}`,
        { headers: getAdminAuthHeader() }
      );
      setSelectedWorker(response.data.worker);
      setShowDetailsModal(true);
    } catch (err) {
      console.error('Error fetching worker details:', err);
      alert(err.response?.data?.error || 'Failed to load worker details');
    } finally {
      setActionLoading(false);
    }
  };

  // Verify/Approve worker
  const verifyWorker = async (workerId, newStatus) => {
    const reason = newStatus === 'rejected' 
      ? prompt('Please enter rejection reason:') 
      : '';

    if (newStatus === 'rejected' && !reason) return;

    try {
      setActionLoading(true);
      await axios.patch(
        `${API_URL}/admin/workers/${workerId}/verify`,
        { 
          status: newStatus,
          adminNote: reason
        },
        { headers: getAdminAuthHeader() }
      );

      alert(`Worker ${newStatus} successfully`);
      fetchWorkers();
      if (showDetailsModal) {
        viewWorkerDetails(workerId);
      }
    } catch (err) {
      console.error('Error verifying worker:', err);
      alert(err.response?.data?.error || 'Failed to verify worker');
    } finally {
      setActionLoading(false);
    }
  };

  // Block/Unblock worker
  const toggleWorkerStatus = async (workerId, currentStatus) => {
    const newStatus = currentStatus === 'approved' ? 'blocked' : 'approved';
    const confirmMessage = newStatus === 'blocked' 
      ? 'Are you sure you want to block this worker?' 
      : 'Are you sure you want to unblock this worker?';

    if (!confirm(confirmMessage)) return;

    const reason = newStatus === 'blocked' ? prompt('Block reason:') : '';

    try {
      setActionLoading(true);
      await axios.patch(
        `${API_URL}/admin/workers/${workerId}/status`,
        { status: newStatus, reason },
        { headers: getAdminAuthHeader() }
      );

      alert(`Worker ${newStatus === 'blocked' ? 'blocked' : 'unblocked'} successfully`);
      fetchWorkers();
      if (showDetailsModal) {
        setShowDetailsModal(false);
      }
    } catch (err) {
      console.error('Error toggling worker status:', err);
      alert(err.response?.data?.error || 'Failed to update worker status');
    } finally {
      setActionLoading(false);
    }
  };

  // Delete worker
  const deleteWorker = async (workerId) => {
    if (!confirm('Are you sure you want to delete this worker? This action cannot be undone.')) {
      return;
    }

    try {
      setActionLoading(true);
      await axios.delete(
        `${API_URL}/admin/workers/${workerId}`,
        { headers: getAdminAuthHeader() }
      );

      alert('Worker deleted successfully');
      fetchWorkers();
      if (showDetailsModal) {
        setShowDetailsModal(false);
      }
    } catch (err) {
      console.error('Error deleting worker:', err);
      alert(err.response?.data?.error || 'Failed to delete worker');
    } finally {
      setActionLoading(false);
    }
  };

  // Feature/Unfeature worker
  const toggleFeatureWorker = async (workerId, isFeatured) => {
    if (!isFeatured) {
      const days = prompt('Enter number of days to feature this worker:', '7');
      if (!days) return;

      try {
        setActionLoading(true);
        await axios.post(
          `${API_URL}/admin/workers/${workerId}/feature`,
          { days: parseInt(days) },
          { headers: getAdminAuthHeader() }
        );

        alert('Worker featured successfully');
        fetchWorkers();
        if (showDetailsModal) {
          viewWorkerDetails(workerId);
        }
      } catch (err) {
        console.error('Error featuring worker:', err);
        alert(err.response?.data?.error || 'Failed to feature worker');
      } finally {
        setActionLoading(false);
      }
    } else {
      try {
        setActionLoading(true);
        await axios.post(
          `${API_URL}/admin/workers/${workerId}/unfeature`,
          {},
          { headers: getAdminAuthHeader() }
        );

        alert('Worker unfeatured successfully');
        fetchWorkers();
        if (showDetailsModal) {
          viewWorkerDetails(workerId);
        }
      } catch (err) {
        console.error('Error unfeaturing worker:', err);
        alert(err.response?.data?.error || 'Failed to unfeature worker');
      } finally {
        setActionLoading(false);
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'blocked': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved': return <CheckCircle className="w-4 h-4" />;
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'rejected': return <XCircle className="w-4 h-4" />;
      case 'blocked': return <Ban className="w-4 h-4" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Worker Management</h1>
          <p className="text-gray-600 mt-1">Manage all worker profiles and verifications</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">Total Workers</p>
          <p className="text-2xl font-bold text-blue-600">{totalWorkers}</p>
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
              placeholder="Search by name, email, phone, or location..."
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
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="blocked">Blocked</option>
            </select>
          </div>

          {/* Work Type Filter */}
          <div className="relative">
            <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Filter by work type..."
              value={workTypeFilter}
              onChange={(e) => {
                setWorkTypeFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-[180px]"
            />
          </div>
        </div>
      </div>

      {/* Workers Table */}
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
        ) : workers.length === 0 ? (
          <div className="p-6 text-center">
            <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No workers found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Worker Info
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Work Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Applications
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
                  {workers.map((worker) => (
                    <tr key={worker._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-gray-900">{worker.name}</p>
                              {worker.isFeatured && (
                                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                              )}
                            </div>
                            <p className="text-sm text-gray-500">ID: {worker._id.slice(-8)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Mail className="w-4 h-4" />
                            <span className="truncate max-w-[200px]">{worker.email}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Phone className="w-4 h-4" />
                            <span>{worker.phone || 'N/A'}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Award className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-900">{worker.workType || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-900">{worker.location || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-gray-400" />
                          <span className="text-sm font-semibold text-gray-900">
                            {worker.applicationCount || 0}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(worker.status)}`}>
                          {getStatusIcon(worker.status)}
                          {worker.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => viewWorkerDetails(worker._id)}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {worker.status === 'pending' && (
                            <>
                              <button
                                onClick={() => verifyWorker(worker._id, 'approved')}
                                className="p-1 text-green-600 hover:bg-green-50 rounded"
                                title="Approve"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => verifyWorker(worker._id, 'rejected')}
                                className="p-1 text-red-600 hover:bg-red-50 rounded"
                                title="Reject"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          {worker.status !== 'pending' && (
                            <button
                              onClick={() => toggleWorkerStatus(worker._id, worker.status)}
                              className={`p-1 rounded ${
                                worker.status === 'blocked'
                                  ? 'text-green-600 hover:bg-green-50'
                                  : 'text-red-600 hover:bg-red-50'
                              }`}
                              title={worker.status === 'blocked' ? 'Unblock' : 'Block'}
                            >
                              {worker.status === 'blocked' ? <CheckCircle className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                            </button>
                          )}
                          <button
                            onClick={() => toggleFeatureWorker(worker._id, worker.isFeatured)}
                            className={`p-1 rounded ${
                              worker.isFeatured
                                ? 'text-yellow-600 hover:bg-yellow-50'
                                : 'text-gray-600 hover:bg-gray-50'
                            }`}
                            title={worker.isFeatured ? 'Unfeature' : 'Feature'}
                          >
                            <Star className={`w-4 h-4 ${worker.isFeatured ? 'fill-yellow-600' : ''}`} />
                          </button>
                          <button
                            onClick={() => deleteWorker(worker._id)}
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
                Showing {((currentPage - 1) * limit) + 1} to {Math.min(currentPage * limit, totalWorkers)} of {totalWorkers} workers
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

      {/* Worker Details Modal */}
      {showDetailsModal && selectedWorker && (
        <WorkerDetailsModal
          worker={selectedWorker}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedWorker(null);
          }}
          onVerify={(status) => verifyWorker(selectedWorker._id, status)}
          onBlock={() => toggleWorkerStatus(selectedWorker._id, selectedWorker.status)}
          onDelete={() => deleteWorker(selectedWorker._id)}
          onFeature={() => toggleFeatureWorker(selectedWorker._id, selectedWorker.isFeatured)}
          actionLoading={actionLoading}
        />
      )}
    </div>
  );
};

// Worker Details Modal Component
const WorkerDetailsModal = ({ worker, onClose, onVerify, onBlock, onDelete, onFeature, actionLoading }) => {
  const [activeTab, setActiveTab] = useState('details');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-green-600 to-green-700">
          <div className="text-white">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold">{worker.name}</h2>
              {worker.isFeatured && (
                <Star className="w-5 h-5 text-yellow-300 fill-yellow-300" />
              )}
            </div>
            <p className="text-green-100 text-sm">{worker.email}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-green-600 rounded-lg text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 px-6">
          <div className="flex gap-4">
            {['details', 'applications'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-3 px-4 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab
                    ? 'border-green-600 text-green-600'
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
              {/* Status Badge */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold ${
                    worker.status === 'approved' ? 'bg-green-100 text-green-800' :
                    worker.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    worker.status === 'rejected' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {worker.status === 'approved' && <CheckCircle className="w-4 h-4" />}
                    {worker.status === 'pending' && <Clock className="w-4 h-4" />}
                    {worker.status === 'rejected' && <XCircle className="w-4 h-4" />}
                    {worker.status === 'blocked' && <Ban className="w-4 h-4" />}
                    {worker.status}
                  </span>
                  {worker.isFeatured && (
                    <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-semibold bg-yellow-100 text-yellow-800">
                      <Star className="w-4 h-4 fill-yellow-800" />
                      Featured
                      {worker.featuredUntil && (
                        <span className="text-xs">
                          (until {new Date(worker.featuredUntil).toLocaleDateString()})
                        </span>
                      )}
                    </span>
                  )}
                </div>
              </div>

              {/* Admin Note */}
              {worker.adminNote && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm font-semibold text-yellow-900">Admin Note:</p>
                  <p className="text-sm text-yellow-800 mt-1">{worker.adminNote}</p>
                </div>
              )}

              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoItem icon={Mail} label="Email" value={worker.email} />
                <InfoItem icon={Phone} label="Phone" value={worker.phone || 'N/A'} />
                <InfoItem icon={Award} label="Work Type" value={worker.workType || 'N/A'} />
                <InfoItem icon={MapPin} label="Location" value={worker.location || 'N/A'} />
                <InfoItem 
                  icon={Calendar} 
                  label="Joined" 
                  value={new Date(worker.createdAt).toLocaleDateString()} 
                />
                <InfoItem 
                  icon={UserCheck} 
                  label="Experience" 
                  value={worker.experience ? `${worker.experience} years` : 'N/A'} 
                />
              </div>

              {/* Description */}
              {worker.description && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Description</h3>
                  <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-4">
                    {worker.description}
                  </p>
                </div>
              )}

              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                <StatCard 
                  label="Total Applications" 
                  value={worker.stats?.totalApplications || 0}
                  icon={FileText}
                  color="blue"
                />
                <StatCard 
                  label="Profile Views" 
                  value={worker.profileViews || 0}
                  icon={Eye}
                  color="purple"
                />
              </div>
            </div>
          )}

          {activeTab === 'applications' && (
            <div>
              {worker.applications && worker.applications.length > 0 ? (
                <div className="space-y-3">
                  {worker.applications.map((app) => (
                    <div key={app._id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">{app.workType}</h4>
                          <p className="text-sm text-gray-600 mt-1">
                            <MapPin className="w-3 h-3 inline mr-1" />
                            {app.location}
                          </p>
                          {app.clientId && (
                            <p className="text-sm text-gray-500 mt-2">
                              Client: {app.clientId.name || app.clientId.companyName || 'Unknown'}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500">
                            Applied: {new Date(app.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No job applications yet</p>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="px-6 py-4 border-t border-gray-200 flex flex-wrap gap-3 bg-gray-50">
          {worker.status === 'pending' && (
            <>
              <button
                onClick={() => onVerify('approved')}
                disabled={actionLoading}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {actionLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin inline" />
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 inline mr-2" />
                    Approve Worker
                  </>
                )}
              </button>
              <button
                onClick={() => onVerify('rejected')}
                disabled={actionLoading}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                <XCircle className="w-4 h-4 inline mr-2" />
                Reject
              </button>
            </>
          )}
          {worker.status !== 'pending' && (
            <button
              onClick={onBlock}
              disabled={actionLoading}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 ${
                worker.status === 'blocked'
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-red-600 text-white hover:bg-red-700'
              }`}
            >
              {actionLoading ? (
                <Loader2 className="w-4 h-4 animate-spin inline" />
              ) : worker.status === 'blocked' ? (
                <>
                  <CheckCircle className="w-4 h-4 inline mr-2" />
                  Unblock Worker
                </>
              ) : (
                <>
                  <Ban className="w-4 h-4 inline mr-2" />
                  Block Worker
                </>
              )}
            </button>
          )}
          <button
            onClick={onFeature}
            disabled={actionLoading}
            className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors disabled:opacity-50"
          >
            <Star className={`w-4 h-4 inline mr-2 ${worker.isFeatured ? 'fill-white' : ''}`} />
            {worker.isFeatured ? 'Unfeature' : 'Feature'}
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

export default WorkerManagement;
