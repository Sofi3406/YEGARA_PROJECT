import React, { useEffect, useState } from 'react';
import { usersAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
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

const ManageOfficers = () => {
  const { user } = useAuth();
  const [officers, setOfficers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    department: '',
    customDepartment: ''
  });

  const fetchOfficers = async () => {
    setLoading(true);
    try {
      const response = await usersAPI.getAll({ role: 'officer' });
      setOfficers(response.data.data || []);
    } catch (error) {
      toast.error('Unable to load officers');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.fullName || !form.email || !form.department) {
      toast.error('Please complete all required fields');
      return;
    }

    if (form.department === 'Other' && !form.customDepartment.trim()) {
      toast.error('Please enter the custom category for this officer');
      return;
    }

    try {
      await usersAPI.create({
        fullName: form.fullName,
        email: form.email,
        role: 'officer',
        department: form.department,
        customDepartment: form.department === 'Other' ? form.customDepartment.trim() : undefined,
        woreda: user?.woreda
      });
      toast.success('Department officer added successfully');
      setForm({ fullName: '', email: '', department: '', customDepartment: '' });
      fetchOfficers();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Unable to add officer');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this officer?')) return;
    try {
      await usersAPI.delete(id);
      toast.success('Department officer deleted successfully');
      fetchOfficers();
    } catch (error) {
      toast.error('Unable to delete officer');
    }
  };

  useEffect(() => {
    fetchOfficers();
  }, [user?.woreda]);

  return (
    <PortalPage>
      <PortalHero
        eyebrow="Team management"
        title="Manage department officers"
        description="Add or remove department officers who handle reports in your woreda."
      />

      <PortalFormPanel title="Add new officer" onSubmit={handleCreate}>
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
          <PortalField label="Department">
            <select
              className="input mt-0"
              value={form.department}
              onChange={(e) => setForm({ ...form, department: e.target.value, customDepartment: '' })}
            >
              <option value="">Select department</option>
              <option value="Water">Water</option>
              <option value="Road">Road</option>
              <option value="Sanitation">Sanitation</option>
              <option value="Electricity">Electricity</option>
              <option value="Health">Health</option>
              <option value="Other">Other</option>
            </select>
          </PortalField>
          {form.department === 'Other' && (
            <PortalField label="Custom category">
              <input
                className="input mt-0"
                placeholder="Enter department name"
                value={form.customDepartment}
                onChange={(e) => setForm({ ...form, customDepartment: e.target.value })}
              />
            </PortalField>
          )}
        </div>
        <PortalPrimaryButton type="submit">Add officer</PortalPrimaryButton>
      </PortalFormPanel>

      <PortalPanel title={`Officers (${officers.length})`}>
        {loading ? (
          <PortalLoading />
        ) : officers.length === 0 ? (
          <PortalEmpty message="No officers found for this woreda." />
        ) : (
          <div className="officer-table-wrap overflow-x-auto">
            <table className="officer-table min-w-[640px]">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Department</th>
                  <th>Custom category</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {officers.map((officer) => (
                  <tr key={officer._id}>
                    <td>{officer.fullName}</td>
                    <td>{officer.email}</td>
                    <td>
                      <span className="officer-chip">{officer.department || 'General'}</span>
                    </td>
                    <td>{officer.customDepartment || '—'}</td>
                    <td className="text-right">
                      <button
                        type="button"
                        onClick={() => handleDelete(officer._id)}
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

export default ManageOfficers;
