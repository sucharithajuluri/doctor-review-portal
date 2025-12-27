import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useReviewContext } from '../state/ReviewContext';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const {
    completionCount,
    scanId,
    doctors,
    assignedDoctors,
    addDoctor,
    setAssignmentsForScan,
    assignmentLocked,
    getAssignedDoctorIds,
    aiResult,
    finalResult,
    resetMockData,
  } = useReviewContext();
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPass, setNewPass] = useState('');
  const [selectedAssignIds, setSelectedAssignIds] = useState(getAssignedDoctorIds());

  useEffect(() => {
    setSelectedAssignIds(getAssignedDoctorIds());
  }, [getAssignedDoctorIds]);

  const handleReport = (id) => {
    sessionStorage.setItem('currentScanId', id);
    navigate('/admin/final-summary');
  };

  const handleAddDoctor = (e) => {
    e.preventDefault();
    if (!newEmail || !newPass) return;
    if (assignmentLocked) return;
    const doc = addDoctor({ name: newName, email: newEmail, password: newPass });
    if (doc) {
      setAssignDoctorId(doc.id);
      setNewName('');
      setNewEmail('');
      setNewPass('');
    }
  };

  const handleAssign = (e) => {
    e.preventDefault();
    if (assignmentLocked) return;
    setAssignmentsForScan(selectedAssignIds.slice(0, 3));
  };

  const toggleSelect = (id) => {
    if (assignmentLocked) return;
    setSelectedAssignIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 3) return prev; // cap at 3
      return [...prev, id];
    });
  };

  const assignedCount = assignedDoctors.length || 3;
  const lockedCount = completionCount;
  const statusLabel = () => {
    if (finalResult) return 'Finalized';
    if (aiResult) return 'AI completed';
    if (lockedCount === assignedCount && assignedCount > 0) return 'All reviews submitted';
    return 'Waiting for doctors';
  };
  const nextStep = () => {
    if (finalResult) return 'Review Final Report';
    if (aiResult) return 'Review AI + Finalize';
    if (lockedCount === assignedCount && assignedCount > 0) return 'Run AI (auto when all locked)';
    return 'Lock remaining reviews';
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
            <button className="btn" onClick={() => navigate('/admin/audit')}>Audit Log</button>
            <button className="btn btn-ghost" onClick={() => navigate('/login')}>Logout</button>
          </div>
        </div>
      </header>

      <main className="content">
        <div className="card">
          <div style={{ marginBottom: 12 }}>
            <h2>Study Progress Monitor</h2>
            <p className="muted">Read-only monitoring • Scans from external system</p>
            <p className="muted">Slots remaining: {Math.max(0, 3 - assignedDoctors.length)}</p>
            <p className="muted">Legend: Waiting → All reviews submitted → AI completed → Finalized</p>
          </div>
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Scan ID</th>
                  <th>Status</th>
                  <th>Reviews</th>
                  <th>Next step</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>{scanId}</td>
                  <td>
                    <span className="badge badge-info">{statusLabel()}</span>
                  </td>
                  <td>{lockedCount}/{assignedCount}</td>
                  <td>{nextStep()}</td>
                  <td>
                    <button className="btn btn-primary" onClick={() => handleReport(scanId)}>
                      View Final Report
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="card" style={{ marginTop: 12, display: 'grid', gap: 16 }}>
          <div>
            <h3>Add Doctor</h3>
            <form className="stack" onSubmit={handleAddDoctor}>
              <input className="input" placeholder="Name (optional)" value={newName} onChange={(e) => setNewName(e.target.value)} disabled={assignmentLocked} />
              <input className="input" placeholder="Email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} required disabled={assignmentLocked} />
              <input className="input" placeholder="Password" value={newPass} onChange={(e) => setNewPass(e.target.value)} required disabled={assignmentLocked} />
              <button className="btn btn-primary" type="submit" disabled={assignmentLocked}>Add Doctor</button>
            </form>
            {assignmentLocked && <p className="muted" style={{ marginTop: 6 }}>Assignments locked because a review has started.</p>}
          </div>

          <div>
            <h3 style={{ marginBottom: 8 }}>Assign Doctor to Scan</h3>
            <form className="stack" style={{ gap: 12 }} onSubmit={handleAssign}>
              <div className="card" style={{ boxShadow: 'none', borderColor: '#e2e8f0' }}>
                {doctors.map((d) => {
                  const checked = selectedAssignIds.includes(d.id);
                  const disabled =
                    assignmentLocked ||
                    (!checked && selectedAssignIds.length >= 3);
                  return (
                    <label key={d.id} className="row" style={{ justifyContent: 'space-between', padding: '6px 0' }}>
                      <div>
                        <div>{d.name}</div>
                        <div className="muted" style={{ fontSize: 12 }}>{d.email}</div>
                      </div>
                      <input
                        type="checkbox"
                        value={d.id}
                        checked={checked}
                        onChange={() => toggleSelect(d.id)}
                        disabled={disabled}
                        aria-label={`Assign ${d.name}`}
                      />
                    </label>
                  );
                })}
              </div>
              <button className="btn btn-primary" type="submit" disabled={assignmentLocked}>Assign Selected (max 3)</button>
            </form>
            <div style={{ marginTop: 10 }}>
              <p className="muted">Assigned to {scanId}: {assignedDoctors.map(d => d.name).join(', ') || 'None'}</p>
            </div>
          </div>
          {assignmentLocked && (
            <div className="warn" style={{ borderRadius: 12 }}>
              Assignments locked because a review has already started.
            </div>
          )}
        </div>

        <div className="card warn">
          <p><strong>Note:</strong> Final reports are available only after all assigned doctor reviews are locked and AI analysis is complete.</p>
          <div className="row" style={{ marginTop: 8 }}>
            <button className="btn btn-ghost" onClick={() => navigate('/admin/final-summary')}>Open Summary</button>
            <button className="btn" onClick={() => navigate('/admin/audit')}>View Audit</button>
            <button className="btn btn-primary" onClick={resetMockData}>Reset Mock Data</button>
          </div>
        </div>
      </main>
    </div>
  );
}

