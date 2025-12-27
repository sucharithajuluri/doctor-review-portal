import { createContext, useContext, useMemo, useState } from 'react';

const ReviewContext = createContext(null);

const initialDoctors = [
  { id: '1', name: 'Doctor 1', email: 'doctor1@example.com', password: 'pass1' },
  { id: '2', name: 'Doctor 2', email: 'doctor2@example.com', password: 'pass2' },
  { id: '3', name: 'Doctor 3', email: 'doctor3@example.com', password: 'pass3' },
];

const initialReviews = [
  { doctorId: '1', condition: '', confidence: '', notes: '', status: 'Not Started', updatedAt: null },
  { doctorId: '2', condition: '', confidence: '', notes: '', status: 'Not Started', updatedAt: null },
  { doctorId: '3', condition: '', confidence: '', notes: '', status: 'Not Started', updatedAt: null },
];

const initialLogs = [
  { timestamp: new Date().toISOString(), actor: 'System', action: 'Scan Ingested', scanId: 'SCN-2024-001' },
  { timestamp: new Date().toISOString(), actor: 'System', action: 'Scan Assigned', scanId: 'SCN-2024-001' },
];

const initialAssignments = [{ scanId: 'SCN-2024-001', doctorIds: ['1', '2', '3'] }];
const maxAssignedDoctors = 3;
const adminAccount = { email: 'admin@demo.com', password: 'admin123' };

export function ReviewProvider({ children }) {
  const [activeDoctorId, setActiveDoctorId] = useState('1');
  const [loggedDoctorId, setLoggedDoctorId] = useState(null);
  const [doctors, setDoctors] = useState(initialDoctors);
  const [reviews, setReviews] = useState(initialReviews);
  const [assignments, setAssignments] = useState(initialAssignments);
  const [auditLogs, setAuditLogs] = useState(initialLogs);
  const [aiResult, setAiResult] = useState(null);
  const [finalResult, setFinalResult] = useState(null);

  const scanId = 'SCN-2024-001';

  const addLog = (actor, action) => {
    setAuditLogs((prev) => [
      ...prev,
      { timestamp: new Date().toISOString(), actor, action, scanId },
    ]);
  };

  const getAssignedDoctorIds = () => {
    const match = assignments.find((a) => a.scanId === scanId);
    return match ? match.doctorIds : [];
  };

  const isDoctorAssigned = (doctorId) => getAssignedDoctorIds().includes(doctorId);

  const assignmentLocked = reviews.some((r) => r.status !== 'Not Started');

  const checkAndRunAI = (incoming) => {
    const lockedCount = incoming.filter((r) => r.status === 'Locked' && isDoctorAssigned(r.doctorId)).length;
    const assignedCount = getAssignedDoctorIds().length;
    if (assignedCount > 0 && lockedCount === assignedCount && !aiResult) {
      setAiResult({
        condition: 'Acne Vulgaris',
        confidence: 'High',
        notes:
          'Detected multiple inflammatory lesions and comedones. Pattern consistent with moderate acne vulgaris.',
      });
      addLog('System', 'AI Executed');
      setFinalResult('Match');
      addLog('System', 'Final Result Locked');
    }
  };

  const updateReview = (doctorId, updates) => {
    setReviews((prev) => {
      const next = prev.map((r) => (r.doctorId === doctorId ? { ...r, ...updates } : r));
      checkAndRunAI(next);
      return next;
    });
  };

  const saveDraft = ({ doctorId, condition, confidence, notes }) => {
    updateReview(doctorId, {
      condition,
      confidence,
      notes,
      status: 'Draft',
      updatedAt: new Date().toISOString(),
    });
    addLog(`Doctor ${doctorId}`, 'Draft Saved');
  };

  const submitReview = ({ doctorId, condition, confidence, notes }) => {
    updateReview(doctorId, {
      condition,
      confidence,
      notes,
      status: 'Locked',
      updatedAt: new Date().toISOString(),
    });
    addLog(`Doctor ${doctorId}`, 'Review Submitted');
  };

  const addDoctor = ({ name, email, password }) => {
    if (assignmentLocked) return null;
    const id = String(doctors.length + 1);
    const newDoc = { id, name: name || `Doctor ${id}`, email, password };
    setDoctors((prev) => [...prev, newDoc]);
    setReviews((prev) => [...prev, { doctorId: id, condition: '', confidence: '', notes: '', status: 'Not Started', updatedAt: null }]);
    addLog('System', 'Doctor Added');
    return newDoc;
  };

  const assignDoctorToScan = (doctorId) => {
    if (assignmentLocked) return false;
    setAssignments((prev) => {
      const existing = prev.find((a) => a.scanId === scanId);
      if (existing) {
        if (existing.doctorIds.includes(doctorId)) return prev;
        if (existing.doctorIds.length >= maxAssignedDoctors) return prev;
        return prev.map((a) =>
          a.scanId === scanId ? { ...a, doctorIds: [...a.doctorIds, doctorId] } : a
        );
      }
      return [{ scanId, doctorIds: [doctorId] }];
    });
    addLog('System', 'Scan Assigned');
    return true;
  };

  const unassignDoctorFromScan = (doctorId) => {
    if (assignmentLocked) return false;
    setAssignments((prev) =>
      prev.map((a) =>
        a.scanId === scanId
          ? { ...a, doctorIds: a.doctorIds.filter((id) => id !== doctorId) }
          : a
      )
    );
    addLog('System', 'Scan Assigned');
    return true;
  };

  const setAssignmentsForScan = (doctorIds) => {
    if (assignmentLocked) return false;
    const limited = doctorIds.slice(0, maxAssignedDoctors);
    setAssignments([{ scanId, doctorIds: limited }]);
    addLog('System', 'Scan Assigned');
    return true;
  };

  const resetMockData = () => {
    setActiveDoctorId('1');
    setDoctors(initialDoctors);
    setReviews(initialReviews);
    setAssignments(initialAssignments);
    setAuditLogs(initialLogs);
    setAiResult(null);
    setFinalResult(null);
    addLog('System', 'Mock Data Reset');
  };

  const authenticate = (email, password) => {
    const user = email.trim().toLowerCase();
    const pass = (password || '').trim();
    if (user === adminAccount.email && pass === adminAccount.password) {
      return { role: 'admin' };
    }
    const doc = doctors.find((d) => d.email.toLowerCase() === user && d.password === pass);
    if (!doc) return null;
    if (!isDoctorAssigned(doc.id)) return null;
    return { role: 'doctor', doctorId: doc.id };
  };

  const assignedDoctors = doctors.filter((d) => isDoctorAssigned(d.id));

  const value = useMemo(
    () => ({
      activeDoctorId,
      setActiveDoctorId,
      loggedDoctorId,
      setLoggedDoctorId,
      scanId,
      reviews,
      doctors,
      assignedDoctors,
      auditLogs,
      aiResult,
      finalResult,
      isDoctorAssigned,
      assignmentLocked,
      authenticate,
      addDoctor,
      assignDoctorToScan,
      unassignDoctorFromScan,
      setAssignmentsForScan,
      resetMockData,
      getAssignedDoctorIds,
      getReviewByDoctor: (doctorId) =>
        reviews.find((r) => r.doctorId === doctorId) || {
          doctorId,
          condition: '',
          confidence: '',
          notes: '',
          status: 'Not Started',
          updatedAt: null,
        },
      saveDraft,
      submitReview,
      completionCount: reviews.filter((r) => r.status === 'Locked' && isDoctorAssigned(r.doctorId)).length,
    }),
    [activeDoctorId, reviews, auditLogs, aiResult, finalResult, doctors, assignments]
  );

  return <ReviewContext.Provider value={value}>{children}</ReviewContext.Provider>;
}

export function useReviewContext() {
  const ctx = useContext(ReviewContext);
  if (!ctx) throw new Error('useReviewContext must be used within ReviewProvider');
  return ctx;
}

