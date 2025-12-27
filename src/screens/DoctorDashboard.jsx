import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useReviewContext } from '../state/ReviewContext';

const statusClass = (status) => {
  if (status === 'Locked' || status === 'Submitted') return 'badge badge-success';
  if (status === 'Draft') return 'badge badge-warn';
  return 'badge badge-muted';
};

export default function DoctorDashboard() {
  const navigate = useNavigate();
  const { activeDoctorId, setActiveDoctorId, getReviewByDoctor, scanId, assignedDoctors, loggedDoctorId } = useReviewContext();
  const effectiveDoctorId = loggedDoctorId || activeDoctorId;
  const review = getReviewByDoctor(effectiveDoctorId);
  const isAssigned = assignedDoctors.some((d) => d.id === effectiveDoctorId);
  const displayDoctor = assignedDoctors.find((d) => d.id === effectiveDoctorId);

  useEffect(() => {
    if (loggedDoctorId && assignedDoctors.some((d) => d.id === loggedDoctorId)) {
      setActiveDoctorId(loggedDoctorId);
      return;
    }
    if (assignedDoctors.length && !assignedDoctors.find(d => d.id === effectiveDoctorId)) {
      setActiveDoctorId(assignedDoctors[0].id);
    }
  }, [assignedDoctors, effectiveDoctorId, setActiveDoctorId, loggedDoctorId]);

  const handleOpen = () => {
    sessionStorage.setItem('currentScanId', scanId);
    sessionStorage.setItem('currentStatus', review.status);
    navigate('/doctor/review');
  };
  const handleLogout = () => {
    navigate('/login');
  };

  return (
    <div className="page">
      <header className="header">
        <div className="header-inner">
          <div>
            <h1>My Reviews</h1>
            <p className="muted">Independent clinical assessments</p>
            {displayDoctor && <p className="muted">Signed in as {displayDoctor.name}</p>}
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
                <td><span className={statusClass(review.status)}>{review.status}</span></td>
                <td>{review.status === 'Draft' ? <span className="badge badge-warn">Resume draft</span> : '—'}</td>
                <td>
                  {!isAssigned ? (
                    <span className="muted">Not assigned</span>
                  ) : review.status === 'Locked' ? (
                    <span className="muted">Locked</span>
                  ) : (
                    <button className="btn btn-primary" onClick={handleOpen}>
                      {review.status === 'Draft' ? 'Continue' : 'Start Review'}
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

