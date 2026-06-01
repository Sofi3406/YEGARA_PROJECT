import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import { announcementsAPI, eventsAPI, meetingsAPI, reportsAPI, usersAPI } from '../../services/api';
import DashboardAnnouncementsShowcase from '../../components/portal/DashboardAnnouncementsShowcase';
import { useAuth } from '../../context/AuthContext';
import { getRegistrationCount } from '../../utils/eventRegistrations';
import {
  PortalPage,
  PortalHero,
  PortalHeroLink,
  PortalStatGrid,
  PortalPanel,
  PortalLoading,
  PortalEmpty,
  PortalQuickLink,
  statusToClass
} from '../../components/portal/PortalPageShell';

const Dashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState([]);
  const [events, setEvents] = useState([]);
  const [myEvents, setMyEvents] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [residentCount, setResidentCount] = useState(0);
  const [officerCount, setOfficerCount] = useState(0);
  const [announcements, setAnnouncements] = useState([]);

  useEffect(() => {
    if (!user?.woreda) return undefined;

    let isMounted = true;

    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const [reportsResponse, residentsResponse, officersResponse, eventsResponse, myEventsResponse, meetingsResponse, announcementsResponse] = await Promise.all([
          reportsAPI.getMyReports(),
          usersAPI.getAll({ role: 'resident' }),
          usersAPI.getAll({ role: 'officer' }),
          eventsAPI.getByWoreda(user.woreda),
          eventsAPI.getMyOrganized(),
          meetingsAPI.getAll(),
          announcementsAPI.getAll()
        ]);

        if (!isMounted) return;

        setReports(reportsResponse.data?.data || []);
        setResidentCount(residentsResponse.data?.count || 0);
        setOfficerCount(officersResponse.data?.count || 0);
        setEvents(eventsResponse.data?.data || []);
        setMyEvents(myEventsResponse.data?.data || []);
        setMeetings(meetingsResponse.data?.data || []);
        setAnnouncements(announcementsResponse.data?.data || []);
      } catch (error) {
        if (isMounted) toast.error('Unable to load dashboard data');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchDashboardData();
    return () => { isMounted = false; };
  }, [user?.woreda]);

  const reportStats = useMemo(() => {
    const pending = reports.filter((r) => r.status === 'Pending').length;
    const inProgress = reports.filter((r) => r.status === 'In Progress').length;
    const resolved = reports.filter((r) => r.status === 'Resolved').length;
    const rejected = reports.filter((r) => r.status === 'Rejected').length;
    return { total: reports.length, pending, inProgress, resolved, rejected };
  }, [reports]);

  const categoryBreakdown = useMemo(() => {
    return reports.reduce((acc, report) => {
      const key = report.category || 'Other';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
  }, [reports]);

  const recentReports = useMemo(() => reports.slice(0, 5), [reports]);
  const total = Math.max(reportStats.total, 1);

  return (
    <PortalPage>
      <PortalHero
        eyebrow="Woreda administration"
        title="Woreda admin dashboard"
        description={`Overview of reports, users, events, and meetings in ${user?.woreda || 'your woreda'}.`}
        actions={
          <>
            <PortalHeroLink to="/woreda-admin/reports">All reports</PortalHeroLink>
            <PortalHeroLink to="/woreda-admin/events" variant="ghost">Manage events</PortalHeroLink>
            <PortalHeroLink to="/woreda-admin/announcements" variant="ghost">Announcements</PortalHeroLink>
          </>
        }
      />

      <PortalStatGrid
        stats={[
          { label: 'Residents', value: loading ? '…' : residentCount, percent: 100 },
          { label: 'Officers', value: loading ? '…' : officerCount, percent: 100 },
          { label: 'Total reports', value: loading ? '…' : reportStats.total, percent: 100 },
          { label: 'Pending', value: loading ? '…' : reportStats.pending, percent: (reportStats.pending / total) * 100 }
        ]}
      />

      <PortalStatGrid
        columns={4}
        stats={[
          { label: 'In progress', value: loading ? '…' : reportStats.inProgress, percent: (reportStats.inProgress / total) * 100 },
          { label: 'Resolved', value: loading ? '…' : reportStats.resolved, percent: (reportStats.resolved / total) * 100 },
          { label: 'Upcoming events', value: loading ? '…' : events.length, percent: 100 },
          { label: 'Meetings', value: loading ? '…' : meetings.length, percent: 100 }
        ]}
      />

      <DashboardAnnouncementsShowcase
        announcements={announcements}
        loading={loading}
        manageLink="/woreda-admin/announcements"
      />

      <PortalPanel title="My events & registrations" linkTo="/woreda-admin/events" linkLabel="Manage events">
        {loading ? (
          <PortalLoading />
        ) : myEvents.length === 0 ? (
          <PortalEmpty message="You have not created any events yet." />
        ) : (
          <ul className="space-y-3">
            {myEvents.slice(0, 5).map((event) => (
              <li key={event._id} className="officer-list-item">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold text-slate-900">{event.title}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {new Date(event.date).toLocaleString()} · {event.location}
                    </p>
                  </div>
                  <span className="officer-chip">{getRegistrationCount(event)} registered</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </PortalPanel>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <PortalPanel title="Recent reports" linkTo="/woreda-admin/reports">
            {loading ? (
              <PortalLoading />
            ) : recentReports.length === 0 ? (
              <PortalEmpty message="No reports submitted yet." />
            ) : (
              <ul className="space-y-3">
                {recentReports.map((report) => (
                  <li key={report._id} className="officer-list-item">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{report.title}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {new Date(report.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <span className={statusToClass(report.status)}>{report.status}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </PortalPanel>
        </div>

        <div className="space-y-6">
          <PortalPanel title="Quick actions">
            <div className="space-y-3">
              <PortalQuickLink to="/woreda-admin/officers" icon="👥">Manage officers</PortalQuickLink>
              <PortalQuickLink to="/woreda-admin/analytics" icon="📊">View analytics</PortalQuickLink>
              <PortalQuickLink to="/woreda-admin/meetings" icon="🎥">Virtual meetings</PortalQuickLink>
              <PortalQuickLink to="/woreda-admin/announcements" icon="📢">Publish announcement</PortalQuickLink>
            </div>
          </PortalPanel>

          <PortalPanel title="Report status">
            {loading ? (
              <p className="text-sm text-slate-500">Loading…</p>
            ) : (
              <div className="officer-metric-list">
                {[
                  ['Pending', reportStats.pending],
                  ['In progress', reportStats.inProgress],
                  ['Resolved', reportStats.resolved],
                  ['Rejected', reportStats.rejected]
                ].map(([label, value]) => (
                  <div key={label} className="officer-metric-list__row">
                    <span>{label}</span>
                    <span className="officer-metric-list__value">{value}</span>
                  </div>
                ))}
              </div>
            )}
          </PortalPanel>

          <PortalPanel title="Report categories">
            {loading ? (
              <p className="text-sm text-slate-500">Loading…</p>
            ) : Object.keys(categoryBreakdown).length === 0 ? (
              <p className="text-sm text-slate-500">No category data yet.</p>
            ) : (
              <div className="officer-metric-list">
                {Object.entries(categoryBreakdown).map(([category, count]) => (
                  <div key={category} className="officer-metric-list__row">
                    <span>{category}</span>
                    <span className="officer-metric-list__value">{count}</span>
                  </div>
                ))}
              </div>
            )}
          </PortalPanel>
        </div>
      </div>
    </PortalPage>
  );
};

export default Dashboard;
