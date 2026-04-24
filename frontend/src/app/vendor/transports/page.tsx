'use client';
import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import DataTable from '@/components/DataTable';
import { Truck } from '@phosphor-icons/react';

export default function VendorTransportsPage() {
  const [transports, setTransports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { api.getTransports().then(t => setTransports(t||[])).catch(console.error).finally(()=>setLoading(false)); }, []);

  const columns = [
    { key: 'vehicleNo', label: 'Vehicle No' },
    { key: 'type', label: 'Type' },
    { key: 'ownerDetails', label: 'Driver' },
    { key: 'contact', label: 'Contact' },
  ];

  if (loading) return <div className="text-slate-500 font-mono text-center py-12 animate-pulse">Loading...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-chivo font-bold uppercase tracking-wider flex items-center gap-3">
        <Truck size={28} weight="duotone" className="text-green-400" /> My Transports
      </h1>
      <DataTable data={transports} columns={columns} />
    </div>
  );
}
