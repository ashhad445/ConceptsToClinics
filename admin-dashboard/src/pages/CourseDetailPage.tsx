import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import Modal from '../components/Modal';
import { ImageUploadInput } from '../components/ImageUploadInput';
import ConfirmDialog from '../components/ConfirmDialog';
import {
  getCourses, updateCourse,
  getCoursePlaylists, createPlaylist, updatePlaylist, deletePlaylist,
  getPlaylistVideos, createVideo, updateVideo, deleteVideo,
} from '../api/courses';
import type { Course, Playlist, Video } from '../api/courses';
import { useUploadManager } from '../context/UploadContext';
import toast from 'react-hot-toast';
import {
  RiArrowLeftLine, RiAddLine, RiEditLine, RiDeleteBinLine,
  RiArrowUpLine, RiArrowDownLine, RiEyeLine, RiEyeOffLine,
  RiPlayListLine, RiArrowDownSLine, RiArrowUpSLine,
} from 'react-icons/ri';

// ─── Local types ──────────────────────────────────────────────────────────────

interface PlaylistWithVideos extends Playlist {
  videos: Video[];
  expanded: boolean;
  videosLoaded: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

const CourseDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { startUpload } = useUploadManager();

  const [course, setCourse] = useState<Course | null>(null);
  const [playlists, setPlaylists] = useState<PlaylistWithVideos[]>([]);
  const [loading, setLoading] = useState(true);

  // ── Course edit modal state ────────────────────────────────────────────────
  const [editCourseModal, setEditCourseModal] = useState(false);
  const [courseForm, setCourseForm] = useState({ title: '', description: '', thumbnail: '', order: '1' });
  const [savingCourse, setSavingCourse] = useState(false);
  const [togglingPublish, setTogglingPublish] = useState(false);

  // ── Playlist modal state ───────────────────────────────────────────────────
  const [playlistModal, setPlaylistModal] = useState(false);
  const [editingPlaylist, setEditingPlaylist] = useState<PlaylistWithVideos | null>(null);
  const [playlistForm, setPlaylistForm] = useState({ title: '', description: '', order: '1' });
  const [savingPlaylist, setSavingPlaylist] = useState(false);

  // ── Delete playlist confirm ────────────────────────────────────────────────
  const [deletePlaylistTarget, setDeletePlaylistTarget] = useState<string | null>(null);
  const [deletingPlaylist, setDeletingPlaylist] = useState(false);

  // ── Video modal state ──────────────────────────────────────────────────────
  const [videoModal, setVideoModal] = useState(false);
  const [activePlaylistId, setActivePlaylistId] = useState<string | null>(null);
  const [editingVideo, setEditingVideo] = useState<Video | null>(null);
  const [videoForm, setVideoForm] = useState({ title: '', description: '', bunnyVideoGuid: '', order: '1', isFreePreview: false });
  const [savingVideo, setSavingVideo] = useState(false);

  // ── Delete video confirm ───────────────────────────────────────────────────
  const [deleteVideoTarget, setDeleteVideoTarget] = useState<{ playlistId: string; videoId: string } | null>(null);
  const [deletingVideo, setDeletingVideo] = useState(false);

  // ─── Load ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    const load = async () => {
      try {
        let pls: Playlist[] = [];
        const courses = await getCourses();
        const c = courses.find((c) => c.id === id);
        if (c) {
          setCourse(c);
          setCourseForm({ title: c.title, description: c.description, thumbnail: c.thumbnail, order: String(c.order) });
          try {
            pls = await getCoursePlaylists(id!);
          } catch {
            console.warn('[CourseDetailPage] Could not load playlists (cloud function endpoint may be updating)');
          }
          setPlaylists(pls.map((p) => ({ ...p, videos: [], expanded: false, videosLoaded: false })));
        } else {
          toast.error('Course not found');
        }
      } catch {
        toast.error('Failed to load course.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  // ─── Toggle playlist expand (lazy-load videos) ─────────────────────────────

  const togglePlaylist = async (playlistId: string) => {
    const idx = playlists.findIndex((p) => p.id === playlistId);
    if (idx === -1) return;

    const pl = playlists[idx];

    // If already loaded, just toggle
    if (pl.videosLoaded) {
      setPlaylists((prev) =>
        prev.map((p) => p.id === playlistId ? { ...p, expanded: !p.expanded } : p)
      );
      return;
    }

    // Lazy-load videos for this playlist
    try {
      const videos = await getPlaylistVideos(id!, playlistId);
      setPlaylists((prev) =>
        prev.map((p) =>
          p.id === playlistId ? { ...p, videos, videosLoaded: true, expanded: true } : p
        )
      );
    } catch {
      toast.error('Failed to load videos for this playlist.');
    }
  };

  // ─── Course actions ────────────────────────────────────────────────────────

  const handleSaveCourse = async () => {
    if (!course) return;
    setSavingCourse(true);
    try {
      await updateCourse(id!, { ...courseForm, order: Number(courseForm.order) });
      setCourse({ ...course, ...courseForm, order: Number(courseForm.order) });
      toast.success('Course updated!');
      setEditCourseModal(false);
    } catch {
      toast.error('Failed to update course.');
    } finally {
      setSavingCourse(false);
    }
  };

  const handleTogglePublish = async () => {
    if (!course) return;
    setTogglingPublish(true);
    try {
      const next = !course.isPublished;
      await updateCourse(id!, { isPublished: next });
      setCourse({ ...course, isPublished: next });
      toast.success(next ? 'Course published!' : 'Course unpublished.');
    } catch {
      toast.error('Failed to update publish status.');
    } finally {
      setTogglingPublish(false);
    }
  };

  // ─── Playlist actions ──────────────────────────────────────────────────────

  const openAddPlaylist = () => {
    setEditingPlaylist(null);
    setPlaylistForm({ title: '', description: '', order: String(playlists.length + 1) });
    setPlaylistModal(true);
  };

  const openEditPlaylist = (pl: PlaylistWithVideos) => {
    setEditingPlaylist(pl);
    setPlaylistForm({ title: pl.title, description: pl.description, order: String(pl.order) });
    setPlaylistModal(true);
  };

  const handleSavePlaylist = async () => {
    if (!playlistForm.title.trim()) {
      toast.error('Playlist title is required.');
      return;
    }
    setSavingPlaylist(true);
    try {
      if (editingPlaylist) {
        await updatePlaylist(id!, editingPlaylist.id, { ...playlistForm, order: Number(playlistForm.order) });
        setPlaylists((prev) =>
          prev.map((p) =>
            p.id === editingPlaylist.id
              ? { ...p, ...playlistForm, order: Number(playlistForm.order) }
              : p
          )
        );
        toast.success('Playlist updated!');
      } else {
        const newPl = await createPlaylist(id!, { ...playlistForm, order: Number(playlistForm.order) });
        setPlaylists((prev) =>
          [...prev, { ...newPl, videos: [], expanded: false, videosLoaded: false }].sort(
            (a, b) => a.order - b.order
          )
        );
        if (course) setCourse({ ...course, totalPlaylists: course.totalPlaylists + 1 });
        toast.success('Playlist created!');
      }
      setPlaylistModal(false);
    } catch {
      toast.error('Failed to save playlist.');
    } finally {
      setSavingPlaylist(false);
    }
  };

  const handleDeletePlaylist = async () => {
    if (!deletePlaylistTarget) return;
    setDeletingPlaylist(true);
    try {
      const pl = playlists.find((p) => p.id === deletePlaylistTarget);
      await deletePlaylist(id!, deletePlaylistTarget);
      setPlaylists((prev) => prev.filter((p) => p.id !== deletePlaylistTarget));
      if (course && pl) {
        setCourse({
          ...course,
          totalPlaylists: Math.max(0, course.totalPlaylists - 1),
          totalVideos: Math.max(0, course.totalVideos - (pl.totalVideos ?? 0)),
        });
      }
      toast.success('Playlist deleted.');
      setDeletePlaylistTarget(null);
    } catch {
      toast.error('Failed to delete playlist.');
    } finally {
      setDeletingPlaylist(false);
    }
  };

  const handleReorderPlaylist = async (playlistId: string, dir: 'up' | 'down') => {
    const idx = playlists.findIndex((p) => p.id === playlistId);
    if ((dir === 'up' && idx === 0) || (dir === 'down' && idx === playlists.length - 1)) return;
    const swapIdx = dir === 'up' ? idx - 1 : idx + 1;
    const newPlaylists = [...playlists];
    const newOrder = newPlaylists[swapIdx].order;
    const oldOrder = newPlaylists[idx].order;
    newPlaylists[idx] = { ...newPlaylists[idx], order: newOrder };
    newPlaylists[swapIdx] = { ...newPlaylists[swapIdx], order: oldOrder };
    newPlaylists.sort((a, b) => a.order - b.order);
    setPlaylists(newPlaylists);
    try {
      await Promise.all([
        updatePlaylist(id!, newPlaylists[idx].id, { order: newPlaylists[idx].order }),
        updatePlaylist(id!, newPlaylists[swapIdx].id, { order: newPlaylists[swapIdx].order }),
      ]);
    } catch {
      toast.error('Failed to reorder playlists.');
    }
  };

  // ─── Video actions ─────────────────────────────────────────────────────────

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  const openAddVideo = (playlistId: string) => {
    const pl = playlists.find((p) => p.id === playlistId);
    setActivePlaylistId(playlistId);
    setEditingVideo(null);
    setSelectedFile(null);
    setUploadProgress(null);
    setVideoForm({
      title: '',
      description: '',
      bunnyVideoGuid: '',
      order: String((pl?.videos.length ?? 0) + 1),
      isFreePreview: false,
    });
    setVideoModal(true);
  };

  const openEditVideo = (playlistId: string, video: Video) => {
    setActivePlaylistId(playlistId);
    setEditingVideo(video);
    setSelectedFile(null);
    setUploadProgress(null);
    setVideoForm({
      title: video.title,
      description: video.description,
      bunnyVideoGuid: video.bunnyVideoGuid || '',
      order: String(video.order),
      isFreePreview: video.isFreePreview,
    });
    setVideoModal(true);
  };

  const handleSaveVideo = async () => {
    if (!videoForm.title) {
      toast.error('Video title is required.');
      return;
    }
    if (!editingVideo && !selectedFile && !videoForm.bunnyVideoGuid) {
      toast.error('Please select a video file to upload.');
      return;
    }
    if (!activePlaylistId) return;

    if (selectedFile) {
      // Parallel Background Upload Flow:
      // Instantly close modal so tutor can keep working and queue multiple videos
      const fileToUpload = selectedFile;
      const titleToUpload = videoForm.title;
      const descToUpload = videoForm.description;
      const orderToUpload = Number(videoForm.order);
      const freeToUpload = videoForm.isFreePreview;
      const targetPlaylistId = activePlaylistId;

      setVideoModal(false);
      setVideoForm({ title: '', description: '', order: '1', isFreePreview: false, bunnyVideoGuid: '' });
      setSelectedFile(null);
      setEditingVideo(null);

      startUpload(
        id!,
        targetPlaylistId,
        titleToUpload,
        descToUpload,
        orderToUpload,
        freeToUpload,
        fileToUpload,
        (newVid) => {
          setPlaylists((prev) =>
            prev.map((p) =>
              p.id === targetPlaylistId
                ? {
                    ...p,
                    videos: [...p.videos, newVid].sort((a, b) => a.order - b.order),
                    totalVideos: (p.totalVideos ?? 0) + 1,
                  }
                : p
            )
          );
          if (course) setCourse({ ...course, totalVideos: course.totalVideos + 1 });
        }
      );
      return;
    }

    setSavingVideo(true);
    try {
      if (editingVideo) {
        await updateVideo(id!, activePlaylistId, editingVideo.id, {
          title: videoForm.title,
          description: videoForm.description,
          bunnyVideoGuid: videoForm.bunnyVideoGuid,
          order: Number(videoForm.order),
          isFreePreview: videoForm.isFreePreview,
        });
        setPlaylists((prev) =>
          prev.map((p) =>
            p.id === activePlaylistId
              ? {
                  ...p,
                  videos: p.videos.map((v) =>
                    v.id === editingVideo.id
                      ? {
                          ...v,
                          title: videoForm.title,
                          description: videoForm.description,
                          bunnyVideoGuid: videoForm.bunnyVideoGuid,
                          order: Number(videoForm.order),
                          isFreePreview: videoForm.isFreePreview,
                        }
                      : v
                  ),
                }
              : p
          )
        );
        toast.success('Video updated!');
      } else {
        const newVid = await createVideo(id!, activePlaylistId, {
          title: videoForm.title,
          description: videoForm.description,
          bunnyVideoGuid: videoForm.bunnyVideoGuid,
          order: Number(videoForm.order),
          isFreePreview: videoForm.isFreePreview,
        });
        setPlaylists((prev) =>
          prev.map((p) =>
            p.id === activePlaylistId
              ? {
                  ...p,
                  videos: [...p.videos, newVid].sort((a, b) => a.order - b.order),
                  totalVideos: (p.totalVideos ?? 0) + 1,
                }
              : p
          )
        );
        if (course) setCourse({ ...course, totalVideos: course.totalVideos + 1 });
        toast.success('Video added!');
      }
      setVideoModal(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to save video.');
    } finally {
      setSavingVideo(false);
      setUploadProgress(null);
    }
  };

  const handleDeleteVideo = async () => {
    if (!deleteVideoTarget) return;
    setDeletingVideo(true);
    try {
      const { playlistId, videoId } = deleteVideoTarget;
      await deleteVideo(id!, playlistId, videoId);
      setPlaylists((prev) =>
        prev.map((p) =>
          p.id === playlistId
            ? {
                ...p,
                videos: p.videos.filter((v) => v.id !== videoId),
                totalVideos: Math.max(0, (p.totalVideos ?? 1) - 1),
              }
            : p
        )
      );
      if (course) setCourse({ ...course, totalVideos: Math.max(0, course.totalVideos - 1) });
      toast.success('Video deleted.');
      setDeleteVideoTarget(null);
    } catch {
      toast.error('Failed to delete video.');
    } finally {
      setDeletingVideo(false);
    }
  };

  const handleReorderVideo = async (playlistId: string, videoId: string, dir: 'up' | 'down') => {
    const pl = playlists.find((p) => p.id === playlistId);
    if (!pl) return;
    const videos = pl.videos;
    const idx = videos.findIndex((v) => v.id === videoId);
    if ((dir === 'up' && idx === 0) || (dir === 'down' && idx === videos.length - 1)) return;
    const swapIdx = dir === 'up' ? idx - 1 : idx + 1;
    const newVideos = [...videos];
    const newOrder = newVideos[swapIdx].order;
    const oldOrder = newVideos[idx].order;
    newVideos[idx] = { ...newVideos[idx], order: newOrder };
    newVideos[swapIdx] = { ...newVideos[swapIdx], order: oldOrder };
    newVideos.sort((a, b) => a.order - b.order);
    setPlaylists((prev) =>
      prev.map((p) => p.id === playlistId ? { ...p, videos: newVideos } : p)
    );
    try {
      await Promise.all([
        updateVideo(id!, playlistId, newVideos[idx].id, { order: newVideos[idx].order }),
        updateVideo(id!, playlistId, newVideos[swapIdx].id, { order: newVideos[swapIdx].order }),
      ]);
    } catch {
      toast.error('Failed to reorder videos.');
    }
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <Layout title="Course Detail">
        <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}><div className="spinner" /></div>
      </Layout>
    );
  }
  if (!course) {
    return <Layout title="Course Not Found"><p className="text-muted">Course not found.</p></Layout>;
  }

  return (
    <Layout
      title={course.title}
      badge={course.isPublished ? 'Published' : 'Draft'}
      actions={
        <button className="btn btn-secondary btn-sm" onClick={() => navigate('/courses')}>
          <RiArrowLeftLine /> Back to Courses
        </button>
      }
    >
      {/* Course Info Card */}
      <div className="card mb-6">
        <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 24, alignItems: 'start' }}>
          <img
            src={course.thumbnail}
            alt={course.title}
            style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 'var(--radius-md)' }}
            onError={(e) => { (e.target as HTMLImageElement).src = `https://via.placeholder.com/200x120/E2E8F0/94A3B8?text=No+Image`; }}
          />
          <div>
            <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 6 }}>{course.title}</div>
            <div className="text-muted text-sm" style={{ marginBottom: 14, lineHeight: 1.6 }}>{course.description}</div>
            <div className="flex items-center gap-2" style={{ marginBottom: 12 }}>
              <span className="badge badge-info">{course.totalPlaylists} playlist{course.totalPlaylists !== 1 ? 's' : ''}</span>
              <span className="badge badge-lavender">{course.totalVideos} video{course.totalVideos !== 1 ? 's' : ''}</span>
            </div>
            <div className="flex items-center gap-2">
              <button className="btn btn-secondary btn-sm" onClick={() => setEditCourseModal(true)}>
                <RiEditLine /> Edit Details
              </button>
              <button
                className="btn btn-sm"
                style={course.isPublished
                  ? { background: 'var(--warning-bg)', color: 'var(--warning)', border: '1px solid rgba(245,158,11,0.2)' }
                  : { background: 'var(--success-bg)', color: 'var(--success)', border: '1px solid rgba(16,185,129,0.2)' }
                }
                onClick={handleTogglePublish}
                disabled={togglingPublish}
              >
                {course.isPublished ? <><RiEyeOffLine /> Unpublish</> : <><RiEyeLine /> Publish</>}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Playlists Section Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="page-title" style={{ fontSize: 17 }}>
            <RiPlayListLine style={{ marginRight: 8, verticalAlign: 'middle' }} />
            Playlists ({playlists.length})
          </div>
          <div className="page-subtitle">Manage playlists and their videos</div>
        </div>
        <button className="btn btn-primary" onClick={openAddPlaylist}>
          <RiAddLine /> Add Playlist
        </button>
      </div>

      {/* Playlists Accordion */}
      {playlists.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>📚</div>
          <div style={{ fontSize: 13, marginBottom: 12 }}>No playlists yet. Add your first playlist to organise videos.</div>
          <button className="btn btn-primary btn-sm" onClick={openAddPlaylist}><RiAddLine /> Add Playlist</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {playlists.map((pl, plIdx) => (
            <div key={pl.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>

              {/* Playlist Header Row */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '16px 20px',
                  cursor: 'pointer',
                  userSelect: 'none',
                  gap: 12,
                }}
                onClick={() => togglePlaylist(pl.id)}
              >
                {/* Order badge */}
                <div style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: 'var(--accent)', color: '#FFF',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 700, flexShrink: 0,
                }}>
                  {plIdx + 1}
                </div>

                {/* Title + meta */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{pl.title}</div>
                  {pl.description && (
                    <div className="text-muted text-sm" style={{ marginTop: 2 }}>{pl.description}</div>
                  )}
                </div>

                {/* Video count badge */}
                <span className="badge badge-lavender" style={{ flexShrink: 0 }}>
                  {pl.totalVideos} video{pl.totalVideos !== 1 ? 's' : ''}
                </span>

                {/* Reorder buttons */}
                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                  <button
                    className="btn btn-icon btn"
                    title="Move up"
                    disabled={plIdx === 0}
                    onClick={() => handleReorderPlaylist(pl.id, 'up')}
                  >
                    <RiArrowUpLine />
                  </button>
                  <button
                    className="btn btn-icon btn"
                    title="Move down"
                    disabled={plIdx === playlists.length - 1}
                    onClick={() => handleReorderPlaylist(pl.id, 'down')}
                  >
                    <RiArrowDownLine />
                  </button>
                </div>

                {/* Edit / Delete */}
                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                  <button
                    className="btn btn-icon btn"
                    title="Edit playlist"
                    onClick={() => openEditPlaylist(pl)}
                  >
                    <RiEditLine />
                  </button>
                  <button
                    className="btn btn-icon btn"
                    title="Delete playlist"
                    onClick={() => setDeletePlaylistTarget(pl.id)}
                  >
                    <RiDeleteBinLine style={{ color: 'var(--danger)' }} />
                  </button>
                </div>

                {/* Expand arrow */}
                <div style={{ color: 'var(--text-muted)', flexShrink: 0 }}>
                  {pl.expanded ? <RiArrowUpSLine /> : <RiArrowDownSLine />}
                </div>
              </div>

              {/* Videos Sub-Table (expanded) */}
              {pl.expanded && (
                <div style={{ borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-base)' }}>
                  {/* Add Video button */}
                  <div style={{ padding: '12px 20px', display: 'flex', justifyContent: 'flex-end' }}>
                    <button className="btn btn-primary btn-sm" onClick={() => openAddVideo(pl.id)}>
                      <RiAddLine /> Add Video
                    </button>
                  </div>

                  {pl.videos.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: 13 }}>
                      No videos in this playlist yet.
                    </div>
                  ) : (
                    <div className="table-container" style={{ borderRadius: 0, border: 'none', boxShadow: 'none', margin: '0 0 0 0' }}>
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th style={{ width: 40 }}>#</th>
                            <th>Title</th>
                            <th>Duration</th>
                            <th>Status</th>
                            <th>Preview</th>
                            <th style={{ width: 100 }}>Order</th>
                            <th style={{ width: 120 }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pl.videos.map((v, vIdx) => {
                            const durMins = v.duration ? Math.floor(v.duration / 60) : 0;
                            const durSecs = v.duration ? v.duration % 60 : 0;
                            const formattedDur = v.duration ? `${durMins}:${durSecs < 10 ? '0' : ''}${durSecs}` : '—';
                            return (
                              <tr key={v.id}>
                                <td className="text-muted text-sm">{vIdx + 1}</td>
                                <td>
                                  <div style={{ fontWeight: 600 }}>{v.title}</div>
                                  <div className="text-muted text-sm">{v.description}</div>
                                </td>
                                <td className="text-sm font-mono">{formattedDur}</td>
                                <td>
                                  {v.status === 'ready' && <span className="badge badge-success">Ready</span>}
                                  {v.status === 'processing' && <span className="badge badge-warning">Encoding...</span>}
                                  {v.status === 'failed' && <span className="badge badge-danger">Failed</span>}
                                  {v.status === 'uploading' && <span className="badge badge-info">Uploading...</span>}
                                  {!v.status && <span className="badge badge-success">Ready</span>}
                                </td>
                                <td>
                                  {v.isFreePreview
                                    ? <span className="badge badge-success">Free</span>
                                    : <span className="badge">Paid</span>}
                                </td>
                              <td>
                                <div className="flex items-center gap-1">
                                  <button
                                    className="btn btn-icon btn"
                                    title="Move up"
                                    disabled={vIdx === 0}
                                    onClick={() => handleReorderVideo(pl.id, v.id, 'up')}
                                  >
                                    <RiArrowUpLine />
                                  </button>
                                  <button
                                    className="btn btn-icon btn"
                                    title="Move down"
                                    disabled={vIdx === pl.videos.length - 1}
                                    onClick={() => handleReorderVideo(pl.id, v.id, 'down')}
                                  >
                                    <RiArrowDownLine />
                                  </button>
                                </div>
                              </td>
                              <td>
                                <div className="flex items-center gap-1">
                                  <button
                                    className="btn btn-icon btn"
                                    title="Edit video"
                                    onClick={() => openEditVideo(pl.id, v)}
                                  >
                                    <RiEditLine />
                                  </button>
                                  <button
                                    className="btn btn-icon btn"
                                    title="Delete video"
                                    onClick={() => setDeleteVideoTarget({ playlistId: pl.id, videoId: v.id })}
                                  >
                                    <RiDeleteBinLine style={{ color: 'var(--danger)' }} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Edit Course Modal ─────────────────────────────────────────────── */}
      <Modal isOpen={editCourseModal} onClose={() => setEditCourseModal(false)} title="Edit Course Details">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label className="form-label">Title</label>
            <input className="form-input" value={courseForm.title} onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-input" rows={3} value={courseForm.description} onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })} style={{ resize: 'vertical' }} />
          </div>
          <ImageUploadInput
            value={courseForm.thumbnail}
            onChange={(url) => setCourseForm({ ...courseForm, thumbnail: url })}
          />
          <div className="form-group">
            <label className="form-label">Display Order</label>
            <input type="number" className="form-input" min={1} value={courseForm.order} onChange={(e) => setCourseForm({ ...courseForm, order: e.target.value })} />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={() => setEditCourseModal(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSaveCourse} disabled={savingCourse}>
            {savingCourse ? <span className="spinner-sm spinner" /> : 'Save Changes'}
          </button>
        </div>
      </Modal>

      {/* ── Add/Edit Playlist Modal ───────────────────────────────────────── */}
      <Modal
        isOpen={playlistModal}
        onClose={() => setPlaylistModal(false)}
        title={editingPlaylist ? 'Edit Playlist' : 'Add Playlist'}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label className="form-label">Playlist Title</label>
            <input
              className="form-input"
              placeholder="e.g. Chapter 1 — Cell Biology"
              value={playlistForm.title}
              onChange={(e) => setPlaylistForm({ ...playlistForm, title: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Description (optional)</label>
            <textarea
              className="form-input"
              rows={2}
              placeholder="Brief overview of what this section covers"
              value={playlistForm.description}
              onChange={(e) => setPlaylistForm({ ...playlistForm, description: e.target.value })}
              style={{ resize: 'vertical' }}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Display Order</label>
            <input
              type="number"
              className="form-input"
              min={1}
              value={playlistForm.order}
              onChange={(e) => setPlaylistForm({ ...playlistForm, order: e.target.value })}
            />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={() => setPlaylistModal(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSavePlaylist} disabled={savingPlaylist}>
            {savingPlaylist ? <span className="spinner-sm spinner" /> : editingPlaylist ? 'Save Changes' : 'Create Playlist'}
          </button>
        </div>
      </Modal>

      {/* ── Add/Edit Video Modal ──────────────────────────────────────────── */}
      <Modal
        isOpen={videoModal}
        onClose={() => setVideoModal(false)}
        title={editingVideo ? 'Edit / Replace Video' : 'Add Video (Bunny Stream)'}
        subtitle="Select a video file to upload directly. Tutors do not need to open Bunny's dashboard."
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label className="form-label">Video Title</label>
            <input className="form-input" placeholder="e.g. Lecture 1 - Cell Structure" value={videoForm.title} onChange={(e) => setVideoForm({ ...videoForm, title: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-input" rows={2} placeholder="Brief overview of this lecture" value={videoForm.description} onChange={(e) => setVideoForm({ ...videoForm, description: e.target.value })} style={{ resize: 'vertical' }} />
          </div>
          
          <div className="form-group">
            <label className="form-label">{editingVideo ? 'Replace Video File (Optional)' : 'Select Video File (*.mp4, *.mov)'}</label>
            <input
              type="file"
              accept="video/*"
              className="form-input"
              style={{ padding: '8px 12px' }}
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
            />
            {selectedFile && (
              <div style={{ fontSize: 12, color: 'var(--accent)', marginTop: 4, fontWeight: 600 }}>
                Selected: {selectedFile.name} ({(selectedFile.size / (1024 * 1024)).toFixed(1)} MB)
              </div>
            )}
          </div>

          {uploadProgress !== null && (
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                <span>Uploading Video...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div style={{ width: '100%', background: 'var(--border-subtle)', height: 8, borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ width: `${uploadProgress}%`, background: 'var(--accent)', height: '100%', transition: 'width 0.2s' }} />
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Order</label>
              <input type="number" className="form-input" min={1} value={videoForm.order} onChange={(e) => setVideoForm({ ...videoForm, order: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Free Preview?</label>
              <div className="toggle-wrap" style={{ paddingTop: 10 }}>
                <div
                  className={`toggle${videoForm.isFreePreview ? ' on' : ''}`}
                  onClick={() => setVideoForm({ ...videoForm, isFreePreview: !videoForm.isFreePreview })}
                />
                <span className="toggle-label">{videoForm.isFreePreview ? 'Yes — visible to all' : 'No — enrolled only'}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={() => setVideoModal(false)} disabled={savingVideo}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSaveVideo} disabled={savingVideo}>
            {savingVideo ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="spinner-sm spinner" />
                {uploadProgress !== null ? `Uploading (${uploadProgress}%)` : 'Processing...'}
              </span>
            ) : editingVideo ? (
              selectedFile ? 'Upload & Replace Video' : 'Save Changes'
            ) : (
              'Upload Video'
            )}
          </button>
        </div>
      </Modal>

      {/* ── Delete Playlist Confirm ───────────────────────────────────────── */}
      <ConfirmDialog
        isOpen={!!deletePlaylistTarget}
        onClose={() => setDeletePlaylistTarget(null)}
        onConfirm={handleDeletePlaylist}
        title="Delete Playlist"
        message="This will permanently delete the playlist and ALL its videos. This cannot be undone."
        confirmLabel="Delete Playlist"
        loading={deletingPlaylist}
      />

      {/* ── Delete Video Confirm ──────────────────────────────────────────── */}
      <ConfirmDialog
        isOpen={!!deleteVideoTarget}
        onClose={() => setDeleteVideoTarget(null)}
        onConfirm={handleDeleteVideo}
        title="Delete Video"
        message="Are you sure you want to delete this video? This cannot be undone."
        confirmLabel="Delete"
        loading={deletingVideo}
      />
    </Layout>
  );
};

export default CourseDetailPage;
