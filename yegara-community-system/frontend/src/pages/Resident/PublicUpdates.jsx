import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { reportsAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';

const PublicUpdates = () => {
  const { user } = useAuth();
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    let isMounted = true;

    const fetchUpdates = async () => {
      setLoading(true);
      try {
        const response = await reportsAPI.getPublicUpdates();
        if (!isMounted) return;

        setUpdates(response.data?.data || []);
      } catch (error) {
        if (isMounted) {
          toast.error('Unable to load public updates');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchUpdates();

    return () => {
      isMounted = false;
    };
  }, [user]);

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
        <h1 className="text-3xl font-semibold text-gray-900">Public updates</h1>
        <p className="text-gray-600 mt-2">Officer updates for reports in your woreda.</p>
      </div>

      {updates.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm text-gray-600">
          No public updates are available yet.
        </div>
      ) : (
        <div className="space-y-4">
          {updates.map((item) => (
            <div key={item._id} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="text-lg font-semibold text-gray-900 truncate">{item.reportTitle}</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {item.reportCategory} • {item.reportDepartment || 'General'} • {item.woreda}
                  </p>
                </div>
                <span className="inline-flex items-center rounded-full bg-primary-50 text-primary-700 px-3 py-1 text-xs font-medium border border-primary-100">
                  {item.reportStatus}
                </span>
              </div>

              <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50/70 p-4">
                <div className="flex items-center justify-between gap-3 text-xs text-gray-500">
                  <span>
                    {item.latestUpdate?.updatedBy?.fullName || 'Officer'}
                    {item.latestUpdate?.updatedBy?.department ? ` • ${item.latestUpdate.updatedBy.department}` : ''}
                  </span>
                  <span>
                    {item.latestUpdate?.timestamp ? new Date(item.latestUpdate.timestamp).toLocaleString() : 'Update'}
                  </span>
                </div>
                <p className="mt-3 text-gray-700 leading-relaxed">{item.latestUpdate?.message}</p>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-gray-500">
                  Linked report: {item.resident?.fullName ? `submitted by ${item.resident.fullName}` : 'community report'}
                </p>
                <Link to={`/resident/reports/${item.reportId}`} className="text-primary-600 hover:text-primary-700 font-medium text-sm">
                  Open report
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PublicUpdates;