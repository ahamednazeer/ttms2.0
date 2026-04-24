'use client';
import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import DataTable from '@/components/DataTable';
import Modal from '@/components/Modal';
import { Storefront, Plus } from '@phosphor-icons/react';
import { toast } from 'sonner';

export default function VendorsPage() {
  const [vendors, setVendors] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editData, setEditData] = useState<any>(null);
  const [form, setForm] = useState({ vendorName: '', contact: '', email: '', cityId: '' });

  const fetchData = async () => {
    try {
      const [v, c] = await Promise.all([api.getVendors(), api.getCities()]);
      setVendors(v || []); setCities(c || []);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };
  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editData) { await api.updateVendor(editData._id, form); toast.success('Updated'); }
      else { await api.createVendor(form); toast.success('Created'); }
      setModalOpen(false); setEditData(null); fetchData();
    } catch (err: any) { toast.error(err.message); }
  };

  const handleDelete = async (r: any) => {
    if (!confirm('Delete?')) return;
    try { await api.deleteVendor(r._id); toast.success('Deleted'); fetchData(); } catch (err: any) { toast.error(err.message); }
  };

  const columns = [
    { key: 'vendorName', label: 'Vendor Name', sortable: true },
    { key: 'contact', label: 'Contact' },
    { key: 'email', label: 'Email' },
    { key: 'city', label: 'City', render: (r: any) => r.cityId?.cityName || '-' },
    { key: 'actions', label: 'Actions', render: (r: any) => (
      <div className="flex gap-2">
        <button onClick={() => { setEditData(r); setForm({ vendorName: r.vendorName, contact: r.contact||'', email: r.email||'', cityId: r.cityId?._id||'' }); setModalOpen(true); }} className="btn-secondary text-xs px-3 py-1">Edit</button>
        <button onClick={() => handleDelete(r)} className="btn-danger text-xs px-3 py-1">Delete</button>
      </div>
    )},
  ];

  if (loading) return <div className="text-slate-500 font-mono text-center py-12 animate-pulse">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-chivo font-bold uppercase tracking-wider flex items-center gap-3">
          <Storefront size={28} weight="duotone" className="text-purple-400" /> Vendors
        </h1>
        <button onClick={() => { setEditData(null); setForm({ vendorName: '', contact: '', email: '', cityId: '' }); setModalOpen(true); }} className="btn-primary flex items-center gap-2"><Plus size={16}/> Add</button>
      </div>
      <DataTable data={vendors} columns={columns} />
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editData ? 'Edit Vendor' : 'Add Vendor'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><label className="block text-slate-400 text-xs uppercase mb-2 font-mono">Name</label><input value={form.vendorName} onChange={e=>setForm({...form, vendorName: e.target.value})} required className="input-modern"/></div>
          <div><label className="block text-slate-400 text-xs uppercase mb-2 font-mono">Contact</label><input value={form.contact} onChange={e=>setForm({...form, contact: e.target.value})} className="input-modern"/></div>
          <div><label className="block text-slate-400 text-xs uppercase mb-2 font-mono">Email</label><input value={form.email} onChange={e=>setForm({...form, email: e.target.value})} className="input-modern"/></div>
          <div><label className="block text-slate-400 text-xs uppercase mb-2 font-mono">City</label>
            <select value={form.cityId} onChange={e=>setForm({...form, cityId: e.target.value})} required className="input-modern">
              <option value="">Select</option>
              {cities.map((c:any)=><option key={c._id} value={c._id}>{c.cityName}</option>)}
            </select>
          </div>
          <div className="flex gap-3 justify-end"><button type="button" onClick={()=>setModalOpen(false)} className="btn-secondary">Cancel</button><button type="submit" className="btn-primary">{editData?'Update':'Create'}</button></div>
        </form>
      </Modal>
    </div>
  );
}
