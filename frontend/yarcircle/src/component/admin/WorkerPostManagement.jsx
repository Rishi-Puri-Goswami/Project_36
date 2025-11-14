import { useState, useEffect } from 'react';
import axios from 'axios';
import { getAdminAuthHeader } from '../../utils/adminAuth';
import { 
  Search, 
  Eye, 
  Ban, 
  CheckCircle, 
  Trash2, 
  X,
  MapPin,
  Phone,
  Mail,
  Briefcase,
  DollarSign,
  Calendar,
  Image as ImageIcon,
  User
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const WorkerPostManagement = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPosts, setTotalPosts] = useState(0);
  
  // Modal state
  const [selectedPost, setSelectedPost] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  
  // Action loading
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchPosts();
  }, [currentPage, searchTerm, statusFilter]);

  const fetchPosts = async () => {
    setLoading(true);
    setError('');
    
    try {
      const params = new URLSearchParams({
        page: currentPage,
        limit: 10,
      });
      
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter) params.append('status', statusFilter);
      
      const response = await axios.get(
        `${API_URL}/admin/worker-posts?${params}`,
        { headers: getAdminAuthHeader() }
      );
      
      setPosts(response.data.posts || []);
      setTotalPages(response.data.pagination?.totalPages || 1);
      setTotalPosts(response.data.pagination?.total || 0);
      
    } catch (err) {
      console.error('Error fetching worker posts:', err);
      setError(err.response?.data?.error || 'Failed to fetch worker posts');
    } finally {
      setLoading(false);
    }
  };

  const viewPostDetails = async (postId) => {
    try {
      const response = await axios.get(
        `${API_URL}/admin/worker-posts/${postId}`,
        { headers: getAdminAuthHeader() }
      );
      
      setSelectedPost(response.data.post);
      setShowDetailsModal(true);
      
    } catch (err) {
      console.error('Error fetching post details:', err);
      alert(err.response?.data?.error || 'Failed to fetch post details');
    }
  };

  const togglePostStatus = async (postId, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    const action = newStatus === 'inactive' ? 'block' : 'unblock';
    
    if (!confirm(`Are you sure you want to ${action} this post?`)) return;
    
    setActionLoading(true);
    
    try {
      await axios.patch(
        `${API_URL}/admin/worker-posts/${postId}/status`,
        { status: newStatus },
        { headers: getAdminAuthHeader() }
      );
      
      alert(`Post ${action}ed successfully`);
      fetchPosts();
      
      if (selectedPost?._id === postId) {
        setSelectedPost({ ...selectedPost, status: newStatus });
      }
      
    } catch (err) {
      console.error(`Error ${action}ing post:`, err);
      alert(err.response?.data?.error || `Failed to ${action} post`);
    } finally {
      setActionLoading(false);
    }
  };

  const deletePost = async (postId) => {
    if (!confirm('Are you sure you want to delete this post? This action cannot be undone.')) return;
    
    setActionLoading(true);
    
    try {
      await axios.delete(
        `${API_URL}/admin/worker-posts/${postId}`,
        { headers: getAdminAuthHeader() }
      );
      
      alert('Post deleted successfully');
      setShowDetailsModal(false);
      fetchPosts();
      
    } catch (err) {
      console.error('Error deleting post:', err);
      alert(err.response?.data?.error || 'Failed to delete post');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchPosts();
  };

  // Helper Components
  const InfoItem = ({ icon: Icon, label, value }) => (
    <div className="flex items-start space-x-3 py-2">
      <Icon className="w-5 h-5 text-gray-400 mt-0.5" />
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-sm font-medium text-gray-900">{value || 'N/A'}</p>
      </div>
    </div>
  );

  const StatusBadge = ({ status }) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-red-100 text-red-800'
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
        {status}
      </span>
    );
  };

  // Post Details Modal Component
  const PostDetailsModal = () => {
    if (!selectedPost) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          {/* Modal Header */}
          <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-800">Worker Post Details</h2>
            <button
              onClick={() => setShowDetailsModal(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Modal Content */}
          <div className="p-6">
            {/* Post Status & Actions */}
            <div className="flex justify-between items-center mb-6 pb-4 border-b">
              <StatusBadge status={selectedPost.status} />
              <div className="flex space-x-2">
                <button
                  onClick={() => togglePostStatus(selectedPost._id, selectedPost.status)}
                  disabled={actionLoading}
                  className={`px-4 py-2 rounded-lg flex items-center space-x-2 ${
                    selectedPost.status === 'active'
                      ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                      : 'bg-green-600 hover:bg-green-700 text-white'
                  } disabled:opacity-50`}
                >
                  {selectedPost.status === 'active' ? (
                    <>
                      <Ban className="w-4 h-4" />
                      <span>Block</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      <span>Unblock</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => deletePost(selectedPost._id)}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center space-x-2 disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete</span>
                </button>
              </div>
            </div>

            {/* Post Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column - Post Details */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Post Information</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500">Title</p>
                    <p className="text-base font-medium text-gray-900">{selectedPost.title}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-500">Description</p>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedPost.description}</p>
                  </div>
                  
                  {selectedPost.skills && (
                    <div>
                      <p className="text-sm text-gray-500">Skills</p>
                      <p className="text-sm text-gray-700">{selectedPost.skills}</p>
                    </div>
                  )}
                  
                  {selectedPost.availability && (
                    <InfoItem 
                      icon={Calendar} 
                      label="Availability" 
                      value={selectedPost.availability} 
                    />
                  )}
                  
                  {selectedPost.expectedSalary && (
                    <InfoItem 
                      icon={DollarSign} 
                      label="Expected Salary" 
                      value={selectedPost.expectedSalary} 
                    />
                  )}
                  
                  <div>
                    <p className="text-sm text-gray-500">Posted On</p>
                    <p className="text-sm text-gray-700">
                      {new Date(selectedPost.createdAt).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Right Column - Worker Details */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Worker Information</h3>
                {selectedPost.worker ? (
                  <div className="space-y-3">
                    <InfoItem 
                      icon={User} 
                      label="Name" 
                      value={selectedPost.worker.name} 
                    />
                    <InfoItem 
                      icon={Mail} 
                      label="Email" 
                      value={selectedPost.worker.email} 
                    />
                    <InfoItem 
                      icon={Phone} 
                      label="Phone" 
                      value={selectedPost.worker.phone} 
                    />
                    <InfoItem 
                      icon={Briefcase} 
                      label="Work Type" 
                      value={selectedPost.worker.workType} 
                    />
                    <InfoItem 
                      icon={MapPin} 
                      label="Location" 
                      value={selectedPost.worker.location} 
                    />
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Worker information not available</p>
                )}
              </div>
            </div>

            {/* Post Images */}
            {selectedPost.images && selectedPost.images.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <ImageIcon className="w-5 h-5 mr-2" />
                  Post Images ({selectedPost.images.length})
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {selectedPost.images.map((img, index) => (
                    <div key={index} className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                      <img
                        src={img}
                        alt={`Post image ${index + 1}`}
                        className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
                        onClick={() => window.open(img, '_blank')}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Worker Post Management</h1>
        <p className="text-gray-600 mt-1">View and manage worker posts</p>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by title, description, or skills..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Blocked</option>
          </select>
          
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Search
          </button>
        </form>
      </div>

      {/* Stats */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex items-center justify-between">
          <p className="text-gray-600">
            Total Posts: <span className="font-semibold text-gray-800">{totalPosts}</span>
          </p>
          <p className="text-sm text-gray-500">
            Page {currentPage} of {totalPages}
          </p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Posts Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No worker posts found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Worker</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Skills</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Posted Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {posts.map((post) => (
                  <tr key={post._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{post.title}</div>
                      <div className="text-sm text-gray-500 truncate max-w-xs">{post.description}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{post.worker?.name || 'N/A'}</div>
                      <div className="text-sm text-gray-500">{post.worker?.email || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500">{post.skills || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={post.status} />
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(post.createdAt).toLocaleDateString('en-IN')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => viewPostDetails(post._id)}
                          className="text-blue-600 hover:text-blue-800"
                          title="View Details"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => togglePostStatus(post._id, post.status)}
                          className={post.status === 'active' ? 'text-yellow-600 hover:text-yellow-800' : 'text-green-600 hover:text-green-800'}
                          title={post.status === 'active' ? 'Block' : 'Unblock'}
                        >
                          {post.status === 'active' ? <Ban className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
                        </button>
                        <button
                          onClick={() => deletePost(post._id)}
                          className="text-red-600 hover:text-red-800"
                          title="Delete"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex justify-center items-center space-x-2">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          
          <div className="flex space-x-1">
            {[...Array(totalPages)].map((_, index) => (
              <button
                key={index + 1}
                onClick={() => setCurrentPage(index + 1)}
                className={`px-4 py-2 rounded-lg ${
                  currentPage === index + 1
                    ? 'bg-blue-600 text-white'
                    : 'border hover:bg-gray-50'
                }`}
              >
                {index + 1}
              </button>
            ))}
          </div>
          
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}

      {/* Modals */}
      {showDetailsModal && <PostDetailsModal />}
    </div>
  );
};

export default WorkerPostManagement;
