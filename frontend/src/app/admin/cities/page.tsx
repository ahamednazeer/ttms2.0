'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { api } from '@/lib/api';
import { Buildings, FloppyDisk, Plus, Trash } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { CrudPageSkeleton } from '@/components/Skeleton';
import ConfirmModal from '@/components/ConfirmModal';

const DataTable = dynamic(() => import('@/components/DataTable'), { ssr: false }) as any;
const Modal = dynamic(() => import('@/components/Modal'), { ssr: false });

export default function CitiesPage() {
  const [cities, setCities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editData, setEditData] = useState<any>(null);
  const [form, setForm] = useState({ cityName: '', cityId: '' });
  const [newLocationName, setNewLocationName] = useState('');
  const [locationEdits, setLocationEdits] = useState<Record<string, string>>({});
  const [savingLocationKey, setSavingLocationKey] = useState<string | null>(null);
  const [cityToDelete, setCityToDelete] = useState<any>(null);
  const [locationToDelete, setLocationToDelete] = useState<any>(null);
  const [deletingCity, setDeletingCity] = useState(false);
  const [deletingLocation, setDeletingLocation] = useState(false);
  const [locationPreview, setLocationPreview] = useState<{
    names: string[];
    x: number;
    y: number;
  } | null>(null);

  const fetchCities = async () => {
    try {
      const data = await api.getCities();
      setCities(data || []);
      return data || [];
    } catch (e) {
      console.error(e);
      return [];
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchCities(); }, []);

  const syncLocationEdits = (city: any) => {
    const edits: Record<string, string> = {};
    for (const location of city?.locations || []) {
      edits[location._id] = getLocationName(location);
    }
    setLocationEdits(edits);
  };

  const refreshEditedCity = async (cityId: string) => {
    const data = await fetchCities();
    const refreshed = data.find((city: any) => city._id === cityId);
    if (refreshed) {
      setEditData(refreshed);
      syncLocationEdits(refreshed);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editData) {
        await api.updateCity(editData._id, form);
        toast.success('City updated');
        await refreshEditedCity(editData._id);
      } else {
        const city = await api.createCity(form);
        toast.success('City created');
        await fetchCities();
        setEditData(city);
        syncLocationEdits(city);
      }
    } catch (err: any) { toast.error(err.message); }
  };

  const handleEdit = (city: any) => {
    setEditData(city);
    setForm({ cityName: city.cityName, cityId: city.cityId });
    setNewLocationName('');
    syncLocationEdits(city);
    setModalOpen(true);
  };

  const handleDelete = async () => {
    if (!cityToDelete) return;
    setDeletingCity(true);
    try {
      await api.deleteCity(cityToDelete._id);
      toast.success('City deleted');
      setCityToDelete(null);
      fetchCities();
    } catch (err: any) { toast.error(err.message); }
    finally { setDeletingCity(false); }
  };

  const getLocationName = (location: any) => location?.locationName || String(location || '');

  const handleAddLocation = async () => {
    const locationName = newLocationName.trim();
    if (!editData?._id || !locationName) {
      toast.error('Enter a location name'); return;
    }

    setSavingLocationKey('new');
    try {
      await api.createLocation({ cityId: editData._id, locationName });
      toast.success('Location added');
      setNewLocationName('');
      await refreshEditedCity(editData._id);
    } catch (err: any) {
      toast.error(err.message || 'Failed to add location');
    } finally {
      setSavingLocationKey(null);
    }
  };

  const handleUpdateLocation = async (location: any) => {
    const locationName = (locationEdits[location._id] || '').trim();
    if (!locationName) {
      toast.error('Enter a location name'); return;
    }

    setSavingLocationKey(location._id);
    try {
      await api.updateLocation(location._id, { cityId: editData._id, locationName });
      toast.success('Location updated');
      await refreshEditedCity(editData._id);
    } catch (err: any) {
      toast.error(err.message || 'Failed to update location');
    } finally {
      setSavingLocationKey(null);
    }
  };

  const handleDeleteLocation = async () => {
    if (!locationToDelete) return;

    setDeletingLocation(true);
    setSavingLocationKey(locationToDelete._id);
    try {
      await api.deleteLocation(locationToDelete._id);
      toast.success('Location deleted');
      setLocationToDelete(null);
      await refreshEditedCity(editData._id);
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete location');
    } finally {
      setDeletingLocation(false);
      setSavingLocationKey(null);
    }
  };

  const showRemainingLocations = (locations: any[], target: HTMLElement) => {
    const rect = target.getBoundingClientRect();
    setLocationPreview({
      names: locations.slice(3).map(getLocationName),
      x: Math.min(rect.left, window.innerWidth - 280),
      y: rect.bottom + 8,
    });
  };

  const columns = [
    { key: 'cityId', label: 'City ID', sortable: true },
    { key: 'cityName', label: 'City Name', sortable: true },
    {
      key: 'locations', label: 'Locations',
      render: (row: any) => {
        const locations = row.locations || [];
        return (
        <div className="flex gap-1 flex-wrap">
          {locations.slice(0, 3).map((loc: any, i: number) => (
            <span key={i} className="px-2 py-0.5 bg-slate-800 border border-slate-700 rounded text-xs font-mono text-blue-400">
              {getLocationName(loc)}
            </span>
          ))}
          {locations.length > 3 && (
            <button
              type="button"
              onMouseEnter={(event) => showRemainingLocations(locations, event.currentTarget)}
              onFocus={(event) => showRemainingLocations(locations, event.currentTarget)}
              onMouseLeave={() => setLocationPreview(null)}
              onBlur={() => setLocationPreview(null)}
              className="px-2 py-0.5 bg-blue-900/50 border border-blue-700 rounded text-xs font-mono text-blue-300 hover:bg-blue-800/70 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              +{locations.length - 3} more
            </button>
          )}
        </div>
        );
      },
    },
    {
      key: 'actions', label: 'Actions',
      render: (row: any) => (
        <div className="flex gap-2">
          <button onClick={() => handleEdit(row)} className="btn-secondary text-xs px-3 py-1">Edit</button>
          <button onClick={() => setCityToDelete(row)} className="btn-danger text-xs px-3 py-1">Delete</button>
        </div>
      ),
    },
  ];

  if (loading) return <CrudPageSkeleton cols={3} />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-chivo font-bold uppercase tracking-wider flex items-center gap-3">
          <Buildings size={28} weight="duotone" className="text-indigo-400" />
          Cities
        </h1>
        <button onClick={() => { setEditData(null); setForm({ cityName: '', cityId: '' }); setNewLocationName(''); setLocationEdits({}); setModalOpen(true); }} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> New City
        </button>
      </div>

      <p className="page-subtitle">Maintain the list of supported cities used across ticketing, vendor operations, and reporting.</p>

      <DataTable data={cities} columns={columns} />

      {locationPreview && (
        <div
          className="fixed z-50 max-w-[260px] rounded-md border border-slate-700 bg-slate-950 px-3 py-2 shadow-xl"
          style={{ left: locationPreview.x, top: locationPreview.y }}
        >
          <div className="flex flex-wrap gap-1.5">
            {locationPreview.names.map((name, index) => (
              <span key={`${name}-${index}`} className="px-2 py-0.5 rounded border border-slate-700 bg-slate-800 text-xs font-mono text-blue-300">
                {name}
              </span>
            ))}
          </div>
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => { setModalOpen(false); setEditData(null); }} title={editData ? 'Edit City' : 'Create City'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-slate-400 text-xs uppercase tracking-wider mb-2 font-mono">City ID</label>
            <input value={form.cityId} onChange={(e) => setForm({ ...form, cityId: e.target.value })} required className="input-modern" placeholder="e.g. CTY001" />
          </div>
          <div>
            <label className="block text-slate-400 text-xs uppercase tracking-wider mb-2 font-mono">City Name</label>
            <input value={form.cityName} onChange={(e) => setForm({ ...form, cityName: e.target.value })} required className="input-modern" placeholder="e.g. New Delhi" />
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">{editData ? 'Save City' : 'Create City'}</button>
          </div>
        </form>

        {editData && (
          <div className="mt-6 border-t border-slate-800 pt-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-mono uppercase tracking-widest text-slate-400">Locations</h3>
                <p className="mt-1 text-sm text-slate-500">{(editData.locations || []).length} linked to this city</p>
              </div>
            </div>

            <div className="mb-4 flex flex-col gap-3 sm:flex-row">
              <input
                value={newLocationName}
                onChange={(event) => setNewLocationName(event.target.value)}
                className="input-modern flex-1"
                placeholder="Add location"
              />
              <button
                type="button"
                onClick={() => void handleAddLocation()}
                disabled={savingLocationKey === 'new'}
                className="btn-primary inline-flex items-center justify-center gap-2"
              >
                <Plus size={16} /> {savingLocationKey === 'new' ? 'Adding...' : 'Add'}
              </button>
            </div>

            {(editData.locations || []).length === 0 ? (
              <div className="rounded-md border border-slate-800 bg-slate-900/40 px-4 py-5 text-center text-sm text-slate-500">
                No locations added yet.
              </div>
            ) : (
              <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
                {(editData.locations || []).map((location: any) => {
                  const isSaving = savingLocationKey === location._id;
                  return (
                    <div key={location._id} className="flex flex-col gap-2 rounded-md border border-slate-800 bg-slate-900/40 p-3 sm:flex-row sm:items-center">
                      <input
                        value={locationEdits[location._id] ?? getLocationName(location)}
                        onChange={(event) => setLocationEdits((current) => ({ ...current, [location._id]: event.target.value }))}
                        className="input-modern h-10 flex-1"
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => void handleUpdateLocation(location)}
                          disabled={isSaving}
                          className="btn-secondary inline-flex items-center gap-1.5 text-sm"
                        >
                          <FloppyDisk size={15} /> {isSaving ? 'Saving...' : 'Save'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setLocationToDelete(location)}
                          disabled={isSaving}
                          className="btn-danger inline-flex items-center gap-1.5 text-sm"
                        >
                          <Trash size={15} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </Modal>
      <ConfirmModal
        isOpen={Boolean(cityToDelete)}
        title="Delete City"
        message={`Delete city ${cityToDelete?.cityName || 'record'}?`}
        confirmLabel="Delete"
        loading={deletingCity}
        onCancel={() => setCityToDelete(null)}
        onConfirm={() => void handleDelete()}
      />
      <ConfirmModal
        isOpen={Boolean(locationToDelete)}
        title="Delete Location"
        message={`Delete location ${locationToDelete ? getLocationName(locationToDelete) : ''}?`}
        confirmLabel="Delete"
        loading={deletingLocation}
        onCancel={() => setLocationToDelete(null)}
        onConfirm={() => void handleDeleteLocation()}
      />
    </div>
  );
}
