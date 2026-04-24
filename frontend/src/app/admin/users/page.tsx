'use client';
import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { api } from '@/lib/api';
import { StatusBadge } from '@/components/StatusBadge';
import type { City, CreateUserInput, User } from '@/lib/types';
import { Users, Plus } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { CrudPageSkeleton } from '@/components/Skeleton';

const DataTable = dynamic(() => import('@/components/DataTable'), { ssr: false });
const Modal = dynamic(() => import('@/components/Modal'), { ssr: false });

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editData, setEditData] = useState<User | null>(null);
  const [form, setForm] = useState<CreateUserInput>({ username: '', password: '', firstName: '', lastName: '', email: '', phone: '', role: 'USER', cityId: '' });

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
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : 'Failed to save user'); }
  };

  const handleDelete = async (r: User) => {
    if (!confirm('Delete this user account?')) return;
    try { await api.deleteUser(r._id); toast.success('User removed successfully'); fetchData(); } catch (err: unknown) { toast.error(err instanceof Error ? err.message : 'Failed to delete user'); }
  };

  const columns = [
    { key: 'username', label: 'Username', sortable: true },
    { key: 'name', label: 'Name', render: (r: User) => `${r.firstName||''} ${r.lastName||''}`.trim() || '-' },
    { key: 'email', label: 'Email' },
    { key: 'role', label: 'Role', render: (r: User) => <StatusBadge status={r.role} /> },
    { key: 'city', label: 'City', render: (r: User) => (typeof r.cityId === 'string' ? '-' : r.cityId?.cityName || '-') },
    { key: 'actions', label: 'Actions', render: (r: User) => (
      <div className="flex gap-2">
        <button onClick={() => { setEditData(r); setForm({ username: r.username, password: '', firstName: r.firstName||'', lastName: r.lastName||'', email: r.email||'', phone: r.phone||'', role: r.role, cityId: typeof r.cityId === 'string' ? r.cityId : r.cityId?._id || '' }); setModalOpen(true); }} className="btn-secondary text-xs px-3 py-1">Edit</button>
        <button onClick={() => handleDelete(r)} className="btn-danger text-xs px-3 py-1">Delete</button>
      </div>
    )},
  ];

  if (loading) return <CrudPageSkeleton cols={6} />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-chivo font-bold uppercase tracking-wider flex items-center gap-3">
          <Users size={28} weight="duotone" className="text-green-400" /> Users
        </h1>
        <button onClick={() => { setEditData(null); setForm({ username: '', password: '', firstName: '', lastName: '', email: '', phone: '', role: 'USER', cityId: '' }); setModalOpen(true); }} className="btn-primary flex items-center gap-2"><Plus size={16}/> New User</button>
      </div>
      <p className="page-subtitle">Create and maintain platform access for citizens, vendors, drivers, and administrators.</p>
      <DataTable data={users} columns={columns} />
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editData ? 'Edit User' : 'Create User'} size="lg">
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
              <select value={form.role} onChange={e=>setForm({...form, role: e.target.value as User['role']})} className="input-modern">
                <option value="USER">Citizen</option><option value="VENDOR">Vendor</option><option value="TRANSPORT">Transport</option><option value="SUPERADMIN">Super Admin</option>
              </select>
            </div>
            <div><label className="block text-slate-400 text-xs uppercase mb-2 font-mono">City</label>
              <select value={form.cityId} onChange={e=>setForm({...form, cityId: e.target.value})} className="input-modern">
                <option value="">Select</option>
                {cities.map((c)=><option key={c._id} value={c._id}>{c.cityName}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-3 justify-end"><button type="button" onClick={()=>setModalOpen(false)} className="btn-secondary">Cancel</button><button type="submit" className="btn-primary">{editData?'Update':'Create'}</button></div>
        </form>
      </Modal>
    </div>
  );
}
