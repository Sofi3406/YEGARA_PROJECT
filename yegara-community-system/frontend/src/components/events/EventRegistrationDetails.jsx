import React from 'react';
import { getRegistrationCount, getRegistrationStatus } from '../../utils/eventRegistrations';

const EventRegistrationDetails = ({ event, loading, onClose }) => {
  if (!event) return null;

  const registrationStatus = getRegistrationStatus(event);

  return (
    <div className="rounded-3xl border border-amber-100 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-2 border-b border-slate-100 pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-600">Event details</p>
          <h2 className="mt-1 text-xl font-semibold text-slate-900">{event.title}</h2>
          <p className="mt-2 text-sm text-slate-600">{event.description || 'No description available.'}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
            >
              Close
            </button>
          )}
          <span className={`rounded-full px-3 py-1 text-xs font-semibold border ${registrationStatus.className}`}>
            {registrationStatus.label}
          </span>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 text-sm text-slate-600 sm:grid-cols-2">
        <p>
          <span className="font-medium text-slate-800">Date:</span>{' '}
          {event.date ? new Date(event.date).toLocaleString() : '—'}
        </p>
        <p>
          <span className="font-medium text-slate-800">Location:</span> {event.location || '—'}
        </p>
      </div>

      <p className="mt-4 text-sm text-slate-600">
        Registered users: {event.attendees?.length || 0} | Guest registrations: {event.guestAttendees?.length || 0}
        {getRegistrationCount(event) > 0 && (
          <span className="ml-2 text-slate-500">(Total: {getRegistrationCount(event)})</span>
        )}
      </p>

      {loading ? (
        <div className="flex justify-center items-center py-10">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-amber-200 border-t-amber-600" />
        </div>
      ) : (
        <div className="mt-5 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Registered users</h3>
            <div className="mt-4 space-y-3">
              {(event.attendees || []).length === 0 ? (
                <p className="text-sm text-slate-500">No resident registrations yet.</p>
              ) : (
                event.attendees.map((attendee, index) => {
                  const attendeeId = typeof attendee === 'object' ? attendee?._id : attendee;
                  const attendeeName = typeof attendee === 'object' ? attendee?.fullName : null;
                  const attendeeEmail = typeof attendee === 'object' ? attendee?.email : '';

                  return (
                    <div key={attendeeId || `${event._id}-attendee-${index}`} className="rounded-2xl border border-white bg-white p-4 shadow-sm">
                      <p className="font-semibold text-slate-900">{attendeeName || `User ${index + 1}`}</p>
                      {attendeeEmail && <p className="mt-1 text-sm text-slate-600">{attendeeEmail}</p>}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Guest registrations</h3>
            <div className="mt-4 space-y-3">
              {(event.guestAttendees || []).length === 0 ? (
                <p className="text-sm text-slate-500">No guest registrations yet.</p>
              ) : (
                event.guestAttendees.map((guest, index) => (
                  <div key={`${event._id}-guest-${index}`} className="rounded-2xl border border-white bg-white p-4 shadow-sm">
                    <p className="font-semibold text-slate-900">{guest.fullName || `Guest ${index + 1}`}</p>
                    <p className="mt-1 text-sm text-slate-600">{guest.email || 'No email provided'}</p>
                    {guest.phone && <p className="mt-1 text-sm text-slate-600">{guest.phone}</p>}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventRegistrationDetails;
