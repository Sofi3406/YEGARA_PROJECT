import React, { useEffect, useState } from 'react';
import { announcementsAPI } from '../../services/api';
import { toast } from 'react-hot-toast';
import { getMediaUrl } from '../../utils/media';

const Announcements = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    title: '',
    message: '',
    category: 'General',
    audienceRoles: ['all'],
    image: null
  });

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const response = await announcementsAPI.getAll();
      setAnnouncements(response.data.data || []);
    } catch (error) {
      toast.error('Unable to load announcements');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.message) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const payload = new FormData();
      payload.append('title', form.title);
      payload.append('message', form.message);
      payload.append('category', form.category);
      payload.append('audienceRoles', form.audienceRoles.join(','));
      if (form.image) {
        payload.append('image', form.image);
      }

      await announcementsAPI.create(payload);
      toast.success('Announcement published');
      setForm({ title: '', message: '', category: 'General', audienceRoles: ['all'], image: null });
      fetchAnnouncements();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Unable to publish announcement');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this announcement?')) return;
    try {
      await announcementsAPI.delete(id);
      toast.success('Announcement deleted');
      fetchAnnouncements();
    } catch (error) {
      toast.error('Unable to delete announcement');
    }
  };

  const toggleAudience = (role) => {
    setForm((prev) => {
      if (prev.audienceRoles.includes(role)) {
        return { ...prev, audienceRoles: prev.audienceRoles.filter((item) => item !== role) };
      }
      return { ...prev, audienceRoles: [...prev.audienceRoles, role] };
    });
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const formatAnnouncementTime = (value) => {
    const date = new Date(value);
    return {
      day: date.toLocaleDateString(undefined, { day: '2-digit' }),
      month: date.toLocaleDateString(undefined, { month: 'short' }).toUpperCase(),
      full: date.toLocaleString()
    };
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-gray-900">Announcements panel</h1>
        <p className="text-gray-600 mt-2">Publish updates to residents and staff.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Title</label>
          <input
            className="input mt-1"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Message</label>
          <textarea
            rows="4"
            className="input mt-1"
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Category</label>
          <input
            className="input mt-1"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Announcement image</label>
          <input
            type="file"
            accept="image/*"
            className="input mt-1"
            onChange={(e) => setForm({ ...form, image: e.target.files?.[0] || null })}
          />
          {form.image && (
            <p className="mt-1 text-xs text-primary-700">{form.image.name}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Audience</label>
          <div className="mt-2 flex flex-wrap gap-2 text-sm">
            {['resident', 'officer', 'woreda_admin', 'subcity_admin', 'all'].map((role) => (
              <button
                key={role}
                type="button"
                onClick={() => toggleAudience(role)}
                className={`px-3 py-1 rounded-full border ${form.audienceRoles.includes(role) ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-600 border-gray-300'}`}
              >
                {role}
              </button>
            ))}
          </div>
        </div>
        <button type="submit" className="btn btn-primary">Publish announcement</button>
      </form>

      {loading ? (
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
        </div>
      ) : announcements.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm text-gray-600">
          No announcements published yet.
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map((item) => (
            <div key={item._id} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
              {item.image && (
                <div className="mb-4 overflow-hidden rounded-2xl border border-gray-200 bg-gray-50 aspect-[4/3] max-h-48">
                  <img
                    src={getMediaUrl(item.image)}
                    alt={item.title}
                    className="h-full w-full object-cover"
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              )}

              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4 min-w-0">
                  <div className="shrink-0 rounded-xl bg-gradient-to-br from-primary-600 to-primary-500 text-white w-14 h-14 flex flex-col items-center justify-center shadow-sm">
                    <span className="text-[10px] tracking-wide">{formatAnnouncementTime(item.createdAt).month}</span>
                    <span className="text-base font-semibold leading-none">{formatAnnouncementTime(item.createdAt).day}</span>
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-lg font-semibold text-gray-900 truncate">{item.title}</h2>
                    <p className="text-xs text-gray-500 mt-1">{formatAnnouncementTime(item.createdAt).full}</p>
                  </div>
                </div>

                <button
                  onClick={() => handleDelete(item._id)}
                  className="inline-flex items-center rounded-lg border border-red-200 text-red-700 text-sm font-medium px-3 py-1.5 hover:bg-red-50"
                >
                  Delete
                </button>
              </div>

              <p className="mt-3 text-gray-700 leading-relaxed">{item.message}</p>

              <div className="mt-4 flex flex-wrap gap-2">
                <span className="inline-flex items-center rounded-full bg-primary-50 text-primary-700 px-3 py-1 text-xs font-medium border border-primary-100">
                  Category: {item.category || 'General'}
                </span>
                <span className="inline-flex items-center rounded-full bg-gray-50 text-gray-700 px-3 py-1 text-xs font-medium border border-gray-200">
                  Audience: {item.audienceRoles?.join(', ') || 'All'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Announcements;
