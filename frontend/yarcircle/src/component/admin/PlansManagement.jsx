import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { API_URL } from '../../config/api';
import { getAdminAuthHeader } from '../../utils/adminAuth';
import { Loader2, FileText, Users, CreditCard } from 'lucide-react';

// Simple currency formatter
const formatCurrency = (amount, currency = 'INR') => {
  try {
    const opts = { style: 'currency', currency, maximumFractionDigits: 2 };
    // Use Intl when available
    return new Intl.NumberFormat('en-IN', opts).format(amount);
  } catch (e) {
    return `${currency} ${amount}`;
  }
};

const PlansManagement = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modals & selected plan
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Edit form state
  const [form, setForm] = useState({
    planName: '',
    viewsAllowed: 0,
    priceAmount: 0,
    priceCurrency: 'INR',
    duration: 0,
    description: '',
    planType: ''
  });

  const [createForm, setCreateForm] = useState({
    planName: '',
    viewsAllowed: 0,
    priceAmount: 0,
    priceCurrency: 'INR',
    duration: 0,
    description: '',
    planType: ''
  });

  const [actionLoading, setActionLoading] = useState(false);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.get(`${API_URL}/admin/plans`, {
        headers: getAdminAuthHeader(),
      });
      setPlans(res.data.plans || []);
    } catch (err) {
      console.error('Error fetching plans:', err);
      setError(err.response?.data?.error || 'Failed to load plans');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const openView = (plan) => {
    setSelectedPlan(plan);
    setShowViewModal(true);
  };

  const openEdit = (plan) => {
    setSelectedPlan(plan);
    setForm({
      planName: plan.planName || '',
      viewsAllowed: plan.viewsAllowed ?? 0,
      priceAmount: plan.price?.amount ?? 0,
      priceCurrency: plan.price?.currency || 'INR',
      duration: plan.duration ?? 0,
      description: plan.description || '',
      planType: plan.planType || ''
    });
    setShowEditModal(true);
  };

  const openDelete = (plan) => {
    setSelectedPlan(plan);
    setShowDeleteModal(true);
  };

  const handleFormChange = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const handleUpdate = async () => {
    if (!selectedPlan) return;
    // basic validation
    if (!form.planName || isNaN(parseInt(form.viewsAllowed)) || isNaN(parseFloat(form.priceAmount))) {
      alert('Please provide valid plan name, views and price');
      return;
    }

    try {
      setActionLoading(true);
      const body = {
        planName: form.planName,
        viewsAllowed: parseInt(form.viewsAllowed),
        price: { amount: parseFloat(form.priceAmount), currency: form.priceCurrency },
        duration: parseInt(form.duration),
        description: form.description,
        planType: form.planType
      };

      await axios.put(`${API_URL}/admin/plans/${selectedPlan._id}`, body, {
        headers: getAdminAuthHeader()
      });

      setShowEditModal(false);
      setSelectedPlan(null);
      await fetchPlans();
    } catch (err) {
      console.error('Error updating plan:', err);
      alert(err.response?.data?.error || 'Failed to update plan');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedPlan) return;
    try {
      setActionLoading(true);
      await axios.delete(`${API_URL}/admin/plans/${selectedPlan._id}`, {
        headers: getAdminAuthHeader()
      });

      setShowDeleteModal(false);
      setSelectedPlan(null);
      await fetchPlans();
    } catch (err) {
      console.error('Error deleting plan:', err);
      alert(err.response?.data?.error || 'Failed to delete plan');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateFormChange = (key, value) => {
    setCreateForm(prev => ({ ...prev, [key]: value }));
  };

  const handleCreate = async () => {
    // basic validation
    if (!createForm.planName || isNaN(parseInt(createForm.viewsAllowed)) || isNaN(parseFloat(createForm.priceAmount))) {
      alert('Please provide valid plan name, views and price');
      return;
    }

    try {
      setActionLoading(true);
      const body = {
        planName: createForm.planName,
        viewsAllowed: parseInt(createForm.viewsAllowed),
        price: { amount: parseFloat(createForm.priceAmount), currency: createForm.priceCurrency },
        duration: parseInt(createForm.duration),
        description: createForm.description,
        planType: createForm.planType
      };

      await axios.post(`${API_URL}/admin/plans/create`, body, {
        headers: getAdminAuthHeader()
      });

      setShowCreateModal(false);
      setCreateForm({ planName: '', viewsAllowed: 0, priceAmount: 0, priceCurrency: 'INR', duration: 0, description: '', planType: '' });
      await fetchPlans();
    } catch (err) {
      console.error('Error creating plan:', err);
      alert(err.response?.data?.error || 'Failed to create plan');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="w-6 h-6 text-blue-600" />
            Subscription Plans
          </h2>
          <p className="text-gray-600 mt-1">View and manage subscription plans available to clients</p>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => setShowCreateModal(true)} className="px-4 py-2 bg-green-600 text-white rounded-lg">Create Plan</button>
        </div>
      </div>

      {loading && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading plans...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {plans.length === 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center col-span-full">
              <p className="text-gray-600">No plans found</p>
            </div>
          )}

          {plans.map((plan) => {
            const priceAmount = plan.price?.amount ?? 0;
            const currency = plan.price?.currency || 'INR';
            const views = plan.viewsAllowed ?? 0;
            const duration = plan.duration ?? 0;
            const purchases = plan.purchaseCount ?? 0;
            const activeSubs = plan.activeSubscriptions ?? 0;

            // Subtitle example: "₹1000 for 150 worker profile views - Premium pack"
            const subtitle = `${formatCurrency(priceAmount, currency)} for ${views} worker profile views${plan.planType ? ` - ${plan.planType}` : ''}`;

            return (
              <div key={plan._id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{plan.planName || `${views} Profile Views`}</h3>
                    <p className="text-sm text-gray-600 mt-1">{subtitle}</p>
                    <div className="mt-4">
                      <p className="text-3xl font-extrabold text-gray-900">{formatCurrency(priceAmount, currency)}</p>
                      <p className="text-xs text-gray-500">{currency}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-sm text-gray-500">{purchases} purchases</div>
                    <div className="text-sm text-gray-500">{activeSubs} active subscriptions</div>
                    <div className="mt-4 text-sm text-gray-600">Views Allowed</div>
                    <div className="text-xl font-semibold text-gray-900">{views}</div>
                    <div className="mt-2 text-sm text-gray-600">Duration</div>
                    <div className="text-sm font-medium text-gray-900">{duration} days</div>
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  <button onClick={() => openView(plan)} className="px-3 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium">View</button>
                  <button onClick={() => openEdit(plan)} className="px-3 py-2 bg-gray-50 text-gray-700 rounded-lg text-sm font-medium">Edit</button>
                  <button onClick={() => openDelete(plan)} className="px-3 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-medium ml-auto">Delete</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* View Modal */}
      {showViewModal && selectedPlan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">{selectedPlan.planName}</h3>
              <button onClick={() => setShowViewModal(false)} className="text-gray-600">Close</button>
            </div>
            <p className="text-sm text-gray-600 mb-4">{selectedPlan.description}</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500">Price</p>
                <p className="font-semibold">{formatCurrency(selectedPlan.price?.amount ?? 0, selectedPlan.price?.currency)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Views Allowed</p>
                <p className="font-semibold">{selectedPlan.viewsAllowed ?? 0}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Active Subscriptions</p>
                <p className="font-semibold">{selectedPlan.activeSubscriptions ?? 0}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Purchases</p>
                <p className="font-semibold">{selectedPlan.purchaseCount ?? 0}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedPlan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">Edit Plan</h3>
              <button onClick={() => setShowEditModal(false)} className="text-gray-600">Close</button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-sm text-gray-600">Plan Name</label>
                <input value={form.planName} onChange={(e) => handleFormChange('planName', e.target.value)} className="w-full border px-3 py-2 rounded mt-1" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-gray-600">Views Allowed</label>
                  <input type="number" value={form.viewsAllowed} onChange={(e) => handleFormChange('viewsAllowed', e.target.value)} className="w-full border px-3 py-2 rounded mt-1" />
                </div>
                <div>
                  <label className="text-sm text-gray-600">Duration (days)</label>
                  <input type="number" value={form.duration} onChange={(e) => handleFormChange('duration', e.target.value)} className="w-full border px-3 py-2 rounded mt-1" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-gray-600">Price Amount</label>
                  <input type="number" value={form.priceAmount} onChange={(e) => handleFormChange('priceAmount', e.target.value)} className="w-full border px-3 py-2 rounded mt-1" />
                </div>
                <div>
                  <label className="text-sm text-gray-600">Currency</label>
                  <input value={form.priceCurrency} onChange={(e) => handleFormChange('priceCurrency', e.target.value)} className="w-full border px-3 py-2 rounded mt-1" />
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-600">Description</label>
                <textarea value={form.description} onChange={(e) => handleFormChange('description', e.target.value)} className="w-full border px-3 py-2 rounded mt-1" rows={3} />
              </div>

              <div>
                <label className="text-sm text-gray-600">Plan Type</label>
                <input value={form.planType} onChange={(e) => handleFormChange('planType', e.target.value)} className="w-full border px-3 py-2 rounded mt-1" />
              </div>

              <div className="flex gap-3 mt-4">
                <button disabled={actionLoading} onClick={handleUpdate} className="px-4 py-2 bg-blue-600 text-white rounded">{actionLoading ? 'Saving...' : 'Save Changes'}</button>
                <button onClick={() => setShowEditModal(false)} className="px-4 py-2 border rounded">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && selectedPlan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold mb-2">Delete Plan</h3>
            <p className="text-sm text-gray-600 mb-4">Are you sure you want to delete the plan "{selectedPlan.planName}"? This action cannot be undone.</p>
            <div className="flex gap-3">
              <button disabled={actionLoading} onClick={handleDelete} className="px-4 py-2 bg-red-600 text-white rounded">{actionLoading ? 'Deleting...' : 'Delete'}</button>
              <button onClick={() => setShowDeleteModal(false)} className="px-4 py-2 border rounded">Cancel</button>
            </div>
          </div>
        </div>
      )}
      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">Create Plan</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-600">Close</button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-sm text-gray-600">Plan Name</label>
                <input value={createForm.planName} onChange={(e) => handleCreateFormChange('planName', e.target.value)} className="w-full border px-3 py-2 rounded mt-1" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-gray-600">Views Allowed</label>
                  <input type="number" value={createForm.viewsAllowed} onChange={(e) => handleCreateFormChange('viewsAllowed', e.target.value)} className="w-full border px-3 py-2 rounded mt-1" />
                </div>
                <div>
                  <label className="text-sm text-gray-600">Duration (days)</label>
                  <input type="number" value={createForm.duration} onChange={(e) => handleCreateFormChange('duration', e.target.value)} className="w-full border px-3 py-2 rounded mt-1" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-gray-600">Price Amount</label>
                  <input type="number" value={createForm.priceAmount} onChange={(e) => handleCreateFormChange('priceAmount', e.target.value)} className="w-full border px-3 py-2 rounded mt-1" />
                </div>
                <div>
                  <label className="text-sm text-gray-600">Currency</label>
                  <input value={createForm.priceCurrency} onChange={(e) => handleCreateFormChange('priceCurrency', e.target.value)} className="w-full border px-3 py-2 rounded mt-1" />
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-600">Description</label>
                <textarea value={createForm.description} onChange={(e) => handleCreateFormChange('description', e.target.value)} className="w-full border px-3 py-2 rounded mt-1" rows={3} />
              </div>

              <div>
                <label className="text-sm text-gray-600">Plan Type</label>
                <input value={createForm.planType} onChange={(e) => handleCreateFormChange('planType', e.target.value)} className="w-full border px-3 py-2 rounded mt-1" />
              </div>

              <div className="flex gap-3 mt-4">
                <button disabled={actionLoading} onClick={handleCreate} className="px-4 py-2 bg-green-600 text-white rounded">{actionLoading ? 'Creating...' : 'Create Plan'}</button>
                <button onClick={() => setShowCreateModal(false)} className="px-4 py-2 border rounded">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlansManagement;
