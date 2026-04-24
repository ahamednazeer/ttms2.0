'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import DataTable from '@/components/DataTable';
import Modal from '@/components/Modal';
import { CurrencyDollar, Plus } from '@phosphor-icons/react';
import { toast } from 'sonner';

export default function LocationCostsPage() {
  const [costs, setCosts] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editData, setEditData] = useState<any>(null);
  const [form, setForm] = useState({ fromLocationId: '', toLocationId: '', cityId: '', cost: '', distance: '' });

  const fetchData = async () => {
    try {
      const [c, l, ci] = await Promise.all([api.getLocationCosts(), api.getLocations(), api.getCities()]);
      setCosts(c || []); setLocations(l || []); setCities(ci || []);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = { ...form, cost: Number(form.cost), distance: Number(form.distance) };
      if (editData) { await api.updateLocationCost(editData._id, payload); toast.success('Cost updated'); }
      else { await api.createLocationCost(payload); toast.success('Cost created'); }
      setModalOpen(false); setEditData(null); setForm({ fromLocationId: '', toLocationId: '', cityId: '', cost: '', distance: '' });
      fetchData();
    } catch (err: any) { toast.error(err.message); }
  };

  const handleDelete = async (row: any) => {
    if (!confirm('Delete this cost entry?')) return;
    try { await api.deleteLocationCost(row._id); toast.success('Deleted'); fetchData(); } catch (err: any) { toast.error(err.message); }
  };

  const columns = [
    { key: 'fromLocation', label: 'From', render: (r: any) => <span className="font-mono text-slate-300">{r.fromLocationId?.locationName || '-'}</span> },
    { key: 'toLocation', label: 'To', render: (r: any) => <span className="font-mono text-slate-300">{r.toLocationId?.locationName || '-'}</span> },
    { key: 'city', label: 'City', render: (r: any) => <span className="text-blue-400 font-mono">{r.cityId?.cityName || '-'}</span> },
    { key: 'cost', label: 'Cost', render: (r: any) => <span className="text-green-400 font-mono font-bold">${r.cost}</span> },
    { key: 'distance', label: 'Distance (km)', render: (r: any) => <span className="font-mono">{r.distance} km</span> },
    {
      key: 'actions', label: 'Actions',
      render: (r: any) => (
        <div className="flex gap-2">
          <button onClick={() => { setEditData(r); setForm({ fromLocationId: r.fromLocationId?._id || '', toLocationId: r.toLocationId?._id || '', cityId: r.cityId?._id || '', cost: String(r.cost), distance: String(r.distance) }); setModalOpen(true); }} className="btn-secondary text-xs px-3 py-1">Edit</button>
          <button onClick={() => handleDelete(r)} className="btn-danger text-xs px-3 py-1">Delete</button>
        </div>
      ),
    },
  ];

  if (loading) return <div className="text-slate-500 font-mono text-center py-12 animate-pulse">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-chivo font-bold uppercase tracking-wider flex items-center gap-3">
          <CurrencyDollar size={28} weight="duotone" className="text-green-400" /> Location Cost Management
        </h1>
        <button onClick={() => { setEditData(null); setForm({ fromLocationId: '', toLocationId: '', cityId: '', cost: '', distance: '' }); setModalOpen(true); }} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Add Cost
        </button>
      </div>
      <DataTable data={costs} columns={columns} />
      <Modal isOpen={modalOpen} onClose={() => { setModalOpen(false); setEditData(null); }} title={editData ? 'Edit Cost' : 'Add Cost'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-slate-400 text-xs uppercase tracking-wider mb-2 font-mono">City</label>
            <select value={form.cityId} onChange={(e) => setForm({ ...form, cityId: e.target.value })} required className="input-modern">
              <option value="">Select City</option>
              {cities.map((c: any) => <option key={c._id} value={c._id}>{c.cityName}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-400 text-xs uppercase tracking-wider mb-2 font-mono">From Location</label>
              <select value={form.fromLocationId} onChange={(e) => setForm({ ...form, fromLocationId: e.target.value })} required className="input-modern">
                <option value="">Select</option>
                {locations.filter((l: any) => !form.cityId || l.cityId?._id === form.cityId || l.cityId === form.cityId).map((l: any) => <option key={l._id} value={l._id}>{l.locationName}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-slate-400 text-xs uppercase tracking-wider mb-2 font-mono">To Location</label>
              <select value={form.toLocationId} onChange={(e) => setForm({ ...form, toLocationId: e.target.value })} required className="input-modern">
                <option value="">Select</option>
                {locations.filter((l: any) => (!form.cityId || l.cityId?._id === form.cityId || l.cityId === form.cityId) && l._id !== form.fromLocationId).map((l: any) => <option key={l._id} value={l._id}>{l.locationName}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-400 text-xs uppercase tracking-wider mb-2 font-mono">Cost ($)</label>
              <input type="number" step="0.01" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} required className="input-modern" />
            </div>
            <div>
              <label className="block text-slate-400 text-xs uppercase tracking-wider mb-2 font-mono">Distance (km)</label>
              <input type="number" step="0.1" value={form.distance} onChange={(e) => setForm({ ...form, distance: e.target.value })} required className="input-modern" />
            </div>
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
