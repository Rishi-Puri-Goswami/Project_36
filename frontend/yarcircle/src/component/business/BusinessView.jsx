import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Star, MapPin, Clock, Phone, Mail, User, Eye, Tag, X, ChevronLeft, ChevronRight, Plus, Minus } from 'lucide-react';
import { getBusinessToken } from '../../utils/businessAuth';
import { API_URL } from '../../config/api';
import { useBusiness } from '../../context/BusinessContext';
import ReviewForm from './ReviewForm';

const BusinessView = () => {
  const navigate = useNavigate();
  const { businessId } = useParams();
  const { user: businessUser, isAuthenticated } = useBusiness();
  const [business, setBusiness] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeImage, setActiveImage] = useState(0);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [userReview, setUserReview] = useState(null);
  const [reviewsPage, setReviewsPage] = useState(1);
  const [totalReviewPages, setTotalReviewPages] = useState(1);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImage, setLightboxImage] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStart = React.useRef({ x: 0, y: 0, offsetX: 0, offsetY: 0 });
  const touchStartX = React.useRef(null);
  const touchLocked = React.useRef(false);

  useEffect(() => {
    fetchBusiness();
    fetchReviews();
  }, [businessId]);

  // Refetch when user authentication changes
  useEffect(() => {
    if (isAuthenticated && businessUser?._id) {
      fetchBusiness();
    }
  }, [isAuthenticated, businessUser?._id]);

  const fetchBusiness = async () => {
    try {
      const token = getBusinessToken();
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

      const response = await fetch(`${API_URL}/business/${businessId}`, { headers });
      const data = await response.json();

      if (response.ok) {
        setBusiness(data.business);
        // Check if user has already reviewed
        if (isAuthenticated && businessUser?._id && data.business.reviews) {
          const existing = data.business.reviews.find(
            r => {
              const reviewerId = r.reviewer?._id || r.reviewer;
              const userId = businessUser._id;
              return reviewerId?.toString() === userId?.toString();
            }
          );
          setUserReview(existing || null);
        } else if (!isAuthenticated) {
          setUserReview(null);
        }
      } else {
        setError(data.message || 'Business not found');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async (page = 1) => {
    try {
      const response = await fetch(`${API_URL}/business/${businessId}/reviews?page=${page}&limit=5`);
      const data = await response.json();

      if (response.ok) {
        setReviews(data.reviews);
        setTotalReviewPages(data.totalPages);
        setReviewsPage(page);
      }
    } catch (err) {
      console.error('Error fetching reviews:', err);
    }
  };

  const handleReviewAdded = async (data) => {
    setShowReviewForm(false);
    // Refetch business data to get the complete review with _id
    await fetchBusiness();
    await fetchReviews();
  };

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm('Are you sure you want to delete this review?')) return;

    try {
      const response = await fetch(`${API_URL}/business/${businessId}/reviews/${reviewId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${getBusinessToken()}`
        }
      });

      const data = await response.json();

      if (response.ok) {
        setUserReview(null);
        fetchBusiness();
        fetchReviews();
        alert('Review deleted successfully');
      } else {
        alert(data.message || 'Failed to delete review');
      }
    } catch (err) {
      console.error('Error deleting review:', err);
      alert('Error deleting review. Please try again.');
    }
  };

  const renderStars = (rating) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={16}
            className={star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
          />
        ))}
      </div>
    );
  };

  const handleCall = () => {
    window.location.href = `tel:${business.contactPhone}`;
  };

  const openLightbox = (img) => {
    setLightboxImage(img);
    setZoom(1);
    setOffset({ x: 0, y: 0 });
    setLightboxOpen(true);
    // lock scroll
    document.body.style.overflow = 'hidden';
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
    setLightboxImage(null);
    setZoom(1);
    setOffset({ x: 0, y: 0 });
    document.body.style.overflow = '';
  };

  const zoomIn = () => setZoom(z => Math.min(4, +(z + 0.25).toFixed(2)));
  const zoomOut = () => {
    setZoom(z => {
      const next = +(z - 0.25).toFixed(2);
      if (next <= 1) {
        setOffset({ x: 0, y: 0 });
        return 1;
      }
      return Math.max(1, next);
    });
  };

  const handleWheel = (e) => {
    if (!lightboxOpen) return;
    e.preventDefault();
    const delta = -e.deltaY || e.wheelDelta;
    if (delta > 0) zoomIn(); else zoomOut();
  };

  const handleMouseDown = (e) => {
    if (zoom <= 1) return;
    setIsPanning(true);
    panStart.current = {
      x: e.clientX,
      y: e.clientY,
      offsetX: offset.x,
      offsetY: offset.y
    };
  };

  const handleMouseMove = (e) => {
    if (!isPanning) return;
    const dx = e.clientX - panStart.current.x;
    const dy = e.clientY - panStart.current.y;
    setOffset({ x: panStart.current.offsetX + dx, y: panStart.current.offsetY + dy });
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  const handleDoubleClick = () => {
    if (zoom === 1) setZoom(2); else { setZoom(1); setOffset({ x: 0, y: 0 }); }
  };

  const currentImageIndex = () => {
    if (!business?.businessImages || !lightboxImage) return -1;
    return business.businessImages.findIndex(i => i === lightboxImage);
  };

  const showPrev = () => {
    const idx = currentImageIndex();
    if (idx <= 0) return;
    const prev = business.businessImages[idx - 1];
    setLightboxImage(prev);
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  };

  const showNext = () => {
    const idx = currentImageIndex();
    if (idx === -1) return;
    if (idx >= business.businessImages.length - 1) return;
    const next = business.businessImages[idx + 1];
    setLightboxImage(next);
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  };

  const onTouchStart = (e) => {
    if (!e.touches || e.touches.length === 0) return;
    touchStartX.current = e.touches[0].clientX;
    touchLocked.current = false;
  };

  const onTouchMove = (e) => {
    if (!touchStartX.current || touchLocked.current) return;
    const currentX = e.touches[0].clientX;
    const dx = currentX - touchStartX.current;
    if (Math.abs(dx) > 40) {
      touchLocked.current = true;
      if (dx > 0) showPrev(); else showNext();
    }
  };

  const onTouchEnd = () => {
    touchStartX.current = null;
    touchLocked.current = false;
  };

  const handleWhatsApp = () => {
    const number = business.whatsappNumber || business.contactPhone;
    const message = encodeURIComponent(`Hi, I found your business "${business.businessName}" on YaarCircle.`);
    window.open(`https://wa.me/91${number}?text=${message}`, '_blank');
  };

  // close on escape
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape' && lightboxOpen) closeLightbox();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightboxOpen]);

  // keyboard navigation for images
  useEffect(() => {
    const onKeyNav = (e) => {
      if (!lightboxOpen) return;
      if (e.key === 'ArrowLeft') showPrev();
      if (e.key === 'ArrowRight') showNext();
    };
    window.addEventListener('keydown', onKeyNav);
    return () => window.removeEventListener('keydown', onKeyNav);
  }, [lightboxOpen, business, lightboxImage]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-xl font-semibold text-gray-600">{error}</h3>
          <button
            onClick={() => navigate(-1)}
            className="mt-4 text-purple-600 hover:text-purple-800"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="text-gray-600 hover:text-gray-800"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <h1 className="text-lg font-semibold text-gray-800 truncate">
            {business.businessName}
          </h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto pb-24">
        {/* Images */}
        <div className="bg-gray-200">
          {business.businessImages && business.businessImages.length > 0 ? (
            <div>
              <div className="h-64 md:h-80">
                <img
                  src={business.businessImages[activeImage]}
                  alt={business.businessName}
                  className="w-full h-full object-cover cursor-zoom-in"
                  onClick={() => openLightbox(business.businessImages[activeImage])}
                />
              </div>
              {business.businessImages.length > 1 && (
                <div className="flex gap-2 p-2 overflow-x-auto bg-white">
                  {business.businessImages.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImage(idx)}
                      className={`w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden border-2 ${
                        activeImage === idx ? 'border-purple-600' : 'border-transparent'
                      }`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center bg-gradient-to-br from-purple-100 to-indigo-100">
              <svg className="w-16 h-16 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="bg-white p-6">
          {/* Title & Type */}
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-purple-100 text-purple-700 text-sm px-3 py-1 rounded-full">
                  {business.businessType}
                </span>
                {business.isVerified && (
                  <span className="bg-green-100 text-green-700 text-sm px-3 py-1 rounded-full flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Verified
                  </span>
                )}
              </div>
              <h1 className="text-2xl font-bold text-gray-800">
                {business.businessName}
              </h1>
            </div>
          </div>

          {/* Description */}
          <p className="text-gray-600 mt-4 leading-relaxed">
            {business.description}
          </p>

          {/* Details Section */}
          <div className="mt-6 space-y-4">
            {/* Address */}
            <div className="border-t pt-4">
              <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gray-600" />
                Address
              </h3>
              <p className="text-gray-600">
                {business.shopAddress}
                {business.landmark && `, ${business.landmark}`}
              </p>
              <p className="text-gray-600">
                {business.village}, {business.district}, {business.state} - {business.pincode}
              </p>
            </div>

            {/* Timing */}
            <div className="border-t pt-4">
              <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-600" />
                Business Hours
              </h3>
              <p className="text-gray-600">
                {business.openingTime} - {business.closingTime}
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                {business.workingDays?.map(day => (
                  <span key={day} className="bg-gray-100 text-gray-600 text-sm px-2 py-1 rounded">
                    {day.substring(0, 3)}
                  </span>
                ))}
              </div>
            </div>

            {/* Contact */}
            <div className="border-t pt-4">
              <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                <Phone className="w-4 h-4 text-gray-600" />
                Contact
              </h3>
              <p className="text-gray-600">Phone: {business.contactPhone}</p>
              {business.contactEmail && (
                <p className="text-gray-600">Email: {business.contactEmail}</p>
              )}
              {business.whatsappNumber && (
                <p className="text-gray-600">WhatsApp: {business.whatsappNumber}</p>
              )}
            </div>

            {/* Owner */}
            {business.owner && (
              <div className="border-t pt-4">
                <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-600" />
                  Owner
                </h3>
                <p className="text-gray-600">{business.owner.fullName}</p>
              </div>
            )}

            {/* Tags */}
            {business.tags && business.tags.length > 0 && (
              <div className="border-t pt-4">
                  <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                    <Tag className="w-4 h-4 text-gray-600" />
                    Tags
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {business.tags.map((tag, idx) => (
                      <span key={idx} className="bg-purple-50 text-purple-600 text-sm px-3 py-1 rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
            )}

            {/* Stats */}
            <div className="border-t pt-4">
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  {business.viewCount} views
                </div>
                {business.averageRating > 0 && (
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    {business.averageRating.toFixed(1)} ({business.totalReviews} reviews)
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Lightbox / Modal for image zoom */}
        {lightboxOpen && (
          <div
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
            onWheel={handleWheel}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            role="dialog"
            aria-modal="true"
          >
            <div className="relative max-w-5xl w-full max-h-full">
              <button
                onClick={closeLightbox}
                className="absolute top-3 right-3 bg-white/90 hover:bg-white rounded-full p-2 shadow z-30"
                aria-label="Close"
              >
                <X className="w-5 h-5 text-gray-800" />
              </button>

              <div className="absolute top-3 left-3 z-30 flex gap-2 items-center">
                <button onClick={zoomOut} className="bg-white/90 hover:bg-white rounded-full p-2 shadow" title="Zoom out">
                  <Minus className="w-4 h-4 text-gray-800" />
                </button>
                <div className="text-sm bg-white/70 px-2 py-1 rounded shadow text-gray-800">{zoom}x</div>
                <button onClick={zoomIn} className="bg-white/90 hover:bg-white rounded-full p-2 shadow" title="Zoom in">
                  <Plus className="w-4 h-4 text-gray-800" />
                </button>
                <button onClick={() => { setZoom(1); setOffset({ x: 0, y: 0 }); }} className="bg-white/90 hover:bg-white rounded-full p-2 shadow" title="Reset">
                  Reset
                </button>
              </div>

              <div
                className="flex items-center justify-center overflow-hidden bg-black/0 cursor-grab relative"
                style={{ width: '100%', height: '80vh' }}
                onMouseDown={handleMouseDown}
                onDoubleClick={handleDoubleClick}
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
              >
                {/* prev/next buttons */}
                <button
                  onClick={showPrev}
                  className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 z-30 shadow"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="w-6 h-6 text-gray-800" />
                </button>
                <button
                  onClick={showNext}
                  className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 z-30 shadow"
                  aria-label="Next image"
                >
                  <ChevronRight className="w-6 h-6 text-gray-800" />
                </button>

                <img
                  src={lightboxImage}
                  alt="Preview"
                  draggable={false}
                  style={{
                    transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
                    transition: isPanning ? 'none' : 'transform 0.12s ease-out',
                    maxWidth: '100%',
                    maxHeight: '100%'
                  }}
                  className={isPanning ? 'cursor-grabbing select-none' : 'select-none'}
                />

                {/* bottom caption / counter */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 bg-black/50 text-white text-sm px-3 py-1 rounded">
                  {business?.businessImages ? `${currentImageIndex() + 1} / ${business.businessImages.length}` : ''}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Reviews Section */}
        <div className="bg-white mt-4 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-800">
              Reviews & Ratings
              {business.totalReviews > 0 && (
                <span className="ml-2 text-sm font-normal text-gray-500">
                  ({business.totalReviews})
                </span>
              )}
            </h2>
            {isAuthenticated && !userReview && (
              <button
                onClick={() => setShowReviewForm(!showReviewForm)}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm"
              >
                Write Review
              </button>
            )}
          </div>

          {/* Average Rating Display */}
          {business.averageRating > 0 && (
            <div className="bg-yellow-50 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className="text-4xl font-bold text-gray-800">
                    {business.averageRating.toFixed(1)}
                  </div>
                  <div className="flex gap-1 mt-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        size={20}
                        className={star <= Math.round(business.averageRating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
                      />
                    ))}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    {business.totalReviews} {business.totalReviews === 1 ? 'review' : 'reviews'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Review Form */}
          {showReviewForm && isAuthenticated && (
            <div className="mb-6">
              <ReviewForm
                businessId={businessId}
                onReviewAdded={handleReviewAdded}
                onClose={() => setShowReviewForm(false)}
                existingReview={userReview}
              />
            </div>
          )}

          {/* All Reviews */}
          <div className="space-y-4">
            {reviews.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Star className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>No reviews yet. Be the first to review!</p>
              </div>
            ) : (
              reviews.map((review) => {
                // Check if this review belongs to the current user
                const reviewerId = review.reviewer?._id || review.reviewer;
                const userId = businessUser?._id;
                const isUserReview = isAuthenticated && userId && 
                  reviewerId?.toString() === userId?.toString();

                // Debug logging
                if (isAuthenticated) {
                  console.log('Review check:', {
                    reviewerName: review.reviewerName,
                    reviewerId: reviewerId?.toString(),
                    userId: userId?.toString(),
                    isMatch: isUserReview
                  });
                }

                return (
                  <div 
                    key={review._id} 
                    className={`border-b pb-4 last:border-b-0 relative ${
                      isUserReview ? 'bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4' : ''
                    }`}
                  >
                    {/* Edit and Delete buttons for user's own review */}
                    {isUserReview && (
                      <div className="absolute top-3 right-3 flex gap-2 z-10">
                        <button
                          onClick={() => setShowReviewForm(true)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors shadow-md"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteReview(review._id)}
                          className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors shadow-md"
                        >
                          Delete
                        </button>
                      </div>
                    )}

                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                        {review.reviewer?.profilePicture ? (
                          <img
                            src={review.reviewer.profilePicture}
                            alt={review.reviewerName}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <User className="w-6 h-6 text-gray-500" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1 pr-32">
                          <div>
                            <div className="font-semibold text-gray-800">
                              {review.reviewerName}
                              {isUserReview && <span className="ml-2 text-xs text-blue-600">(You)</span>}
                            </div>
                            {renderStars(review.rating)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(review.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                        <p className="text-gray-700 mb-2">{review.comment}</p>
                        {review.images && review.images.length > 0 && (
                          <div className="grid grid-cols-3 gap-2 mt-2">
                            {review.images.map((img, idx) => (
                              <img
                                key={idx}
                                src={img}
                                alt="Review"
                                className="w-full h-24 object-cover rounded-lg cursor-pointer hover:opacity-80"
                                onClick={() => window.open(img, '_blank')}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Pagination */}
          {totalReviewPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              <button
                onClick={() => fetchReviews(reviewsPage - 1)}
                disabled={reviewsPage === 1}
                className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="px-4 py-2">
                Page {reviewsPage} of {totalReviewPages}
              </span>
              <button
                onClick={() => fetchReviews(reviewsPage + 1)}
                disabled={reviewsPage === totalReviewPages}
                className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Fixed Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 z-50">
        <div className="max-w-4xl mx-auto flex gap-3">
          <button
            onClick={handleCall}
            className="flex-1 bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            Call
          </button>
          <button
            onClick={handleWhatsApp}
            className="flex-1 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            WhatsApp
          </button>
        </div>
      </div>
    </div>
  );
};

export default BusinessView;
