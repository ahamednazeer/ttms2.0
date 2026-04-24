'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { api } from '@/lib/api';
import { Buildings, Plus } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { CrudPageSkeleton } from '@/components/Skeleton';

const DataTable = dynamic(() => import('@/components/DataTable'), { ssr: false });
const Modal = dynamic(() => import('@/components/Modal'), { ssr: false });

export default function CitiesPage() {
  const [cities, setCities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editData, setEditData] = useState<any>(null);
  const [form, setForm] = useState({ cityName: '', cityId: '' });

  const fetchCities = async () => {
    try {
      const data = await api.getCities();
      setCities(data || []);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => { fetchCities(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editData) {
        await api.updateCity(editData._id, form);
        toast.success('City updated');
      } else {
        await api.createCity(form);
        toast.success('City created');
      }
      setModalOpen(false);
      setEditData(null);
      setForm({ cityName: '', cityId: '' });
      fetchCities();
    } catch (err: any) { toast.error(err.message); }
  };

  const handleEdit = (city: any) => {
    setEditData(city);
    setForm({ cityName: city.cityName, cityId: city.cityId });
    setModalOpen(true);
  };

  const handleDelete = async (city: any) => {
    if (!confirm('Delete this city?')) return;
    try {
      await api.deleteCity(city._id);
      toast.success('City deleted');
      fetchCities();
    } catch (err: any) { toast.error(err.message); }
  };

  const columns = [
    { key: 'cityId', label: 'City ID', sortable: true },
    { key: 'cityName', label: 'City Name', sortable: true },
    {
      key: 'locations', label: 'Locations',
      render: (row: any) => (
        <div className="flex gap-1 flex-wrap">
          {(row.locations || []).slice(0, 3).map((loc: any, i: number) => (
            <span key={i} className="px-2 py-0.5 bg-slate-800 border border-slate-700 rounded text-xs font-mono text-blue-400">
              {loc.locationName || loc}
            </span>
          ))}
          {(row.locations || []).length > 3 && (
            <span className="px-2 py-0.5 bg-blue-900/50 border border-blue-700 rounded text-xs font-mono text-blue-300">
              +{row.locations.length - 3} more
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'actions', label: 'Actions',
      render: (row: any) => (
        <div className="flex gap-2">
          <button onClick={() => handleEdit(row)} className="btn-secondary text-xs px-3 py-1">Edit</button>
          <button onClick={() => handleDelete(row)} className="btn-danger text-xs px-3 py-1">Delete</button>
        </div>
      ),
    },
  ];

  if (loading) return <CrudPageSkeleton cols={3} />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-chivo font-bold uppercase tracking-wider flex items-center gap-3">
          <Buildings size={28} weight="duotone" className="text-indigo-400" />
          Cities
        </h1>
        <button onClick={() => { setEditData(null); setForm({ cityName: '', cityId: '' }); setModalOpen(true); }} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> New City
        </button>
      </div>

      <p className="page-subtitle">Maintain the list of supported cities used across ticketing, vendor operations, and reporting.</p>

      <DataTable data={cities} columns={columns} />

      <Modal isOpen={modalOpen} onClose={() => { setModalOpen(false); setEditData(null); }} title={editData ? 'Edit City' : 'Create City'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-slate-400 text-xs uppercase tracking-wider mb-2 font-mono">City ID</label>
            <input value={form.cityId} onChange={(e) => setForm({ ...form, cityId: e.target.value })} required className="input-modern" placeholder="e.g. CTY001" />
          </div>
          <div>
            <label className="block text-slate-400 text-xs uppercase tracking-wider mb-2 font-mono">City Name</label>
            <input value={form.cityName} onChange={(e) => setForm({ ...form, cityName: e.target.value })} required className="input-modern" placeholder="e.g. New Delhi" />
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">{editData ? 'Update' : 'Create'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
