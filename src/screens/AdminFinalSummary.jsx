import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useReviewContext } from '../state/ReviewContext';

export default function AdminFinalSummary() {
  const { auth, logout, getCurrentScanId, getAdminFinal, fromApiConfidence } = useReviewContext();
  const navigate = useNavigate();
  const scanId = getCurrentScanId();
  const [data, setData] = useState(null);
  const [pageError, setPageError] = useState('');

  const scan = data?.scan || null;
  const reviews = data?.reviews || [];
  const ai = data?.ai || null;
  const final = data?.final || null;
  const isComplete = Boolean(data?.isComplete);
  const reviewCompletion = data?.reviewCompletion || `${(reviews || []).filter((r) => r.status === 'LOCKED').length}/3`;

  const lockedCount = (reviews || []).filter((r) => r.status === 'LOCKED').length;
  const backendBase = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

  const getImageSrc = (scanId) => {
    if (!scanId) return null;
    return `${backendBase}/system/image/${encodeURIComponent(scanId)}`;
  };

  useEffect(() => {
    if (auth.role !== 'ADMIN') {
      navigate('/login', { replace: true });
    }
  }, [auth.role, navigate]);

  useEffect(() => {
    if (auth.role !== 'ADMIN') return;
    setPageError('');
    getAdminFinal(scanId)
      .then((res) => {
        setData(res);
      })
      .catch((err) => {
        if (err?.status === 401) {
          logout();
          navigate('/login', { replace: true });
          return;
        }
        if (err?.status === 403) {
          setPageError('Access denied.');
          return;
        }
        setPageError('Unable to load final summary.');
      });
  }, [auth.role, getAdminFinal, logout, navigate, scanId]);

  useEffect(() => {
    // Validation logging: ensure correct scanId usage
    // eslint-disable-next-line no-console
    console.log('ADMIN scanId:', scanId);
    // eslint-disable-next-line no-console
    console.log('ADMIN image src:', getImageSrc(scanId));
  }, [scanId]);

  return (
    <div className="page">
      <header className="header">
        <div className="header-inner">
          <div className="row">
            <button className="btn" onClick={() => window.history.back()}>Back</button>
            <div>
              <h1>Admin Final Summary (READ-ONLY)</h1>
              <p className="muted">Scan ID: {scanId}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="content">
        {pageError && (
          <div className="warn" style={{ marginBottom: 16, borderRadius: 12 }}>
            {pageError}
          </div>
        )}
        <div className="card" style={{ marginBottom: 12, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <div className="pill">Assigned: 3</div>
          <div className="pill">Locked: {reviewCompletion}</div>
          <div className="pill">AI: {isComplete && ai ? 'Completed' : 'Pending'}</div>
          <div className="pill">Final: {isComplete ? (final?.result || 'Pending') : 'Pending'}</div>
        </div>
        {!isComplete && (
          <div className="warn" style={{ marginBottom: 18, borderRadius: 12, padding: 12 }}>
            Reviews in progress — results available after completion.
          </div>
        )}
        <div className="card" style={{ marginBottom: 18 }}>
          <h2 style={{ marginBottom: 12 }}>Face Image</h2>
          <div style={{ maxWidth: 380, margin: '0 auto' }}>
            <div className="image-box">
              {getImageSrc(scanId) ? (
                <img
                  src={getImageSrc(scanId)}
                  alt="Face Image"
                  style={{ maxWidth: '100%', border: '1px solid #ccc' }}
                />
              ) : (
                <div className="muted" style={{ color: '#ef4444', fontWeight: 700 }}>
                  Image unavailable (missing scanId)
                </div>
              )}
            </div>
            <div className="center" style={{ marginTop: 10 }}>
              <p className="muted">Read-only image from external system</p>
            </div>
          </div>
        </div>

        {isComplete && (
          <div className="stack" style={{ marginBottom: 18 }}>
            <h2>Doctor Review Decisions</h2>
            {(reviews || []).map((review) => (
              <div key={review.reviewId || `${review.doctorId}-${review.scanId}`} className="card">
                <h3 style={{ color: '#4f46e5', marginBottom: 12 }}>Doctor {review.doctorId}</h3>
                <div className="layout-2col" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                  <div>
                    <p className="muted">Condition (Tier 1)</p>
                    <p>{review.conditionTier1 || '—'}</p>
                  </div>
                  <div>
                    <p className="muted">Confidence</p>
                    <span className="badge badge-success">{fromApiConfidence(review.confidenceLevel) || '—'}</span>
                  </div>
                  <div>
                    <p className="muted">Clinical Notes</p>
                    <p>{review.notes || '—'}</p>
                  </div>
                </div>
                {review.status === 'LOCKED' && review.lockedAt && (
                  <p className="muted" style={{ marginTop: 8 }}>Locked at {new Date(review.lockedAt).toLocaleString()}</p>
                )}
              </div>
            ))}
          </div>
        )}

        {isComplete && (
          <div className="stack" style={{ marginBottom: 18 }}>
            <div className="badge badge-warn" style={{ alignSelf: 'flex-start' }}>AI – Assistive Only</div>
            <div className="card">
              <div className="layout-2col" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                <div>
                  <p className="muted">Condition (Tier 1)</p>
                  <p>—</p>
                </div>
                <div>
                  <p className="muted">Confidence</p>
                  <span className="badge badge-success">—</span>
                </div>
                <div>
                  <p className="muted">Analysis</p>
                  <p>{ai?.outputText || 'Unavailable'}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {isComplete && (
          <div className="card" style={{ marginBottom: 18 }}>
            <h2 className="section-title">Agreement Summary</h2>
            <p>{final?.agreementSummary || 'Pending'}</p>
          </div>
        )}

        {isComplete && (
          <div className="card">
            <h2 className="section-title">Final Result</h2>
            <div className="center">
              <div className={final?.result === 'MATCH' ? 'badge badge-success' : 'badge badge-warn'} style={{ padding: '18px 26px', fontSize: 24 }}>
                {final?.result || 'Pending'}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

