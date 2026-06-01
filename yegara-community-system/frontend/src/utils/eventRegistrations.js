export const normalizeId = (value) => {
  if (value == null) return '';

  if (typeof value === 'object') {
    return String(value._id || value.id || '');
  }

  return String(value);
};

export const getCurrentUserId = (user) => normalizeId(user);

export const getOrganizerId = (event) => normalizeId(event?.organizer);

export const isEventOwner = (event, user) => {
  const organizerId = getOrganizerId(event);
  const userId = getCurrentUserId(user);

  return Boolean(organizerId && userId && organizerId === userId);
};

export const isEventsAdmin = (user) =>
  ['woreda_admin', 'subcity_admin'].includes(user?.role);

export const canViewEventRegistrations = (event, user) =>
  isEventOwner(event, user) || isEventsAdmin(user);

export const countFromRegistrationArrays = (event) => {
  if (!event) return 0;

  const attendees = Array.isArray(event.attendees) ? event.attendees.length : 0;
  const guests = Array.isArray(event.guestAttendees) ? event.guestAttendees.length : 0;

  return attendees + guests;
};

export const getRegistrationCount = (event) => {
  if (!event) return 0;

  const fromArrays = countFromRegistrationArrays(event);

  return Math.max(
    fromArrays,
    Number(event.registrationCount) || 0,
    Number(event.attendeeCount) || 0
  );
};

export const getRegistrationStatus = (event) => {
  const count = getRegistrationCount(event);
  const max = event?.maxAttendees;

  if (!max) {
    return {
      label: `Registered: ${count}`,
      className: 'bg-amber-50 text-amber-700 border-amber-100'
    };
  }

  const ratio = count / max;

  if (count >= max) {
    return {
      label: `Full: ${count}/${max}`,
      className: 'bg-red-50 text-red-700 border-red-200'
    };
  }

  if (ratio >= 0.8) {
    return {
      label: `Almost full: ${count}/${max}`,
      className: 'bg-amber-50 text-amber-800 border-amber-200'
    };
  }

  return {
    label: `Registered: ${count}/${max}`,
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200'
  };
};

export const getSpotsLeft = (event) => {
  const max = event?.maxAttendees;

  if (!max) return null;

  return Math.max(max - getRegistrationCount(event), 0);
};
