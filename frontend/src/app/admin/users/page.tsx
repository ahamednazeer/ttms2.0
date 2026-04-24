'use client';
import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import DataTable from '@/components/DataTable';
import Modal from '@/components/Modal';
import { StatusBadge } from '@/components/StatusBadge';
import { Users, Plus } from '@phosphor-icons/react';
import { toast } from 'sonner';

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editData, setEditData] = useState<any>(null);
  const [form, setForm] = useState({ username: '', password: '', firstName: '', lastName: '', email: '', phone: '', role: 'USER', cityId: '' });

  const fetchData = async () => {
    try {
      const [u, c] = await Promise.all([api.getUsers(), api.getCities()]);
      setUsers(u || []); setCities(c || []);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };
  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editData) { await api.updateUser(editData._id, form); toast.success('Updated'); }
      else { await api.createUser(form); toast.success('Created'); }
      setModalOpen(false); setEditData(null); fetchData();
    } catch (err: any) { toast.error(err.message); }
  };

  const handleDelete = async (r: any) => {
    if (!confirm('Delete?')) return;
    try { await api.deleteUser(r._id); toast.success('Deleted'); fetchData(); } catch (err: any) { toast.error(err.message); }
  };

  const columns = [
    { key: 'username', label: 'Username', sortable: true },
    { key: 'name', label: 'Name', render: (r: any) => `${r.firstName||''} ${r.lastName||''}`.trim() || '-' },
    { key: 'email', label: 'Email' },
    { key: 'role', label: 'Role', render: (r: any) => <StatusBadge status={r.role} /> },
    { key: 'city', label: 'City', render: (r: any) => r.cityId?.cityName || '-' },
    { key: 'actions', label: 'Actions', render: (r: any) => (
      <div className="flex gap-2">
        <button onClick={() => { setEditData(r); setForm({ username: r.username, password: '', firstName: r.firstName||'', lastName: r.lastName||'', email: r.email||'', phone: r.phone||'', role: r.role, cityId: r.cityId?._id||'' }); setModalOpen(true); }} className="btn-secondary text-xs px-3 py-1">Edit</button>
        <button onClick={() => handleDelete(r)} className="btn-danger text-xs px-3 py-1">Delete</button>
      </div>
    )},
  ];

  if (loading) return <div className="text-slate-500 font-mono text-center py-12 animate-pulse">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-chivo font-bold uppercase tracking-wider flex items-center gap-3">
          <Users size={28} weight="duotone" className="text-green-400" /> User Management
        </h1>
        <button onClick={() => { setEditData(null); setForm({ username: '', password: '', firstName: '', lastName: '', email: '', phone: '', role: 'USER', cityId: '' }); setModalOpen(true); }} className="btn-primary flex items-center gap-2"><Plus size={16}/> Add User</button>
      </div>
      <DataTable data={users} columns={columns} />
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editData ? 'Edit User' : 'Add User'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-slate-400 text-xs uppercase mb-2 font-mono">Username</label><input value={form.username} onChange={e=>setForm({...form, username: e.target.value})} required className="input-modern" disabled={!!editData}/></div>
            <div><label className="block text-slate-400 text-xs uppercase mb-2 font-mono">Password{editData?' (leave empty to keep)':''}</label><input type="password" value={form.password} onChange={e=>setForm({...form, password: e.target.value})} required={!editData} className="input-modern"/></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-slate-400 text-xs uppercase mb-2 font-mono">First Name</label><input value={form.firstName} onChange={e=>setForm({...form, firstName: e.target.value})} required className="input-modern"/></div>
            <div><label className="block text-slate-400 text-xs uppercase mb-2 font-mono">Last Name</label><input value={form.lastName} onChange={e=>setForm({...form, lastName: e.target.value})} className="input-modern"/></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-slate-400 text-xs uppercase mb-2 font-mono">Email</label><input type="email" value={form.email} onChange={e=>setForm({...form, email: e.target.value})} className="input-modern"/></div>
            <div><label className="block text-slate-400 text-xs uppercase mb-2 font-mono">Phone</label><input value={form.phone} onChange={e=>setForm({...form, phone: e.target.value})} className="input-modern"/></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-slate-400 text-xs uppercase mb-2 font-mono">Role</label>
              <select value={form.role} onChange={e=>setForm({...form, role: e.target.value})} className="input-modern">
                <option value="USER">Citizen</option><option value="VENDOR">Vendor</option><option value="TRANSPORT">Transport</option><option value="SUPERADMIN">Super Admin</option>
              </select>
            </div>
            <div><label className="block text-slate-400 text-xs uppercase mb-2 font-mono">City</label>
              <select value={form.cityId} onChange={e=>setForm({...form, cityId: e.target.value})} className="input-modern">
                <option value="">Select</option>
                {cities.map((c:any)=><option key={c._id} value={c._id}>{c.cityName}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-3 justify-end"><button type="button" onClick={()=>setModalOpen(false)} className="btn-secondary">Cancel</button><button type="submit" className="btn-primary">{editData?'Update':'Create'}</button></div>
        </form>
      </Modal>
    </div>
  );
}
