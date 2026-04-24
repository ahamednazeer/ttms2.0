'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import DataTable from '@/components/DataTable';
import { ShieldCheck } from '@phosphor-icons/react';

interface AuditLogRecord {
  _id: string;
  action: string;
  status: 'SUCCESS' | 'FAILURE';
  actorId?: string;
  actorRole?: string;
  actorUsername?: string;
  targetId?: string;
  method?: string;
  path?: string;
  ip?: string;
  userAgent?: string;
  errorMessage?: string;
  createdAt: string;
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    action: '',
    status: '',
    actorUsername: '',
    dateFrom: '',
    dateTo: '',
  });

  const fetchLogs = async () => {
    try {
      const params = Object.fromEntries(
        Object.entries(filters).filter(([, value]) => value),
      ) as Record<string, string>;
      const data = await api.getAuditLogs(params);
      setLogs(data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleApplyFilters = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    fetchLogs();
  };

  const columns = [
    { key: 'createdAt', label: 'Time', render: (r: AuditLogRecord) => new Date(r.createdAt).toLocaleString() },
    { key: 'action', label: 'Action' },
    { key: 'status', label: 'Status', render: (r: AuditLogRecord) => (
      <span className={r.status === 'SUCCESS' ? 'text-green-400 font-mono' : 'text-red-400 font-mono'}>
        {r.status}
      </span>
    ) },
    { key: 'actor', label: 'Actor', render: (r: AuditLogRecord) => r.actorUsername || r.actorId || '-' },
    { key: 'role', label: 'Role', render: (r: AuditLogRecord) => r.actorRole || '-' },
    { key: 'targetId', label: 'Target', render: (r: AuditLogRecord) => r.targetId || '-' },
    { key: 'request', label: 'Request', render: (r: AuditLogRecord) => `${r.method || '-'} ${r.path || '-'}` },
    { key: 'ip', label: 'IP', render: (r: AuditLogRecord) => r.ip || '-' },
    { key: 'errorMessage', label: 'Error', render: (r: AuditLogRecord) => r.errorMessage || '-' },
  ];

  if (loading) {
    return <div className="text-slate-500 font-mono text-center py-12 animate-pulse">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-chivo font-bold uppercase tracking-wider flex items-center gap-3">
          <ShieldCheck size={28} weight="duotone" className="text-cyan-400" /> Audit Logs
        </h1>
        <p className="text-slate-500 text-sm font-mono">Recent auth and ticket mutation activity</p>
      </div>

      <form onSubmit={handleApplyFilters} className="bg-slate-800/40 border border-slate-700/60 rounded-sm p-4 grid grid-cols-1 md:grid-cols-5 gap-4">
        <div>
          <label className="block text-slate-400 text-xs uppercase mb-2 font-mono">Action</label>
          <input value={filters.action} onChange={e => setFilters({ ...filters, action: e.target.value })} className="input-modern" placeholder="AUTH_SIGN_IN" />
        </div>
        <div>
          <label className="block text-slate-400 text-xs uppercase mb-2 font-mono">Status</label>
          <select value={filters.status} onChange={e => setFilters({ ...filters, status: e.target.value })} className="input-modern">
            <option value="">All</option>
            <option value="SUCCESS">Success</option>
            <option value="FAILURE">Failure</option>
          </select>
        </div>
        <div>
          <label className="block text-slate-400 text-xs uppercase mb-2 font-mono">Username</label>
          <input value={filters.actorUsername} onChange={e => setFilters({ ...filters, actorUsername: e.target.value })} className="input-modern" placeholder="admin" />
        </div>
        <div>
          <label className="block text-slate-400 text-xs uppercase mb-2 font-mono">From</label>
          <input type="date" value={filters.dateFrom} onChange={e => setFilters({ ...filters, dateFrom: e.target.value })} className="input-modern" />
        </div>
        <div>
          <label className="block text-slate-400 text-xs uppercase mb-2 font-mono">To</label>
          <input type="date" value={filters.dateTo} onChange={e => setFilters({ ...filters, dateTo: e.target.value })} className="input-modern" />
        </div>
        <div className="md:col-span-5 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => {
              setFilters({ action: '', status: '', actorUsername: '', dateFrom: '', dateTo: '' });
              setLoading(true);
              Promise.resolve(api.getAuditLogs()).then((data) => setLogs(data || [])).finally(() => setLoading(false));
            }}
            className="btn-secondary"
          >
            Reset
          </button>
          <button type="submit" className="btn-primary">Apply Filters</button>
        </div>
      </form>

      <DataTable data={logs} columns={columns} emptyMessage="No audit logs found" />
    </div>
  );
}
