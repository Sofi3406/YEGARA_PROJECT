import React, { useEffect, useState } from 'react';
import { usersAPI } from '../../services/api';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import {
  PortalPage,
  PortalHero,
  PortalLoading,
  PortalEmpty,
  PortalFormPanel,
  PortalField,
  PortalPrimaryButton,
  PortalPanel
} from '../../components/portal/PortalPageShell';

const ManageWoredaAdmins = () => {
  const { user } = useAuth();
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    region: '',
    subcity: '',
    woreda: ''
  });

  const targetRole =
    user?.role === 'system_admin'
      ? 'regional_admin'
      : user?.role === 'regional_admin'
        ? 'subcity_admin'
        : 'woreda_admin';

  const roleLabel =
    targetRole === 'regional_admin'
      ? 'regional admin'
      : targetRole === 'subcity_admin'
        ? 'sub city admin'
        : 'woreda admin';

  const fetchAdmins = async () => {
    setLoading(true);
    try {
      const response = await usersAPI.getAll({ role: targetRole });
      setAdmins(response.data.data || []);
    } catch (error) {
      toast.error(`Unable to load ${roleLabel}s`);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.fullName || !form.email) {
      toast.error('Please complete all required fields');
      return;
    }

    if (targetRole === 'regional_admin' && !form.region) {
      toast.error('Region is required');
      return;
    }

    if (targetRole === 'subcity_admin' && (!form.region || !form.subcity)) {
      toast.error('Region and sub city are required');
      return;
    }

    if (targetRole === 'woreda_admin' && (!form.region || !form.subcity || !form.woreda)) {
      toast.error('Region, sub city, and woreda are required');
      return;
    }

    try {
      await usersAPI.create({
        fullName: form.fullName,
        email: form.email,
        role: targetRole,
        region: form.region || undefined,
        subcity: form.subcity || undefined,
        woreda: form.woreda || undefined
      });
      toast.success(`${roleLabel} added successfully`);
      setForm({ fullName: '', email: '', region: '', subcity: '', woreda: '' });
      fetchAdmins();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Unable to add admin');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this woreda admin?')) return;
    try {
      await usersAPI.delete(id);
      toast.success('Woreda admin deleted successfully');
      fetchAdmins();
    } catch (error) {
      toast.error('Unable to delete admin');
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, [targetRole]);

  return (
    <PortalPage>
      <PortalHero
        eyebrow="Woreda leadership"
        title={`Manage ${roleLabel}s`}
        description={`Create or remove ${roleLabel} accounts in your administrative scope.`}
      />

      <PortalFormPanel title={`Add ${roleLabel}`} onSubmit={handleCreate}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <PortalField label="Full name">
            <input
              className="input mt-0"
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            />
          </PortalField>
          <PortalField label="Email">
            <input
              type="email"
              className="input mt-0"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </PortalField>
          {(targetRole === 'regional_admin' || targetRole === 'subcity_admin' || targetRole === 'woreda_admin') && (
            <PortalField label="Region">
              <input className="input mt-0" value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })} />
            </PortalField>
          )}
          {(targetRole === 'subcity_admin' || targetRole === 'woreda_admin') && (
            <PortalField label="Sub city">
              <input className="input mt-0" value={form.subcity} onChange={(e) => setForm({ ...form, subcity: e.target.value })} />
            </PortalField>
          )}
          {targetRole === 'woreda_admin' && (
            <PortalField label="Woreda">
              <input className="input mt-0" value={form.woreda} onChange={(e) => setForm({ ...form, woreda: e.target.value })} />
            </PortalField>
          )}
        </div>
        <PortalPrimaryButton type="submit">Add {roleLabel}</PortalPrimaryButton>
      </PortalFormPanel>

      <PortalPanel title={`${roleLabel}s (${admins.length})`}>
        {loading ? (
          <PortalLoading />
        ) : admins.length === 0 ? (
          <PortalEmpty message={`No ${roleLabel}s found.`} />
        ) : (
          <div className="officer-table-wrap overflow-x-auto">
            <table className="officer-table min-w-[640px]">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Scope</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {admins.map((admin) => (
                  <tr key={admin._id}>
                    <td>{admin.fullName}</td>
                    <td>{admin.email}</td>
                    <td>
                      <span className="officer-chip">{[admin.region, admin.subcity, admin.woreda].filter(Boolean).join(' / ') || '—'}</span>
                    </td>
                    <td className="text-right">
                      <button
                        type="button"
                        onClick={() => handleDelete(admin._id)}
                        className="officer-btn officer-btn--danger-outline"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </PortalPanel>
    </PortalPage>
  );
};

export default ManageWoredaAdmins;
