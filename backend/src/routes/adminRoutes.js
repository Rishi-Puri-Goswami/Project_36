import express from "express";
import { 
  listPendingWorkers, 
  approveWorker, 
  rejectWorker, 
  listClientPosts, 
  listPendingPosts, 
  approvePost, 
  rejectPost,
  createplan 
} from "../controllers/adminController.js";

const adminrouter = express.Router();

// Worker routes
adminrouter.route('/workers/pending').get(listPendingWorkers);
adminrouter.route('/workers/:id/approve').post(approveWorker);
adminrouter.route('/workers/:id/reject').post(rejectWorker);

// Post routes
adminrouter.route('/posts').get(listClientPosts);
adminrouter.route('/posts/pending').get(listPendingPosts);
adminrouter.route('/posts/:id/approve').post(approvePost);
adminrouter.route('/posts/:id/reject').post(rejectPost);

// Plan routes
adminrouter.route('/plans/create').post(createplan);

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
