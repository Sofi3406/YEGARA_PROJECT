import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { announcementsAPI } from '../../services/api';
import { toast } from 'react-hot-toast';
import { getMediaUrl } from '../../utils/media';

const ResidentAnnouncements = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  const formatAnnouncementTime = (value) => {
    const date = new Date(value);
    return {
      day: date.toLocaleDateString(undefined, { day: '2-digit' }),
      month: date.toLocaleDateString(undefined, { month: 'short' }).toUpperCase(),
      full: date.toLocaleString()
    };
  };

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

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-gray-900">Announcements</h1>
        <p className="text-gray-600 mt-2">Latest community announcements for residents.</p>
      </div>

      {announcements.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm text-gray-600">
          No announcements yet.
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

                <span className="inline-flex items-center rounded-full bg-primary-50 text-primary-700 px-3 py-1 text-xs font-medium border border-primary-100">
                  {item.category || 'General'}
                </span>
              </div>

              <p className="mt-3 text-gray-700 leading-relaxed">{item.message}</p>

              <div className="mt-4 flex flex-wrap gap-2">
                <span className="inline-flex items-center rounded-full bg-gray-50 text-gray-700 px-3 py-1 text-xs font-medium border border-gray-200">
                  Posted by: {item.createdBy?.fullName || 'Admin'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <div>
        <Link to="/resident/dashboard" className="text-sm text-primary-600 hover:text-primary-700">
          Back to dashboard
        </Link>
      </div>
    </div>
  );
};

export default ResidentAnnouncements;