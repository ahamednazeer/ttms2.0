'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import DataTable from '@/components/DataTable';
import Modal from '@/components/Modal';
import { MapPin, Plus } from '@phosphor-icons/react';
import { toast } from 'sonner';

export default function LocationsPage() {
  const [locations, setLocations] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editData, setEditData] = useState<any>(null);
  const [form, setForm] = useState({ locationName: '', cityId: '' });

  const fetchData = async () => {
    try {
      const [locs, cits] = await Promise.all([api.getLocations(), api.getCities()]);
      setLocations(locs || []);
      setCities(cits || []);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editData) {
        await api.updateLocation(editData._id, form);
        toast.success('Location updated');
      } else {
        await api.createLocation(form);
        toast.success('Location created');
      }
      setModalOpen(false); setEditData(null); setForm({ locationName: '', cityId: '' });
      fetchData();
    } catch (err: any) { toast.error(err.message); }
  };

  const handleEdit = (loc: any) => {
    setEditData(loc);
    setForm({ locationName: loc.locationName, cityId: loc.cityId?._id || loc.cityId || '' });
    setModalOpen(true);
  };

  const handleDelete = async (loc: any) => {
    if (!confirm('Delete this location?')) return;
    try { await api.deleteLocation(loc._id); toast.success('Location deleted'); fetchData(); } catch (err: any) { toast.error(err.message); }
  };

  const columns = [
    { key: 'locationName', label: 'Location Name', sortable: true },
    { key: 'city', label: 'City', render: (row: any) => <span className="text-blue-400 font-mono">{row.cityId?.cityName || '-'}</span> },
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

  if (loading) return <div className="text-slate-500 font-mono text-center py-12 animate-pulse">Loading locations...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-chivo font-bold uppercase tracking-wider flex items-center gap-3">
          <MapPin size={28} weight="duotone" className="text-red-400" /> Location Management
        </h1>
        <button onClick={() => { setEditData(null); setForm({ locationName: '', cityId: '' }); setModalOpen(true); }} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Add Location
        </button>
      </div>

      <DataTable data={locations} columns={columns} />

      <Modal isOpen={modalOpen} onClose={() => { setModalOpen(false); setEditData(null); }} title={editData ? 'Edit Location' : 'Add Location'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-slate-400 text-xs uppercase tracking-wider mb-2 font-mono">Location Name</label>
            <input value={form.locationName} onChange={(e) => setForm({ ...form, locationName: e.target.value })} required className="input-modern" placeholder="e.g. Embassy District" />
          </div>
          <div>
            <label className="block text-slate-400 text-xs uppercase tracking-wider mb-2 font-mono">City</label>
            <select value={form.cityId} onChange={(e) => setForm({ ...form, cityId: e.target.value })} required className="input-modern">
              <option value="">Select City</option>
              {cities.map((c: any) => <option key={c._id} value={c._id}>{c.cityName}</option>)}
            </select>
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
