import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../../components/Layout/Navbar';
import Footer from '../../components/Layout/Footer';
import { publicAPI } from '../../services/api';
import { getMediaUrl } from '../../utils/media';

const Home = () => {
  const [snapshot, setSnapshot] = useState({
    openReports: 0,
    resolvedThisWeek: 0,
    upcomingEvents: 0,
    activeResources: 0,
    updatedAt: null
  });
  const [loadingSnapshot, setLoadingSnapshot] = useState(true);
  const [events, setEvents] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loadingCommunity, setLoadingCommunity] = useState(true);
  const navigate = useNavigate();
  const eventsCarouselRef = useRef(null);
  const announcementsCarouselRef = useRef(null);

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
          publicAPI.getEvents({ limit: 3 }),
          publicAPI.getAnnouncements({ limit: 10 })
        ]);

        if (!isMounted) return;

        setEvents(evRes.data?.data || []);
        setAnnouncements(anRes.data?.data || []);
      } catch (err) {
        if (isMounted) {
          setEvents([]);
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
  }, []);

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

  useEffect(() => {
    const carousel = eventsCarouselRef.current;
    if (!carousel || events.length <= 1) return undefined;

    const intervalId = window.setInterval(() => {
      const firstCard = carousel.querySelector('[data-carousel-card]');
      const cardWidth = firstCard?.getBoundingClientRect().width || carousel.clientWidth;
      const maxScrollLeft = carousel.scrollWidth - carousel.clientWidth;

      if (carousel.scrollLeft >= maxScrollLeft - 2) {
        carousel.scrollTo({ left: 0, behavior: 'smooth' });
        return;
      }

      carousel.scrollBy({ left: cardWidth + 16, behavior: 'smooth' });
    }, 10000);

    return () => window.clearInterval(intervalId);
  }, [events.length]);

  useEffect(() => {
    const carousel = announcementsCarouselRef.current;
    if (!carousel || announcements.length <= 1) return undefined;

    const intervalId = window.setInterval(() => {
      const firstCard = carousel.querySelector('[data-carousel-card]');
      const cardWidth = firstCard?.getBoundingClientRect().width || carousel.clientWidth;
      const maxScrollLeft = carousel.scrollWidth - carousel.clientWidth;

      if (carousel.scrollLeft >= maxScrollLeft - 2) {
        carousel.scrollTo({ left: 0, behavior: 'smooth' });
        return;
      }

      carousel.scrollBy({ left: cardWidth + 16, behavior: 'smooth' });
    }, 10000);

    return () => window.clearInterval(intervalId);
  }, [announcements.length]);

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
                  className="px-6 py-2.5 rounded-full text-white font-semibold bg-gradient-to-r from-cyan-400 to-blue-600 hover:brightness-110"
                >
                  Get Started
                </Link>
                <Link
                  to="/events"
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

        <section className="bg-white rounded-xl p-6 md:p-8 shadow-sm border border-slate-200">
          <div className="text-center mb-6">
            <h2 className="text-3xl font-display text-slate-900">Latest from the community</h2>
            <p className="text-slate-600 mt-1">Events and announcements</p>
          </div>

          <div className="space-y-6">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 md:p-5">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-semibold text-lg md:text-xl">Upcoming Events</h3>
              </div>

              {events.length === 0 ? (
                <div className="mt-3 text-sm text-slate-500">No upcoming events</div>
              ) : (
                <div ref={eventsCarouselRef} className="mt-3 flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory scroll-smooth">
                  {events.map((ev) => (
                    <article
                      key={ev._id}
                      data-carousel-card
                      className="group min-w-full shrink-0 snap-start overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-transform hover:-translate-y-1 hover:shadow-md"
                    >
                      <div className="p-2 bg-gradient-to-br from-slate-100 via-white to-cyan-50">
                        <div className="relative h-56 md:h-72 overflow-hidden rounded-xl border border-white/80 ring-1 ring-slate-200/70 shadow-[0_18px_40px_rgba(15,23,42,0.12)] bg-slate-100">
                        {ev.images?.[0] ? (
                          <img
                            src={getMediaUrl(ev.images[0])}
                            alt={ev.title}
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                            loading="lazy"
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 px-6 text-center">
                            <p className="text-2xl md:text-3xl font-semibold text-slate-700 line-clamp-3">{ev.title}</p>
                          </div>
                        )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/15 to-transparent" />
                          <div className="absolute inset-x-0 bottom-0 p-5 md:p-6 text-white">
                            <p className="text-xs uppercase tracking-[0.28em] text-cyan-200">Event</p>
                            <Link
                              to={`/events/${ev._id}`}
                              onClick={(e) => { e.preventDefault(); navigate(`/events/${ev._id}`); }}
                              className="mt-2 block text-2xl md:text-4xl font-display font-semibold hover:underline line-clamp-2"
                            >
                              {ev.title}
                            </Link>
                            <p className="mt-2 text-sm md:text-base text-slate-100">{new Date(ev.startDate).toLocaleDateString()}</p>
                          </div>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}

              <div className="mt-3">
                <Link to="/events" onClick={(e) => { e.preventDefault(); navigate('/events'); }} className="text-sm text-cyan-700 hover:underline">View all events</Link>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 md:p-5">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-semibold text-lg md:text-xl">Announcements</h3>
              </div>

              {announcements.length === 0 ? (
                <div className="mt-3 text-sm text-slate-500">No announcements</div>
              ) : (
                <div ref={announcementsCarouselRef} className="mt-3 flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory scroll-smooth">
                  {announcements.map((a) => (
                    <article
                      key={a._id}
                      data-carousel-card
                      className="group min-w-full shrink-0 snap-start overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-transform hover:-translate-y-1 hover:shadow-md"
                    >
                      <div className="p-2 bg-gradient-to-br from-slate-100 via-white to-cyan-50">
                        <div className="relative h-56 md:h-72 overflow-hidden rounded-xl border border-white/80 ring-1 ring-slate-200/70 shadow-[0_18px_40px_rgba(15,23,42,0.12)] bg-slate-100">
                        {a.image ? (
                          <img
                            src={getMediaUrl(a.image)}
                            alt={a.title}
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                            loading="lazy"
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 px-6 text-center">
                            <p className="text-2xl md:text-3xl font-semibold text-slate-700 line-clamp-3">{a.title}</p>
                          </div>
                        )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/15 to-transparent" />
                          <div className="absolute inset-x-0 bottom-0 p-5 md:p-6 text-white">
                            <p className="text-xs uppercase tracking-[0.28em] text-cyan-200">Announcement</p>
                            <Link
                              to="/announcements"
                              onClick={(e) => { e.preventDefault(); navigate('/announcements'); }}
                              className="mt-2 block text-2xl md:text-4xl font-display font-semibold hover:underline line-clamp-2"
                            >
                              {a.title}
                            </Link>
                            <p className="mt-2 text-sm md:text-base text-slate-100">{new Date(a.createdAt).toLocaleDateString()}</p>
                            <p className="mt-2 max-w-3xl text-sm md:text-base text-slate-100 line-clamp-2">{a.message}</p>
                          </div>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}

              <div className="mt-3">
                <Link to="/announcements" onClick={(e) => { e.preventDefault(); navigate('/announcements'); }} className="text-sm text-cyan-700 hover:underline">View all announcements</Link>
              </div>
            </div>

            {/* Resources section removed by request */}
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
                  <div className="mx-auto h-16 w-16 rounded-full bg-gradient-to-r from-cyan-400 to-blue-600 text-white text-3xl font-bold flex items-center justify-center shadow-md">
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
              className="inline-flex items-center px-8 py-3 rounded-full text-white font-semibold bg-gradient-to-r from-cyan-400 to-blue-700 hover:brightness-110"
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
