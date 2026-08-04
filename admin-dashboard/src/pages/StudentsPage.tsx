import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { getStudents } from '../api/students';
import type { Student } from '../api/students';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import { RiSearchLine, RiUserLine } from 'react-icons/ri';

type Filter = 'all' | 'active' | 'locked' | 'expired';

const StudentsPage: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getStudents();
        setStudents(data);
      } catch {
        toast.error('Failed to load students.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = useMemo(() => {
    return students.filter((s) => {
      const matchSearch =
        search === '' ||
        s.displayName.toLowerCase().includes(search.toLowerCase()) ||
        s.email.toLowerCase().includes(search.toLowerCase()) ||
        (s.studentId ?? '').toLowerCase().includes(search.toLowerCase());

      const now = Date.now() / 1000;
      const isExpired = s.subscriptionExpiry && s.subscriptionExpiry._seconds < now;
      const matchFilter =
        filter === 'all' ||
        (filter === 'active' && s.subscriptionActive && !isExpired && s.deviceStatus === 'active') ||
        (filter === 'locked' && s.deviceStatus === 'locked') ||
        (filter === 'expired' && isExpired);

      return matchSearch && matchFilter;
    });
  }, [students, filter, search]);

  const counts = useMemo(() => {
    const now = Date.now() / 1000;
    return {
      all: students.length,
      active: students.filter((s) => s.subscriptionActive && s.deviceStatus === 'active' && (!s.subscriptionExpiry || s.subscriptionExpiry._seconds > now)).length,
      locked: students.filter((s) => s.deviceStatus === 'locked').length,
      expired: students.filter((s) => s.subscriptionExpiry && s.subscriptionExpiry._seconds < now).length,
    };
  }, [students]);

  return (
    <Layout
      title="Students"
      badge={`${students.length} total`}
    >
      {/* Stats Row */}
      <div className="grid-stats">
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div>
            <div className="stat-label">Total Students</div>
            <div className="stat-value">{counts.all}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div>
            <div className="stat-label">Active</div>
            <div className="stat-value" style={{ color: 'var(--success)' }}>{counts.active}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🔒</div>
          <div>
            <div className="stat-label">Device Locked</div>
            <div className="stat-value" style={{ color: 'var(--danger)' }}>{counts.locked}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⏰</div>
          <div>
            <div className="stat-label">Expired</div>
            <div className="stat-value" style={{ color: 'var(--warning)' }}>{counts.expired}</div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4">
        <div className="filter-tabs">
          {(['all', 'active', 'locked', 'expired'] as Filter[]).map((f) => (
            <button key={f} className={`filter-tab${filter === f ? ' active' : ''}`} onClick={() => setFilter(f)}>
              {f.charAt(0).toUpperCase() + f.slice(1)} ({counts[f]})
            </button>
          ))}
        </div>
        <div className="search-wrap">
          <RiSearchLine className="search-icon" />
          <input
            className="search-input"
            placeholder="Search by name, ID or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Student</th>
              <th>Student ID</th>
              <th>Device Status</th>
              <th>Subscription</th>
              <th>Enrolled Courses</th>
              <th>Code Used</th>
              <th>Joined</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="table-empty">
                  <div className="spinner" style={{ margin: '0 auto' }} />
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="table-empty">
                  <RiUserLine style={{ fontSize: 32, color: 'var(--text-muted)', marginBottom: 8 }} />
                  <div>No students found</div>
                </td>
              </tr>
            ) : filtered.map((s) => {
              const now = Date.now() / 1000;
              const isExpired = s.subscriptionExpiry && s.subscriptionExpiry._seconds < now;
              return (
                <tr key={s.id} className="clickable" onClick={() => navigate(`/students/${s.id}`)}>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="avatar">{s.displayName?.[0]?.toUpperCase() || '?'}</div>
                      <div>
                        <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                          {s.displayName}
                          {s.isAuthOnly && <span className="badge badge-warning" style={{ fontSize: 10 }}>Auth Account</span>}
                        </div>
                        <div className="text-muted text-sm">{s.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    {s.studentId
                      ? <code style={{ fontSize: 12, fontFamily: 'monospace', background: 'var(--bg-elevated)', padding: '3px 8px', borderRadius: 6, color: 'var(--text-secondary)', letterSpacing: 0.5 }}>{s.studentId}</code>
                      : <span className="text-muted text-sm">—</span>}
                  </td>
                  <td>
                    {s.deviceStatus === 'locked'
                      ? <span className="badge badge-danger badge-dot">Locked</span>
                      : <span className="badge badge-success badge-dot">Active</span>}
                  </td>
                  <td>
                    {!s.subscriptionActive
                      ? <span className="badge badge-neutral">Inactive</span>
                      : isExpired
                        ? <span className="badge badge-warning badge-dot">Expired</span>
                        : <span className="badge badge-success badge-dot">Active</span>}
                  </td>
                  <td>
                    <span className="badge badge-accent">{s.enrolledCourses?.length ?? 0} courses</span>
                  </td>
                  <td>
                    <code style={{ fontSize: 12, background: 'var(--bg-elevated)', padding: '2px 6px', borderRadius: 4, color: 'var(--accent)' }}>
                      {s.signupCodeUsed}
                    </code>
                  </td>
                  <td className="text-muted text-sm">
                    {s.createdAt?._seconds
                      ? formatDistanceToNow(new Date(s.createdAt._seconds * 1000), { addSuffix: true })
                      : '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Layout>
  );
};

export default StudentsPage;
