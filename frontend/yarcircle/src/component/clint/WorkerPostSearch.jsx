import { useState, useEffect } from 'react';
import { Search, MapPin, Briefcase, X, Lock, Unlock, Star, Clock, DollarSign, Image as ImageIcon } from 'lucide-react';
import axios from 'axios';
import { API_URL } from '../../config/api';

const WorkerPostSearch = () => {
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [workTypeFilter, setWorkTypeFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('');
  const [creditsRemaining, setCreditsRemaining] = useState(null);
  
  // Selected worker and post for modal
  const [selectedPost, setSelectedPost] = useState(null);
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [unlocking, setUnlocking] = useState(false);

  // Fetch workers with posts
  const fetchWorkersWithPosts = async () => {
    try {
      setLoading(true);
      setError('');

      const token = localStorage.getItem('clientToken');
      const params = new URLSearchParams();
      
      if (searchTerm) params.append('search', searchTerm);
      if (workTypeFilter && workTypeFilter !== 'all') params.append('workType', workTypeFilter);
      if (locationFilter) params.append('location', locationFilter);

      const response = await axios.get(
        `${API_URL}/clients/workers/with-posts?${params.toString()}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setWorkers(response.data.workers || []);
      console.log('Workers with posts:', response.data);
    } catch (err) {
      console.error('Error fetching workers:', err);
      setError(err.response?.data?.error || 'Failed to fetch workers');
    } finally {
      setLoading(false);
    }
  };

  // Fetch subscription status to get credits
  const fetchCredits = async () => {
    try {
      const token = localStorage.getItem('clientToken');
      const response = await axios.get(`${API_URL}/clients/subscription/status`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setCreditsRemaining(response.data.subscription?.creditsRemaining || 0);
    } catch (err) {
      console.error('Error fetching credits:', err);
    }
  };

  useEffect(() => {
    fetchWorkersWithPosts();
    fetchCredits();
  }, []);

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    fetchWorkersWithPosts();
  };

  // Open post modal
  const openPostModal = (worker, post) => {
    setSelectedWorker(worker);
    setSelectedPost(post);
    setShowModal(true);
  };

  // Close modal
  const closeModal = () => {
    setShowModal(false);
    setSelectedPost(null);
    setSelectedWorker(null);
  };

  // Unlock worker post
  const unlockPost = async (postId) => {
    if (creditsRemaining <= 0) {
      alert('You have no credits left! Please purchase more credits to view worker posts.');
      return;
    }

    if (!confirm('This will deduct 1 credit from your account. Continue?')) {
      return;
    }

    try {
      setUnlocking(true);
      const token = localStorage.getItem('clientToken');
      
      const response = await axios.post(
        `${API_URL}/clients/worker-posts/unlock/${postId}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      // Update the post with full details
      setSelectedPost(response.data.post);
      
      // Update credits
      setCreditsRemaining(response.data.subscription.creditsRemaining);

      // Refresh the worker list to update unlock status
      fetchWorkersWithPosts();

      if (response.data.creditDeducted) {
        alert(`Post unlocked! 1 credit deducted. ${response.data.subscription.creditsRemaining} credits remaining.`);
      } else {
        alert('Post already unlocked - no credit charged!');
      }
    } catch (err) {
      console.error('Error unlocking post:', err);
      alert(err.response?.data?.message || 'Failed to unlock post');
    } finally {
      setUnlocking(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Worker Posts</h1>
              <p className="text-gray-600 mt-1">Browse worker profiles and their project posts</p>
            </div>
            <div className="bg-blue-50 px-6 py-3 rounded-lg">
              <p className="text-sm text-gray-600">Credits Remaining</p>
              <p className="text-2xl font-bold text-blue-600">{creditsRemaining ?? '...'}</p>
            </div>
          </div>

          {/* Search and Filters */}
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search Input */}
              <div className="relative">
                <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search workers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Work Type Filter */}
              <div className="relative">
                <Briefcase className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <select
                  value={workTypeFilter}
                  onChange={(e) => setWorkTypeFilter(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                >
                  <option value="all">All Work Types</option>
                  <option value="Plumber">Plumber</option>
                  <option value="Electrician">Electrician</option>
                  <option value="Carpenter">Carpenter</option>
                  <option value="Painter">Painter</option>
                  <option value="Mason">Mason</option>
                  <option value="Cleaner">Cleaner</option>
                  <option value="Driver">Driver</option>
                  <option value="Helper">Helper</option>
                </select>
              </div>

              {/* Location Filter */}
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Location"
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full md:w-auto px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Search Workers
            </button>
          </form>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading workers...</p>
          </div>
        )}

        {/* Workers List */}
        {!loading && workers.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <Briefcase className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No worker posts found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || workTypeFilter !== 'all' || locationFilter 
                ? 'Try adjusting your search filters or search terms' 
                : 'Workers haven\'t created any posts yet'}
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4 text-left max-w-md mx-auto">
              <p className="text-sm text-gray-700 mb-2"><strong>Note:</strong> Worker posts appear here when workers:</p>
              <ul className="text-sm text-gray-600 space-y-1 ml-4 list-disc">
                <li>Create project posts from their dashboard</li>
                <li>Add images and descriptions of their work</li>
                <li>Set their posts to "active" status</li>
              </ul>
            </div>
          </div>
        )}

        {!loading && workers.length > 0 && (
          <div className="space-y-6">
            {workers.map((item) => (
              <div key={item.worker._id} className="bg-white rounded-lg shadow-sm overflow-hidden">
                {/* Worker Header */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 border-b">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      {/* Profile Picture */}
                      <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
                        {item.worker.profilePicture ? (
                          <img 
                            src={item.worker.profilePicture} 
                            alt={item.worker.name}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          item.worker.name.charAt(0).toUpperCase()
                        )}
                      </div>

                      {/* Worker Info */}
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900">{item.worker.name}</h2>
                        <div className="flex items-center space-x-4 mt-2 text-gray-600">
                          <div className="flex items-center">
                            <Briefcase className="h-4 w-4 mr-1" />
                            <span>{item.worker.workType}</span>
                          </div>
                          {item.worker.location && (
                            <div className="flex items-center">
                              <MapPin className="h-4 w-4 mr-1" />
                              <span>{item.worker.location}</span>
                            </div>
                          )}
                          {item.worker.yearsOfExperience && (
                            <div className="flex items-center">
                              <Star className="h-4 w-4 mr-1" />
                              <span>{item.worker.yearsOfExperience} years exp</span>
                            </div>
                          )}
                        </div>
                        {item.worker.bio && (
                          <p className="mt-2 text-gray-700 text-sm">{item.worker.bio}</p>
                        )}
                        {item.worker.skills && (
                          <p className="mt-1 text-sm text-gray-600">
                            <strong>Skills:</strong> {item.worker.skills}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Post Count Badge */}
                    <div className="bg-white px-4 py-2 rounded-lg shadow-sm">
                      <p className="text-sm text-gray-600">Posts</p>
                      <p className="text-2xl font-bold text-blue-600">{item.postCount}</p>
                    </div>
                  </div>
                </div>

                {/* Worker Posts */}
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Posts</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {item.posts.map((post) => (
                      <div
                        key={post._id}
                        onClick={() => openPostModal(item.worker, post)}
                        className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                      >
                        {/* Post Image Preview */}
                        <div className="relative h-48 bg-gray-100">
                          {post.previewImage ? (
                            <img
                              src={post.previewImage}
                              alt={post.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ImageIcon className="h-16 w-16 text-gray-400" />
                            </div>
                          )}
                          
                          {/* Lock/Unlock Badge */}
                          <div className={`absolute top-2 right-2 px-3 py-1 rounded-full text-xs font-semibold ${
                            post.isUnlocked 
                              ? 'bg-green-500 text-white' 
                              : 'bg-yellow-500 text-white'
                          }`}>
                            {post.isUnlocked ? (
                              <span className="flex items-center">
                                <Unlock className="h-3 w-3 mr-1" />
                                Unlocked
                              </span>
                            ) : (
                              <span className="flex items-center">
                                <Lock className="h-3 w-3 mr-1" />
                                1 Credit
                              </span>
                            )}
                          </div>

                          {/* Image Count */}
                          {post.imageCount > 0 && (
                            <div className="absolute bottom-2 left-2 bg-black bg-opacity-60 text-white px-2 py-1 rounded text-xs">
                              <ImageIcon className="h-3 w-3 inline mr-1" />
                              {post.imageCount} photos
                            </div>
                          )}
                        </div>

                        {/* Post Details */}
                        <div className="p-4">
                          <h4 className="font-semibold text-gray-900 mb-2">{post.title}</h4>
                          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                            {post.description}
                          </p>
                          
                          <div className="space-y-1 text-xs text-gray-500">
                            {post.expectedSalary && (
                              <div className="flex items-center">
                                <DollarSign className="h-3 w-3 mr-1" />
                                <span>{post.expectedSalary}</span>
                              </div>
                            )}
                            {post.availability && (
                              <div className="flex items-center">
                                <Clock className="h-3 w-3 mr-1" />
                                <span>{post.availability}</span>
                              </div>
                            )}
                          </div>

                          <button
                            className={`w-full mt-3 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                              post.isUnlocked
                                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                : 'bg-blue-600 text-white hover:bg-blue-700'
                            }`}
                          >
                            {post.isUnlocked ? 'View Details' : 'Unlock Post (1 Credit)'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Post Details Modal */}
      {showModal && selectedPost && selectedWorker && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">{selectedPost.title}</h2>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {/* Worker Info */}
              <div className="bg-blue-50 rounded-lg p-4 mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                    {selectedWorker.profilePicture ? (
                      <img 
                        src={selectedWorker.profilePicture} 
                        alt={selectedWorker.name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      selectedWorker.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{selectedWorker.name}</h3>
                    <p className="text-sm text-gray-600">{selectedWorker.workType}</p>
                  </div>
                </div>
              </div>

              {/* Post Images */}
              {selectedPost.isUnlocked && selectedPost.images && selectedPost.images.length > 0 ? (
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 mb-3">Project Photos</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {selectedPost.images.map((image, index) => (
                      <img
                        key={index}
                        src={image}
                        alt={`Post image ${index + 1}`}
                        className="w-full h-48 object-cover rounded-lg"
                      />
                    ))}
                  </div>
                </div>
              ) : !selectedPost.isUnlocked && (
                <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
                  <Lock className="h-12 w-12 text-yellow-600 mx-auto mb-3" />
                  <p className="text-gray-700 font-semibold mb-2">Unlock this post to view all {selectedPost.imageCount} photos</p>
                  <p className="text-sm text-gray-600 mb-4">This will deduct 1 credit from your account</p>
                  <button
                    onClick={() => unlockPost(selectedPost._id)}
                    disabled={unlocking || creditsRemaining <= 0}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {unlocking ? 'Unlocking...' : `Unlock Post (1 Credit)`}
                  </button>
                  {creditsRemaining <= 0 && (
                    <p className="mt-2 text-sm text-red-600">You have no credits left. Please purchase more.</p>
                  )}
                </div>
              )}

              {/* Post Description */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
                <p className="text-gray-700 whitespace-pre-wrap">{selectedPost.description}</p>
              </div>

              {/* Post Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {selectedPost.skills && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Skills</h4>
                    <p className="text-gray-700">{selectedPost.skills}</p>
                  </div>
                )}
                {selectedPost.availability && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Availability</h4>
                    <p className="text-gray-700">{selectedPost.availability}</p>
                  </div>
                )}
                {selectedPost.expectedSalary && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Expected Salary</h4>
                    <p className="text-gray-700">{selectedPost.expectedSalary}</p>
                  </div>
                )}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Posted</h4>
                  <p className="text-gray-700">{new Date(selectedPost.createdAt).toLocaleDateString()}</p>
                </div>
              </div>

              {/* Contact Worker Button (if unlocked) */}
              {selectedPost.isUnlocked && selectedWorker.phone && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Contact Worker</h4>
                  <p className="text-gray-700">
                    <strong>Phone:</strong> {selectedWorker.phone}
                  </p>
                  {selectedWorker.email && (
                    <p className="text-gray-700">
                      <strong>Email:</strong> {selectedWorker.email}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkerPostSearch;
