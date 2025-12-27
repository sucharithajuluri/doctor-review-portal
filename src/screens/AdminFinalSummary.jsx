import { useReviewContext } from '../state/ReviewContext';

export default function AdminFinalSummary() {
  const { scanId, reviews, aiResult, finalResult, assignedDoctors } = useReviewContext();
  const assignedReviews = assignedDoctors.map((doc) => reviews.find((r) => r.doctorId === doc.id) || {
    doctorId: doc.id,
    condition: '',
    confidence: '',
    notes: '',
    status: 'Not Started',
    updatedAt: null,
  });

  const agreementSummary = (() => {
    const filled = assignedReviews.filter((r) => r.condition).map((r) => r.condition);
    if (filled.length < assignedReviews.length) return 'Pending doctor submissions.';
    const unique = new Set(filled).size;
    if (unique === 1) return 'All doctors independently identified the same condition.';
    if (unique === 2) return 'Partial agreement among doctors.';
    return 'No agreement between doctors.';
  })();
  const lockedCount = assignedReviews.filter((r) => r.status === 'Locked').length;

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
        <div className="card" style={{ marginBottom: 12, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <div className="pill">Assigned: {assignedReviews.length}</div>
          <div className="pill">Locked: {lockedCount}/{assignedReviews.length}</div>
          <div className="pill">AI: {aiResult ? 'Completed' : 'Pending'}</div>
          <div className="pill">Final: {finalResult || 'Pending'}</div>
        </div>
        <div className="card" style={{ marginBottom: 18 }}>
          <h2 style={{ marginBottom: 12 }}>Face Image</h2>
          <div style={{ maxWidth: 380, margin: '0 auto' }}>
            <div className="image-box">
              <img src="https://images.unsplash.com/photo-1717068341198-95cce0b54b26?auto=format&fit=crop&w=900&q=80" alt="Face scan" />
            </div>
            <div className="center" style={{ marginTop: 10 }}>
              <p className="muted">Read-only image from external system</p>
            </div>
          </div>
        </div>

        <div className="stack" style={{ marginBottom: 18 }}>
          <h2>Doctor Review Decisions</h2>
          {assignedReviews.map((review) => (
            <div key={review.doctorId} className="card">
              <h3 style={{ color: '#4f46e5', marginBottom: 12 }}>Doctor {review.doctorId}</h3>
              <div className="layout-2col" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                <div>
                  <p className="muted">Condition (Tier 1)</p>
                  <p>{review.condition || '—'}</p>
                </div>
                <div>
                  <p className="muted">Confidence</p>
                  <span className="badge badge-success">{review.confidence || '—'}</span>
                </div>
                <div>
                  <p className="muted">Clinical Notes</p>
                  <p>{review.notes || '—'}</p>
                </div>
              </div>
              {review.status === 'Locked' && review.updatedAt && (
                <p className="muted" style={{ marginTop: 8 }}>Locked at {new Date(review.updatedAt).toLocaleString()}</p>
              )}
            </div>
          ))}
        </div>

        <div className="stack" style={{ marginBottom: 18 }}>
          <div className="badge badge-warn" style={{ alignSelf: 'flex-start' }}>AI – Assistive Only</div>
          <div className="card">
            <div className="layout-2col" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
              <div>
                <p className="muted">Condition (Tier 1)</p>
                <p>{aiResult?.condition || 'Pending until all locked'}</p>
              </div>
              <div>
                <p className="muted">Confidence</p>
                <span className="badge badge-success">{aiResult?.confidence || 'Pending'}</span>
              </div>
              <div>
                <p className="muted">Analysis</p>
                <p>{aiResult?.notes || 'Runs after all reviews are locked.'}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card" style={{ marginBottom: 18 }}>
          <h2 className="section-title">Agreement Summary</h2>
          <p>{agreementSummary}</p>
        </div>

        <div className="card">
          <h2 className="section-title">Final Result</h2>
          <div className="center">
            <div className={finalResult === 'Match' ? 'badge badge-success' : 'badge badge-warn'} style={{ padding: '18px 26px', fontSize: 24 }}>
              {finalResult || 'Pending'}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

