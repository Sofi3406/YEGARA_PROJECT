import React, { useEffect, useState } from 'react';
import { usersAPI } from '../../services/api';
import { toast } from 'react-hot-toast';
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
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    woreda: ''
  });

  const fetchAdmins = async () => {
    setLoading(true);
    try {
      const response = await usersAPI.getAll({ role: 'woreda_admin' });
      setAdmins(response.data.data || []);
    } catch (error) {
      toast.error('Unable to load woreda admins');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.fullName || !form.email || !form.woreda) {
      toast.error('Please complete all required fields');
      return;
    }

    try {
      await usersAPI.create({
        fullName: form.fullName,
        email: form.email,
        role: 'woreda_admin',
        woreda: form.woreda
      });
      toast.success('Woreda admin added successfully');
      setForm({ fullName: '', email: '', woreda: '' });
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
  }, []);

  return (
    <PortalPage>
      <PortalHero
        eyebrow="Woreda leadership"
        title="Manage woreda admins"
        description="Create or remove woreda administrator accounts across the sub city."
      />

      <PortalFormPanel title="Add woreda admin" onSubmit={handleCreate}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
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
          <PortalField label="Woreda">
            <input
              className="input mt-0"
              value={form.woreda}
              onChange={(e) => setForm({ ...form, woreda: e.target.value })}
            />
          </PortalField>
        </div>
        <PortalPrimaryButton type="submit">Add woreda admin</PortalPrimaryButton>
      </PortalFormPanel>

      <PortalPanel title={`Woreda admins (${admins.length})`}>
        {loading ? (
          <PortalLoading />
        ) : admins.length === 0 ? (
          <PortalEmpty message="No woreda admins found." />
        ) : (
          <div className="officer-table-wrap overflow-x-auto">
            <table className="officer-table min-w-[640px]">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Woreda</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {admins.map((admin) => (
                  <tr key={admin._id}>
                    <td>{admin.fullName}</td>
                    <td>{admin.email}</td>
                    <td>
                      <span className="officer-chip">{admin.woreda}</span>
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
