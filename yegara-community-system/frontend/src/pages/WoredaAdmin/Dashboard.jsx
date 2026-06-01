import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { eventsAPI, meetingsAPI, reportsAPI, usersAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { getRegistrationCount } from '../../utils/eventRegistrations';

const statusStyles = {
  Pending: 'bg-yellow-100 text-yellow-800',
  'In Progress': 'bg-blue-100 text-blue-800',
  Resolved: 'bg-green-100 text-green-800',
  Rejected: 'bg-red-100 text-red-800'
};

const Dashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState([]);
  const [events, setEvents] = useState([]);
  const [myEvents, setMyEvents] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [residentCount, setResidentCount] = useState(0);
  const [officerCount, setOfficerCount] = useState(0);

  useEffect(() => {
    if (!user?.woreda) return;

    let isMounted = true;

    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const [reportsResponse, residentsResponse, officersResponse, eventsResponse, myEventsResponse, meetingsResponse] = await Promise.all([
          reportsAPI.getMyReports(),
          usersAPI.getAll({ role: 'resident' }),
          usersAPI.getAll({ role: 'officer' }),
          eventsAPI.getByWoreda(user.woreda),
          eventsAPI.getMyOrganized(),
          meetingsAPI.getAll()
        ]);

        if (!isMounted) return;

        setReports(reportsResponse.data?.data || []);
        setResidentCount(residentsResponse.data?.count || 0);
        setOfficerCount(officersResponse.data?.count || 0);
        setEvents(eventsResponse.data?.data || []);
        setMyEvents(myEventsResponse.data?.data || []);
        setMeetings(meetingsResponse.data?.data || []);
      } catch (error) {
        if (isMounted) {
          toast.error('Unable to load dashboard data');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchDashboardData();

    return () => {
      isMounted = false;
    };
  }, [user?.woreda]);

  const reportStats = useMemo(() => {
    const pending = reports.filter((report) => report.status === 'Pending').length;
    const inProgress = reports.filter((report) => report.status === 'In Progress').length;
    const resolved = reports.filter((report) => report.status === 'Resolved').length;
    const rejected = reports.filter((report) => report.status === 'Rejected').length;

    return {
      total: reports.length,
      pending,
      inProgress,
      resolved,
      rejected
    };
  }, [reports]);

  const categoryBreakdown = useMemo(() => {
    return reports.reduce((acc, report) => {
      const key = report.category || 'Other';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
  }, [reports]);

  const recentReports = useMemo(() => reports.slice(0, 5), [reports]);

  const stats = [
    { label: 'Residents', value: residentCount },
    { label: 'Officers', value: officerCount },
    { label: 'Total reports', value: reportStats.total },
    { label: 'Pending reports', value: reportStats.pending },
    { label: 'In progress', value: reportStats.inProgress },
    { label: 'Resolved', value: reportStats.resolved },
    { label: 'Upcoming events', value: events.length },
    { label: 'Meetings', value: meetings.length }
  ];

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-primary-100 bg-gradient-to-r from-white via-primary-50 to-sky-50 p-6 shadow-sm">
        <h1 className="text-3xl font-semibold text-gray-900">Woreda Admin Dashboard</h1>
        <p className="text-gray-600 mt-2">Overview of reports, users, and activities in your woreda.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
            <p className="text-sm text-gray-500">{stat.label}</p>
            <p className="mt-1 text-2xl font-semibold text-gray-900">
              {loading ? '...' : stat.value}
            </p>
            <div className="mt-3 h-1.5 rounded-full bg-gray-100 overflow-hidden">
              <div className="h-full bg-primary-600" style={{ width: loading ? '0%' : '100%' }}></div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">My events & registrations</h2>
          <Link to="/woreda-admin/events" className="text-sm text-primary-600 hover:text-primary-700">
            Manage events
          </Link>
        </div>
        {loading ? (
          <div className="flex justify-center items-center h-24">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : myEvents.length === 0 ? (
          <p className="mt-4 text-sm text-gray-500">You have not created any events yet.</p>
        ) : (
          <div className="mt-4 divide-y divide-gray-200">
            {myEvents.slice(0, 5).map((event) => (
              <div key={event._id} className="py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{event.title}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(event.date).toLocaleString()} · {event.location}
                  </p>
                </div>
                <span className="text-xs px-3 py-1 rounded-full w-fit bg-amber-50 text-amber-800 border border-amber-100 font-medium">
                  {getRegistrationCount(event)} registered
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Recent reports</h2>
            <Link to="/woreda-admin/reports" className="text-sm text-primary-600 hover:text-primary-700">
              View all
            </Link>
          </div>
          {loading ? (
            <div className="flex justify-center items-center h-24">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : recentReports.length === 0 ? (
            <div className="mt-4 text-gray-500 text-sm">
              No reports submitted yet.
            </div>
          ) : (
            <div className="mt-4 divide-y divide-gray-200">
              {recentReports.map((report) => (
                <div key={report._id} className="py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{report.title}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(report.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded-full w-fit ${statusStyles[report.status] || 'bg-gray-100 text-gray-700'}`}
                  >
                    {report.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Report status</h2>
            <div className="mt-4 space-y-2 text-sm text-gray-600">
              <div className="flex items-center justify-between">
                <span>Pending</span>
                <span className="font-semibold text-gray-900">{loading ? '...' : reportStats.pending}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>In progress</span>
                <span className="font-semibold text-gray-900">{loading ? '...' : reportStats.inProgress}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Resolved</span>
                <span className="font-semibold text-gray-900">{loading ? '...' : reportStats.resolved}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Rejected</span>
                <span className="font-semibold text-gray-900">{loading ? '...' : reportStats.rejected}</span>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900">Report categories</h2>
            {loading ? (
              <div className="mt-4 text-sm text-gray-500">Loading...</div>
            ) : Object.keys(categoryBreakdown).length === 0 ? (
              <div className="mt-4 text-sm text-gray-500">No category data yet.</div>
            ) : (
              <div className="mt-4 space-y-2 text-sm text-gray-600">
                {Object.entries(categoryBreakdown).map(([category, count]) => (
                  <div key={category} className="flex items-center justify-between">
                    <span>{category}</span>
                    <span className="font-semibold text-gray-900">{count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
