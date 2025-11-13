import express from "express";
import { 
  listPendingWorkers, 
  approveWorker, 
  rejectWorker, 
  listClientPosts, 
  listPendingPosts, 
  approvePost, 
  rejectPost,
  createplan,
  getDashboardOverview,
  getUserGrowthAnalytics,
  getRevenueAnalytics,
  getAllClients,
  getClientDetails,
  getClientJobPosts,
  getClientPaymentHistory,
  getClientSubscription,
  toggleClientStatus,
  blockClient,
  unblockClient,
  deleteClient,
  resetClientCredits,
  // Worker Management
  getAllWorkers,
  getWorkerDetails,
  getWorkerApplications,
  verifyWorkerProfile,
  toggleWorkerStatus,

  featureWorker,
  unfeatureWorker,
  deleteWorker,
  // Job Posts Management
  getAllJobPosts,
  deleteJobPost,
  // Subscription & Plans Management
  getAllPlans,
  getPlanDetails,
  updatePlan,
  deletePlan,
  getPlanPurchaseHistory,
  getAllPurchaseHistory,
  getMostPopularPlans,
  getPlanRevenueAnalytics,
  blockWorker,
  unblockWorker
} from "../controllers/adminController.js";

const adminrouter = express.Router();

// Dashboard routes
adminrouter.get('/dashboard/overview', getDashboardOverview);
adminrouter.get('/dashboard/user-growth', getUserGrowthAnalytics);
adminrouter.get('/dashboard/revenue-analytics', getRevenueAnalytics);

// Client Management routes
adminrouter.get('/clients', getAllClients);
adminrouter.get('/clients/:clientId', getClientDetails);
adminrouter.get('/clients/:clientId/jobs', getClientJobPosts);
adminrouter.get('/clients/:clientId/payments', getClientPaymentHistory);
adminrouter.get('/clients/:clientId/subscription', getClientSubscription);
adminrouter.patch('/clients/:clientId/status', toggleClientStatus);
adminrouter.post('/clients/:clientId/block', blockClient);
adminrouter.post('/clients/:clientId/unblock', unblockClient);
adminrouter.delete('/clients/:clientId', deleteClient);
adminrouter.post('/clients/:clientId/reset-credits', resetClientCredits);

// Worker Management routes
adminrouter.get('/workers', getAllWorkers);
adminrouter.get('/workers/:workerId', getWorkerDetails);
adminrouter.get('/workers/:workerId/applications', getWorkerApplications);
adminrouter.patch('/workers/:workerId/verify', verifyWorkerProfile);
adminrouter.patch('/workers/:workerId/status', toggleWorkerStatus);
adminrouter.post('/workers/:workerId/block', blockWorker);
adminrouter.post('/workers/:workerId/unblock', unblockWorker);
adminrouter.post('/workers/:workerId/feature', featureWorker);
adminrouter.post('/workers/:workerId/unfeature', unfeatureWorker);
adminrouter.delete('/workers/:workerId', deleteWorker);

// Job Posts Management routes
adminrouter.get('/job-posts', getAllJobPosts);
adminrouter.delete('/job-posts/:postId', deleteJobPost);

// Subscription & Plans Management routes
adminrouter.get('/plans', getAllPlans);
adminrouter.get('/plans/:planId', getPlanDetails);
adminrouter.put('/plans/:planId', updatePlan);
adminrouter.delete('/plans/:planId', deletePlan);
adminrouter.get('/plans/:planId/purchase-history', getPlanPurchaseHistory);
adminrouter.get('/purchase-history', getAllPurchaseHistory);
adminrouter.get('/analytics/popular-plans', getMostPopularPlans);
adminrouter.get('/analytics/plan-revenue', getPlanRevenueAnalytics);
adminrouter.post('/plans/create', createplan);

// Worker routes (old - keeping for backward compatibility)
adminrouter.route('/workers/pending').get(listPendingWorkers);
adminrouter.route('/workers/:id/approve').post(approveWorker);
adminrouter.route('/workers/:id/reject').post(rejectWorker);

// Post routes
adminrouter.route('/posts').get(listClientPosts);
adminrouter.route('/posts/pending').get(listPendingPosts);
adminrouter.route('/posts/:id/approve').post(approvePost);
adminrouter.route('/posts/:id/reject').post(rejectPost);

export default adminrouter;











// router.get('/workers/pending', listPendingWorkers);
// router.post('/workers/:id/approve', approveWorker);
// router.post('/workers/:id/reject', rejectWorker);

// router.get('/posts', listClientPosts);

// router.get('/posts/pending', async (req, res) => {
// 	const controller = await import('../controllers/adminController.js');
// 	return controller.listPendingPosts(req, res);
// });

// router.post('/posts/:id/approve', async (req, res) => {
// 	const controller = await import('../controllers/adminController.js');
// 	return controller.approvePost(req, res);
// });

// router.post('/posts/:id/reject', async (req, res) => {
// 	const controller = await import('../controllers/adminController.js');
// 	return controller.rejectPost(req, res);
// });
