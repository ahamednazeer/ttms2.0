'use client';
import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { api } from '@/lib/api';
import { Invoice, DownloadSimple } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { CrudPageSkeleton } from '@/components/Skeleton';

const DataTable = dynamic(() => import('@/components/DataTable'), { ssr: false });

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [genForm, setGenForm] = useState({ vendorId: '', month: new Date().getMonth() + 1, year: new Date().getFullYear() });

  const fetchData = async () => {
    try {
      const [inv, v] = await Promise.all([api.getInvoices(), api.getVendors()]);
      setInvoices(inv || []); setVendors(v || []);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };
  useEffect(() => { fetchData(); }, []);

  const handleGenerate = async () => {
    if (!genForm.vendorId) { toast.error('Select a vendor'); return; }
    try {
      await api.generateInvoice(genForm.vendorId, genForm.month, genForm.year);
      toast.success('Invoice generated');
      fetchData();
    } catch (err: any) { toast.error(err.message); }
  };

  const handleDownload = async (inv: any) => {
    try {
      const blob = await api.downloadInvoice(inv._id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `invoice-${inv._id}.pdf`; a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) { toast.error(err.message); }
  };

  const columns = [
    { key: 'vendor', label: 'Vendor', render: (r: any) => r.vendorId?.vendorName || '-' },
    { key: 'period', label: 'Period', render: (r: any) => `${r.month}/${r.year}` },
    { key: 'totalCost', label: 'Total', render: (r: any) => <span className="text-green-400 font-mono font-bold">${r.totalCost?.toFixed(2)}</span> },
    { key: 'ticketCount', label: 'Tickets', render: (r: any) => r.tickets?.length || 0 },
    { key: 'generatedAt', label: 'Generated', render: (r: any) => new Date(r.generatedAt).toLocaleDateString() },
    { key: 'actions', label: '', render: (r: any) => (
      <button onClick={() => handleDownload(r)} className="btn-primary text-xs px-3 py-1 flex items-center gap-1"><DownloadSimple size={14}/> PDF</button>
    )},
  ];

  if (loading) return <CrudPageSkeleton cols={5} />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-chivo font-bold uppercase tracking-wider flex items-center gap-3">
        <Invoice size={28} weight="duotone" className="text-orange-400" /> Invoices
      </h1>
      <p className="page-subtitle">Generate vendor billing statements and review historical invoice output.</p>

      {/* Generate Invoice */}
      <div className="bg-slate-800/40 border border-slate-700/60 rounded-sm p-6">
        <h3 className="text-sm font-mono text-slate-400 uppercase tracking-widest mb-4">Generate Invoice</h3>
        <p className="text-slate-400 text-sm mb-4">Create a billing run for a selected vendor and reporting month.</p>
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-slate-400 text-xs uppercase mb-2 font-mono">Vendor</label>
            <select value={genForm.vendorId} onChange={e => setGenForm({...genForm, vendorId: e.target.value})} className="input-modern w-48">
              <option value="">Select</option>
              {vendors.map((v: any) => <option key={v._id} value={v._id}>{v.vendorName}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-slate-400 text-xs uppercase mb-2 font-mono">Month</label>
            <select value={genForm.month} onChange={e => setGenForm({...genForm, month: Number(e.target.value)})} className="input-modern w-32">
              {Array.from({length:12},(_,i)=>i+1).map(m=><option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-slate-400 text-xs uppercase mb-2 font-mono">Year</label>
            <input type="number" value={genForm.year} onChange={e => setGenForm({...genForm, year: Number(e.target.value)})} className="input-modern w-28"/>
          </div>
          <button onClick={handleGenerate} className="btn-success">Generate</button>
        </div>
      </div>

      <DataTable data={invoices} columns={columns} />
    </div>
  );
}
