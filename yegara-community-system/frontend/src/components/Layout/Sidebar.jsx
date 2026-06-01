import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { analyticsAPI } from '../../services/api';
import {
  HomeIcon,
  DocumentTextIcon,
  CalendarIcon,
  ChartBarIcon,
  UserGroupIcon,
  CogIcon,
  DocumentArrowUpIcon,
  ArrowRightOnRectangleIcon,
  UserCircleIcon
} from '@heroicons/react/24/outline';

const ResidentSidebar = ({ onLogout }) => {
  const links = [
    { to: '/resident/dashboard', icon: HomeIcon, label: 'Dashboard' },
    { to: '/resident/reports', icon: DocumentTextIcon, label: 'My Reports' },
    { to: '/resident/reports/new', icon: DocumentArrowUpIcon, label: 'New Report' },
    { to: '/resident/meetings', icon: CalendarIcon, label: 'Virtual Meetings' },
    { to: '/resident/events', icon: CalendarIcon, label: 'Events' },
    { to: '/resident/public-updates', icon: DocumentTextIcon, label: 'Public Updates' },
    { to: '/resident/resources', icon: DocumentTextIcon, label: 'Resources' },
    { to: '/profile/edit', icon: UserCircleIcon, label: 'Edit Profile' }
  ];

  return (
    <div className="w-64 bg-gray-900 text-white h-full flex flex-col">
      <nav className="mt-5 px-2 space-y-1 flex-1">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                isActive
                  ? 'bg-gray-800 text-white'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`
            }
          >
            <link.icon className="mr-3 h-5 w-5" />
            {link.label}
          </NavLink>
        ))}
      </nav>
      <div className="px-2 pb-4">
        <button
          type="button"
          onClick={onLogout}
          className="group flex w-full items-center px-3 py-2 text-sm font-semibold rounded-md text-red-200 hover:bg-red-600 hover:text-white"
        >
          <ArrowRightOnRectangleIcon className="mr-3 h-5 w-5" />
          Logout
        </button>
      </div>
    </div>
  );
};

const OfficerSidebar = ({ onLogout }) => {
  const links = [
    { to: '/officer/dashboard', icon: HomeIcon, label: 'Dashboard' },
    { to: '/officer/reports', icon: DocumentTextIcon, label: 'Manage Reports' },
    { to: '/officer/resources', icon: DocumentArrowUpIcon, label: 'Upload Resources' },
    { to: '/officer/updates', icon: DocumentTextIcon, label: 'Post Updates' },
    { to: '/officer/meetings', icon: CalendarIcon, label: 'Virtual Meetings' },
    { to: '/officer/announcements', icon: DocumentTextIcon, label: 'Announcements' },
    { to: '/officer/events', icon: CalendarIcon, label: 'Events' },
    { to: '/profile/edit', icon: UserCircleIcon, label: 'Edit Profile' }
  ];

  return (
    <div className="w-64 bg-gray-800 text-white h-full flex flex-col">
      <div className="p-4">
        <h2 className="text-lg font-semibold">Department Officer</h2>
      </div>
      <nav className="mt-5 px-2 space-y-1 flex-1">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                isActive
                  ? 'bg-gray-700 text-white'
                  : 'text-gray-300 hover:bg-gray-600 hover:text-white'
              }`
            }
          >
            <link.icon className="mr-3 h-5 w-5" />
            {link.label}
          </NavLink>
        ))}
      </nav>
      <div className="px-2 pb-4">
        <button
          type="button"
          onClick={onLogout}
          className="group flex w-full items-center px-3 py-2 text-sm font-semibold rounded-md text-red-200 hover:bg-red-600 hover:text-white"
        >
          <ArrowRightOnRectangleIcon className="mr-3 h-5 w-5" />
          Logout
        </button>
      </div>
    </div>
  );
};

const WoredaAdminSidebar = ({ onLogout }) => {
  const links = [
    { to: '/woreda-admin/dashboard', icon: HomeIcon, label: 'Dashboard' },
    { to: '/woreda-admin/reports', icon: DocumentTextIcon, label: 'All Reports' },
    { to: '/woreda-admin/officers', icon: UserGroupIcon, label: 'Manage Officers' },
    { to: '/woreda-admin/events', icon: CalendarIcon, label: 'Manage Events' },
    { to: '/woreda-admin/meetings', icon: CalendarIcon, label: 'Virtual Meetings' },
    { to: '/woreda-admin/announcements', icon: DocumentTextIcon, label: 'Announcements' },
    { to: '/woreda-admin/analytics', icon: ChartBarIcon, label: 'Analytics' },
    { to: '/profile/edit', icon: UserCircleIcon, label: 'Edit Profile' }
  ];

  return (
    <div className="w-64 bg-gray-900 text-white h-full flex flex-col">
      <div className="p-4">
        <h2 className="text-lg font-semibold">Woreda Admin</h2>
      </div>
      <nav className="mt-5 px-2 space-y-1 flex-1">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                isActive
                  ? 'bg-gray-800 text-white'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`
            }
          >
            <link.icon className="mr-3 h-5 w-5" />
            {link.label}
          </NavLink>
        ))}
      </nav>
      <div className="px-2 pb-4">
        <button
          type="button"
          onClick={onLogout}
          className="group flex w-full items-center px-3 py-2 text-sm font-semibold rounded-md text-red-200 hover:bg-red-600 hover:text-white"
        >
          <ArrowRightOnRectangleIcon className="mr-3 h-5 w-5" />
          Logout
        </button>
      </div>
    </div>
  );
};

const SubCityAdminSidebar = ({ onLogout }) => {
  const [systemStatus, setSystemStatus] = useState({
    uptime: 0,
    activeUsers: 0,
    reportsToday: 0
  });

  const formatUptime = (seconds) => {
    if (!seconds || Number.isNaN(Number(seconds))) return '0m';

    const totalSeconds = Math.floor(Number(seconds));
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  useEffect(() => {
    let isMounted = true;

    const fetchRealtimeStatus = async () => {
      try {
        const response = await analyticsAPI.getRealtime();
        const data = response.data?.data || {};

        if (isMounted) {
          setSystemStatus({
            uptime: data.uptime || 0,
            activeUsers: data.activeUsers || 0,
            reportsToday: data.reportsToday || 0
          });
        }
      } catch (error) {
        // Keep defaults if realtime fetch fails.
      }
    };

    fetchRealtimeStatus();
    const interval = setInterval(fetchRealtimeStatus, 30000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const links = [
    { to: '/subcity-admin/dashboard', icon: HomeIcon, label: 'Analytics Dashboard' },
    { to: '/subcity-admin/reports', icon: DocumentTextIcon, label: 'All Reports' },
    { to: '/subcity-admin/admins', icon: UserGroupIcon, label: 'Manage Woreda Admins' },
    { to: '/subcity-admin/meetings', icon: CalendarIcon, label: 'Virtual Meetings' },
    { to: '/subcity-admin/users', icon: UserGroupIcon, label: 'User Management' },
    { to: '/subcity-admin/announcements', icon: DocumentTextIcon, label: 'Announcements' },
    { to: '/subcity-admin/system', icon: CogIcon, label: 'System Settings' },
    { to: '/profile/edit', icon: UserCircleIcon, label: 'Edit Profile' }
  ];

  return (
    <div className="w-64 bg-indigo-900 text-white h-full flex flex-col">
      <div className="p-4">
        <h2 className="text-lg font-semibold">Sub-City Admin</h2>
        <p className="text-sm text-gray-300">System Administrator</p>
      </div>
      <nav className="mt-5 px-2 space-y-1 flex-1">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                isActive
                  ? 'bg-indigo-800 text-white'
                  : 'text-gray-300 hover:bg-indigo-700 hover:text-white'
              }`
            }
          >
            <link.icon className="mr-3 h-5 w-5" />
            {link.label}
          </NavLink>
        ))}
      </nav>
      <div className="px-2 pb-4">
        <button
          type="button"
          onClick={onLogout}
          className="group flex w-full items-center px-3 py-2 text-sm font-semibold rounded-md text-red-100 hover:bg-red-600 hover:text-white"
        >
          <ArrowRightOnRectangleIcon className="mr-3 h-5 w-5" />
          Logout
        </button>
      </div>
      
      {/* System Status */}
      <div className="mt-8 mx-4 p-3 bg-indigo-800 rounded-lg">
        <h4 className="font-semibold text-sm mb-2">System Status</h4>
        <div className="space-y-1 text-xs">
          <div className="flex justify-between">
            <span>Uptime</span>
            <span className="text-green-300">{formatUptime(systemStatus.uptime)}</span>
          </div>
          <div className="flex justify-between">
            <span>Active Users</span>
            <span>{systemStatus.activeUsers.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span>Reports Today</span>
            <span>{systemStatus.reportsToday.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const Sidebar = () => {
  const { user, logout } = useAuth();

  if (!user) return null;

  switch(user.role) {
    case 'resident':
      return <ResidentSidebar onLogout={logout} />;
    case 'officer':
      return <OfficerSidebar onLogout={logout} />;
    case 'woreda_admin':
      return <WoredaAdminSidebar onLogout={logout} />;
    case 'subcity_admin':
      return <SubCityAdminSidebar onLogout={logout} />;
    default:
      return null;
  }
};

export default Sidebar;