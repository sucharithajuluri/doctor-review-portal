import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useReviewContext } from '../state/ReviewContext';

export default function DoctorReview() {
  const navigate = useNavigate();
  const {
    auth,
    saveDraft,
    submitReview,
    logout,
    getCurrentScanId,
    getMyReviews,
    getScan,
    fromApiConfidence,
  } = useReviewContext();

  const scanId = getCurrentScanId();
  const [imageUrl, setImageUrl] = useState('');
  const [imgError, setImgError] = useState(false);
  const [imgLoading, setImgLoading] = useState(false);
  const [review, setReview] = useState(null);
  const [condition, setCondition] = useState('');
  const [confidence, setConfidence] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState({});
  const isDraft = !review || review?.status === 'DRAFT';
  const isSubmitted = review?.status === 'SUBMITTED';
  const isLocked = review?.status === 'LOCKED';
  const isReadOnly = !isDraft;
  const submittedAt = review?.submittedAt || null;
  const lockedAt = review?.lockedAt || null;
  const [pageError, setPageError] = useState('');
  const mixedContentBlocked =
    window.location.protocol === 'https:' &&
    typeof imageUrl === 'string' &&
    imageUrl.startsWith('http:');

  useEffect(() => {
    if (auth.role !== 'DOCTOR' || !auth.userId) {
      navigate('/login', { replace: true });
      return;
    }

    setPageError('');
    Promise.all([
      getScan(scanId),
      getMyReviews(),
    ])
      .then(([scan, reviews]) => {
        setImageUrl(scan?.imageUrl || '');
        setImgError(false);
        setImgLoading(Boolean(scan?.imageUrl));
        const r = (reviews || []).find((x) => x.scanId === scanId) || null;
        setReview(r);
        setCondition(r?.conditionTier1 || '');
        setConfidence(fromApiConfidence(r?.confidenceLevel) || '');
        setNotes(r?.notes || '');
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
        setPageError('Unable to load review.');
      });
  }, [auth.role, auth.userId, fromApiConfidence, getMyReviews, getScan, logout, navigate, scanId]);

  useEffect(() => {
    if (imageUrl) {
      // Debug: verify imageUrl is used exactly as returned by backend
      // eslint-disable-next-line no-console
      console.log('[DoctorReview] imageUrl:', imageUrl);
    }
  }, [imageUrl]);

  const handleSaveDraft = () => {
    setErrors({});
    setPageError('');
    saveDraft({ scanId, condition, confidence, notes })
      .then((r) => {
        setReview(r);
        alert('Draft saved');
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
        setPageError('Unable to save draft.');
      });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const nextErrors = {};
    if (!condition) nextErrors.condition = 'Condition is required';
    if (!confidence) nextErrors.confidence = 'Confidence is required';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setPageError('');
    saveDraft({ scanId, condition, confidence, notes })
      .then(() => submitReview({ scanId }))
      .then((r) => {
        setReview(r);
        sessionStorage.setItem('submittedAt', r?.submittedAt || new Date().toISOString());
        if (r?.lockedAt) sessionStorage.setItem('lockedAt', r.lockedAt);
        navigate('/doctor/confirmation');
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
        setPageError('Unable to submit review.');
      });
  };

  const handleCancel = () => navigate('/doctor/dashboard');

  const fallbackSrc = `${import.meta.env.BASE_URL}face.svg`;
  const faceSrc = mixedContentBlocked ? fallbackSrc : (imageUrl || fallbackSrc);

  return (
    <div className="page">
      <header className="header">
        <div className="header-inner">
          <div>
            <h1>Clinical Review</h1>
            <p className="muted">Independent blinded assessment</p>
            <p className="muted">
              Status: {isLocked ? 'Locked' : (isSubmitted ? 'Submitted (Final)' : 'Draft (Editable)')}
            </p>
          </div>
        </div>
      </header>

      <main className="content">
        {pageError && (
          <div className="warn" style={{ marginBottom: 16, borderRadius: 12 }}>
            {pageError}
          </div>
        )}
        {isSubmitted && (
          <div className="warn" style={{ marginBottom: 16, borderRadius: 12 }}>
            This review is submitted and cannot be edited.
            {submittedAt && <div className="muted">Submitted by you at {new Date(submittedAt).toLocaleString()}</div>}
          </div>
        )}
        {isLocked && (
          <div className="warn" style={{ marginBottom: 16, borderRadius: 12 }}>
            This review is locked and cannot be edited.
            {lockedAt && <div className="muted">Locked by you at {new Date(lockedAt).toLocaleString()}</div>}
          </div>
        )}
        <div className="banner" style={{ marginBottom: 18 }}>
          <span style={{ fontWeight: 700 }}>!</span>
          <p>This review is independent and blinded. You cannot see AI output or other doctors' reviews.</p>
        </div>

        <div className="layout-2col">
          <div className="card">
            <div className="row" style={{ justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <h2>Face Image</h2>
              </div>
              <div className="right">
                <p className="muted" style={{ margin: 0 }}>Scan ID</p>
                <p style={{ margin: 0 }}>{scanId}</p>
              </div>
            </div>
            <div className="image-box">
              <img
                src={faceSrc}
                alt="Face Image"
                onLoad={() => setImgLoading(false)}
                onError={() => {
                  setImgLoading(false);
                  setImgError(true);
                }}
              />
            </div>
            <div style={{ marginTop: 10, textAlign: 'center' }}>
              <p className="muted">Read-only image from external system</p>
              {(mixedContentBlocked || imgError) && (
                <p className="muted" style={{ color: '#ef4444', fontWeight: 700 }}>
                  Image unavailable from external server
                </p>
              )}
              {imgLoading && <p className="muted">Loading image…</p>}
            </div>
          </div>

          <div className="card">
            <div className="section-title">
              <h2>Clinical Assessment</h2>
              <p className="muted">Complete all required fields</p>
            </div>
            <form className="stack" onSubmit={handleSubmit}>
              <div className="form-field">
                <label className="form-label" htmlFor="condition">Condition (Tier 1) *</label>
                <select
                  id="condition"
                  className="select"
                  value={condition}
                  onChange={(e) => setCondition(e.target.value)}
                  disabled={isReadOnly}
                  required
                >
                  <option value="">Select condition...</option>
                  <option value="Acne Vulgaris">Acne Vulgaris</option>
                  <option value="Rosacea">Rosacea</option>
                  <option value="Eczema">Eczema</option>
                  <option value="Psoriasis">Psoriasis</option>
                  <option value="Dermatitis">Dermatitis</option>
                  <option value="Normal">Normal</option>
                  <option value="Other">Other</option>
                </select>
                {errors.condition && <div className="muted" style={{ color: '#ef4444' }}>{errors.condition}</div>}
              </div>

              <div className="form-field">
                <label className="form-label">Confidence *</label>
                <div className="row" style={{ gap: 14 }}>
                  {['Low', 'Medium', 'High'].map((level) => (
                    <label key={level} className="row" style={{ gap: 8 }}>
                      <input
                        type="radio"
                        name="confidence"
                        value={level}
                        checked={confidence === level}
                        onChange={(e) => setConfidence(e.target.value)}
                        disabled={isReadOnly}
                        required
                      />
                      <span>{level}</span>
                    </label>
                  ))}
                </div>
                {errors.confidence && <div className="muted" style={{ color: '#ef4444' }}>{errors.confidence}</div>}
              </div>

              <div className="form-field">
                <label className="form-label" htmlFor="notes">Clinical Notes</label>
                <textarea
                  id="notes"
                  className="textarea"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Additional clinical observations..."
                  disabled={isReadOnly}
                />
                <p className="muted">Optional</p>
              </div>

              <div className="warn" style={{ padding: 12, borderRadius: 12 }}>
                Once submitted, this review is final and cannot be changed.
              </div>

              {isDraft ? (
                <div className="row">
                  <button type="button" className="btn" onClick={handleSaveDraft}>Save Draft</button>
                  <button type="submit" className="btn btn-primary">Submit Review</button>
                  <button type="button" className="btn btn-ghost" onClick={handleCancel}>Cancel</button>
                </div>
              ) : (
                <div className="lock-note">Review is read-only</div>
              )}
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}

