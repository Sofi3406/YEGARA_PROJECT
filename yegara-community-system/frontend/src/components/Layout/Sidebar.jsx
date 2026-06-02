import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  HomeIcon,
  DocumentTextIcon,
  CalendarIcon,
  ChartBarIcon,
  UserGroupIcon,
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
    <div className="w-64 bg-stone-900 text-amber-50 h-full flex flex-col border-r border-amber-900/30">
      <nav className="mt-5 px-2 space-y-1 flex-1">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                isActive
                  ? 'bg-amber-900/35 text-amber-50'
                  : 'text-amber-100/80 hover:bg-stone-800 hover:text-amber-50'
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
          className="group flex w-full items-center px-3 py-2 text-sm font-semibold rounded-md text-red-200 hover:bg-red-700/80 hover:text-white"
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
    { to: '/officer/events', icon: CalendarIcon, label: 'Register for Events' },
    { to: '/profile/edit', icon: UserCircleIcon, label: 'Edit Profile' }
  ];

  return (
    <div className="w-64 bg-stone-900 text-amber-50 h-full flex flex-col border-r border-amber-900/30">
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
                  ? 'bg-amber-900/35 text-amber-50'
                  : 'text-amber-100/80 hover:bg-stone-800 hover:text-amber-50'
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
          className="group flex w-full items-center px-3 py-2 text-sm font-semibold rounded-md text-red-200 hover:bg-red-700/80 hover:text-white"
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
    { to: '/woreda-admin/community-events', icon: CalendarIcon, label: 'Register for Events' },
    { to: '/woreda-admin/meetings', icon: CalendarIcon, label: 'Virtual Meetings' },
    { to: '/woreda-admin/announcements', icon: DocumentTextIcon, label: 'Announcements' },
    { to: '/woreda-admin/analytics', icon: ChartBarIcon, label: 'Analytics' },
    { to: '/profile/edit', icon: UserCircleIcon, label: 'Edit Profile' }
  ];

  return (
    <div className="w-64 bg-stone-900 text-amber-50 h-full flex flex-col border-r border-amber-900/30">
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
                  ? 'bg-amber-900/35 text-amber-50'
                  : 'text-amber-100/80 hover:bg-stone-800 hover:text-amber-50'
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
          className="group flex w-full items-center px-3 py-2 text-sm font-semibold rounded-md text-red-200 hover:bg-red-700/80 hover:text-white"
        >
          <ArrowRightOnRectangleIcon className="mr-3 h-5 w-5" />
          Logout
        </button>
      </div>
    </div>
  );
};

const SubCityAdminSidebar = ({ onLogout }) => {
  const links = [
    { to: '/subcity-admin/dashboard', icon: HomeIcon, label: 'Analytics' },
    { to: '/subcity-admin/reports', icon: DocumentTextIcon, label: 'All Reports' },
    { to: '/subcity-admin/admins', icon: UserGroupIcon, label: 'Manage Woreda Admins' },
    { to: '/subcity-admin/events', icon: CalendarIcon, label: 'Manage Events' },
    { to: '/subcity-admin/users', icon: UserGroupIcon, label: 'User Management' },
    { to: '/subcity-admin/meetings', icon: CalendarIcon, label: 'Virtual Meetings' },
    { to: '/subcity-admin/announcements', icon: DocumentTextIcon, label: 'Announcements' },
    { to: '/profile/edit', icon: UserCircleIcon, label: 'Edit Profile' }
  ];

  return (
    <div className="w-64 bg-stone-900 text-amber-50 h-full flex flex-col border-r border-amber-900/30">
      <div className="p-4">
        <h2 className="text-lg font-semibold">Sub-City Admin</h2>
        <p className="text-sm text-amber-100/70">Sub city administration</p>
      </div>
      <nav className="mt-5 px-2 space-y-1 flex-1">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                isActive
                  ? 'bg-amber-900/35 text-amber-50'
                  : 'text-amber-100/80 hover:bg-stone-800 hover:text-amber-50'
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
          className="group flex w-full items-center px-3 py-2 text-sm font-semibold rounded-md text-red-200 hover:bg-red-700/80 hover:text-white"
        >
          <ArrowRightOnRectangleIcon className="mr-3 h-5 w-5" />
          Logout
        </button>
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