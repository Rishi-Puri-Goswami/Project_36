import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { getAdminAuthHeader } from '../../utils/adminAuth';
import { API_URL } from '../../config/api';
import {
  Briefcase,
  Search,
  Filter,
  MapPin,
  DollarSign,
  Users,
  Calendar,
  Eye,
  Trash2,
  Star,
  StarOff,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  Phone,
  Mail,
  X,
  Loader2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

const JobPostManagement = () => {
  const [jobPosts, setJobPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filters and search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all, active, expired
  const [workTypeFilter, setWorkTypeFilter] = useState('');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPosts, setTotalPosts] = useState(0);
  const limit = 10;
  
  // Modal states
  const [selectedPost, setSelectedPost] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteReason, setDeleteReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  
  // Fetch job posts
  const fetchJobPosts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {
        page: currentPage,
        limit,
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(workTypeFilter && { workType: workTypeFilter })
      };
      
      const response = await axios.get(`${API_URL}/admin/jobs/all`, {
        params,
        headers: getAdminAuthHeader()
      });
      
      setJobPosts(response.data.jobPosts || []);
      setTotalPosts(response.data.pagination?.total || 0);
      setTotalPages(response.data.pagination?.totalPages || 1);
      
    } catch (err) {
      console.error('Error fetching job posts:', err);
      setError(err.response?.data?.error || 'Failed to fetch job posts');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchJobPosts();
  }, [currentPage, statusFilter, workTypeFilter]);
  
  // Handle search with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (currentPage === 1) {
        fetchJobPosts();
      } else {
        setCurrentPage(1);
      }
    }, 500);
    
    return () => clearTimeout(timeoutId);
  }, [searchTerm]);
  
  // Delete job post
  const handleDeletePost = async () => {
    if (!selectedPost || !deleteReason.trim()) {
      alert('Please provide a reason for deletion');
      return;
    }
    
    try {
      setActionLoading(true);
      
      await axios.delete(`${API_URL}/admin/jobs/${selectedPost._id}`, {
        headers: getAdminAuthHeader(),
        data: { reason: deleteReason }
      });
      
      alert('Job post deleted successfully');
      setShowDeleteModal(false);
      setDeleteReason('');
      setSelectedPost(null);
      fetchJobPosts();
      
    } catch (err) {
      console.error('Error deleting job post:', err);
      alert(err.response?.data?.error || 'Failed to delete job post');
    } finally {
      setActionLoading(false);
    }
  };
  
  // Toggle featured status
  const handleToggleFeatured = async (postId, currentStatus) => {
    try {
      setActionLoading(true);
      
      await axios.patch(
        `${API_URL}/admin/jobs/${postId}/feature`,
        { isFeatured: !currentStatus },
        { headers: getAdminAuthHeader() }
      );
      
      alert(`Job post ${!currentStatus ? 'marked as' : 'removed from'} featured`);
      fetchJobPosts();
      
    } catch (err) {
      console.error('Error toggling featured status:', err);
      alert(err.response?.data?.error || 'Failed to update featured status');
    } finally {
      setActionLoading(false);
    }
  };
  
  // Get status badge color
  const getStatusBadge = (expiryDate) => {
    const now = new Date();
    const expiry = new Date(expiryDate);
    
    if (expiry > now) {
      return (
        <span className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
          <CheckCircle className="w-3 h-3" />
          Active
        </span>
      );
    } else {
      return (
        <span className="flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold">
          <XCircle className="w-3 h-3" />
          Expired
        </span>
      );
    }
  };
  
  // View job details modal
  const openDetailsModal = (post) => {
    setSelectedPost(post);
    setShowDetailsModal(true);
  };
  
  // Open delete modal
  const openDeleteModal = (post) => {
    setSelectedPost(post);
    setShowDeleteModal(true);
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Briefcase className="w-7 h-7 text-blue-600" />
              Job Posts Management
            </h2>
            <p className="text-gray-600 mt-1">
              Manage, monitor, and moderate client job postings
            </p>
          </div>
          
          <div className="bg-blue-50 px-4 py-2 rounded-lg">
            <p className="text-sm text-gray-600">Total Posts</p>
            <p className="text-2xl font-bold text-blue-600">{totalPosts}</p>
          </div>
        </div>
        
        {/* Search and Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by work type, location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="expired">Expired</option>
          </select>
          
          {/* Work Type Filter */}
          <input
            type="text"
            placeholder="Filter by work type"
            value={workTypeFilter}
            onChange={(e) => setWorkTypeFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>
      
      {/* Loading State */}
      {loading && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading job posts...</p>
        </div>
      )}
      
      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-red-600" />
            <div>
              <h3 className="text-red-900 font-semibold">Error</h3>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Job Posts List */}
      {!loading && !error && (
        <>
          {jobPosts.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Job Posts Found</h3>
              <p className="text-gray-600">
                {searchTerm || statusFilter !== 'all' || workTypeFilter
                  ? 'Try adjusting your filters'
                  : 'No job posts have been created yet'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {jobPosts.map((post) => (
                <div
                  key={post._id}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-gray-900">{post.workType}</h3>
                        {getStatusBadge(post.expiryDate)}
                        {post.paidVisibility && (
                          <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold">
                            Premium
                          </span>
                        )}
                        {post.isFeatured && (
                          <span className="flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-semibold">
                            <Star className="w-3 h-3" />
                            Featured
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                        {post.clientId && (
                          <span className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {post.clientId.name || post.clientId.companyName}
                          </span>
                        )}
                        {post.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {post.location}
                          </span>
                        )}
                        {post.salaryRange && (
                          <span className="flex items-center gap-1">
                            <DollarSign className="w-4 h-4" />
                            {post.salaryRange}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {post.workerApplications?.length || 0} Applications
                        </span>
                      </div>
                      
                      {post.description && (
                        <p className="text-gray-700 text-sm line-clamp-2">
                          {post.description}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-4 text-xs text-gray-500 mt-3">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Posted: {new Date(post.createdAt).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Expires: {new Date(post.expiryDate).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Briefcase className="w-3 h-3" />
                          {post.numberOfWorkers || 1} Worker(s) Needed
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                    <button
                      onClick={() => openDetailsModal(post)}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors text-sm font-medium"
                    >
                      <Eye className="w-4 h-4" />
                      View Details
                    </button>
                    
                    <button
                      onClick={() => handleToggleFeatured(post._id, post.isFeatured)}
                      disabled={actionLoading}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
                        post.isFeatured
                          ? 'bg-yellow-50 text-yellow-600 hover:bg-yellow-100'
                          : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {post.isFeatured ? (
                        <>
                          <StarOff className="w-4 h-4" />
                          Unfeature
                        </>
                      ) : (
                        <>
                          <Star className="w-4 h-4" />
                          Mark Featured
                        </>
                      )}
                    </button>
                    
                    <button
                      onClick={() => openDeleteModal(post)}
                      disabled={actionLoading}
                      className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors text-sm font-medium ml-auto"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  Showing {((currentPage - 1) * limit) + 1} to {Math.min(currentPage * limit, totalPosts)} of {totalPosts} posts
                </p>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  
                  <span className="px-4 py-2 bg-blue-50 text-blue-600 font-semibold rounded-lg">
                    {currentPage} / {totalPages}
                  </span>
                  
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
      
      {/* Job Details Modal */}
      {showDetailsModal && selectedPost && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">Job Post Details</h3>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Job Info */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <h4 className="text-2xl font-bold text-gray-900">{selectedPost.workType}</h4>
                  {getStatusBadge(selectedPost.expiryDate)}
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Location</p>
                    <p className="font-semibold text-gray-900">{selectedPost.location || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Salary Range</p>
                    <p className="font-semibold text-gray-900">{selectedPost.salaryRange || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Workers Needed</p>
                    <p className="font-semibold text-gray-900">{selectedPost.numberOfWorkers || 1}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Applications</p>
                    <p className="font-semibold text-gray-900">{selectedPost.workerApplications?.length || 0}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Posted Date</p>
                    <p className="font-semibold text-gray-900">{new Date(selectedPost.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Expiry Date</p>
                    <p className="font-semibold text-gray-900">{new Date(selectedPost.expiryDate).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
              
              {/* Description */}
              {selectedPost.description && (
                <div>
                  <h5 className="font-semibold text-gray-900 mb-2">Description</h5>
                  <p className="text-gray-700 text-sm bg-gray-50 p-4 rounded-lg">
                    {selectedPost.description}
                  </p>
                </div>
              )}
              
              {/* Client Info */}
              {selectedPost.clientId && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h5 className="font-semibold text-gray-900 mb-3">Client Information</h5>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-blue-600" />
                      <span className="font-medium">{selectedPost.clientId.name || selectedPost.clientId.companyName}</span>
                    </div>
                    {selectedPost.clientId.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-blue-600" />
                        <span>{selectedPost.clientId.email}</span>
                      </div>
                    )}
                    {selectedPost.contactNumber && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-blue-600" />
                        <span>{selectedPost.contactNumber}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Worker Applications */}
              {selectedPost.workerApplications && selectedPost.workerApplications.length > 0 && (
                <div>
                  <h5 className="font-semibold text-gray-900 mb-3">
                    Worker Applications ({selectedPost.workerApplications.length})
                  </h5>
                  <div className="space-y-2">
                    {selectedPost.workerApplications.map((worker, index) => (
                      <div key={index} className="bg-gray-50 p-3 rounded-lg flex items-center gap-3 text-sm">
                        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                          {worker.name?.charAt(0).toUpperCase() || 'W'}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">{worker.name}</p>
                          <p className="text-gray-600 text-xs">{worker.workType || 'Worker'}</p>
                        </div>
                        {worker.phone && (
                          <span className="text-gray-600">{worker.phone}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedPost && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              
              <h3 className="text-xl font-bold text-gray-900 text-center mb-2">
                Delete Job Post
              </h3>
              <p className="text-gray-600 text-center mb-6">
                Are you sure you want to delete this job post? This action cannot be undone.
              </p>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for Deletion <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                  placeholder="Enter reason for deleting this job post..."
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                />
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeleteReason('');
                    setSelectedPost(null);
                  }}
                  disabled={actionLoading}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeletePost}
                  disabled={actionLoading || !deleteReason.trim()}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {actionLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Delete Post
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobPostManagement;
