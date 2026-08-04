import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { getCodes, generateCode, deactivateCode } from '../api/codes';
import type { SignupCode } from '../api/codes';
import { getCourses } from '../api/courses';
import type { Course } from '../api/courses';
import { formatDistanceToNow, format } from 'date-fns';
import toast from 'react-hot-toast';
import { RiAddLine, RiKeyLine, RiCheckLine } from 'react-icons/ri';

const CodesPage: React.FC = () => {
  const [codes, setCodes] = useState<SignupCode[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  const [generateModal, setGenerateModal] = useState(false);
  const [studentEmail, setStudentEmail] = useState('');
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [expiresAt, setExpiresAt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [newCode, setNewCode] = useState<string | null>(null);

  const [deactivateTarget, setDeactivateTarget] = useState<string | null>(null);
  const [deactivating, setDeactivating] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [c, courses] = await Promise.all([getCodes(), getCourses()]);
        setCodes(c);
        setCourses(courses);
      } catch {
        toast.error('Failed to load signup codes.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const toggleCourse = (id: string) => {
    setSelectedCourses((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const handleGenerate = async () => {
    if (!studentEmail || !studentEmail.includes('@')) {
      toast.error('Enter a valid student email address.');
      return;
    }
    if (selectedCourses.length === 0) {
      toast.error('Select at least one course.');
      return;
    }
    setGenerating(true);
    try {
      const result = await generateCode({ email: studentEmail, grantsCourses: selectedCourses, expiresAt: expiresAt || undefined });
      setNewCode(result.code);
      const updated = await getCodes();
      setCodes(updated);
    } catch {
      toast.error('Failed to generate code.');
    } finally {
      setGenerating(false);
    }
  };

  const handleDeactivate = async () => {
    if (!deactivateTarget) return;
    setDeactivating(true);
    try {
      await deactivateCode(deactivateTarget);
      setCodes((prev) => prev.map((c) => c.code === deactivateTarget ? { ...c, isActive: false } : c));
      toast.success(`Code ${deactivateTarget} deactivated.`);
      setDeactivateTarget(null);
    } catch {
      toast.error('Failed to deactivate code.');
    } finally {
      setDeactivating(false);
    }
  };

  const getCourseTitle = (id: string) => courses.find((c) => c.id === id)?.title ?? id;

  const stats = {
    total: codes.length,
    active: codes.filter((c) => c.isActive && !c.usedBy).length,
    used: codes.filter((c) => !!c.usedBy).length,
    inactive: codes.filter((c) => !c.isActive && !c.usedBy).length,
  };

  return (
    <Layout
      title="Signup Codes"
      badge={`${codes.length} total`}
      actions={
        <button className="btn btn-primary" onClick={() => { setGenerateModal(true); setNewCode(null); setStudentEmail(''); setSelectedCourses([]); setExpiresAt(''); }}>
          <RiAddLine /> Generate Code
        </button>
      }
    >
      {/* Stats */}
      <div className="grid-stats">
        <div className="stat-card">
          <div className="stat-icon">🔑</div>
          <div><div className="stat-label">Total Codes</div><div className="stat-value">{stats.total}</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div><div className="stat-label">Unused Active</div><div className="stat-value" style={{ color: 'var(--success)' }}>{stats.active}</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">👤</div>
          <div><div className="stat-label">Used</div><div className="stat-value" style={{ color: 'var(--accent)' }}>{stats.used}</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🚫</div>
          <div><div className="stat-label">Deactivated</div><div className="stat-value" style={{ color: 'var(--text-muted)' }}>{stats.inactive}</div></div>
        </div>
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Bound Email</th>
              <th>Grants Access To</th>
              <th>Status</th>
              <th>Used By</th>
              <th>Created</th>
              <th>Expires</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="table-empty"><div className="spinner" style={{ margin: '0 auto' }} /></td></tr>
            ) : codes.length === 0 ? (
              <tr><td colSpan={8} className="table-empty">
                <RiKeyLine style={{ fontSize: 32, color: 'var(--text-muted)', marginBottom: 8 }} />
                <div>No signup codes yet. Generate your first one!</div>
              </td></tr>
            ) : codes.map((c) => {
              const isUsed = !!c.usedBy;
              const statusBadge = isUsed
                ? <span className="badge badge-accent badge-dot">Used</span>
                : c.isActive
                  ? <span className="badge badge-success badge-dot">Active</span>
                  : <span className="badge badge-neutral">Inactive</span>;

              return (
                <tr key={c.code}>
                  <td>
                    <code style={{ fontSize: 14, fontWeight: 700, letterSpacing: 1, color: 'var(--accent)', background: 'var(--accent-light)', padding: '3px 8px', borderRadius: 6 }}>
                      {c.code}
                    </code>
                  </td>
                  <td className="text-sm font-medium">
                    {c.boundEmail ?? <span className="text-muted">—</span>}
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {c.grantsCourses.map((id) => (
                        <span key={id} className="badge badge-neutral">{getCourseTitle(id)}</span>
                      ))}
                    </div>
                  </td>
                  <td>{statusBadge}</td>
                  <td className="text-sm">
                    {c.usedByName ?? (c.usedBy ? <span className="text-muted">Unknown</span> : <span className="text-muted">—</span>)}
                    {c.usedAt?._seconds && (
                      <div className="text-muted" style={{ fontSize: 11 }}>
                        {formatDistanceToNow(new Date(c.usedAt._seconds * 1000), { addSuffix: true })}
                      </div>
                    )}
                  </td>
                  <td className="text-sm text-muted">
                    {c.createdAt?._seconds ? format(new Date(c.createdAt._seconds * 1000), 'dd MMM yyyy') : '—'}
                  </td>
                  <td className="text-sm text-muted">
                    {c.expiresAt?._seconds ? format(new Date(c.expiresAt._seconds * 1000), 'dd MMM yyyy') : 'Never'}
                  </td>
                  <td>
                    {!isUsed && c.isActive && (
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => setDeactivateTarget(c.code)}
                      >
                        Deactivate
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Generate Modal */}
      <Modal
        isOpen={generateModal}
        onClose={() => { setGenerateModal(false); setNewCode(null); }}
        title="Generate Signup Code"
        subtitle="Create a one-time code bound to a specific student email."
        size="md"
      >
        {newCode ? (
          <div>
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>Your new signup code is:</div>
              <div style={{
                fontSize: 32, fontWeight: 800, letterSpacing: 4,
                color: 'var(--accent)', background: 'var(--accent-light)',
                padding: '16px 32px', borderRadius: 12, display: 'inline-block',
              }}>{newCode}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 12 }}>
                Share this code with <strong>{studentEmail}</strong>. It can only be used by this email.
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary" onClick={() => { setGenerateModal(false); setNewCode(null); }}>Done</button>
            </div>
          </div>
        ) : (
          <div>
            <div className="form-group mb-4">
              <label className="form-label">Student Email (bound to code) *</label>
              <input
                type="email"
                className="form-input"
                placeholder="student@example.com"
                value={studentEmail}
                onChange={(e) => setStudentEmail(e.target.value)}
              />
            </div>
            <div className="form-group mb-4">
              <label className="form-label">Select Courses to Grant Access *</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 200, overflowY: 'auto' }}>
                {courses.map((course) => (
                  <div
                    key={course.id}
                    className={`checkbox-item${selectedCourses.includes(course.id) ? ' selected' : ''}`}
                    onClick={() => toggleCourse(course.id)}
                  >
                    <div className="checkbox-box">
                      {selectedCourses.includes(course.id) && <RiCheckLine style={{ fontSize: 11 }} />}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{course.title}</div>
                      <div className="text-muted text-sm">{course.totalVideos} videos · {course.isPublished ? 'Published' : 'Draft'}</div>
                    </div>
                  </div>
                ))}
                {courses.length === 0 && <div className="text-muted text-sm">No courses found. Create a course first.</div>}
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Expiry Date (optional)</label>
              <input type="date" className="form-input" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setGenerateModal(false)}>Cancel</button>
              <button
                className="btn btn-primary"
                onClick={handleGenerate}
                disabled={generating || !studentEmail || selectedCourses.length === 0}
              >
                {generating ? <span className="spinner-sm spinner" /> : 'Generate Code'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Deactivate Confirm */}
      <ConfirmDialog
        isOpen={!!deactivateTarget}
        onClose={() => setDeactivateTarget(null)}
        onConfirm={handleDeactivate}
        title="Deactivate Code"
        message={`Are you sure you want to deactivate code ${deactivateTarget}? It will no longer be usable for registration.`}
        confirmLabel="Deactivate"
        loading={deactivating}
      />
    </Layout>
  );
};

export default CodesPage;
