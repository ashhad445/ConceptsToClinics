import React, { useState, useRef } from 'react';
import { RiUploadCloud2Line, RiLinkM, RiImageLine, RiCloseLine, RiCheckLine } from 'react-icons/ri';

interface Props {
  value: string;
  onChange: (value: string) => void;
}

const PRESET_COVERS = [
  {
    name: 'Biology 101',
    url: 'https://images.unsplash.com/photo-1530210124550-912dc1381cb8?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Anatomy',
    url: 'https://images.unsplash.com/photo-1559757175-5700dde675bc?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Physiology',
    url: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Clinical Surgery',
    url: 'https://images.unsplash.com/photo-1551076805-e1869033e561?auto=format&fit=crop&w=800&q=80',
  },
];

export const ImageUploadInput: React.FC<Props> = ({ value, onChange }) => {
  const [tab, setTab] = useState<'upload' | 'url' | 'presets'>('upload');
  const [urlInput, setUrlInput] = useState(value && value.startsWith('http') ? value : '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Compress & convert file to Data URL
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (PNG, JPG, WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Resize image to max 800x600 for optimal fast mobile loading & storage size
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxDim = 800;

        if (width > height && width > maxDim) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else if (height > maxDim) {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.82);
          onChange(compressedDataUrl);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleUrlSubmit = () => {
    if (urlInput.trim()) {
      onChange(urlInput.trim());
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <label className="form-label" style={{ marginBottom: 0 }}>
        Course Cover Picture
      </label>

      {/* Live Preview Card */}
      {value ? (
        <div
          style={{
            position: 'relative',
            borderRadius: 14,
            overflow: 'hidden',
            border: '1px solid var(--border-subtle, #334155)',
            background: '#0F172A',
            height: 160,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <img
            src={value}
            alt="Course preview"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
          <button
            type="button"
            onClick={() => onChange('')}
            style={{
              position: 'absolute',
              top: 10,
              right: 10,
              background: 'rgba(0,0,0,0.75)',
              color: '#FFF',
              border: 'none',
              borderRadius: '50%',
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
            title="Remove Picture"
          >
            <RiCloseLine style={{ fontSize: 18 }} />
          </button>
          <div
            style={{
              position: 'absolute',
              bottom: 8,
              left: 10,
              background: 'rgba(0,0,0,0.65)',
              color: '#E2E8F0',
              fontSize: 11,
              padding: '3px 8px',
              borderRadius: 12,
              backdropFilter: 'blur(4px)',
            }}
          >
            ✓ Picture Loaded
          </div>
        </div>
      ) : null}

      {/* Tabs for Selection */}
      <div
        style={{
          display: 'flex',
          gap: 6,
          background: 'var(--bg-input, #1E293B)',
          padding: 4,
          borderRadius: 10,
        }}
      >
        <button
          type="button"
          onClick={() => setTab('upload')}
          style={{
            flex: 1,
            padding: '6px 12px',
            borderRadius: 8,
            fontSize: 12,
            fontWeight: 600,
            border: 'none',
            cursor: 'pointer',
            background: tab === 'upload' ? 'var(--primary, #6366F1)' : 'transparent',
            color: tab === 'upload' ? '#FFF' : 'var(--text-muted, #94A3B8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
          }}
        >
          <RiUploadCloud2Line /> Upload File
        </button>
        <button
          type="button"
          onClick={() => setTab('url')}
          style={{
            flex: 1,
            padding: '6px 12px',
            borderRadius: 8,
            fontSize: 12,
            fontWeight: 600,
            border: 'none',
            cursor: 'pointer',
            background: tab === 'url' ? 'var(--primary, #6366F1)' : 'transparent',
            color: tab === 'url' ? '#FFF' : 'var(--text-muted, #94A3B8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
          }}
        >
          <RiLinkM /> Image URL
        </button>
        <button
          type="button"
          onClick={() => setTab('presets')}
          style={{
            flex: 1,
            padding: '6px 12px',
            borderRadius: 8,
            fontSize: 12,
            fontWeight: 600,
            border: 'none',
            cursor: 'pointer',
            background: tab === 'presets' ? 'var(--primary, #6366F1)' : 'transparent',
            color: tab === 'presets' ? '#FFF' : 'var(--text-muted, #94A3B8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
          }}
        >
          <RiImageLine /> Presets
        </button>
      </div>

      {/* Tab 1: File Upload */}
      {tab === 'upload' && (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
          <div
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: '2px dashed var(--border-subtle, #334155)',
              borderRadius: 12,
              padding: '24px 16px',
              textAlign: 'center',
              cursor: 'pointer',
              background: 'rgba(255,255,255,0.02)',
              transition: 'all 0.2s ease',
            }}
          >
            <RiUploadCloud2Line style={{ fontSize: 32, color: 'var(--primary, #6366F1)', marginBottom: 8 }} />
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary, #F8FAFC)' }}>
              Click to select an image from your device
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted, #94A3B8)', marginTop: 4 }}>
              Supports PNG, JPG, WebP (auto-compressed for fast loading)
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: URL Input */}
      {tab === 'url' && (
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            type="text"
            className="form-input"
            placeholder="https://example.com/course-cover.jpg"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            style={{ flex: 1 }}
          />
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleUrlSubmit}
            style={{ padding: '0 16px' }}
          >
            Set URL
          </button>
        </div>
      )}

      {/* Tab 3: Presets */}
      {tab === 'presets' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
          {PRESET_COVERS.map((preset) => (
            <div
              key={preset.name}
              onClick={() => onChange(preset.url)}
              style={{
                position: 'relative',
                borderRadius: 8,
                overflow: 'hidden',
                height: 70,
                cursor: 'pointer',
                border: value === preset.url ? '2px solid var(--primary, #6366F1)' : '1px solid var(--border-subtle, #334155)',
              }}
            >
              <img src={preset.url} alt={preset.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)',
                  padding: 6,
                  display: 'flex',
                  alignItems: 'flex-end',
                  justifyContent: 'space-between',
                }}
              >
                <span style={{ fontSize: 11, fontWeight: 700, color: '#FFF' }}>{preset.name}</span>
                {value === preset.url && <RiCheckLine style={{ color: '#10B981', fontSize: 16 }} />}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
