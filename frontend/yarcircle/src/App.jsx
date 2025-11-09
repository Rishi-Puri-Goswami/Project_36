import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
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

const App = () => {
  return (
    <Router>
      <Routes>

        <Route path="/" element={<LandingPage />} />
        <Route path="/client" element={<ClintPage />} />
        <Route path="/client/login" element={<ClintLogin />} />
        <Route path="/client/register" element={<ClintRegister />} />
        <Route path="/client/dashboard" element={<ClintDashboard />} />
        <Route path="/client/profile" element={<ClintProfile />} />
        <Route path="/client/post-job" element={<PostJob />} />
        <Route path="/client/my-jobs" element={<MyJobs />} />
        <Route path="/client/jobs/:jobId" element={<JobDetails />} />
        <Route path="/client/edit-job/:jobId" element={<EditJob />} />
        <Route path="/client/worker-profile/:workerId" element={<WorkerProfileView />} />
        <Route path="/worker" element={<WorkerPage />} />
        <Route path="/worker/login" element={<WorkerLogin />} />
        <Route path="/worker/register" element={<WorkerRegister />} />
        <Route path="/worker/dashboard" element={<WorkerDashboard />} />
        <Route path="/worker/profile" element={<WorkerProfile />} />
        <Route path="/cancellation-refund" element={<CancellationRefund />} />
        <Route path="/contact-us" element={<ContactUs />} />
        <Route path="/terms/privacy" element={<Privacy />} />
        <Route path="/shipping" element={<Shipping />} />
        <Route path="/terms" element={<Terms />} />

      </Routes>
    </Router>
  )
}


export default App;



