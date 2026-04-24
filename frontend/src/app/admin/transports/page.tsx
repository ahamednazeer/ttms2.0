'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';
import DataTable from '@/components/DataTable';
import Modal from '@/components/Modal';
import { Truck, Plus } from '@phosphor-icons/react';
import { toast } from 'sonner';

interface TransportFormState {
  vehicleNo: string;
  type: string;
  ownerDetails: string;
  contact: string;
  vendorId: string;
  cityId: string;
  userId: string;
}

const emptyForm: TransportFormState = {
  vehicleNo: '',
  type: '',
  ownerDetails: '',
  contact: '',
  vendorId: '',
  cityId: '',
  userId: '',
};

export default function TransportsPage() {
  const [transports, setTransports] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editData, setEditData] = useState<any>(null);
  const [form, setForm] = useState<TransportFormState>(emptyForm);

  const fetchData = async () => {
    try {
      const [transportData, vendorData, cityData, userData] = await Promise.all([
        api.getTransports(),
        api.getVendors(),
        api.getCities(),
        api.getUsers(),
      ]);
      setTransports(transportData || []);
      setVendors(vendorData || []);
      setCities(cityData || []);
      setUsers(userData || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const transportUsers = useMemo(
    () => users.filter((user) => user.role === 'TRANSPORT'),
    [users],
  );

  const selectedTransportUser = useMemo(
    () => transportUsers.find((user) => user._id === form.userId) || null,
    [form.userId, transportUsers],
  );

  const getLinkedUserId = (transportId: string) =>
    transportUsers.find((user) => (user.transportId?._id || user.transportId) === transportId)?._id || '';

  const handleTransportUserChange = (userId: string) => {
    const selectedUser = transportUsers.find((user) => user._id === userId);

    setForm((currentForm) => {
      if (!selectedUser) {
        return { ...currentForm, userId: '' };
      }

      const fullName = [selectedUser.firstName, selectedUser.lastName].filter(Boolean).join(' ').trim();

      return {
        ...currentForm,
        userId,
        ownerDetails: fullName || currentForm.ownerDetails,
        contact: selectedUser.phone || currentForm.contact,
        cityId: selectedUser.cityId?._id || currentForm.cityId,
      };
    });
  };

  const openCreateModal = () => {
    setEditData(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEditModal = (transport: any) => {
    setEditData(transport);
    setForm({
      vehicleNo: transport.vehicleNo,
      type: transport.type || '',
      ownerDetails: transport.ownerDetails || '',
      contact: transport.contact || '',
      vendorId: transport.vendorId?._id || '',
      cityId: transport.cityId?._id || '',
      userId: getLinkedUserId(transport._id),
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editData) {
        await api.updateTransport(editData._id, form);
        toast.success('Transport updated');
      } else {
        await api.createTransport(form);
        toast.success('Transport created');
      }
      setModalOpen(false);
      setEditData(null);
      setForm(emptyForm);
      fetchData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleDelete = async (row: any) => {
    if (!confirm('Delete?')) return;
    try {
      await api.deleteTransport(row._id);
      toast.success('Transport deleted');
      fetchData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const columns = [
    { key: 'vehicleNo', label: 'Vehicle No', sortable: true },
    { key: 'type', label: 'Type' },
    { key: 'ownerDetails', label: 'Driver' },
    { key: 'contact', label: 'Contact' },
    {
      key: 'portalUser',
      label: 'Portal User',
      render: (row: any) =>
        transportUsers.find((user) => (user.transportId?._id || user.transportId) === row._id)?.username || '-',
    },
    { key: 'vendor', label: 'Vendor', render: (row: any) => row.vendorId?.vendorName || '-' },
    { key: 'city', label: 'City', render: (row: any) => row.cityId?.cityName || '-' },
    {
      key: 'actions',
      label: 'Actions',
      render: (row: any) => (
        <div className="flex gap-2">
          <button onClick={() => openEditModal(row)} className="btn-secondary text-xs px-3 py-1">Edit</button>
          <button onClick={() => handleDelete(row)} className="btn-danger text-xs px-3 py-1">Delete</button>
        </div>
      ),
    },
  ];

  if (loading) return <div className="text-slate-500 font-mono text-center py-12 animate-pulse">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-chivo font-bold uppercase tracking-wider flex items-center gap-3">
          <Truck size={28} weight="duotone" className="text-blue-400" /> Transport Management
        </h1>
        <button onClick={openCreateModal} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Add
        </button>
      </div>

      <DataTable data={transports} columns={columns} />

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editData ? 'Edit Transport' : 'Add Transport'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="info-strip">
            Link the driver login here so the transport dashboard automatically shows rides for this vehicle. If driver details exist on that user, they auto-fill below.
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-400 text-xs uppercase mb-2 font-mono">Vehicle No</label>
              <input
                value={form.vehicleNo}
                onChange={(e) => setForm({ ...form, vehicleNo: e.target.value })}
                required
                className="input-modern"
              />
            </div>
            <div>
              <label className="block text-slate-400 text-xs uppercase mb-2 font-mono">Type</label>
              <input
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="input-modern"
                placeholder="Sedan, SUV..."
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-400 text-xs uppercase mb-2 font-mono">Driver Name</label>
              <input
                value={form.ownerDetails}
                onChange={(e) => setForm({ ...form, ownerDetails: e.target.value })}
                className="input-modern"
              />
            </div>
            <div>
              <label className="block text-slate-400 text-xs uppercase mb-2 font-mono">Contact</label>
              <input
                value={form.contact}
                onChange={(e) => setForm({ ...form, contact: e.target.value })}
                className="input-modern"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-400 text-xs uppercase mb-2 font-mono">Vendor</label>
              <select
                value={form.vendorId}
                onChange={(e) => setForm({ ...form, vendorId: e.target.value })}
                required
                className="input-modern"
              >
                <option value="">Select</option>
                {vendors.map((vendor: any) => (
                  <option key={vendor._id} value={vendor._id}>{vendor.vendorName}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-slate-400 text-xs uppercase mb-2 font-mono">City</label>
              <select
                value={form.cityId}
                onChange={(e) => setForm({ ...form, cityId: e.target.value })}
                required
                className="input-modern"
              >
                <option value="">Select</option>
                {cities.map((city: any) => (
                  <option key={city._id} value={city._id}>{city.cityName}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-400 text-xs uppercase mb-2 font-mono">Transport User</label>
            <select
              value={form.userId}
              onChange={(e) => handleTransportUserChange(e.target.value)}
              className="input-modern"
            >
              <option value="">Unlinked</option>
              {transportUsers.map((user: any) => (
                <option key={user._id} value={user._id}>
                  {user.username}{user.firstName ? ` - ${user.firstName}` : ''}
                </option>
                ))}
              </select>
              {selectedTransportUser?.email && (
                <p className="mt-2 text-xs text-slate-500 font-mono">
                  Driver email: <span className="text-slate-300">{selectedTransportUser.email}</span>
                </p>
              )}
          </div>

          <div className="flex gap-3 justify-end">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">{editData ? 'Update' : 'Create'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
