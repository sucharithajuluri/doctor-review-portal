import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useReviewContext } from '../state/ReviewContext';

const statusClass = (status) => {
  if (status === 'Locked' || status === 'Submitted') return 'badge badge-success';
  if (status === 'Draft') return 'badge badge-warn';
  return 'badge badge-muted';
};

export default function DoctorDashboard() {
  const navigate = useNavigate();
  const { auth, logout, getCurrentScanId, getMyReviews } = useReviewContext();
  const scanId = getCurrentScanId();
  const displayDoctor = auth.userId ? `(${auth.userId})` : null;

  const [reviewStatus, setReviewStatus] = useState('Not Started');

  useEffect(() => {
    if (auth.role !== 'DOCTOR' || !auth.userId) {
      navigate('/login', { replace: true });
      return;
    }
    getMyReviews()
      .then((reviews) => {
        const r = (reviews || []).find((x) => x.scanId === scanId);
        if (!r) setReviewStatus('Not Started');
        else if (r.status === 'LOCKED') setReviewStatus('Locked');
        else if (r.status === 'SUBMITTED') setReviewStatus('Submitted');
        else setReviewStatus('Draft');
      })
      .catch((err) => {
        if (err?.status === 401) {
          logout();
          navigate('/login', { replace: true });
        }
      });
  }, [auth.role, auth.userId, getMyReviews, navigate, logout, scanId]);

  const handleOpen = () => {
    sessionStorage.setItem('currentScanId', scanId);
    navigate('/doctor/review');
  };
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="page">
      <header className="header">
        <div className="header-inner">
          <div>
            <h1>My Reviews</h1>
            <p className="muted">Independent clinical assessments</p>
            {displayDoctor && <p className="muted">Signed in as {displayDoctor}</p>}
          </div>
          <button className="btn btn-ghost" onClick={handleLogout}>Logout</button>
        </div>
      </header>
      <main className="content">
        <div className="card">
          <div className="table-responsive">
            <table className="table">
            <thead>
              <tr>
                <th>Scan ID</th>
                <th>Review Status</th>
                <th>Draft</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{scanId}</td>
                <td><span className={statusClass(reviewStatus)}>{reviewStatus}</span></td>
                <td>{reviewStatus === 'Draft' ? <span className="badge badge-warn">Resume draft</span> : '—'}</td>
                <td>
                  {reviewStatus === 'Locked' || reviewStatus === 'Submitted' ? (
                    <span className="muted">{reviewStatus}</span>
                  ) : (
                    <button className="btn btn-primary" onClick={handleOpen}>
                      {reviewStatus === 'Draft' ? 'Continue' : 'Start Review'}
                    </button>
                  )}
                </td>
              </tr>
            </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}

