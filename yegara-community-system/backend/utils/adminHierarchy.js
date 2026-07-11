const ADMIN_ROLE_CHAIN = ['system_admin', 'regional_admin', 'subcity_admin', 'woreda_admin', 'officer'];

const CHILD_ROLE_MAP = {
  system_admin: ['regional_admin'],
  regional_admin: ['subcity_admin'],
  subcity_admin: ['woreda_admin'],
  woreda_admin: ['officer']
};

const normalizeScopeValue = (value) => String(value || '').trim();

const getAdminScope = (user = {}) => ({
  region: normalizeScopeValue(user.region),
  subcity: normalizeScopeValue(user.subcity),
  woreda: normalizeScopeValue(user.woreda)
});

const getAssignableRoles = (role) => CHILD_ROLE_MAP[role] || [];

const isAdminRole = (role) => ADMIN_ROLE_CHAIN.includes(role);

const scopeQueryForUser = (user = {}) => {
  if (!isAdminRole(user.role)) {
    return {};
  }

  const scope = getAdminScope(user);

  switch (user.role) {
    case 'system_admin':
      return {};
    case 'regional_admin':
      return scope.region ? { region: scope.region } : {};
    case 'subcity_admin':
      return {
        ...(scope.region ? { region: scope.region } : {}),
        ...(scope.subcity ? { subcity: scope.subcity } : {})
      };
    case 'woreda_admin':
      return {
        ...(scope.region ? { region: scope.region } : {}),
        ...(scope.subcity ? { subcity: scope.subcity } : {}),
        ...(scope.woreda ? { woreda: scope.woreda } : {})
      };
    default:
      return {};
  }
};

const canAccessUser = (actor = {}, target = {}) => {
  if (!actor || !target) {
    return false;
  }

  if (actor.role === 'system_admin') {
    return true;
  }

  const actorScope = getAdminScope(actor);
  const targetScope = getAdminScope(target);

  if (actor.role === 'regional_admin') {
    return actorScope.region && targetScope.region === actorScope.region;
  }

  if (actor.role === 'subcity_admin') {
    return (
      actorScope.region &&
      targetScope.region === actorScope.region &&
      actorScope.subcity &&
      targetScope.subcity === actorScope.subcity
    );
  }

  if (actor.role === 'woreda_admin') {
    return (
      actorScope.region &&
      targetScope.region === actorScope.region &&
      actorScope.subcity &&
      targetScope.subcity === actorScope.subcity &&
      actorScope.woreda &&
      targetScope.woreda === actorScope.woreda
    );
  }

  return actor.id && target.id && actor.id === target.id;
};

const getNextManagedRole = (role) => getAssignableRoles(role)[0] || null;

const prepareManagedUserPayload = (actor = {}, input = {}) => {
  const scope = getAdminScope(actor);
  const nextRole = getNextManagedRole(actor.role);

  const payload = {
    ...input,
    role: input.role || nextRole
  };

  if (actor.role === 'system_admin') {
    return payload;
  }

  if (actor.role === 'regional_admin') {
    payload.region = scope.region;
    return payload;
  }

  if (actor.role === 'subcity_admin') {
    payload.region = scope.region;
    payload.subcity = scope.subcity;
    return payload;
  }

  if (actor.role === 'woreda_admin') {
    payload.region = scope.region;
    payload.subcity = scope.subcity;
    payload.woreda = scope.woreda;
    return payload;
  }

  return payload;
};

const isValidAdminAssignment = (actor = {}, targetRole) => getAssignableRoles(actor.role).includes(targetRole);

module.exports = {
  ADMIN_ROLE_CHAIN,
  canAccessUser,
  getAdminScope,
  getAssignableRoles,
  getNextManagedRole,
  isAdminRole,
  isValidAdminAssignment,
  normalizeScopeValue,
  prepareManagedUserPayload,
  scopeQueryForUser
};