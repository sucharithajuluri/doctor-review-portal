import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useReviewContext } from '../state/ReviewContext';

export default function DoctorReview() {
  const navigate = useNavigate();
  const {
    activeDoctorId,
    setActiveDoctorId,
    scanId,
    getReviewByDoctor,
    saveDraft,
    submitReview,
    assignedDoctors,
    loggedDoctorId,
  } = useReviewContext();
  const effectiveDoctorId = loggedDoctorId || activeDoctorId;
  const review = getReviewByDoctor(effectiveDoctorId);
  const isAssigned = assignedDoctors.some((d) => d.id === effectiveDoctorId);
  const [condition, setCondition] = useState(review.condition);
  const [confidence, setConfidence] = useState(review.confidence);
  const [notes, setNotes] = useState(review.notes);
  const [errors, setErrors] = useState({});
  const isLocked = review.status === 'Locked';
  const lockedAt = review.updatedAt;

  useEffect(() => {
    if (!isAssigned) {
      alert('You are not assigned to this scan. Contact admin.');
      navigate('/doctor/dashboard');
      return;
    }
    const r = getReviewByDoctor(effectiveDoctorId);
    setCondition(r.condition);
    setConfidence(r.confidence);
    setNotes(r.notes);
  }, [effectiveDoctorId, getReviewByDoctor, isAssigned, navigate]);

  const handleSaveDraft = () => {
    saveDraft({ doctorId: activeDoctorId, condition, confidence, notes });
    sessionStorage.setItem('currentStatus', 'Draft');
    alert('Draft saved');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const nextErrors = {};
    if (!condition) nextErrors.condition = 'Condition is required';
    if (!confidence) nextErrors.confidence = 'Confidence is required';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    submitReview({ doctorId: activeDoctorId, condition, confidence, notes });
    sessionStorage.setItem('currentStatus', 'Locked');
    sessionStorage.setItem('lockedAt', new Date().toISOString());
    navigate('/doctor/confirmation');
  };

  const handleCancel = () => navigate('/doctor/dashboard');

  return (
    <div className="page">
      <header className="header">
        <div className="header-inner">
          <div>
            <h1>Clinical Review</h1>
            <p className="muted">Independent blinded assessment</p>
            <p className="muted">Status: {isLocked ? 'Submitted (Locked)' : 'Draft (Editable)'}</p>
          </div>
          <select
            className="select"
            value={effectiveDoctorId}
            onChange={(e) => setActiveDoctorId(e.target.value)}
            style={{ width: 160 }}
            disabled
          >
            {(loggedDoctorId ? assignedDoctors.filter(d => d.id === loggedDoctorId) : assignedDoctors).map((doc) => (
              <option key={doc.id} value={doc.id}>{doc.name}</option>
            ))}
          </select>
        </div>
      </header>

      <main className="content">
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
              <img src="https://images.unsplash.com/photo-1717068341198-95cce0b54b26?auto=format&fit=crop&w=900&q=80" alt="Face scan" />
            </div>
            <div style={{ marginTop: 10, textAlign: 'center' }}>
              <p className="muted">Read-only image from external system</p>
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
                  disabled={isLocked}
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
                        disabled={isLocked}
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
                  disabled={isLocked}
                />
                <p className="muted">Optional</p>
              </div>

              <div className="warn" style={{ padding: 12, borderRadius: 12 }}>
                Once submitted, this review will be locked
              </div>

              {!isLocked ? (
                <div className="row">
                  <button type="button" className="btn" onClick={handleSaveDraft}>Save Draft</button>
                  <button type="submit" className="btn btn-primary">Submit Review</button>
                  <button type="button" className="btn btn-ghost" onClick={handleCancel}>Cancel</button>
                </div>
              ) : (
                <div className="lock-note">Review is LOCKED (read-only)</div>
              )}
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}

