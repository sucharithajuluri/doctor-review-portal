import { Routes, Route, Navigate } from 'react-router-dom';
import DoctorLogin from './screens/DoctorLogin';
import DoctorDashboard from './screens/DoctorDashboard';
import DoctorReview from './screens/DoctorReview';
import ReviewConfirmation from './screens/ReviewConfirmation';
import AdminDashboard from './screens/AdminDashboard';
import AdminFinalSummary from './screens/AdminFinalSummary';
import AuditLog from './screens/AuditLog';
import { ReviewProvider } from './state/ReviewContext';

export default function App() {
  return (
    <ReviewProvider>
      <Routes>
        <Route path="/login" element={<DoctorLogin />} />
        <Route path="/doctor/dashboard" element={<DoctorDashboard />} />
        <Route path="/doctor/review" element={<DoctorReview />} />
        <Route path="/doctor/confirmation" element={<ReviewConfirmation />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/final-summary" element={<AdminFinalSummary />} />
        <Route path="/admin/audit" element={<AuditLog />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </ReviewProvider>
  );
}

