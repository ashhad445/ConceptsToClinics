import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import Modal from '../components/Modal';
import { ImageUploadInput } from '../components/ImageUploadInput';
import { getCourses, createCourse } from '../api/courses';
import type { Course } from '../api/courses';
import { getPublicVersionConfig, updateVersionConfig } from '../api/config';
import type { VersionConfig } from '../api/config';
import toast from 'react-hot-toast';
import { RiAddLine, RiBookOpenLine, RiSmartphoneLine } from 'react-icons/ri';

const CoursesPage: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModal, setCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [versionModal, setVersionModal] = useState(false);
  const [updatingVersion, setUpdatingVersion] = useState(false);
  const [versionForm, setVersionForm] = useState<VersionConfig>({
    minRequiredVersion: '1.0.0',
    latestVersion: '1.0.0',
    downloadUrl: 'https://play.google.com/store/apps/details?id=com.conceptstoclinics.app',
    message: 'A required update for Concepts To Clinics is available. Please update the app to continue.',
  });
  const navigate = useNavigate();

  const [form, setForm] = useState({ title: '', description: '', thumbnail: '', order: '1', durationDays: '365' });

  useEffect(() => {
    const load = async () => {
      try {
        setCourses(await getCourses());
      } catch {
        toast.error('Failed to load courses.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const openVersionModal = async () => {
    try {
      const cfg = await getPublicVersionConfig();
      setVersionForm(cfg);
      setVersionModal(true);
    } catch {
      toast.error('Failed to load version configuration.');
    }
  };

  const handleUpdateVersion = async () => {
    setUpdatingVersion(true);
    try {
      await updateVersionConfig(versionForm);
      toast.success('App Version settings updated!');
      setVersionModal(false);
    } catch {
      toast.error('Failed to update app version settings.');
    } finally {
      setUpdatingVersion(false);
    }
  };

  const handleCreate = async () => {
    if (!form.title || !form.description || !form.thumbnail) {
      toast.error('All fields are required.');
      return;
    }
    setCreating(true);
    try {
      await createCourse({ ...form, order: Number(form.order), durationDays: Number(form.durationDays || '365') });
      toast.success('Course created!');
      setCourses(await getCourses());
      setCreateModal(false);
      setForm({ title: '', description: '', thumbnail: '', order: '1', durationDays: '365' });
    } catch {
      toast.error('Failed to create course.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <Layout
      title="Courses"
      badge={`${courses.length} courses`}
      actions={
        <div className="flex gap-2">
          <button className="btn btn-secondary" onClick={openVersionModal}>
            <RiSmartphoneLine /> App Version Control
          </button>
          <button className="btn btn-primary" onClick={() => setCreateModal(true)}>
            <RiAddLine /> New Course
          </button>
        </div>
      }
    >
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
          <div className="spinner" />
        </div>
      ) : courses.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-muted)' }}>
          <RiBookOpenLine style={{ fontSize: 48, marginBottom: 12, color: 'var(--border-subtle)' }} />
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>No courses yet</div>
          <div style={{ fontSize: 13, marginBottom: 20 }}>Create your first course to get started.</div>
          <button className="btn btn-primary" onClick={() => setCreateModal(true)}><RiAddLine /> Create Course</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
          {courses.map((course) => (
            <div key={course.id} className="course-card" onClick={() => navigate(`/courses/${course.id}`)}>
              <img
                className="course-thumb"
                src={course.thumbnail}
                alt={course.title}
                onError={(e) => { (e.target as HTMLImageElement).src = `https://via.placeholder.com/300x180/1E293B/6366F1?text=${encodeURIComponent(course.title)}`; }}
              />
              <div className="course-card-body">
                <div className="flex items-center justify-between mb-2">
                  <div className="course-card-title">{course.title}</div>
                  {course.isPublished
                    ? <span className="badge badge-success">Published</span>
                    : <span className="badge badge-warning">Draft</span>}
                </div>
                <div className="course-card-desc">{course.description}</div>
                <div className="course-card-footer">
                  <span className="text-sm text-muted">{course.totalVideos} videos</span>
                  <span className="text-sm text-muted">Order #{course.order}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Modal
        isOpen={createModal}
        onClose={() => setCreateModal(false)}
        title="Create New Course"
        subtitle="Courses start as drafts. Publish them when they're ready."
        size="md"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label className="form-label">Course Title</label>
            <input className="form-input" placeholder="e.g. Biology 101" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-input" placeholder="What will students learn?" rows={3}
              value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
              style={{ resize: 'vertical' }} />
          </div>
          <ImageUploadInput
            value={form.thumbnail}
            onChange={(url) => setForm({ ...form, thumbnail: url })}
          />
          <div className="form-group">
            <label className="form-label">Display Order</label>
            <input type="number" className="form-input" min={1} value={form.order} onChange={(e) => setForm({ ...form, order: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Access Duration per Student (Days)</label>
            <input type="number" className="form-input" min={0} placeholder="e.g. 180 (0 = unlimited, default 365)" value={form.durationDays} onChange={(e) => setForm({ ...form, durationDays: e.target.value })} />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={() => setCreateModal(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleCreate} disabled={creating}>
            {creating ? <span className="spinner-sm spinner" /> : 'Create Course'}
          </button>
        </div>
      </Modal>

      {/* App Version Control Modal */}
      <Modal
        isOpen={versionModal}
        onClose={() => setVersionModal(false)}
        title="Mobile App Version Control"
        subtitle="Enforce minimum required app version for all students."
        size="md"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label className="form-label">Minimum Required App Version</label>
            <input
              className="form-input"
              placeholder="e.g. 1.0.1"
              value={versionForm.minRequiredVersion}
              onChange={(e) => setVersionForm({ ...versionForm, minRequiredVersion: e.target.value })}
            />
            <span className="text-xs text-muted mt-1">
              Students running a version lower than this will be hard-gated with a non-dismissible Update screen.
            </span>
          </div>

          <div className="form-group">
            <label className="form-label">Latest Version</label>
            <input
              className="form-input"
              placeholder="e.g. 1.0.1"
              value={versionForm.latestVersion}
              onChange={(e) => setVersionForm({ ...versionForm, latestVersion: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Update Download URL</label>
            <input
              className="form-input"
              placeholder="Google Play or direct APK download link"
              value={versionForm.downloadUrl}
              onChange={(e) => setVersionForm({ ...versionForm, downloadUrl: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Update Prompt Message</label>
            <textarea
              className="form-input"
              rows={3}
              placeholder="Message shown to students on the update screen..."
              value={versionForm.message}
              onChange={(e) => setVersionForm({ ...versionForm, message: e.target.value })}
            />
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={() => setVersionModal(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleUpdateVersion} disabled={updatingVersion}>
            {updatingVersion ? <span className="spinner-sm spinner" /> : 'Save Version Settings'}
          </button>
        </div>
      </Modal>
    </Layout>
  );
};

export default CoursesPage;
