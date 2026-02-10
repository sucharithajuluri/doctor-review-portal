import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useReviewContext } from '../state/ReviewContext';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const {
    auth,
    logout,
    getAdminScans,
  } = useReviewContext();
  const [scans, setScans] = useState([]);
  const [pageError, setPageError] = useState('');
  const [didLoad, setDidLoad] = useState(false);

  const refreshScans = () => {
    setPageError('');
    setDidLoad(false);
    return getAdminScans()
      .then((response) => {
        // eslint-disable-next-line no-console
        console.log('AdminDashboard: /admin/scans response:', response);
        // eslint-disable-next-line no-console
        console.log('ADMIN scans loaded:', response?.scans);
        setScans(response?.scans || []);
        setDidLoad(true);
        return response?.scans || [];
      })
      .catch((err) => {
        setDidLoad(true);
        if (err?.status === 401) {
          logout();
          navigate('/login', { replace: true });
          return [];
        }
        if (err?.status === 403) {
          setPageError('Access denied.');
          return [];
        }
        setPageError('Unable to load scans.');
        return [];
      });
  };

  useEffect(() => {
    if (auth.role !== 'ADMIN') {
      navigate('/login', { replace: true });
      return;
    }
    refreshScans();
  }, [auth.role, getAdminScans, navigate, logout]);

  const handleReport = (id) => {
    sessionStorage.setItem('currentScanId', id);
    navigate('/admin/final-summary');
  };

  return (
    <div className="page">
      <header className="header">
        <div className="header-inner">
          <div>
            <h1>Admin Dashboard</h1>
            <p className="muted">System monitoring and management</p>
          </div>
          <div className="row">
            <button className="btn" onClick={refreshScans}>Refresh</button>
            <button className="btn" onClick={() => navigate('/admin/audit')}>Audit Log</button>
            <button className="btn btn-ghost" onClick={() => { logout(); navigate('/login'); }}>Logout</button>
          </div>
        </div>
      </header>

      <main className="content">
        {pageError && (
          <div className="warn" style={{ marginBottom: 16, borderRadius: 12 }}>
            {pageError}
          </div>
        )}
        <div className="card">
          <div style={{ marginBottom: 12 }}>
            <h2>Study Progress Monitor</h2>
            <p className="muted">Read-only monitoring • Scans from external system</p>
          </div>
          <div className="warn" style={{ marginBottom: 12, borderRadius: 12, padding: 12 }}>
            Reviews in progress — results available after completion.
          </div>
          {didLoad && (!scans || scans.length === 0) && (
            <div className="muted" style={{ fontWeight: 700 }}>
              No scans found.
            </div>
          )}
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Scan ID</th>
                  <th>Source User</th>
                  <th>Ingested</th>
                  <th>Image Available</th>
                  <th>Reviews Completed</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {(scans || []).map((s) => {
                  const hasImage = Boolean(s?.imageUrl);
                  return (
                    <tr key={s.scanId}>
                      <td><div style={{ fontWeight: 700 }}>{s.scanId}</div></td>
                      <td>{s.sourceUserId || '—'}</td>
                      <td>{s.createdAt ? new Date(s.createdAt).toLocaleString() : '—'}</td>
                      <td>{hasImage ? 'Yes' : 'No'}</td>
                      <td>{s.reviewCompletion || '0/3'}</td>
                      <td>
                        {s.isComplete ? (
                          <button className="btn btn-primary" onClick={() => handleReport(s.scanId)}>
                            View Results
                          </button>
                        ) : (
                          <button className="btn" disabled>
                            Results Pending
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}

