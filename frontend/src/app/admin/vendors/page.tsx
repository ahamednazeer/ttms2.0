'use client';
import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import DataTable from '@/components/DataTable';
import Modal from '@/components/Modal';
import type { City, CreateVendorInput, User, Vendor } from '@/lib/types';
import { Storefront, Plus } from '@phosphor-icons/react';
import { toast } from 'sonner';

export default function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editData, setEditData] = useState<Vendor | null>(null);
  const [form, setForm] = useState<CreateVendorInput>({ vendorName: '', contact: '', email: '', cityId: '', userId: '' });

  const fetchData = async () => {
    try {
      const [v, c, u] = await Promise.all([api.getVendors(), api.getCities(), api.getUsers()]);
      setVendors(v || []); setCities(c || []); setUsers(u || []);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };
  useEffect(() => { fetchData(); }, []);

  const vendorUsers = users.filter((user) => user.role === 'VENDOR');
  const getLinkedUserId = (vendorId: string) =>
    vendorUsers.find((user) => (typeof user.vendorId === 'string' ? user.vendorId : user.vendorId?._id) === vendorId)?._id || '';

  const handleVendorUserChange = (userId: string) => {
    const selectedUser = vendorUsers.find((user) => user._id === userId);
    setForm((currentForm) => {
      if (!selectedUser) return { ...currentForm, userId: '' };
      return {
        ...currentForm,
        userId,
        contact: selectedUser.phone || currentForm.contact,
        email: selectedUser.email || currentForm.email,
        cityId: typeof selectedUser.cityId === 'string' ? selectedUser.cityId : selectedUser.cityId?._id || currentForm.cityId,
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editData) { await api.updateVendor(editData._id, form); toast.success('Updated'); }
      else { await api.createVendor(form); toast.success('Created'); }
      setModalOpen(false); setEditData(null); fetchData();
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : 'Failed to save vendor'); }
  };

  const handleDelete = async (r: Vendor) => {
    if (!confirm('Delete this vendor record?')) return;
    try { await api.deleteVendor(r._id); toast.success('Vendor removed successfully'); fetchData(); } catch (err: unknown) { toast.error(err instanceof Error ? err.message : 'Failed to delete vendor'); }
  };

  const columns = [
    { key: 'vendorName', label: 'Vendor Name', sortable: true },
    { key: 'contact', label: 'Contact' },
    { key: 'email', label: 'Email' },
    { key: 'portalUser', label: 'Portal User', render: (r: Vendor) => vendorUsers.find((user) => (typeof user.vendorId === 'string' ? user.vendorId : user.vendorId?._id) === r._id)?.username || '-' },
    { key: 'city', label: 'City', render: (r: Vendor) => (typeof r.cityId === 'string' ? '-' : r.cityId?.cityName || '-') },
    { key: 'actions', label: 'Actions', render: (r: Vendor) => (
      <div className="flex gap-2">
        <button onClick={() => { setEditData(r); setForm({ vendorName: r.vendorName, contact: r.contact||'', email: r.email||'', cityId: typeof r.cityId === 'string' ? r.cityId : r.cityId?._id || '', userId: getLinkedUserId(r._id) }); setModalOpen(true); }} className="btn-secondary text-xs px-3 py-1">Edit</button>
        <button onClick={() => handleDelete(r)} className="btn-danger text-xs px-3 py-1">Delete</button>
      </div>
    )},
  ];

  if (loading) return <div className="text-slate-500 font-mono text-center py-12 animate-pulse">Loading vendor records...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-chivo font-bold uppercase tracking-wider flex items-center gap-3">
          <Storefront size={28} weight="duotone" className="text-purple-400" /> Vendors
        </h1>
        <button onClick={() => { setEditData(null); setForm({ vendorName: '', contact: '', email: '', cityId: '', userId: '' }); setModalOpen(true); }} className="btn-primary flex items-center gap-2"><Plus size={16}/> New Vendor</button>
      </div>
      <p className="page-subtitle">Manage vendor partners, their operating city, and the linked portal account used for scoped access.</p>
      <DataTable data={vendors} columns={columns} />
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editData ? 'Edit Vendor' : 'Create Vendor'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="info-strip">Link the vendor account here so dashboards, tickets, and fleet data stay scoped to the correct partner automatically.</div>
          <div><label className="block text-slate-400 text-xs uppercase mb-2 font-mono">Name</label><input value={form.vendorName} onChange={e=>setForm({...form, vendorName: e.target.value})} required className="input-modern"/></div>
          <div><label className="block text-slate-400 text-xs uppercase mb-2 font-mono">Contact</label><input value={form.contact} onChange={e=>setForm({...form, contact: e.target.value})} className="input-modern"/></div>
          <div><label className="block text-slate-400 text-xs uppercase mb-2 font-mono">Email</label><input value={form.email} onChange={e=>setForm({...form, email: e.target.value})} className="input-modern"/></div>
          <div><label className="block text-slate-400 text-xs uppercase mb-2 font-mono">City</label>
            <select value={form.cityId} onChange={e=>setForm({...form, cityId: e.target.value})} required className="input-modern">
              <option value="">Select</option>
              {cities.map((c)=><option key={c._id} value={c._id}>{c.cityName}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-slate-400 text-xs uppercase mb-2 font-mono">Vendor User</label>
            <select value={form.userId} onChange={e=>handleVendorUserChange(e.target.value)} className="input-modern">
              <option value="">Unlinked</option>
              {vendorUsers.map((user)=><option key={user._id} value={user._id}>{user.username}{user.firstName ? ` - ${user.firstName}` : ''}</option>)}
            </select>
          </div>
          <div className="flex gap-3 justify-end"><button type="button" onClick={()=>setModalOpen(false)} className="btn-secondary">Cancel</button><button type="submit" className="btn-primary">{editData?'Update':'Create'}</button></div>
        </form>
      </Modal>
    </div>
  );
}
