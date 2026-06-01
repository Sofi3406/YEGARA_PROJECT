import React, { useEffect, useState } from 'react';
import { eventsAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';
import { getMediaUrl } from '../../utils/media';
import EventRegistrationDetails from '../../components/events/EventRegistrationDetails';
import {
  canViewEventRegistrations,
  getRegistrationStatus,
  getSpotsLeft,
  isEventOwner
} from '../../utils/eventRegistrations';

const ManageEvents = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedEventLoading, setSelectedEventLoading] = useState(false);
  const [form, setForm] = useState({
    title: '',
    date: '',
    location: '',
    description: '',
    meetingLink: '',
    images: []
  });

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const response = await eventsAPI.getByWoreda(user?.woreda);
      setEvents(response.data.data || []);
    } catch (error) {
      toast.error('Unable to load events');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({ title: '', date: '', location: '', description: '', meetingLink: '', images: [] });
    setEditing(null);
  };

  const buildEventFormData = (eventForm) => {
    const formData = new FormData();

    Object.entries(eventForm).forEach(([key, value]) => {
      if (key === 'images') {
        return;
      }

      if (value !== null && value !== undefined && value !== '') {
        formData.append(key, value);
      }
    });

    if (eventForm.images?.length > 0) {
      eventForm.images.forEach((file) => formData.append('images', file));
    }

    return formData;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.date || !form.location) {
      toast.error('Please complete all required fields');
      return;
    }

    try {
      const payload = buildEventFormData({ ...form, woreda: user?.woreda });

      if (editing) {
        await eventsAPI.update(editing, payload);
        toast.success('Event updated successfully');
      } else {
        await eventsAPI.create(payload);
        toast.success('Event added successfully');
      }
      resetForm();
      fetchEvents();
    } catch (error) {
      toast.error('Unable to save event');
    }
  };

  const handleEdit = (event) => {
    setEditing(event._id);
    setForm({
      title: event.title || '',
      date: event.date ? event.date.substring(0, 16) : '',
      location: event.location || '',
      description: event.description || '',
      meetingLink: event.meetingLink || '',
      images: []
    });
  };

  const handleViewRegistrations = async (eventId) => {
    setSelectedEventLoading(true);
    try {
      const eventResponse = await eventsAPI.getOne(eventId);
      const event = eventResponse.data?.data || null;

      if (!event) {
        setSelectedEvent(null);
        return;
      }

      try {
        const regResponse = await eventsAPI.getRegistrations(eventId);
        const registrations = regResponse.data?.data;
        setSelectedEvent({
          ...event,
          attendees: registrations?.attendees || [],
          guestAttendees: registrations?.guestAttendees || []
        });
      } catch (regError) {
        if (regError.response?.status === 403) {
          setSelectedEvent(event);
        } else {
          throw regError;
        }
      }
    } catch (error) {
      toast.error('Unable to load registrations');
    } finally {
      setSelectedEventLoading(false);
    }
  };

  const handleSelectEvent = (eventId) => {
    handleViewRegistrations(eventId);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this event?')) return;
    try {
      await eventsAPI.delete(id);
      toast.success('Event deleted successfully');
      fetchEvents();
    } catch (error) {
      toast.error('Unable to delete event');
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [user?.woreda]);

  const formatEventTime = (value) => {
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
        <h1 className="text-3xl font-semibold text-gray-900">Manage events</h1>
        <p className="text-gray-600 mt-2">Create, update, and publish community events.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Title</label>
          <input
            className="input mt-1"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Date & time</label>
          <input
            type="datetime-local"
            className="input mt-1"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Location</label>
          <input
            className="input mt-1"
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Meeting link (optional)</label>
          <input
            className="input mt-1"
            value={form.meetingLink}
            onChange={(e) => setForm({ ...form, meetingLink: e.target.value })}
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700">Event images</label>
          <input
            type="file"
            accept="image/*"
            multiple
            className="input mt-1"
            onChange={(e) => setForm({ ...form, images: Array.from(e.target.files || []) })}
          />
          <p className="mt-1 text-xs text-gray-500">Attach up to 5 images.</p>
          {form.images?.length > 0 && (
            <p className="mt-1 text-xs text-primary-700">{form.images.length} image{form.images.length > 1 ? 's' : ''} selected</p>
          )}
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700">Description</label>
          <textarea
            rows="3"
            className="input mt-1"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>
        <div className="md:col-span-2 flex gap-3">
          <button type="submit" className="btn btn-primary">
            {editing ? 'Update event' : 'Add event'}
          </button>
          {editing && (
            <button type="button" className="btn btn-secondary" onClick={resetForm}>
              Cancel
            </button>
          )}
        </div>
      </form>

      {loading ? (
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
        </div>
      ) : events.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm text-gray-600">
          No events created yet.
        </div>
      ) : (
        <>
          {selectedEvent && (
            <EventRegistrationDetails
              event={selectedEvent}
              loading={selectedEventLoading}
              onClose={() => setSelectedEvent(null)}
            />
          )}

          <div className="space-y-4">
          {events.map((event) => (
            <div
              key={event._id}
              className={`bg-white border rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow ${selectedEvent?._id === event._id ? 'border-amber-300 ring-2 ring-amber-100' : 'border-gray-200'}`}
            >
              <div
                role="button"
                tabIndex={0}
                onClick={() => handleSelectEvent(event._id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleSelectEvent(event._id);
                  }
                }}
                className="cursor-pointer"
              >
              <div className="flex flex-col md:flex-row md:justify-between gap-4">
                <div className="flex items-start gap-4 min-w-0">
                  <div className="shrink-0 rounded-xl bg-gradient-to-br from-primary-600 to-primary-500 text-white w-14 h-14 flex flex-col items-center justify-center shadow-sm">
                    <span className="text-[10px] tracking-wide">{formatEventTime(event.date).month}</span>
                    <span className="text-base font-semibold leading-none">{formatEventTime(event.date).day}</span>
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 truncate">{event.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">{event.description || 'No description available.'}</p>
                  </div>
                </div>

                <div className="text-sm text-gray-600 md:text-right">
                  <p>{formatEventTime(event.date).full}</p>
                  <p className="mt-1 text-gray-700 font-medium">{event.location}</p>
                  <span className={`inline-flex items-center mt-2 rounded-full px-3 py-1 text-xs font-medium border ${getRegistrationStatus(event).className}`}>
                    {getRegistrationStatus(event).label}
                  </span>
                  {getSpotsLeft(event) !== null && (
                    <span className="inline-flex items-center mt-2 rounded-full bg-white px-3 py-1 text-xs font-medium border border-slate-200 text-slate-600">
                      {getSpotsLeft(event)} spot{getSpotsLeft(event) === 1 ? '' : 's'} left
                    </span>
                  )}
                  <span className="inline-flex items-center mt-2 rounded-full bg-primary-50 text-primary-700 px-3 py-1 text-xs font-medium border border-primary-100">
                    Scope: {event.woreda || user?.woreda || 'Woreda'}
                  </span>
                </div>
              </div>
              </div>

              {(isEventOwner(event, user) || canViewEventRegistrations(event, user)) && (
                <div className="relative z-10 mt-4 flex flex-wrap gap-3">
                  {isEventOwner(event, user) && (
                    <button
                      type="button"
                      className="inline-flex items-center rounded-lg border border-primary-200 text-primary-700 text-sm font-medium px-3 py-1.5 hover:bg-primary-50"
                      onClick={() => handleEdit(event)}
                    >
                      Edit
                    </button>
                  )}
                  {canViewEventRegistrations(event, user) && (
                    <button
                      type="button"
                      className="inline-flex items-center rounded-lg border border-amber-200 text-amber-700 text-sm font-medium px-3 py-1.5 hover:bg-amber-50"
                      onClick={() => handleViewRegistrations(event._id)}
                    >
                      View registrations
                    </button>
                  )}
                  {isEventOwner(event, user) && (
                    <button
                      type="button"
                      className="inline-flex items-center rounded-lg border border-red-200 text-red-700 text-sm font-medium px-3 py-1.5 hover:bg-red-50"
                      onClick={() => handleDelete(event._id)}
                    >
                      Delete
                    </button>
                  )}
                </div>
              )}

              {event.images?.length > 0 && (
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {event.images.slice(0, 3).map((image, index) => (
                    <a
                      key={`${event._id}-image-${index}`}
                      href={getMediaUrl(image)}
                      target="_blank"
                      rel="noreferrer"
                      className="block overflow-hidden rounded-xl border border-gray-200 bg-gray-50"
                    >
                      <img
                        src={getMediaUrl(image)}
                        alt={`Event image ${index + 1} for ${event.title}`}
                        className="h-28 w-full object-cover transition-transform duration-200 hover:scale-105"
                        loading="lazy"
                      />
                    </a>
                  ))}
                </div>
              )}
            </div>
          ))}
          </div>
        </>
      )}
    </div>
  );
};

export default ManageEvents;
