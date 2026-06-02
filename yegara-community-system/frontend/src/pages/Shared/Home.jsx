import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Navbar from '../../components/Layout/Navbar';
import Footer from '../../components/Layout/Footer';
import LandingImageCarousel from '../../components/landing/LandingImageCarousel';
import EventWoredaFilter from '../../components/events/EventWoredaFilter';
import { publicAPI } from '../../services/api';
import { getMediaUrl } from '../../utils/media';
import {
  buildEventWoredaQueryParams,
  filterEventsByWoreda,
  formatEventWoredaLabel,
  EVENT_WOREA_FILTER_ALL
} from '../../utils/woredas';
import './Home.css';

const Home = () => {
  const [snapshot, setSnapshot] = useState({
    openReports: 0,
    resolvedThisWeek: 0,
    upcomingEvents: 0,
    activeResources: 0,
    updatedAt: null
  });
  const [loadingSnapshot, setLoadingSnapshot] = useState(true);
  const [allEvents, setAllEvents] = useState([]);
  const [eventWoredaFilter, setEventWoredaFilter] = useState(EVENT_WOREA_FILTER_ALL);
  const [announcements, setAnnouncements] = useState([]);
  const [loadingCommunity, setLoadingCommunity] = useState(true);
  const [showAllEvents, setShowAllEvents] = useState(false);
  const [showAllAnnouncements, setShowAllAnnouncements] = useState(false);
  const location = useLocation();

  const formatEventDate = (event) => {
    const value = event?.date || event?.startDate;
    if (!value) return '';
    return new Date(value).toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatAnnouncementDate = (item) => {
    if (!item?.createdAt) return '';
    return new Date(item.createdAt).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const scrollToSection = (sectionId) => {
    const section = document.getElementById(sectionId);

    if (section) {
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  useEffect(() => {
    if (!location.hash) return undefined;

    const sectionId = location.hash.replace('#', '');
    const animationFrameId = window.requestAnimationFrame(() => {
      scrollToSection(sectionId);
    });

    return () => window.cancelAnimationFrame(animationFrameId);
  }, [location.hash]);

  useEffect(() => {
    if (!showAllEvents) return undefined;

    const animationFrameId = window.requestAnimationFrame(() => {
      scrollToSection('events-section');
    });

    return () => window.cancelAnimationFrame(animationFrameId);
  }, [showAllEvents]);

  useEffect(() => {
    if (!showAllAnnouncements) return undefined;

    const animationFrameId = window.requestAnimationFrame(() => {
      scrollToSection('announcements-section');
    });

    return () => window.cancelAnimationFrame(animationFrameId);
  }, [showAllAnnouncements]);

  useEffect(() => {
    let isMounted = true;

    const fetchSnapshot = async () => {
      setLoadingSnapshot(true);
      try {
        const response = await publicAPI.getLandingStats();
        if (!isMounted) return;

        const data = response.data?.data || {};
        setSnapshot({
          openReports: Number(data.openReports || 0),
          resolvedThisWeek: Number(data.resolvedThisWeek || 0),
          upcomingEvents: Number(data.upcomingEvents || 0),
          activeResources: Number(data.activeResources || 0),
          updatedAt: data.updatedAt || null
        });
      } catch (error) {
        if (isMounted) {
          setSnapshot((prev) => ({ ...prev, updatedAt: null }));
        }
      } finally {
        if (isMounted) {
          setLoadingSnapshot(false);
        }
      }
    };

    fetchSnapshot();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const fetchCommunity = async () => {
      setLoadingCommunity(true);
      try {

        const [evRes, anRes] = await Promise.all([
          publicAPI.getEvents(buildEventWoredaQueryParams(eventWoredaFilter, { limit: 50 })),
          publicAPI.getAnnouncements({ limit: 50 })
        ]);

        if (!isMounted) return;

        setAllEvents(evRes.data?.data || []);
        setAnnouncements(anRes.data?.data || []);
      } catch (err) {
        if (isMounted) {
          setAllEvents([]);
          setAnnouncements([]);
        }
      } finally {
        if (isMounted) setLoadingCommunity(false);
      }
    };

    fetchCommunity();

    return () => {
      isMounted = false;
    };
  }, [eventWoredaFilter]);

  const events = useMemo(
    () => filterEventsByWoreda(allEvents, eventWoredaFilter),
    [allEvents, eventWoredaFilter]
  );

  const stats = useMemo(
    () => [
      { label: 'Open reports', value: snapshot.openReports },
      { label: 'Resolved this week', value: snapshot.resolvedThisWeek },
      { label: 'Upcoming events', value: snapshot.upcomingEvents },
      { label: 'Active resources', value: snapshot.activeResources }
    ],
    [snapshot]
  );

  const formatNumber = (value) => new Intl.NumberFormat().format(value || 0);

  return (
    <div className="min-h-screen bg-[#ececec]">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 py-6 md:py-10 space-y-8">
        <section className="bg-[#d8d8d8] rounded-xl px-6 md:px-10 py-8 md:py-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div className="text-center lg:text-left rise-in">
              <h1 className="text-3xl md:text-5xl font-display text-slate-900 leading-tight">
                Empowering Communities Through Transparency and Participation
              </h1>
              <p className="mt-4 text-slate-700 max-w-xl mx-auto lg:mx-0">
                A unified platform for community reporting, event management, and digital collaboration across all administrative levels.
              </p>
              <div className="mt-6 flex flex-wrap justify-center lg:justify-start gap-3">
                <Link
                  to="/register"
                  className="px-6 py-2.5 rounded-full text-white font-semibold bg-gradient-to-r from-amber-500 to-orange-700 hover:brightness-110"
                >
                  Get Started
                </Link>
                <Link
                  to="/#events-section"
                  className="px-6 py-2.5 rounded-full text-slate-700 font-semibold bg-white hover:bg-slate-100"
                >
                  Learn More
                </Link>
              </div>
            </div>

            <div className="rise-in rise-in-delay">
              <div className="bg-white border border-slate-300 rounded-lg p-4 shadow-sm">
                <div className="h-56 md:h-60 rounded-md border border-slate-200 overflow-hidden bg-slate-100">
                  <img
                    src={`${process.env.PUBLIC_URL}/Addis%20Ababa.jpg`}
                    alt="Addis Ababa city view"
                    className="w-full h-full object-cover"
                  />
                </div>
                <p className="mt-3 text-center text-emerald-700 font-bold text-xl tracking-[0.14em] uppercase">Addis Ababa</p>
              </div>
            </div>
          </div>
        </section>

        <section
          id="events-section"
          className="landing-community-section relative p-6 md:p-8 scroll-mt-24"
        >
          <div className="relative z-10 text-center mb-8">
            <p className="text-xs font-bold uppercase tracking-[0.32em] text-cyan-700">Community pulse</p>
            <h2 className="mt-2 text-3xl md:text-4xl font-display text-slate-900">Latest from the community</h2>
            <p className="text-slate-600 mt-2 max-w-lg mx-auto">
              Discover upcoming gatherings and official notices in a rich, sliding showcase.
            </p>
          </div>

          <div className="relative z-10 space-y-10">
            <div className="landing-block landing-block--events">
              <header className="landing-section-head">
                <div className="landing-section-head__text">
                  <p className="landing-section-head__eyebrow landing-section-head__eyebrow--events">Live schedule</p>
                  <h3 className="landing-section-head__title">Upcoming events</h3>
                </div>
                {!loadingCommunity && events.length > 0 && (
                  <span className="landing-section-head__count">{events.length}</span>
                )}
              </header>

              <div className="mb-4 max-w-xs">
                <EventWoredaFilter
                  value={eventWoredaFilter}
                  onChange={(e) => setEventWoredaFilter(e.target.value)}
                  disabled={loadingCommunity}
                />
              </div>

              {loadingCommunity ? (
                <div className="landing-empty animate-pulse">Loading events…</div>
              ) : (
                <LandingImageCarousel
                  carouselId="home-events"
                  items={events}
                  theme="events"
                  emptyMessage="No upcoming events yet. Check back soon for community gatherings."
                  badgeLabel="Featured event"
                  getImageSrc={(ev) => (ev.images?.[0] ? getMediaUrl(ev.images[0]) : null)}
                  getTitle={(ev) => ev.title}
                  getDescription={(ev) => ev.description?.trim() || ''}
                  getSubtitle={(ev) => {
                    const parts = [ev.location, ev.woreda ? formatEventWoredaLabel(ev.woreda) : null].filter(Boolean);
                    return parts.length ? parts.join(' · ') : null;
                  }}
                  getDateLabel={formatEventDate}
                  getHref={() => '#events-section'}
                />
              )}

              <div className="landing-block__actions">
                <button
                  type="button"
                  onClick={() => setShowAllEvents((prev) => !prev)}
                  className="landing-view-all landing-view-all--events"
                >
                  {showAllEvents ? 'Show less events' : 'View all events'}
                  <span className="landing-view-all__icon" aria-hidden="true">→</span>
                </button>
              </div>

              {showAllEvents && events.length > 0 && (
                <div className="landing-expanded-grid">
                  {events.map((ev) => (
                    <article key={`${ev._id}-full`} className="landing-expanded-card">
                      <div className="h-44 bg-gradient-to-br from-cyan-100 via-white to-slate-100">
                        {ev.images?.[0] ? (
                          <img src={getMediaUrl(ev.images[0])} alt={ev.title} className="h-full w-full object-cover" loading="lazy" />
                        ) : (
                          <div className="flex h-full items-center justify-center px-6 text-center bg-gradient-to-br from-cyan-800 to-slate-900">
                            <p className="text-xl font-display font-semibold text-white line-clamp-2">{ev.title}</p>
                          </div>
                        )}
                      </div>
                      <div className="p-5">
                        <p className="text-xs uppercase tracking-[0.28em] text-cyan-700">Event</p>
                        <h4 className="mt-2 text-xl font-semibold text-slate-900">{ev.title}</h4>
                        <p className="mt-1 text-sm text-slate-500">{formatEventDate(ev)}</p>
                        <p className="landing-expanded-card__desc">{ev.description || 'No description available.'}</p>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>

            <div id="announcements-section" className="landing-block landing-block--announcements scroll-mt-24">
              <header className="landing-section-head">
                <div className="landing-section-head__text">
                  <p className="landing-section-head__eyebrow landing-section-head__eyebrow--announcements">Official notices</p>
                  <h3 className="landing-section-head__title">Announcements</h3>
                </div>
                {!loadingCommunity && announcements.length > 0 && (
                  <span className="landing-section-head__count">{announcements.length}</span>
                )}
              </header>

              {loadingCommunity ? (
                <div className="landing-empty animate-pulse">Loading announcements…</div>
              ) : (
                <LandingImageCarousel
                  carouselId="home-announcements"
                  items={announcements}
                  theme="announcements"
                  emptyMessage="No announcements yet. Important community updates will appear here."
                  badgeLabel="Featured update"
                  getImageSrc={(a) => (a.image ? getMediaUrl(a.image) : null)}
                  getTitle={(a) => a.title}
                  getDescription={(a) => a.message?.trim() || ''}
                  getDateLabel={formatAnnouncementDate}
                  getHref={() => '#announcements-section'}
                />
              )}

              <div className="landing-block__actions">
                <button
                  type="button"
                  onClick={() => setShowAllAnnouncements((prev) => !prev)}
                  className="landing-view-all landing-view-all--announcements"
                >
                  {showAllAnnouncements ? 'Show less announcements' : 'View all announcements'}
                  <span className="landing-view-all__icon" aria-hidden="true">→</span>
                </button>
              </div>

              {showAllAnnouncements && announcements.length > 0 && (
                <div className="mt-4 space-y-3">
                  {announcements.map((a) => (
                    <article key={`${a._id}-full`} className="landing-expanded-card">
                      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr]">
                        <div className="relative min-h-[220px] bg-gradient-to-br from-amber-100 via-white to-slate-100">
                          {a.image ? (
                            <img src={getMediaUrl(a.image)} alt={a.title} className="h-full w-full object-cover" loading="lazy" />
                          ) : (
                            <div className="flex h-full items-center justify-center px-6 text-center bg-gradient-to-br from-amber-800 to-slate-900">
                              <p className="text-xl font-display font-semibold text-white line-clamp-3">{a.title}</p>
                            </div>
                          )}
                        </div>
                        <div className="p-5 md:p-6">
                          <p className="text-xs uppercase tracking-[0.28em] text-amber-700">Announcement</p>
                          <h4 className="mt-2 text-xl font-semibold text-slate-900">{a.title}</h4>
                          <p className="mt-1 text-sm text-slate-500">{formatAnnouncementDate(a)}</p>
                          <p className="landing-expanded-card__desc">{a.message}</p>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="bg-white rounded-xl p-6 md:p-8 shadow-sm border border-slate-200">
          <div className="text-center">
            <p className="text-xs uppercase tracking-[0.28em] text-cyan-700 font-semibold">Live snapshot</p>
            <h2 className="text-3xl font-display text-slate-900 mt-2">Neighborhood pulse</h2>
            <p className="text-slate-500 text-sm mt-1">
              {loadingSnapshot
                ? 'Syncing with latest data'
                : snapshot.updatedAt
                  ? `Updated ${new Date(snapshot.updatedAt).toLocaleString()}`
                  : 'Updated recently'}
            </p>
          </div>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat) => (
              <div key={stat.label} className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-5 text-center">
                <p className="text-xs uppercase tracking-wider text-slate-500">{stat.label}</p>
                <p className="mt-2 text-3xl font-semibold text-slate-900">{loadingSnapshot ? '...' : formatNumber(stat.value)}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-[#d8d8d8] rounded-xl px-6 md:px-10 py-10">
          <div className="text-center">
            <h2 className="text-4xl font-display text-slate-900">Key features</h2>
            <p className="text-slate-700 mt-2">Everything you need for efficient community management and citizen engagement</p>
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              {
                title: 'Submit Community Reports',
                description: 'Residents can easily report issues, safety concerns, and service problems directly from their devices.'
              },
              {
                title: 'Track Report Status',
                description: 'Real-time tracking of reported issues from submission to resolution with transparent status updates.'
              },
              {
                title: 'Manage Local Events',
                description: 'Plan, schedule, and promote community events with RSVP management and attendance tracking.'
              }
            ].map((item) => (
              <article key={item.title} className="bg-white rounded-lg border border-slate-300 p-5 text-center shadow-sm">
                <h3 className="text-2xl font-display text-slate-900">{item.title}</h3>
                <p className="mt-3 text-slate-700">{item.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="bg-white rounded-xl px-6 md:px-10 py-10 border border-slate-200">
          <div className="text-center">
            <h2 className="text-4xl font-display text-slate-900">How The Platform Works</h2>
            <p className="text-slate-700 mt-2">A streamlined process connecting residents with local government</p>
          </div>

          <div className="relative mt-8">
            <div className="hidden md:block absolute left-12 right-12 top-8 h-1 bg-cyan-200 rounded-full" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              {[
                {
                  step: '1',
                  title: 'Residents Submit Reports',
                  description: 'Community members report issues via web or mobile app with photos and location details.'
                },
                {
                  step: '2',
                  title: 'Officers Review and Update Status',
                  description: 'Department officers receive notifications, review reports, and update resolution status.'
                },
                {
                  step: '3',
                  title: 'Admins Manage Community Activities',
                  description: 'Administrators coordinate events, meetings, and ensure smooth community operations.'
                }
              ].map((item) => (
                <div key={item.step} className="relative">
                  <div className="mx-auto h-16 w-16 rounded-full bg-gradient-to-r from-amber-500 to-orange-700 text-white text-3xl font-bold flex items-center justify-center shadow-md">
                    {item.step}
                  </div>
                  <h3 className="mt-4 text-2xl font-display text-slate-900">{item.title}</h3>
                  <p className="mt-2 text-slate-700">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[#d8d8d8] rounded-xl px-6 md:px-10 py-10">
          <div className="text-center">
            <h2 className="text-4xl font-display text-slate-900">Platform Modules</h2>
            <p className="text-slate-700 mt-2">Tailored interfaces for every stakeholder in the community ecosystem</p>
          </div>

          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              {
                title: 'Resident Portal',
                description: 'Submit reports, track status, view events, and participate in community meetings.'
              },
              {
                title: 'Woreda Admin Dashboard',
                description: 'Manage local events and department officers.'
              },
              {
                title: 'Sub-City Admin Dashboard',
                description: 'Oversee multiple woredas, analyze trends, and coordinate inter-department activities.'
              },
              {
                title: 'Department Officer Dashboard',
                description: 'Review assigned reports, update statuses, and post department updates.'
              }
            ].map((module) => (
              <article key={module.title} className="bg-white rounded-lg border border-slate-300 p-5 text-center shadow-sm">
                <div className="mx-auto h-12 w-12 rounded-full bg-slate-300" />
                <h3 className="mt-3 text-xl font-display text-slate-900">{module.title}</h3>
                <p className="mt-2 text-slate-700 text-sm">{module.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="bg-[#c8c8c8] rounded-2xl px-6 md:px-10 py-12 text-center">
          <h2 className="text-4xl font-display text-slate-900">Join the Digital Transformation of Community Governance</h2>
          <p className="mt-3 text-slate-800 max-w-3xl mx-auto">
            Be part of the modern solution that bridges the gap between residents and local government through technology and transparency.
          </p>
          <div className="mt-8">
            <Link
              to="/register"
              className="inline-flex items-center px-8 py-3 rounded-full text-white font-semibold bg-gradient-to-r from-amber-500 to-orange-700 hover:brightness-110"
            >
              Create Account
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Home;
