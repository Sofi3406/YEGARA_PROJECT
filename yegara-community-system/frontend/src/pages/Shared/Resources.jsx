import React, { useEffect, useState } from 'react';
import { resourcesAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';

const Resources = () => {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchResources = async () => {
    setLoading(true);
    try {
      if (!user) {
        setResources([]);
        toast.error('Please log in to view resources');
        return;
      }

      const response = await resourcesAPI.getAll();
      setResources(response.data.data || []);
    } catch (error) {
      toast.error('Unable to load resources');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (resource) => {
    try {
      if (!user) {
        toast.error('Please log in to download resources');
        return;
      }

      const response = await resourcesAPI.download(resource._id);
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = resource.fileName || 'resource';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast.error('Unable to download resource');
    }
  };

  useEffect(() => {
    fetchResources();
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
        <h1 className="text-3xl font-semibold text-gray-900">Resources</h1>
        <p className="text-gray-600 mt-2">Access official documents, guides, and notices.</p>
      </div>

      {resources.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm text-gray-600">
          No resources available at the moment.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {resources.map((resource) => (
            <div key={resource._id} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900">{resource.title}</h3>
              <p className="mt-2 text-gray-600 text-sm">{resource.description}</p>
              <p className="mt-3 text-xs text-gray-500">Category: {resource.category || 'General'}</p>
              <button
                onClick={() => handleDownload(resource)}
                className="mt-4 btn btn-secondary w-full"
              >
                Download
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Resources;
