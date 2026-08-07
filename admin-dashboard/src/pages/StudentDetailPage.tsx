import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { getStudent, updateStudent, resetDevice, deleteStudent } from '../api/students';
import type { Student, ProgressDoc } from '../api/students';
import { getCourses } from '../api/courses';
import type { Course } from '../api/courses';
import { formatDistanceToNow, format } from 'date-fns';
import toast from 'react-hot-toast';
import { RiArrowLeftLine, RiRefreshLine, RiAddLine, RiDeleteBinLine } from 'react-icons/ri';

const StudentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [student, setStudent] = useState<Student | null>(null);
  const [progress, setProgress] = useState<ProgressDoc[]>([]);
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  const [resetConfirm, setResetConfirm] = useState(false);
  const [resetting, setResetting] = useState(false);

  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [addCourseModal, setAddCourseModal] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [savingCourse, setSavingCourse] = useState(false);

  const [subExpiry, setSubExpiry] = useState('');
  const [savingExpiry, setSavingExpiry] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [{ student: s, progress: p }, courses] = await Promise.all([
          getStudent(id!),
          getCourses(),
        ]);
        setStudent(s);
        setProgress(p);
        setAllCourses(courses);
        if (s.subscriptionExpiry) {
          const d = new Date(s.subscriptionExpiry._seconds * 1000);
          setSubExpiry(d.toISOString().split('T')[0]);
        }
      } catch {
        toast.error('Failed to load student.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleDeleteStudent = async () => {
    setDeleting(true);
    try {
      await deleteStudent(id!);
      toast.success('Account deleted successfully.');
      navigate('/students');
    } catch {
      toast.error('Failed to delete account.');
    } finally {
      setDeleting(false);
    }
  };

  const handleToggleSubscription = async () => {
    if (!student) return;
    const next = !student.subscriptionActive;
    try {
      await updateStudent(id!, { subscriptionActive: next });
      setStudent({ ...student, subscriptionActive: next });
      toast.success(`Subscription ${next ? 'activated' : 'deactivated'}.`);
    } catch {
      toast.error('Failed to update subscription.');
    }
  };

  const handleSaveExpiry = async () => {
    if (!student) return;
    setSavingExpiry(true);
    try {
      await updateStudent(id!, { subscriptionExpiry: subExpiry || null });
      toast.success('Expiry date saved.');
    } catch {
      toast.error('Failed to save expiry date.');
    } finally {
      setSavingExpiry(false);
    }
  };

  const getCourseExpiryDateString = (courseId: string) => {
    const exp = student?.courseExpiries?.[courseId];
    if (!exp) return '';
    if (typeof exp === 'object' && exp !== null && '_seconds' in exp) {
      return new Date((exp as { _seconds: number })._seconds * 1000).toISOString().split('T')[0];
    }
    if (typeof exp === 'string') {
      return exp.split('T')[0];
    }
    return '';
  };

  const handleSaveCourseExpiry = async (courseId: string, newDateStr: string) => {
    if (!student) return;
    try {
      const updatedExpiries: Record<string, string | null> = {};
      if (student.courseExpiries) {
        Object.keys(student.courseExpiries).forEach((key) => {
          const val = student.courseExpiries![key];
          if (typeof val === 'string') {
            updatedExpiries[key] = val;
          } else if (val && typeof val === 'object' && '_seconds' in val) {
            updatedExpiries[key] = new Date(val._seconds * 1000).toISOString();
          }
        });
      }
      updatedExpiries[courseId] = newDateStr ? newDateStr : null;
      await updateStudent(id!, { courseExpiries: updatedExpiries });
      setStudent({ ...student, courseExpiries: updatedExpiries as any });
      toast.success('Course access expiry updated.');
    } catch {
      toast.error('Failed to update course expiry.');
    }
  };

  const handleResetDevice = async () => {
    setResetting(true);
    try {
      await resetDevice(id!);
      setStudent((s) => s ? {
        ...s,
        deviceStatus: 'active',
        registeredDeviceId: null,
        registeredDeviceName: null,
        registeredDeviceFriendlyName: null,
        attemptedDeviceId: null,
        attemptedDeviceName: null,
        attemptedDeviceFriendlyName: null,
        attemptedLoginAt: null,
      } : s);
      toast.success('Device reset. Student can now log in on any device.');
      setResetConfirm(false);
    } catch {
      toast.error('Failed to reset device.');
    } finally {
      setResetting(false);
    }
  };

  const handleAddCourse = async () => {
    if (!student || !selectedCourseId) return;
    if (student.enrolledCourses.includes(selectedCourseId)) {
      toast.error('Student is already enrolled in this course.');
      return;
    }
    setSavingCourse(true);
    try {
      const newCourses = [...student.enrolledCourses, selectedCourseId];
      await updateStudent(id!, { enrolledCourses: newCourses });
      setStudent({ ...student, enrolledCourses: newCourses });
      toast.success('Course added successfully.');
      setAddCourseModal(false);
      setSelectedCourseId('');
    } catch {
      toast.error('Failed to add course.');
    } finally {
      setSavingCourse(false);
    }
  };

  const handleRemoveCourse = async (courseId: string) => {
    if (!student) return;
    const newCourses = student.enrolledCourses.filter((c) => c !== courseId);
    try {
      await updateStudent(id!, { enrolledCourses: newCourses });
      setStudent({ ...student, enrolledCourses: newCourses });
      toast.success('Course removed.');
    } catch {
      toast.error('Failed to remove course.');
    }
  };

  const getCourseById = (cid: string) => allCourses.find((c) => c.id === cid);

  const getProgressForCourse = (courseId: string) => {
    const vids = progress.filter((p) => p.courseId === courseId);
    const completed = vids.filter((p) => p.isCompleted).length;
    const course = getCourseById(courseId);
    const total = course?.totalVideos ?? vids.length;
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { completed, total, pct };
  };

  if (loading) {
    return (
      <Layout title="Student Detail">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
          <div className="spinner" />
        </div>
      </Layout>
    );
  }

  if (!student) {
    return <Layout title="Student Not Found"><p className="text-muted">Student not found.</p></Layout>;
  }

  const unenrolledCourses = allCourses.filter((c) => !student.enrolledCourses.includes(c.id));
  const now = Date.now() / 1000;
  const isExpired = student.subscriptionExpiry && student.subscriptionExpiry._seconds < now;

  return (
    <Layout title="Student Detail" actions={
      <div className="flex items-center gap-2">
        <button className="btn btn-danger btn-header-action" onClick={() => setDeleteConfirm(true)}>
          <RiDeleteBinLine className="btn-action-icon" />
          <span>Delete Account</span>
        </button>
        <button className="btn btn-secondary btn-header-action" onClick={() => navigate('/students')}>
          <RiArrowLeftLine className="btn-action-icon" />
          <span>Back to Students</span>
        </button>
      </div>
    }>
      <div className="detail-grid">
        {/* Left column */}
        <div className="detail-section">

          {/* Profile Card */}
          <div className="card card-compact">
            <div className="flex items-center gap-3 mb-3">
              <div className="avatar" style={{ width: 44, height: 44, fontSize: 18 }}>
                {student.displayName?.[0]?.toUpperCase()}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{student.displayName}</div>
                <div className="text-muted text-xs">{student.email}</div>
                {student.studentId && (
                  <code style={{
                    display: 'inline-block',
                    marginTop: 2,
                    fontSize: 11,
                    fontFamily: 'monospace',
                    background: 'var(--bg-elevated)',
                    padding: '2px 6px',
                    borderRadius: 6,
                    color: 'var(--accent)',
                    letterSpacing: 0.5,
                    fontWeight: 700,
                  }}>
                    {student.studentId}
                  </code>
                )}
              </div>
            </div>
            <div className="divider" style={{ margin: '12px 0' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div className="info-row info-row-compact">
                <div className="info-label">Joined</div>
                <div className="info-value text-xs">
                  {student.createdAt?._seconds
                    ? format(new Date(student.createdAt._seconds * 1000), 'dd MMM yyyy')
                    : '—'}
                </div>
              </div>
              <div className="info-row info-row-compact">
                <div className="info-label">Signup Code</div>
                <div className="info-value">
                  <code style={{ fontSize: 12, background: 'var(--bg-elevated)', padding: '2px 6px', borderRadius: 4, color: 'var(--accent)' }}>
                    {student.signupCodeUsed}
                  </code>
                </div>
              </div>
              <div className="info-row info-row-compact">
                <div className="info-label">Student ID</div>
                <div className="info-value text-xs text-muted" style={{ wordBreak: 'break-all' }}>{student.id}</div>
              </div>
            </div>
          </div>

          {/* Device Card */}
          <div className="card card-compact">
            <div className="flex items-center justify-between mb-3">
              <div className="section-title" style={{ marginBottom: 0, fontSize: 14 }}>Registered Device</div>
              {student.deviceStatus === 'locked'
                ? <span className="badge badge-danger badge-dot" style={{ fontSize: 11 }}>Locked</span>
                : <span className="badge badge-success badge-dot" style={{ fontSize: 11 }}>Active</span>}
            </div>
            <div className="info-row info-row-compact">
              <div className="info-label">Device ID</div>
              <div className="info-value text-xs" style={{ wordBreak: 'break-all', color: 'var(--text-secondary)' }}>
                {student.registeredDeviceId ?? 'Not bound yet'}
              </div>
            </div>
            {student.registeredDeviceName && (
              <div className="info-row info-row-compact">
                <div className="info-label">Device Model</div>
                <div className="info-value text-xs">{student.registeredDeviceName}</div>
              </div>
            )}
            {student.registeredDeviceFriendlyName && (
              <div className="info-row info-row-compact mb-2">
                <div className="info-label">Friendly Name</div>
                <div className="info-value text-xs">{student.registeredDeviceFriendlyName}</div>
              </div>
            )}
            <button
              className="btn btn-danger btn-sm mt-2"
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={() => setResetConfirm(true)}
              disabled={!student.registeredDeviceId}
            >
              <RiRefreshLine /> Reset Device Access
            </button>
          </div>

          {/* Unauthorized Attempt Card */}
          {student.attemptedDeviceId && (
            <div className="card card-compact" style={{ borderLeft: '3px solid var(--danger)' }}>
              <div className="flex items-center gap-2 mb-3">
                <span style={{
                  width: 8, height: 8, borderRadius: '50%',
                  backgroundColor: 'var(--danger)', display: 'inline-block', flexShrink: 0
                }} />
                <div className="section-title" style={{ marginBottom: 0, fontSize: 14, color: 'var(--danger)' }}>
                  Unauthorized Login Attempt
                </div>
              </div>
              <div className="info-row info-row-compact">
                <div className="info-label">Device Model</div>
                <div className="info-value text-xs">{student.attemptedDeviceName ?? '—'}</div>
              </div>
              <div className="info-row info-row-compact">
                <div className="info-label">Friendly Name</div>
                <div className="info-value text-xs">{student.attemptedDeviceFriendlyName ?? '—'}</div>
              </div>
              <div className="info-row info-row-compact">
                <div className="info-label">Device ID</div>
                <div className="info-value text-xs" style={{ wordBreak: 'break-all', color: 'var(--text-secondary)' }}>
                  {student.attemptedDeviceId}
                </div>
              </div>
              {student.attemptedLoginAt && (
                <div className="info-row info-row-compact">
                  <div className="info-label">Attempted At</div>
                  <div className="info-value text-xs">
                    {format(new Date(student.attemptedLoginAt._seconds * 1000), 'dd MMM yyyy, HH:mm')}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Subscription Card */}
          <div className="card card-compact">
            <div className="section-title" style={{ marginBottom: 10, fontSize: 14 }}>Subscription</div>
            <div className="toggle-wrap mb-3">
              <div
                className={`toggle${student.subscriptionActive ? ' on' : ''}`}
                onClick={handleToggleSubscription}
              />
              <span className="toggle-label text-sm">
                {student.subscriptionActive ? 'Active' : 'Inactive'}
                {isExpired && ' (Expired)'}
              </span>
            </div>
            <div className="form-group">
              <label className="form-label text-xs">Expiry Date (optional)</label>
              <div className="flex gap-2">
                <input
                  type="date"
                  className="form-input text-xs"
                  style={{ padding: '6px 10px' }}
                  value={subExpiry}
                  onChange={(e) => setSubExpiry(e.target.value)}
                />
                <button className="btn btn-primary btn-sm" onClick={handleSaveExpiry} disabled={savingExpiry}>
                  {savingExpiry ? <span className="spinner-sm spinner" /> : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="detail-section">

          {/* Enrolled Courses */}
          <div className="card card-compact">
            <div className="flex items-center justify-between mb-3">
              <div className="section-title" style={{ marginBottom: 0, fontSize: 14 }}>
                Enrolled Courses ({student.enrolledCourses.length})
              </div>
              <button className="btn btn-primary btn-sm" onClick={() => setAddCourseModal(true)}>
                <RiAddLine /> Add Course
              </button>
            </div>

            {student.enrolledCourses.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '16px 0', color: 'var(--text-muted)', fontSize: 13 }}>
                No courses enrolled yet.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {student.enrolledCourses.map((courseId) => {
                  const course = getCourseById(courseId);
                  const { completed, total, pct } = getProgressForCourse(courseId);
                  const currentCourseExp = getCourseExpiryDateString(courseId);
                  const isCourseAccessExpired = currentCourseExp && new Date(currentCourseExp).getTime() < Date.now();
                  return (
                    <div key={courseId} style={{
                      background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)',
                      padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 6,
                      border: isCourseAccessExpired ? '1px solid var(--danger)' : '1px solid var(--border-subtle)',
                    }}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div style={{ fontWeight: 600, fontSize: 13.5 }}>{course?.title ?? courseId}</div>
                          {isCourseAccessExpired && <span className="badge badge-danger" style={{ fontSize: 10 }}>Expired</span>}
                        </div>
                        <button
                          className="btn-icon btn"
                          style={{ width: 28, height: 28 }}
                          onClick={() => handleRemoveCourse(courseId)}
                          title="Remove course"
                        >
                          <RiDeleteBinLine style={{ color: 'var(--danger)', fontSize: 13 }} />
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="progress-bar-wrap" style={{ flex: 1 }}>
                          <div
                            className={`progress-bar-fill${pct >= 100 ? ' complete' : ''}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted">{completed}/{total} videos · {pct}%</span>
                      </div>
                      {/* Course Specific Access Expiry Date Input */}
                      <div className="flex items-center justify-between mt-1 pt-1" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                        <span className="text-xs text-muted" style={{ fontWeight: 500 }}>
                          Access Expiry Date:
                        </span>
                        <input
                          type="date"
                          className="form-input text-xs"
                          style={{ width: 130, padding: '2px 6px', height: 26 }}
                          value={currentCourseExp}
                          onChange={(e) => handleSaveCourseExpiry(courseId, e.target.value)}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Progress Detail */}
          {progress.length > 0 && (
            <div className="card card-compact">
              <div className="section-title" style={{ marginBottom: 12, fontSize: 14 }}>
                Video Progress Detail ({progress.length})
              </div>
              <div className="table-container table-scrollable">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Video ID</th>
                      <th>Course</th>
                      <th>Playlist</th>
                      <th>Progress</th>
                      <th>Status</th>
                      <th>Last Watched</th>
                    </tr>
                  </thead>
                  <tbody>
                    {progress.map((p) => (
                      <tr key={p.videoId}>
                        <td className="text-xs" style={{ color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                          {p.videoId.slice(0, 10)}…
                        </td>
                        <td className="text-xs font-semibold">{getCourseById(p.courseId)?.title ?? p.courseId.slice(0, 8)}</td>
                        <td className="text-xs text-muted">{p.playlistId ? p.playlistId.slice(0, 8) + '…' : '—'}</td>
                        <td>
                          <div className="flex items-center gap-2">
                            <div className="progress-bar-wrap" style={{ width: 70 }}>
                              <div className={`progress-bar-fill${p.isCompleted ? ' complete' : ''}`}
                                style={{ width: `${p.percentComplete}%` }} />
                            </div>
                            <span className="text-xs text-muted">{Math.round(p.percentComplete)}%</span>
                          </div>
                        </td>
                        <td>
                          {p.isCompleted
                            ? <span className="badge badge-success" style={{ fontSize: 10 }}>Completed</span>
                            : <span className="badge badge-neutral" style={{ fontSize: 10 }}>In Progress</span>}
                        </td>
                        <td className="text-xs text-muted">
                          {p.lastWatchedAt?._seconds
                            ? formatDistanceToNow(new Date(p.lastWatchedAt._seconds * 1000), { addSuffix: true })
                            : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Course Modal */}
      <Modal
        isOpen={addCourseModal}
        onClose={() => { setAddCourseModal(false); setSelectedCourseId(''); }}
        title="Add Course Enrollment"
        subtitle="Grant this student access to an additional course."
      >
        <div className="form-group">
          <label className="form-label">Select Course</label>
          <select
            className="form-select"
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value)}
          >
            <option value="">— Select a course —</option>
            {unenrolledCourses.map((c) => (
              <option key={c.id} value={c.id}>{c.title}</option>
            ))}
          </select>
        </div>
        {unenrolledCourses.length === 0 && (
          <p className="text-muted text-sm mt-4">Student is already enrolled in all available courses.</p>
        )}
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={() => setAddCourseModal(false)}>Cancel</button>
          <button
            className="btn btn-primary"
            onClick={handleAddCourse}
            disabled={!selectedCourseId || savingCourse}
          >
            {savingCourse ? <span className="spinner-sm spinner" /> : 'Add Course'}
          </button>
        </div>
      </Modal>

      {/* Reset Device Confirm */}
      <ConfirmDialog
        isOpen={resetConfirm}
        onClose={() => setResetConfirm(false)}
        onConfirm={handleResetDevice}
        title="Reset Device Binding"
        message="This will clear the student's registered device and session token. They will be able to log in on any device. This action cannot be undone."
        confirmLabel="Reset Device"
        loading={resetting}
      />

      {/* Delete Account Confirm */}
      <ConfirmDialog
        isOpen={deleteConfirm}
        onClose={() => setDeleteConfirm(false)}
        onConfirm={handleDeleteStudent}
        title="Delete Student Account"
        message={`Are you sure you want to delete the account for ${student.displayName} (${student.email})? This will permanently remove their Firebase Auth user and Firestore student record.`}
        confirmLabel="Delete Account"
        loading={deleting}
      />
    </Layout>
  );
};

export default StudentDetailPage;
