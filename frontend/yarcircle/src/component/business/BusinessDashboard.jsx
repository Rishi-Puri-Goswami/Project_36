import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Filter, Star, MapPin, SlidersHorizontal, X } from 'lucide-react';
import { isBusinessAuthenticated, getBusinessToken, clearBusinessToken } from '../../utils/businessAuth';
import { API_URL } from '../../config/api';

const BusinessDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [businesses, setBusinesses] = useState([]);
  const [allBusinesses, setAllBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    businessType: '',
    district: '',
    state: '',
    village: '',
    minRating: '',
    isVerified: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });
  const [filterOptions, setFilterOptions] = useState({
    states: [],
    districts: [],
    villages: []
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0
  });

  useEffect(() => {
    if (!isBusinessAuthenticated()) {
      navigate('/business/login');
      return;
    }
    fetchProfile();
    fetchFilterOptions();
    fetchAllBusinesses();
  }, [navigate]);

  useEffect(() => {
    fetchAllBusinesses();
  }, [filters]);

  const fetchProfile = async () => {
    try {
      const response = await fetch(`${API_URL}/business/profile`, {
        headers: {
          'Authorization': `Bearer ${getBusinessToken()}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const fetchFilterOptions = async () => {
    try {
      const response = await fetch(`${API_URL}/business/filter-options`);
      const data = await response.json();
      
      if (response.ok) {
        setFilterOptions(data.filters);
      }
    } catch (error) {
      console.error('Error fetching filter options:', error);
    }
  };

  const fetchAllBusinesses = async (page = 1) => {
    setLoading(true);
    try {
      let url = `${API_URL}/business/all?page=${page}&limit=12`;
      
      if (filters.businessType) url += `&businessType=${encodeURIComponent(filters.businessType)}`;
      if (filters.district) url += `&district=${encodeURIComponent(filters.district)}`;
      if (filters.state) url += `&state=${encodeURIComponent(filters.state)}`;
      if (filters.village) url += `&village=${encodeURIComponent(filters.village)}`;
      if (filters.minRating) url += `&minRating=${filters.minRating}`;
      if (filters.isVerified) url += `&isVerified=${filters.isVerified}`;
      if (filters.sortBy) url += `&sortBy=${filters.sortBy}&sortOrder=${filters.sortOrder}`;

      const response = await fetch(url);
      const data = await response.json();

      if (response.ok) {
        setAllBusinesses(data.businesses);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Error fetching businesses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      businessType: '',
      district: '',
      state: '',
      village: '',
      minRating: '',
      isVerified: '',
      sortBy: 'createdAt',
      sortOrder: 'desc'
    });
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      fetchAllBusinesses();
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/business/search?query=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();

      if (response.ok) {
        setAllBusinesses(data.businesses);
        setPagination({
          currentPage: data.page,
          totalPages: data.totalPages,
          totalItems: data.total
        });
      }
    } catch (error) {
      console.error('Error searching:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    clearBusinessToken();
    localStorage.removeItem('businessUser');
    navigate('/');
  };

  const businessTypes = [
    'Retail Store', 'Restaurant', 'Grocery Store', 'Electronics Shop',
    'Clothing Store', 'Hardware Store', 'Medical Store/Pharmacy',
    'Beauty Salon/Parlour', 'Mobile Shop', 'Furniture Store', 'Bakery',
    'Stationery Shop', 'Jewellery Store', 'Auto Parts Shop', 'Sports Shop',
    'Book Store', 'Pet Shop', 'Flower Shop', 'General Store', 'Service Center', 'Other'
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link to="/business/dashboard" className="text-2xl font-bold text-purple-600">
              YaarCircle Business
            </Link>

            {/* Search Bar */}
            <div className="hidden md:flex flex-1 max-w-xl mx-8">
              <div className="relative w-full">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Search businesses, shops, stores..."
                  className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <button
                  onClick={handleSearch}
                  className="absolute right-2 top-1 bg-purple-600 text-white px-4 py-1.5 rounded-lg text-sm hover:bg-purple-700"
                >
                  Search
                </button>
              </div>
            </div>

            {/* Profile Menu */}
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg transition-colors"
              >
                <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
                  {user?.profilePicture ? (
                    <img src={user.profilePicture} alt={user.fullName || 'Profile'} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-purple-600 flex items-center justify-center">
                      <span className="text-white font-semibold text-sm">
                        {user?.fullName?.charAt(0)?.toUpperCase() || 'B'}
                      </span>
                    </div>
                  )}
                </div>
                <span className="hidden md:block font-medium text-gray-700">
                  {user?.fullName?.split(' ')[0] || 'Account'}
                </span>
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown Menu */}
              {showMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-100 py-2 z-50">
                  <div className="px-4 py-2 border-b">
                    <p className="font-semibold text-gray-800">{user?.fullName}</p>
                    <p className="text-sm text-gray-500">{user?.phone}</p>
                  </div>
                  
                  <Link
                    to="/business/profile"
                    className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 text-gray-700"
                    onClick={() => setShowMenu(false)}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    My Profile
                  </Link>

                  <Link
                    to="/business/my-listings"
                    className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 text-gray-700"
                    onClick={() => setShowMenu(false)}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    My Businesses
                  </Link>

                  <Link
                    to="/business/add"
                    className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 text-purple-600 font-medium"
                    onClick={() => setShowMenu(false)}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    List Your Shop/Business
                  </Link>

                  <div className="border-t mt-2 pt-2">
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 text-red-600 w-full"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Search */}
          <div className="md:hidden mt-3">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Search businesses..."
                className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
              <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>
      </nav>

      {/* Filters */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          {/* Filter Toggle Button */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <SlidersHorizontal size={20} />
              <span className="font-medium">Filters</span>
              {Object.values(filters).filter(v => v && v !== 'createdAt' && v !== 'desc').length > 0 && (
                <span className="bg-purple-600 text-white text-xs px-2 py-0.5 rounded-full">
                  {Object.values(filters).filter(v => v && v !== 'createdAt' && v !== 'desc').length}
                </span>
              )}
            </button>
            
            {Object.values(filters).filter(v => v && v !== 'createdAt' && v !== 'desc').length > 0 && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 text-sm text-red-600 hover:text-red-700"
              >
                <X size={16} />
                Clear All
              </button>
            )}
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 pb-4">
              {/* Business Type */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Business Type</label>
                <select
                  value={filters.businessType}
                  onChange={(e) => handleFilterChange('businessType', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">All Types</option>
                  {businessTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              {/* State */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">State</label>
                <select
                  value={filters.state}
                  onChange={(e) => handleFilterChange('state', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">All States</option>
                  {filterOptions.states.map(state => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
              </div>

              {/* District */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">District</label>
                <select
                  value={filters.district}
                  onChange={(e) => handleFilterChange('district', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">All Districts</option>
                  {filterOptions.districts.map(district => (
                    <option key={district} value={district}>{district}</option>
                  ))}
                </select>
              </div>

              {/* Village */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Village/City</label>
                <select
                  value={filters.village}
                  onChange={(e) => handleFilterChange('village', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">All Locations</option>
                  {filterOptions.villages.map(village => (
                    <option key={village} value={village}>{village}</option>
                  ))}
                </select>
              </div>

              {/* Rating Filter */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Minimum Rating</label>
                <select
                  value={filters.minRating}
                  onChange={(e) => handleFilterChange('minRating', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Any Rating</option>
                  <option value="4">4+ Stars</option>
                  <option value="3">3+ Stars</option>
                  <option value="2">2+ Stars</option>
                  <option value="1">1+ Stars</option>
                </select>
              </div>

              {/* Verified Filter */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Verification</label>
                <select
                  value={filters.isVerified}
                  onChange={(e) => handleFilterChange('isVerified', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">All Businesses</option>
                  <option value="true">Verified Only</option>
                  <option value="false">Not Verified</option>
                </select>
              </div>

              {/* Sort By */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Sort By</label>
                <select
                  value={filters.sortBy}
                  onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
                >
                  <option value="createdAt">Newest First</option>
                  <option value="rating">Highest Rated</option>
                  <option value="reviews">Most Reviewed</option>
                  <option value="views">Most Viewed</option>
                </select>
              </div>

              {/* Sort Order */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Order</label>
                <select
                  value={filters.sortOrder}
                  onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
                >
                  <option value="desc">Descending</option>
                  <option value="asc">Ascending</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Quick Action */}
        <div className="rounded-xl p-6 mb-8 text-white" style={{ backgroundColor: '#9333ea' }}>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold">List Your Business Today!</h2>
              <p className="text-gray-100 mt-1">Reach thousands of potential customers in your area</p>
            </div>
            <Link
              to="/business/add"
              className="bg-white text-[#9333ea] px-6 py-3 rounded-lg font-semibold hover:opacity-95 transition-colors inline-flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Your Business
            </Link>
          </div>
        </div>

        {/* Results Count */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">
            {pagination.totalItems > 0 
              ? `${pagination.totalItems} Businesses Found`
              : 'All Businesses'
            }
          </h3>
        </div>

        {/* Business Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          </div>
        ) : allBusinesses.length === 0 ? (
          <div className="text-center py-20">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <h3 className="text-xl font-semibold text-gray-600">No businesses found</h3>
            <p className="text-gray-500 mt-2">Be the first to list your business!</p>
            <Link
              to="/business/add"
              className="inline-block mt-4 bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700"
            >
              List Your Business
            </Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {allBusinesses.map((business) => (
                <Link
                  key={business._id}
                  to={`/business/view/${business._id}`}
                  className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-shadow overflow-hidden group"
                >
                  {/* Business Image */}
                  <div className="h-40 bg-gray-200 relative overflow-hidden">
                    {business.businessImages && business.businessImages[0] ? (
                      <img
                        src={business.businessImages[0]}
                        alt={business.businessName}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-100 to-indigo-100">
                        <svg className="w-12 h-12 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </div>
                    )}
                    {business.isVerified && (
                      <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs flex items-center gap-1">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Verified
                      </div>
                    )}
                  </div>

                  {/* Business Info */}
                  <div className="p-4">
                    <span className="inline-block bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded-full mb-2">
                      {business.businessType}
                    </span>
                    <h4 className="font-semibold text-gray-800 mb-1 truncate">
                      {business.businessName}
                    </h4>
                    <p className="text-sm text-gray-500 mb-2 line-clamp-2">
                      {business.description}
                    </p>
                    
                    {/* Rating */}
                    {business.averageRating > 0 && (
                      <div className="flex items-center gap-1 mb-2">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-semibold text-gray-800">{business.averageRating.toFixed(1)}</span>
                        <span className="text-sm text-gray-500">({business.totalReviews})</span>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <MapPin className="w-4 h-4" />
                      <span className="truncate">{business.village}, {business.district}</span>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>{business.openingTime} - {business.closingTime}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-8">
                <button
                  onClick={() => fetchAllBusinesses(pagination.currentPage - 1)}
                  disabled={!pagination.hasPrevPage}
                  className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Previous
                </button>
                
                <span className="px-4 py-2 text-gray-600">
                  Page {pagination.currentPage} of {pagination.totalPages}
                </span>

                <button
                  onClick={() => fetchAllBusinesses(pagination.currentPage + 1)}
                  disabled={!pagination.hasNextPage}
                  className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default BusinessDashboard;
