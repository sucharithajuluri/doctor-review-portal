import { createContext, useContext, useMemo, useState } from 'react';
import { api } from '../api/api';

const ReviewContext = createContext(null);

export function ReviewProvider({ children }) {
  const [token, setToken] = useState(() => api.getToken());
  const [auth, setAuth] = useState(() => {
    const t = api.getToken();
    const payload = t ? api.parseJwt(t) : null;
    return payload?.role && payload?.userId ? { role: payload.role, userId: payload.userId } : { role: null, userId: null };
  });

  const login = async (email, password) => {
    const res = await api.request('/auth/login', { method: 'POST', body: { email, password } });
    const t = res?.token || '';
    const payload = t ? api.parseJwt(t) : null;
    if (!t || !payload?.role || !payload?.userId) return null;
    api.setToken(t);
    setToken(t);
    setAuth({ role: payload.role, userId: payload.userId });
    return { role: payload.role, userId: payload.userId };
  };

  const logout = () => {
    api.setToken('');
    setToken('');
    setAuth({ role: null, userId: null });
  };

  const getCurrentScanId = () => sessionStorage.getItem('currentScanId') || 'SCN-2024-001';

  const getMyReviews = async () => {
    const res = await api.request('/reviews/my', { method: 'GET', token });
    return res?.reviews || [];
  };

  const saveDraft = async ({ scanId, condition, confidence, notes }) => {
    const body = {
      scanId,
      conditionTier1: condition,
      confidenceLevel: api.toApiConfidence(confidence),
      notes,
    };
    const res = await api.request('/reviews/draft', { method: 'POST', token, body });
    return res?.review || null;
  };

  const submitReview = async ({ scanId }) => {
    const res = await api.request('/reviews/submit', { method: 'POST', token, body: { scanId } });
    return res?.review || null;
  };

  const getScan = async (scanId) => {
    const res = await api.request(`/scans/${encodeURIComponent(scanId)}`, { method: 'GET', token });
    return res?.scan || null;
  };

  const getAdminScans = async () => {
    const res = await api.request('/admin/scans', { method: 'GET', token });
    return res || { scans: [] };
  };

  const getAdminFinal = async (scanId) => {
    const res = await api.request(`/admin/final/${encodeURIComponent(scanId)}`, { method: 'GET', token });
    return res || null;
  };

  const getAdminAudit = async (scanId) => {
    const res = await api.request(`/admin/audit/${encodeURIComponent(scanId)}`, { method: 'GET', token });
    return res?.audit || [];
  };

  const value = useMemo(
    () => ({
      auth,
      token,
      login,
      logout,
      getCurrentScanId,
      getMyReviews,
      saveDraft,
      submitReview,
      getScan,
      getAdminScans,
      getAdminFinal,
      getAdminAudit,
      fromApiConfidence: api.fromApiConfidence,
    }),
    [auth, token]
  );

  return <ReviewContext.Provider value={value}>{children}</ReviewContext.Provider>;
}

export function useReviewContext() {
  const ctx = useContext(ReviewContext);
  if (!ctx) throw new Error('useReviewContext must be used within ReviewProvider');
  return ctx;
}

