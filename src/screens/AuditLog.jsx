import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useReviewContext } from '../state/ReviewContext';

const actionOptions = [
  'Scan Ingested',
  'Draft Saved',
  'Review Submitted',
  'AI Executed',
  'Final Result Generated',
];

export default function AuditLog() {
  const navigate = useNavigate();
  const { auth, logout, getCurrentScanId, getAdminAudit } = useReviewContext();
  const scanId = getCurrentScanId();
  const [auditLogs, setAuditLogs] = useState([]);
  const [pageError, setPageError] = useState('');
  const [filterActor, setFilterActor] = useState('all');
  const [filterAction, setFilterAction] = useState('all');
  const [preset, setPreset] = useState('all');

  useEffect(() => {
    if (auth.role !== 'ADMIN') {
      navigate('/login', { replace: true });
    }
  }, [auth.role, navigate]);

  useEffect(() => {
    if (auth.role !== 'ADMIN') return;
    setPageError('');
    getAdminAudit(scanId)
      .then((rows) => {
        const mapped = (rows || []).map((l) => {
          let actor = 'System';
          if (l.actorRole === 'DOCTOR') {
            if (l.actorId === 'DOCTOR-1') actor = 'Doctor 1';
            else if (l.actorId === 'DOCTOR-2') actor = 'Doctor 2';
            else if (l.actorId === 'DOCTOR-3') actor = 'Doctor 3';
            else actor = `Doctor ${l.actorId}`;
          }
          if (l.actorRole === 'SYSTEM') actor = 'System';
          return {
            timestamp: l.timestamp,
            actor,
            action: l.action,
            scanId: l.scanId,
          };
        });
        setAuditLogs(mapped);
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
        setPageError('Unable to load audit log.');
      });
  }, [auth.role, getAdminAudit, logout, navigate, scanId]);

  const filtered = useMemo(() => {
    let list = auditLogs;
    if (preset === 'system') list = list.filter((l) => l.actor === 'System');
    if (preset === 'doctors') list = list.filter((l) => l.actor.startsWith('Doctor'));
    if (preset === 'ai') list = list.filter((l) => l.actor === 'AI');
    list = list.filter((log) => {
      if (filterActor !== 'all' && !log.actor.includes(filterActor)) return false;
      if (filterAction !== 'all' && log.action !== filterAction) return false;
      return true;
    });
    return list;
  }, [auditLogs, preset, filterActor, filterAction]);

  const colorForAction = (action) => {
    switch (action) {
      case 'Scan Ingested': return 'badge badge-info';
      case 'Draft Saved': return 'badge badge-warn';
      case 'Review Submitted': return 'badge badge-success';
      case 'AI Executed': return 'badge badge-muted';
      case 'Final Result Generated': return 'badge badge-success';
      default: return 'badge badge-muted';
    }
  };

  return (
    <div className="page">
      <header className="header">
        <div className="header-inner">
          <div className="row">
            <button className="btn" onClick={() => window.history.back()}>Back</button>
            <div>
              <h1>Audit Log</h1>
              <p className="muted">Complete system activity timeline</p>
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
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="row" style={{ gap: 16, alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div className="form-field">
              <label className="form-label" htmlFor="preset">Preset</label>
              <select id="preset" className="select" value={preset} onChange={(e) => setPreset(e.target.value)}>
                <option value="all">All</option>
                <option value="system">System</option>
                <option value="doctors">Doctors</option>
                <option value="ai">AI</option>
              </select>
            </div>
            <div className="form-field">
              <label className="form-label" htmlFor="actor">Actor</label>
              <select id="actor" className="select" value={filterActor} onChange={(e) => setFilterActor(e.target.value)}>
                <option value="all">All Actors</option>
                <option value="System">System</option>
                <option value="Doctor 1">Doctor 1</option>
                <option value="Doctor 2">Doctor 2</option>
                <option value="Doctor 3">Doctor 3</option>
              </select>
            </div>
            <div className="form-field">
              <label className="form-label" htmlFor="action">Action</label>
              <select id="action" className="select" value={filterAction} onChange={(e) => setFilterAction(e.target.value)}>
                <option value="all">All Actions</option>
                {actionOptions.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Actor</th>
                  <th>Action</th>
                  <th>Scan ID</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((log, idx) => (
                  <tr key={idx}>
                    <td>{new Date(log.timestamp).toLocaleString()}</td>
                    <td>
                      <span className={
                        log.actor === 'System'
                          ? 'badge badge-muted'
                          : 'badge badge-info'
                      }>
                        {log.actor}
                      </span>
                    </td>
                    <td><span className={colorForAction(log.action)}>{log.action}</span></td>
                    <td>{log.scanId}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="card" style={{ marginTop: 12 }}>
          <p><strong>Note:</strong> All actions are logged chronologically for compliance. This log is read-only.</p>
        </div>
      </main>
    </div>
  );
}

