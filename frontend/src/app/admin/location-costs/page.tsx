'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';
import type { City, Location, LocationCost, LocationCostImportPreview } from '@/lib/types';
import { CheckCircle, CurrencyDollar, FloppyDisk, Plus, Trash, UploadSimple, WarningCircle } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { CrudPageSkeleton } from '@/components/Skeleton';
import { useTheme } from '@/components/ThemeProvider';
import Modal from '@/components/Modal';

type SavedRoute = LocationCost & { fromName: string; toName: string };

export default function LocationCostsPage() {
  const { theme, mounted } = useTheme();
  const isDark = !mounted || theme === 'dark';
  const [costs, setCosts] = useState<LocationCost[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [selectedCityId, setSelectedCityId] = useState('');
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<LocationCostImportPreview | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [routeToDelete, setRouteToDelete] = useState<SavedRoute | null>(null);
  const [deletingRoute, setDeletingRoute] = useState(false);

  // Add-route form
  const [addForm, setAddForm] = useState({ fromLocationId: '', toLocationId: '', cost: '' });

  // Editing existing route prices
  const [editPrices, setEditPrices] = useState<Record<string, string>>({});

  const fetchData = async () => {
    try {
      const [costData, locationData, cityData] = await Promise.all([
        api.getLocationCosts(),
        api.getLocations(),
        api.getCities(),
      ]);
      setCosts(costData || []);
      setLocations(locationData || []);
      setCities(cityData || []);
      if (!selectedCityId && cityData?.[0]?._id) {
        setSelectedCityId(cityData[0]._id);
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to load route pricing');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void fetchData(); }, []);

  const locationsByCity = useMemo(() => {
    const grouped = new Map<string, Location[]>();
    for (const location of locations) {
      const cityId = typeof location.cityId === 'string' ? location.cityId : location.cityId?._id;
      if (!cityId) continue;
      const current = grouped.get(cityId) || [];
      current.push(location);
      grouped.set(cityId, current);
    }
    return grouped;
  }, [locations]);

  const cityLocations = locationsByCity.get(selectedCityId) || [];

  const savedRoutes: SavedRoute[] = useMemo(() => {
    const cityRoutes = costs.filter((cost) => {
      const costCityId = typeof cost.cityId === 'string' ? cost.cityId : cost.cityId?._id;
      return costCityId === selectedCityId;
    });
    return cityRoutes.map((cost) => {
      const fromId = typeof cost.fromLocationId === 'string' ? cost.fromLocationId : cost.fromLocationId?._id;
      const toId = typeof cost.toLocationId === 'string' ? cost.toLocationId : cost.toLocationId?._id;
      const fromName = locations.find((l) => l._id === fromId)?.locationName || fromId || 'Unknown';
      const toName = locations.find((l) => l._id === toId)?.locationName || toId || 'Unknown';
      return { ...cost, fromName, toName };
    });
  }, [costs, locations, selectedCityId]);

  // Initialize edit prices when routes change
  useEffect(() => {
    const initial: Record<string, string> = {};
    for (const r of savedRoutes) {
      initial[r._id] = String(r.cost ?? '');
    }
    setEditPrices(initial);
  }, [savedRoutes]);

  const selectedCity = cities.find((city) => city._id === selectedCityId);

  const handleAddRoute = async (e: React.FormEvent) => {
    e.preventDefault();
    const cost = Number(addForm.cost);
    if (!addForm.fromLocationId || !addForm.toLocationId) {
      toast.error('Select both locations'); return;
    }
    if (addForm.fromLocationId === addForm.toLocationId) {
      toast.error('From and To must be different'); return;
    }
    if (!addForm.cost || Number.isNaN(cost) || cost < 0) {
      toast.error('Enter a valid price'); return;
    }
    // Check duplicate
    const existing = savedRoutes.find((r) => {
      const fromId = typeof r.fromLocationId === 'string' ? r.fromLocationId : r.fromLocationId?._id;
      const toId = typeof r.toLocationId === 'string' ? r.toLocationId : r.toLocationId?._id;
      return fromId === addForm.fromLocationId && toId === addForm.toLocationId;
    });
    if (existing) { toast.error('This route already exists'); return; }

    setSavingKey('add');
    try {
      await api.createLocationCost({ cityId: selectedCityId, fromLocationId: addForm.fromLocationId, toLocationId: addForm.toLocationId, cost });
      toast.success('Route added');
      setAddForm({ fromLocationId: '', toLocationId: '', cost: '' });
      await fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to add route');
    } finally { setSavingKey(null); }
  };

  const handleUpdatePrice = async (route: SavedRoute) => {
    const cost = Number(editPrices[route._id]);
    if (!editPrices[route._id] || Number.isNaN(cost) || cost < 0) {
      toast.error(`Enter a valid price for ${route.fromName} → ${route.toName}`); return;
    }
    const fromId = typeof route.fromLocationId === 'string' ? route.fromLocationId : route.fromLocationId?._id;
    const toId = typeof route.toLocationId === 'string' ? route.toLocationId : route.toLocationId?._id;
    setSavingKey(route._id);
    try {
      await api.updateLocationCost(route._id, { cityId: selectedCityId, fromLocationId: fromId || '', toLocationId: toId || '', cost });
      toast.success(`Updated ${route.fromName} → ${route.toName}`);
      await fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update route');
    } finally { setSavingKey(null); }
  };

  const handleDeleteRoute = (route: SavedRoute) => {
    setRouteToDelete(route);
  };

  const confirmDeleteRoute = async () => {
    if (!routeToDelete) return;

    setDeletingRoute(true);
    try {
      await api.deleteLocationCost(routeToDelete._id);
      toast.success('Route deleted');
      setRouteToDelete(null);
      await fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete route');
    } finally {
      setDeletingRoute(false);
    }
  };

  const handlePreviewImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importFile) {
      toast.error('Choose an Excel file'); return;
    }

    setPreviewing(true);
    try {
      const result = await api.previewLocationCostsImport(importFile);
      setImportPreview(result);
      if (result.errors.length) {
        toast.error(`Found ${result.errors.length} row issue${result.errors.length === 1 ? '' : 's'}`);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to preview route pricing');
    } finally {
      setPreviewing(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!importFile || !importPreview?.canImport) return;

    setImporting(true);
    try {
      const result = await api.importLocationCosts(importFile);
      toast.success(`Imported ${result.importedRows} rows: ${result.routesCreated} added, ${result.routesUpdated} updated, ${result.routesUnchanged} unchanged`);
      setImportFile(null);
      setImportPreview(null);
      await fetchData();
    } catch (error: any) {
      if (error.errors?.length) {
        setImportPreview((current) => current ? { ...current, errors: error.errors, canImport: false } : current);
      }
      toast.error(error.message || 'Failed to import route pricing');
    } finally {
      setImporting(false);
    }
  };

  if (loading) return <CrudPageSkeleton cols={5} />;

  const thBorder = isDark ? { borderColor: 'rgba(30, 41, 59, 0.9)' } : { borderColor: 'var(--border)' };
  const rowBg = (i: number) => isDark
    ? { borderColor: 'rgba(30, 41, 59, 0.8)', background: i % 2 === 0 ? 'rgba(2, 6, 23, 0.1)' : 'rgba(15, 23, 42, 0.18)' }
    : { borderColor: 'var(--border)', background: i % 2 === 0 ? 'transparent' : 'color-mix(in srgb, var(--surface-3) 32%, transparent)' };
  const theadBg = isDark ? { background: 'rgba(15, 23, 42, 0.8)' } : { background: 'color-mix(in srgb, var(--surface-2) 88%, transparent)' };
  const tdClass = `px-4 py-3 text-sm font-medium ${isDark ? 'text-slate-200' : 'text-[color:var(--text-primary)]'}`;
  const thClass = `px-4 py-4 text-left text-xs font-mono uppercase tracking-wider border-b ${isDark ? 'text-slate-400' : 'muted-text'}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-chivo font-bold uppercase tracking-wider flex items-center gap-3">
            <CurrencyDollar size={28} weight="duotone" className="text-green-400" /> Route Pricing
          </h1>
          <p className="page-subtitle mt-3">Manually add routes and set prices for each city. Select a city to view and manage its routes.</p>
        </div>
        <div className="w-full lg:w-72">
          <label className="block text-slate-400 text-xs uppercase tracking-wider mb-2 font-mono">City</label>
          <select value={selectedCityId} onChange={(e) => setSelectedCityId(e.target.value)} className="input-modern">
            <option value="">Select City</option>
            {cities.map((city) => <option key={city._id} value={city._id}>{city.cityName}</option>)}
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="panel p-5">
          <p className="section-title">Selected City</p>
          <p className={`mt-2 text-lg font-semibold ${isDark ? 'text-slate-100' : 'text-[color:var(--text-primary)]'}`}>
            {selectedCity?.cityName || 'Not selected'}
          </p>
        </div>
        <div className="panel p-5">
          <p className="section-title">Configured Routes</p>
          <p className={`mt-2 text-lg font-semibold ${isDark ? 'text-slate-100' : 'text-[color:var(--text-primary)]'}`}>{savedRoutes.length}</p>
        </div>
      </div>

      <div className="panel p-6">
        <h3 className="text-sm font-mono text-slate-400 uppercase tracking-widest mb-4">Import Routes</h3>
        <form onSubmit={handlePreviewImport} className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0 flex-1">
            <label className="block text-slate-400 text-xs uppercase mb-2 font-mono">Excel file</label>
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={(e) => {
                setImportFile(e.target.files?.[0] || null);
                setImportPreview(null);
              }}
              className="input-modern w-full"
            />
            <p className={`mt-2 text-xs ${isDark ? 'text-slate-500' : 'secondary-text'}`}>
              Required columns: Location pick Up, Drop Off Location, Amount, City.
            </p>
          </div>
          <button type="submit" disabled={previewing || !importFile} className="btn-primary inline-flex items-center gap-2">
            <UploadSimple size={16} /> {previewing ? 'Checking...' : 'Preview Excel'}
          </button>
        </form>
      </div>

      {!selectedCityId ? (
        <div className={`panel px-6 py-10 text-center ${isDark ? 'text-slate-400' : 'secondary-text'}`}>
          Select a city to manage its route pricing.
        </div>
      ) : (
        <>
          {/* Add Route Form */}
          <div className="panel p-6">
            <h3 className="text-sm font-mono text-slate-400 uppercase tracking-widest mb-4">Add New Route</h3>
            {cityLocations.length < 2 ? (
              <p className={`text-sm ${isDark ? 'text-slate-500' : 'secondary-text'}`}>Add at least two locations to this city to configure route pricing.</p>
            ) : (
              <form onSubmit={handleAddRoute} className="flex flex-wrap gap-4 items-end">
                <div>
                  <label className="block text-slate-400 text-xs uppercase mb-2 font-mono">From</label>
                  <select value={addForm.fromLocationId} onChange={e => setAddForm({ ...addForm, fromLocationId: e.target.value })} className="input-modern w-48" required>
                    <option value="">Select</option>
                    {cityLocations.map((l) => <option key={l._id} value={l._id}>{l.locationName}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 text-xs uppercase mb-2 font-mono">To</label>
                  <select value={addForm.toLocationId} onChange={e => setAddForm({ ...addForm, toLocationId: e.target.value })} className="input-modern w-48" required>
                    <option value="">Select</option>
                    {cityLocations.filter(l => l._id !== addForm.fromLocationId).map((l) => <option key={l._id} value={l._id}>{l.locationName}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 text-xs uppercase mb-2 font-mono">Price ($)</label>
                  <input
                    type="number" step="0.01" min="0"
                    value={addForm.cost}
                    onChange={e => setAddForm({ ...addForm, cost: e.target.value })}
                    className="input-modern h-10 w-36" placeholder="0.00" required
                  />
                </div>
                <button type="submit" disabled={savingKey === 'add'} className="btn-primary inline-flex items-center gap-2">
                  <Plus size={16} /> {savingKey === 'add' ? 'Adding...' : 'Add Route'}
                </button>
              </form>
            )}
          </div>

          {/* Routes Table */}
          {savedRoutes.length === 0 ? (
            <div className={`panel px-6 py-10 text-center ${isDark ? 'text-slate-400' : 'secondary-text'}`}>
              No routes configured yet. Add the first route above.
            </div>
          ) : (
            <div className="panel overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px]">
                  <thead style={theadBg}>
                    <tr>
                      {['From', 'To', 'Price ($)', 'Action'].map((label) => (
                        <th key={label} className={thClass} style={thBorder}>{label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {savedRoutes.map((route, index) => {
                      const isSaving = savingKey === route._id;
                      return (
                        <tr key={route._id} className="border-t" style={rowBg(index)}>
                          <td className={tdClass}>{route.fromName}</td>
                          <td className={tdClass}>{route.toName}</td>
                          <td className="px-4 py-3">
                            <input
                              type="number" step="0.01" min="0"
                              value={editPrices[route._id] ?? ''}
                              onChange={e => setEditPrices(prev => ({ ...prev, [route._id]: e.target.value }))}
                              className="input-modern h-9 min-w-[120px]"
                              placeholder="0.00"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => void handleUpdatePrice(route)}
                                disabled={isSaving}
                                className="btn-primary inline-flex items-center gap-1.5 text-sm"
                              >
                                <FloppyDisk size={15} /> {isSaving ? 'Saving...' : 'Save'}
                              </button>
                              <button
                                type="button"
                                onClick={() => void handleDeleteRoute(route)}
                                className="btn-danger inline-flex items-center gap-1.5 text-sm"
                              >
                                <Trash size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      <Modal isOpen={Boolean(importPreview)} onClose={() => setImportPreview(null)} title="Import Preview" size="xl">
        {importPreview && (
          <div className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {[
                ['Rows', importPreview.importedRows],
                ['Valid', importPreview.validRows],
                ['Cities New', importPreview.citiesCreated],
                ['Locations New', importPreview.locationsCreated],
                ['Routes New', importPreview.routesCreated],
                ['No Change', importPreview.routesUnchanged],
              ].map(([label, value]) => (
                <div key={label} className="rounded-md border border-slate-700 bg-slate-900/60 p-3">
                  <p className="text-[10px] uppercase tracking-wider text-slate-500 font-mono">{label}</p>
                  <p className="mt-1 text-lg font-semibold text-slate-100">{value}</p>
                </div>
              ))}
            </div>

            <div className={`rounded-md border p-3 ${importPreview.errors.length ? 'border-amber-500/40 bg-amber-500/10' : 'border-emerald-500/40 bg-emerald-500/10'}`}>
              <div className="flex items-center gap-2 text-sm font-medium">
                {importPreview.errors.length ? <WarningCircle size={18} className="text-amber-300" /> : <CheckCircle size={18} className="text-emerald-300" />}
                <span className={importPreview.errors.length ? 'text-amber-200' : 'text-emerald-200'}>
                  {importPreview.errors.length ? 'Fix these rows before importing' : 'Ready to import'}
                </span>
              </div>
              {importPreview.errors.length > 0 && (
                <div className="mt-3 max-h-44 overflow-y-auto space-y-2">
                  {importPreview.errors.map((error, index) => (
                    <div key={`${error.rowNumber}-${index}`} className="text-sm text-amber-100">
                      Row {error.rowNumber || '-'}: {error.message}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {importPreview.previewRows.length > 0 && (
              <div className="overflow-x-auto rounded-md border border-slate-700">
                <table className="w-full min-w-[760px] text-sm">
                  <thead className="bg-slate-900">
                    <tr>
                      {['Row', 'City', 'Pickup', 'Drop-off', 'Amount', 'Action'].map((label) => (
                        <th key={label} className="px-3 py-3 text-left text-xs uppercase tracking-wider text-slate-400 font-mono">{label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {importPreview.previewRows.map((row) => (
                      <tr key={row.rowNumber} className="border-t border-slate-800">
                        <td className="px-3 py-2 text-slate-300">{row.rowNumber}</td>
                        <td className="px-3 py-2 text-slate-200">{row.city}</td>
                        <td className="px-3 py-2 text-slate-200">{row.pickup}</td>
                        <td className="px-3 py-2 text-slate-200">{row.dropoff}</td>
                        <td className="px-3 py-2 text-slate-200">{row.amount}</td>
                        <td className="px-3 py-2">
                          <span className={`rounded px-2 py-0.5 text-xs font-mono uppercase ${
                            row.action === 'update'
                              ? 'bg-blue-500/15 text-blue-300'
                              : row.action === 'unchanged'
                                ? 'bg-slate-700/60 text-slate-300'
                                : 'bg-emerald-500/15 text-emerald-300'
                          }`}>
                            {row.action === 'unchanged' ? 'no change' : row.action}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setImportPreview(null)} className="btn-secondary">Cancel</button>
              <button type="button" onClick={() => void handleConfirmImport()} disabled={!importPreview.canImport || importing} className="btn-primary">
                {importing ? 'Importing...' : 'Confirm Import'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={Boolean(routeToDelete)} onClose={() => setRouteToDelete(null)} title="Delete Route" size="sm">
        {routeToDelete && (
          <div className="space-y-5">
            <p className={`text-sm ${isDark ? 'text-slate-300' : 'secondary-text'}`}>
              Delete route <span className="font-semibold">{routeToDelete.fromName}</span> to <span className="font-semibold">{routeToDelete.toName}</span>?
            </p>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setRouteToDelete(null)} className="btn-secondary" disabled={deletingRoute}>
                Cancel
              </button>
              <button type="button" onClick={() => void confirmDeleteRoute()} className="btn-danger" disabled={deletingRoute}>
                {deletingRoute ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
