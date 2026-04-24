'use client';
import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import DataTable from '@/components/DataTable';
import Modal from '@/components/Modal';
import { Truck, Plus } from '@phosphor-icons/react';
import { toast } from 'sonner';

export default function TransportsPage() {
  const [transports, setTransports] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editData, setEditData] = useState<any>(null);
  const [form, setForm] = useState({ vehicleNo: '', type: '', ownerDetails: '', contact: '', vendorId: '', cityId: '' });

  const fetchData = async () => {
    try {
      const [t, v, c] = await Promise.all([api.getTransports(), api.getVendors(), api.getCities()]);
      setTransports(t || []); setVendors(v || []); setCities(c || []);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };
  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editData) { await api.updateTransport(editData._id, form); toast.success('Updated'); }
      else { await api.createTransport(form); toast.success('Created'); }
      setModalOpen(false); setEditData(null); fetchData();
    } catch (err: any) { toast.error(err.message); }
  };

  const handleDelete = async (r: any) => {
    if (!confirm('Delete?')) return;
    try { await api.deleteTransport(r._id); toast.success('Deleted'); fetchData(); } catch (err: any) { toast.error(err.message); }
  };

  const columns = [
    { key: 'vehicleNo', label: 'Vehicle No', sortable: true },
    { key: 'type', label: 'Type' },
    { key: 'ownerDetails', label: 'Driver' },
    { key: 'contact', label: 'Contact' },
    { key: 'vendor', label: 'Vendor', render: (r: any) => r.vendorId?.vendorName || '-' },
    { key: 'city', label: 'City', render: (r: any) => r.cityId?.cityName || '-' },
    { key: 'actions', label: 'Actions', render: (r: any) => (
      <div className="flex gap-2">
        <button onClick={() => { setEditData(r); setForm({ vehicleNo: r.vehicleNo, type: r.type||'', ownerDetails: r.ownerDetails||'', contact: r.contact||'', vendorId: r.vendorId?._id||'', cityId: r.cityId?._id||'' }); setModalOpen(true); }} className="btn-secondary text-xs px-3 py-1">Edit</button>
        <button onClick={() => handleDelete(r)} className="btn-danger text-xs px-3 py-1">Delete</button>
      </div>
    )},
  ];

  if (loading) return <div className="text-slate-500 font-mono text-center py-12 animate-pulse">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-chivo font-bold uppercase tracking-wider flex items-center gap-3">
          <Truck size={28} weight="duotone" className="text-blue-400" /> Transport Management
        </h1>
        <button onClick={() => { setEditData(null); setForm({ vehicleNo: '', type: '', ownerDetails: '', contact: '', vendorId: '', cityId: '' }); setModalOpen(true); }} className="btn-primary flex items-center gap-2"><Plus size={16}/> Add</button>
      </div>
      <DataTable data={transports} columns={columns} />
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editData ? 'Edit Transport' : 'Add Transport'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-slate-400 text-xs uppercase mb-2 font-mono">Vehicle No</label><input value={form.vehicleNo} onChange={e=>setForm({...form, vehicleNo: e.target.value})} required className="input-modern"/></div>
            <div><label className="block text-slate-400 text-xs uppercase mb-2 font-mono">Type</label><input value={form.type} onChange={e=>setForm({...form, type: e.target.value})} className="input-modern" placeholder="Sedan, SUV..."/></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-slate-400 text-xs uppercase mb-2 font-mono">Driver Name</label><input value={form.ownerDetails} onChange={e=>setForm({...form, ownerDetails: e.target.value})} className="input-modern"/></div>
            <div><label className="block text-slate-400 text-xs uppercase mb-2 font-mono">Contact</label><input value={form.contact} onChange={e=>setForm({...form, contact: e.target.value})} className="input-modern"/></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-slate-400 text-xs uppercase mb-2 font-mono">Vendor</label>
              <select value={form.vendorId} onChange={e=>setForm({...form, vendorId: e.target.value})} required className="input-modern">
                <option value="">Select</option>{vendors.map((v:any)=><option key={v._id} value={v._id}>{v.vendorName}</option>)}
              </select>
            </div>
            <div><label className="block text-slate-400 text-xs uppercase mb-2 font-mono">City</label>
              <select value={form.cityId} onChange={e=>setForm({...form, cityId: e.target.value})} required className="input-modern">
                <option value="">Select</option>{cities.map((c:any)=><option key={c._id} value={c._id}>{c.cityName}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-3 justify-end"><button type="button" onClick={()=>setModalOpen(false)} className="btn-secondary">Cancel</button><button type="submit" className="btn-primary">{editData?'Update':'Create'}</button></div>
        </form>
      </Modal>
    </div>
  );
}
