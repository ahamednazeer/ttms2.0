'use client';
import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { api } from '@/lib/api';
import type { Invoice } from '@/lib/types';
import { Invoice as InvoiceIcon, DownloadSimple, CheckCircle, XCircle, Trash } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { CrudPageSkeleton } from '@/components/Skeleton';
import ConfirmModal from '@/components/ConfirmModal';

const DataTable = dynamic(() => import('@/components/DataTable'), { ssr: false }) as any;
const Modal = dynamic(() => import('@/components/Modal'), { ssr: false });

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    DRAFT: 'bg-amber-500/15 text-amber-300 border border-amber-500/30',
    APPROVED: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30',
    REJECTED: 'bg-red-500/15 text-red-300 border border-red-500/30',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-mono uppercase tracking-wide ${styles[status] || styles.DRAFT}`}>
      {status}
    </span>
  );
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectModal, setRejectModal] = useState<{ open: boolean; invoiceId: string }>({ open: false, invoiceId: '' });
  const [invoiceToApprove, setInvoiceToApprove] = useState<Invoice | null>(null);
  const [invoiceToDelete, setInvoiceToDelete] = useState<Invoice | null>(null);
  const [rejectRemarks, setRejectRemarks] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const inv = await api.getInvoices();
      setInvoices((inv as Invoice[]) || []);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleApprove = async () => {
    if (!invoiceToApprove) return;
    setActionLoading(invoiceToApprove._id + '_approve');
    try {
      await api.approveInvoice(invoiceToApprove._id);
      toast.success('Invoice approved and email sent to vendor');
      setInvoiceToApprove(null);
      fetchData();
    } catch (err: any) { toast.error(err.message); }
    finally { setActionLoading(null); }
  };

  const handleOpenReject = (inv: Invoice) => {
    setRejectRemarks('');
    setRejectModal({ open: true, invoiceId: inv._id });
  };

  const handleReject = async () => {
    if (!rejectRemarks.trim()) { toast.error('Please provide remarks for rejection'); return; }
    setActionLoading(rejectModal.invoiceId + '_reject');
    try {
      await api.rejectInvoice(rejectModal.invoiceId, rejectRemarks.trim());
      toast.success('Invoice rejected — vendor notified by email');
      setRejectModal({ open: false, invoiceId: '' });
      fetchData();
    } catch (err: any) { toast.error(err.message); }
    finally { setActionLoading(null); }
  };

  const handleDownload = async (inv: Invoice) => {
    try {
      const blob = await api.downloadInvoice(inv._id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `invoice-${inv._id}.pdf`; a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) { toast.error(err.message); }
  };

  const handleDelete = async () => {
    if (!invoiceToDelete) return;
    setActionLoading(invoiceToDelete._id + '_delete');
    try {
      await api.deleteInvoice(invoiceToDelete._id);
      toast.success('Invoice deleted');
      setInvoiceToDelete(null);
      fetchData();
    } catch (err: any) { toast.error(err.message); }
    finally { setActionLoading(null); }
  };

  const columns = [
    { key: 'vendor', label: 'Vendor', render: (r: Invoice) => (r.vendorId as any)?.vendorName || '-' },
    { key: 'period', label: 'Period', render: (r: Invoice) => `${r.month}/${r.year}` },
    { key: 'totalCost', label: 'Total', render: (r: Invoice) => <span className="text-green-400 font-mono font-bold">${r.totalCost?.toFixed(2)}</span> },
    { key: 'ticketCount', label: 'Tickets', render: (r: Invoice) => r.tickets?.length || 0 },
    { key: 'generatedAt', label: 'Generated', render: (r: Invoice) => r.generatedAt ? new Date(r.generatedAt).toLocaleDateString() : '-' },
    { key: 'status', label: 'Status', render: (r: Invoice) => <StatusBadge status={r.status} /> },
    {
      key: 'remarks', label: 'Remarks', render: (r: Invoice) => r.adminRemarks
        ? <span className="text-red-400 text-xs font-mono truncate max-w-[160px] block" title={r.adminRemarks}>{r.adminRemarks}</span>
        : <span className="text-slate-600 text-xs">—</span>
    },
    {
      key: 'actions', label: 'Actions', render: (r: Invoice) => (
        <div className="flex gap-2 flex-wrap">
          {r.status === 'DRAFT' && (
            <>
              <button
                onClick={() => setInvoiceToApprove(r)}
                disabled={actionLoading === r._id + '_approve'}
                className="btn-success text-xs px-3 py-1 flex items-center gap-1"
              >
                <CheckCircle size={14} /> Approve
              </button>
              <button
                onClick={() => handleOpenReject(r)}
                disabled={actionLoading === r._id + '_reject'}
                className="btn-danger text-xs px-3 py-1 flex items-center gap-1"
              >
                <XCircle size={14} /> Reject
              </button>
            </>
          )}
          <button onClick={() => handleDownload(r)} className="btn-secondary text-xs px-3 py-1 flex items-center gap-1">
            <DownloadSimple size={14} /> PDF
          </button>
          <button onClick={() => setInvoiceToDelete(r)} className="btn-danger text-xs px-3 py-1 flex items-center gap-1">
            <Trash size={14} />
          </button>
        </div>
      )
    },
  ];

  if (loading) return <CrudPageSkeleton cols={6} />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-chivo font-bold uppercase tracking-wider flex items-center gap-3">
        <InvoiceIcon size={28} weight="duotone" className="text-orange-400" /> Invoices
      </h1>
      <p className="page-subtitle">Invoices are created automatically from completed rides. Review draft invoices, then approve or reject before email is dispatched.</p>

      <DataTable data={invoices} columns={columns} />

      {/* Reject Modal */}
      <Modal isOpen={rejectModal.open} onClose={() => setRejectModal({ open: false, invoiceId: '' })} title="Reject Invoice" size="md">
        <div className="space-y-4">
          <p className="text-slate-300 text-sm">Provide remarks explaining the reason for rejection. These will be included in the email sent to the vendor.</p>
          <div>
            <label className="block text-slate-400 text-xs uppercase mb-2 font-mono">Admin Remarks <span className="text-red-400">*</span></label>
            <textarea
              value={rejectRemarks}
              onChange={e => setRejectRemarks(e.target.value)}
              className="input-modern w-full min-h-[100px]"
              placeholder="e.g. Invoice amount mismatch — please re-verify ticket costs for this period."
            />
          </div>
          <div className="flex gap-3 justify-end">
            <button onClick={() => setRejectModal({ open: false, invoiceId: '' })} className="btn-secondary">Cancel</button>
            <button
              onClick={handleReject}
              disabled={!!actionLoading || !rejectRemarks.trim()}
              className="btn-danger flex items-center gap-2"
            >
              <XCircle size={16} /> Reject Invoice
            </button>
          </div>
        </div>
      </Modal>
      <ConfirmModal
        isOpen={Boolean(invoiceToApprove)}
        title="Approve Invoice"
        message={`Approve invoice for ${invoiceToApprove?.month}/${invoiceToApprove?.year}? This will send the PDF to the vendor.`}
        confirmLabel="Approve"
        variant="success"
        loading={Boolean(invoiceToApprove && actionLoading === invoiceToApprove._id + '_approve')}
        onCancel={() => setInvoiceToApprove(null)}
        onConfirm={() => void handleApprove()}
      />
      <ConfirmModal
        isOpen={Boolean(invoiceToDelete)}
        title="Delete Invoice"
        message="Permanently delete this invoice?"
        confirmLabel="Delete"
        loading={Boolean(invoiceToDelete && actionLoading === invoiceToDelete._id + '_delete')}
        onCancel={() => setInvoiceToDelete(null)}
        onConfirm={() => void handleDelete()}
      />
    </div>
  );
}
