'use client';
import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { api } from '@/lib/api';
import type { City, Transport } from '@/lib/types';
import { Truck, Plus } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { CrudPageSkeleton } from '@/components/Skeleton';

const DataTable = dynamic(() => import('@/components/DataTable'), { ssr: false });
const Modal = dynamic(() => import('@/components/Modal'), { ssr: false });

interface VendorTransportForm {
  vehicleNo: string;
  type: string;
  ownerDetails: string;
  contact: string;
  cityId: string;
}

const emptyForm: VendorTransportForm = {
  vehicleNo: '',
  type: '',
  ownerDetails: '',
  contact: '',
  cityId: '',
};

export default function VendorTransportsPage() {
  const [transports, setTransports] = useState<Transport[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editData, setEditData] = useState<Transport | null>(null);
  const [form, setForm] = useState<VendorTransportForm>(emptyForm);

  const fetchData = async () => {
    try {
      const [transportData, cityData] = await Promise.all([api.getTransports(), api.getCities()]);
      setTransports(transportData || []);
      setCities(cityData || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = { ...form };
      if (editData) {
        await api.updateTransport(editData._id, payload);
        toast.success('Transport updated');
      } else {
        await api.createTransport(payload as any);
        toast.success('Transport created');
      }
      setModalOpen(false);
      setEditData(null);
      setForm(emptyForm);
      fetchData();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to save transport');
    }
  };

  const handleDelete = async (transport: Transport) => {
    if (!confirm('Delete this transport?')) return;
    try {
      await api.deleteTransport(transport._id);
      toast.success('Transport deleted');
      fetchData();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete transport');
    }
  };

  const openEditModal = (transport: Transport) => {
    setEditData(transport);
    setForm({
      vehicleNo: transport.vehicleNo,
      type: transport.type || '',
      ownerDetails: transport.ownerDetails || '',
      contact: transport.contact || '',
      cityId: typeof transport.cityId === 'string' ? transport.cityId : transport.cityId?._id || '',
    });
    setModalOpen(true);
  };

  const columns = [
    { key: 'vehicleNo', label: 'Vehicle No' },
    { key: 'type', label: 'Type' },
    { key: 'ownerDetails', label: 'Driver' },
    { key: 'contact', label: 'Contact' },
    { key: 'city', label: 'City', render: (row: Transport) => (typeof row.cityId === 'string' ? '-' : row.cityId?.cityName || '-') },
    {
      key: 'actions',
      label: 'Actions',
      render: (row: Transport) => (
        <div className="flex gap-2">
          <button onClick={() => openEditModal(row)} className="btn-secondary text-xs px-3 py-1">Edit</button>
          <button onClick={() => handleDelete(row)} className="btn-danger text-xs px-3 py-1">Delete</button>
        </div>
      ),
    },
  ];

  if (loading) return <CrudPageSkeleton cols={5} />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-chivo font-bold uppercase tracking-wider flex items-center gap-3">
          <Truck size={28} weight="duotone" className="text-green-400" /> Fleet Vehicles
        </h1>
        <button
          onClick={() => {
            setEditData(null);
            setForm(emptyForm);
            setModalOpen(true);
          }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={16} /> New Transport
        </button>
      </div>

      <p className="page-subtitle">Manage the vehicles and driver details available for vendor-side dispatch.</p>

      <DataTable data={transports} columns={columns} />

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editData ? 'Edit Transport' : 'Create Transport'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-400 text-xs uppercase mb-2 font-mono">Vehicle No</label>
              <input value={form.vehicleNo} onChange={(e) => setForm({ ...form, vehicleNo: e.target.value })} required className="input-modern" />
            </div>
            <div>
              <label className="block text-slate-400 text-xs uppercase mb-2 font-mono">Type</label>
              <input value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="input-modern" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-400 text-xs uppercase mb-2 font-mono">Driver Name</label>
              <input value={form.ownerDetails} onChange={(e) => setForm({ ...form, ownerDetails: e.target.value })} className="input-modern" />
            </div>
            <div>
              <label className="block text-slate-400 text-xs uppercase mb-2 font-mono">Contact</label>
              <input value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} className="input-modern" />
            </div>
          </div>
          <div>
            <label className="block text-slate-400 text-xs uppercase mb-2 font-mono">City</label>
            <select value={form.cityId} onChange={(e) => setForm({ ...form, cityId: e.target.value })} required className="input-modern">
              <option value="">Select</option>
              {cities.map((city) => (
                <option key={city._id} value={city._id}>{city.cityName}</option>
              ))}
            </select>
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
