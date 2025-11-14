import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { CreditProvider } from './context/CreditContext'
import { AdminProvider } from './context/AdminContext'
import LandingPage from './component/landingPage/LandingPage'
import ClintPage from './component/clint/ClintPage'
import ClintLogin from './component/clint/ClintLogin'
import ClintRegister from './component/clint/ClintRegister'
import ClintDashboard from './component/clint/ClintDashboard'
import ClintProfile from './component/clint/ClintProfile'
import PostJob from './component/clint/PostJob'
import MyJobs from './component/clint/MyJobs'
import JobDetails from './component/clint/JobDetails'
import EditJob from './component/clint/EditJob'
import WorkerProfileView from './component/clint/WorkerProfileView'
import WorkerPostSearch from './component/clint/WorkerPostSearch'
import PricingPage from './component/clint/PricingPage'
import WorkerPage from './component/worker/WorkerPage'
import WorkerLogin from './component/worker/WorkerLogin'
import WorkerRegister from './component/worker/WorkerRegister'
import WorkerDashboard from './component/worker/WorkerDashboard'
import WorkerProfile from './component/worker/WorkerProfile'
import CancellationRefund from './component/policies/CancellationRefund'
import ContactUs from './component/policies/ContactUs'
import Privacy from './component/policies/Privacy'
import Shipping from './component/policies/Shipping'
import Terms from './component/policies/Terms'
import AdminLogin from './component/admin/AdminLogin'
import AdminDashboard from './component/admin/AdminDashboard'
import AdminProtectedRoute from './component/admin/AdminProtectedRoute'

const App = () => {
  // Get admin secret path from environment variable
  const adminSecretPath = import.meta.env.VITE_ADMIN_PANEL_SECRET || 'secure';

  return (
    <Router>
      <CreditProvider>
        <AdminProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            
            {/* Client Routes */}
            <Route path="/client" element={<ClintPage />} />
            <Route path="/client/login" element={<ClintLogin />} />
            <Route path="/client/register" element={<ClintRegister />} />
            <Route path="/client/pricing" element={<PricingPage />} />
            <Route path="/client/dashboard" element={<ClintDashboard />} />
            <Route path="/client/profile" element={<ClintProfile />} />
            <Route path="/client/post-job" element={<PostJob />} />
            <Route path="/client/my-jobs" element={<MyJobs />} />
            <Route path="/client/jobs/:jobId" element={<JobDetails />} />
            <Route path="/client/edit-job/:jobId" element={<EditJob />} />
            <Route path="/client/worker-profile/:workerId" element={<WorkerProfileView />} />
            <Route path="/client/worker-posts" element={<WorkerPostSearch />} />
            
            {/* Worker Routes */}
            <Route path="/worker" element={<WorkerPage />} />
            <Route path="/worker/login" element={<WorkerLogin />} />
            <Route path="/worker/register" element={<WorkerRegister />} />
            <Route path="/worker/dashboard" element={<WorkerDashboard />} />
            <Route path="/worker/profile" element={<WorkerProfile />} />
            
            {/* Policy Routes */}
            <Route path="/terms/cancellation-refund" element={<CancellationRefund />} />
            <Route path="/terms/contact-us" element={<ContactUs />} />
            <Route path="/terms/privacy" element={<Privacy />} />
            <Route path="/terms/shipping" element={<Shipping />} />
            <Route path="/terms/terms" element={<Terms />} />

            {/* Admin Routes with Secret URL */}
            <Route path={`/admin/${adminSecretPath}/login`} element={<AdminLogin />} />
            
            {/* Protected Admin Routes */}
            <Route path={`/admin/${adminSecretPath}`} element={<AdminProtectedRoute />}>
              <Route path="dashboard" element={<AdminDashboard />} />
              {/* More admin routes will be added here */}
            </Route>
          </Routes>
        </AdminProvider>
      </CreditProvider>
    </Router>
  )
}

export default App;



