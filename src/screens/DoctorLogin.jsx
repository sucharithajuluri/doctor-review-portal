import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useReviewContext } from '../state/ReviewContext';

export default function DoctorLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { setActiveDoctorId, setLoggedDoctorId, authenticate } = useReviewContext();

  const handleLogin = (e) => {
    e.preventDefault();
    setError('');
    const auth = authenticate(username, password);
    if (!auth) {
      setError('Invalid credentials or not assigned.');
      return;
    }
    if (auth.role === 'admin') {
      navigate('/admin/dashboard');
    } else {
      setActiveDoctorId(auth.doctorId);
      setLoggedDoctorId(auth.doctorId);
      navigate('/doctor/dashboard');
    }
  };

  return (
    <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div className="card" style={{ width: '100%', maxWidth: 420, padding: 32 }}>
        <div className="center" style={{ marginBottom: 28 }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#e0e7ff', display: 'grid', placeItems: 'center', margin: '0 auto 18px' }}>
            <span role="img" aria-label="lock">🔒</span>
          </div>
          <h2 style={{ marginBottom: 4 }}>Clinical Review Portal</h2>
          <p className="muted">Secure provider access</p>
        </div>

        <form className="stack" onSubmit={handleLogin}>
          <div className="form-field">
            <label className="form-label" htmlFor="username">Username</label>
            <input
              id="username"
              className="input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder='e.g. doctor01 or admin01'
              required
            />
          </div>
          <div className="form-field">
            <label className="form-label" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              required
            />
          </div>
          {error && <div style={{ color: '#ef4444', fontWeight: 600 }}>{error}</div>}
          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 6 }}>
            Sign In
          </button>
        </form>
        <div style={{ marginTop: 18, paddingTop: 18, borderTop: `1px solid #e2e8f0`, textAlign: 'center' }}>
          <p className="muted">Demo creds: doctor1@example.com / pass1 (doctor2/3 likewise). Admin: admin@demo.com / admin123.</p>
        </div>
      </div>
    </div>
  );
}

