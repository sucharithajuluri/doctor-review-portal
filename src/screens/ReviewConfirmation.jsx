import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useReviewContext } from '../state/ReviewContext';

export default function ReviewConfirmation() {
  const navigate = useNavigate();
  const { auth, getCurrentScanId, logout } = useReviewContext();
  const scanId = getCurrentScanId();

  useEffect(() => {
    if (auth.role !== 'DOCTOR' || !auth.userId) {
      navigate('/login', { replace: true });
    }
  }, [auth.role, auth.userId, navigate]);

  const submittedAt = sessionStorage.getItem('submittedAt') || new Date().toISOString();

  return (
    <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div className="card" style={{ width: '100%', maxWidth: 520, padding: 32 }}>
        <div className="center" style={{ marginBottom: 20 }}>
          <div style={{ width: 70, height: 70, borderRadius: '50%', background: '#d1fae5', display: 'grid', placeItems: 'center', margin: '0 auto 12px' }}>
            <span role="img" aria-label="check" style={{ fontSize: 30 }}>✅</span>
          </div>
          <h2 style={{ marginBottom: 6 }}>Review Submitted Successfully</h2>
          <p className="muted">Your clinical assessment is final and cannot be changed</p>
        </div>

        <div className="card" style={{ background: '#f8fafc', borderColor: '#e2e8f0', boxShadow: 'none' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <p className="muted">Scan ID</p>
              <p>{scanId}</p>
            </div>
            <div>
              <p className="muted">Status</p>
              <div className="row">
                <span role="img" aria-label="lock">🔒</span>
                <span className="lock-note">SUBMITTED</span>
              </div>
            </div>
          </div>
          <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid #e2e8f0' }}>
            <p className="muted">Submission Timestamp</p>
            <p>{new Date(submittedAt).toLocaleString()}</p>
          </div>
        </div>

        <div className="warn" style={{ marginTop: 16, borderRadius: 12, padding: 12 }}>
          Once submitted, your review cannot be changed. Results are available only after all 3 doctor reviews are submitted and locked.
        </div>

        <button className="btn btn-primary" style={{ width: '100%', marginTop: 18 }} onClick={() => navigate('/doctor/dashboard')}>
          Return to Dashboard
        </button>
        <button className="btn btn-ghost" style={{ width: '100%', marginTop: 10 }} onClick={() => { logout(); navigate('/login'); }}>
          Logout
        </button>
      </div>
    </div>
  );
}

