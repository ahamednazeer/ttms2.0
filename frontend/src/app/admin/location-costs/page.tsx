'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';
import type { City, Location, LocationCost } from '@/lib/types';
import { CurrencyDollar, FloppyDisk } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { CrudPageSkeleton } from '@/components/Skeleton';
import { useTheme } from '@/components/ThemeProvider';

type RouteRow = {
  key: string;
  cityId: string;
  fromLocationId: string;
  toLocationId: string;
  fromName: string;
  toName: string;
  costId?: string;
  cost: string;
  distance: string;
  hasSavedValue: boolean;
};

export default function LocationCostsPage() {
  const { theme, mounted } = useTheme();
  const isDark = !mounted || theme === 'dark';
  const [costs, setCosts] = useState<LocationCost[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [selectedCityId, setSelectedCityId] = useState('');
  const [rows, setRows] = useState<RouteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);

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

  useEffect(() => {
    void fetchData();
  }, []);

  const locationsByCity = useMemo(() => {
    const grouped = new Map<string, Location[]>();
    for (const location of locations) {
      const cityId = typeof location.cityId === 'string' ? location.cityId : location.cityId?._id;
      if (!cityId) continue;
      const current = grouped.get(cityId) || [];
      current.push(location);
      grouped.set(cityId, current);
    }
    for (const [cityId, cityLocations] of grouped.entries()) {
      grouped.set(
        cityId,
        [...cityLocations].sort((left, right) => left.locationName.localeCompare(right.locationName)),
      );
    }
    return grouped;
  }, [locations]);

  useEffect(() => {
    if (!selectedCityId) {
      setRows([]);
      return;
    }

    const cityLocations = locationsByCity.get(selectedCityId) || [];
    const cityCosts = costs.filter((cost) => {
      const costCityId = typeof cost.cityId === 'string' ? cost.cityId : cost.cityId?._id;
      return costCityId === selectedCityId;
    });

    const nextRows: RouteRow[] = [];
    for (const fromLocation of cityLocations) {
      for (const toLocation of cityLocations) {
        if (fromLocation._id === toLocation._id) continue;

        const existing = cityCosts.find((cost) => {
          const fromId = typeof cost.fromLocationId === 'string' ? cost.fromLocationId : cost.fromLocationId?._id;
          const toId = typeof cost.toLocationId === 'string' ? cost.toLocationId : cost.toLocationId?._id;
          return fromId === fromLocation._id && toId === toLocation._id;
        });

        nextRows.push({
          key: `${fromLocation._id}-${toLocation._id}`,
          cityId: selectedCityId,
          fromLocationId: fromLocation._id,
          toLocationId: toLocation._id,
          fromName: fromLocation.locationName,
          toName: toLocation.locationName,
          costId: existing?._id,
          cost: existing ? String(existing.cost ?? '') : '',
          distance: existing ? String(existing.distance ?? '') : '',
          hasSavedValue: Boolean(existing),
        });
      }
    }

    setRows(nextRows);
  }, [costs, locationsByCity, selectedCityId]);

  const selectedCity = cities.find((city) => city._id === selectedCityId);
  const totalRoutes = rows.length;
  const configuredRoutes = rows.filter((row) => row.hasSavedValue).length;

  const updateRow = (key: string, field: 'cost' | 'distance', value: string) => {
    setRows((current) =>
      current.map((row) => (row.key === key ? { ...row, [field]: value } : row)),
    );
  };

  const saveRow = async (row: RouteRow) => {
    const cost = Number(row.cost);
    const distance = Number(row.distance);

    if (!row.cost || Number.isNaN(cost) || cost < 0) {
      toast.error(`Enter a valid price for ${row.fromName} to ${row.toName}`);
      return;
    }

    if (!row.distance || Number.isNaN(distance) || distance < 0) {
      toast.error(`Enter a valid distance for ${row.fromName} to ${row.toName}`);
      return;
    }

    setSavingKey(row.key);
    try {
      const payload = {
        cityId: row.cityId,
        fromLocationId: row.fromLocationId,
        toLocationId: row.toLocationId,
        cost,
        distance,
      };

      if (row.costId) {
        await api.updateLocationCost(row.costId, payload);
      } else {
        await api.createLocationCost(payload);
      }

      toast.success(`Saved ${row.fromName} to ${row.toName}`);
      await fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save route pricing');
    } finally {
      setSavingKey(null);
    }
  };

  if (loading) return <CrudPageSkeleton cols={6} />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-chivo font-bold uppercase tracking-wider flex items-center gap-3">
            <CurrencyDollar size={28} weight="duotone" className="text-green-400" /> Route Pricing
          </h1>
          <p className="page-subtitle mt-3">
            The system auto-arranges every route pair for the selected city. Update the price and distance for any route, then save it.
          </p>
        </div>
        <div className="w-full lg:w-72">
          <label className="block text-slate-400 text-xs uppercase tracking-wider mb-2 font-mono">City</label>
          <select
            value={selectedCityId}
            onChange={(event) => setSelectedCityId(event.target.value)}
            className="input-modern"
          >
            <option value="">Select City</option>
            {cities.map((city) => (
              <option key={city._id} value={city._id}>
                {city.cityName}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="panel p-5">
          <p className="section-title">Selected City</p>
          <p className={`mt-2 text-lg font-semibold ${isDark ? 'text-slate-100' : 'text-[color:var(--text-primary)]'}`}>
            {selectedCity?.cityName || 'Not selected'}
          </p>
        </div>
        <div className="panel p-5">
          <p className="section-title">Route Pairs</p>
          <p className={`mt-2 text-lg font-semibold ${isDark ? 'text-slate-100' : 'text-[color:var(--text-primary)]'}`}>{totalRoutes}</p>
        </div>
        <div className="panel p-5">
          <p className="section-title">Configured</p>
          <p className={`mt-2 text-lg font-semibold ${isDark ? 'text-slate-100' : 'text-[color:var(--text-primary)]'}`}>
            {configuredRoutes} / {totalRoutes}
          </p>
        </div>
      </div>

      {!selectedCityId ? (
        <div className={`panel px-6 py-10 text-center ${isDark ? 'text-slate-400' : 'secondary-text'}`}>
          Select a city to auto-generate its route pricing list.
        </div>
      ) : rows.length === 0 ? (
        <div className={`panel px-6 py-10 text-center ${isDark ? 'text-slate-400' : 'secondary-text'}`}>
          Add at least two locations to this city and the system will arrange the routes automatically.
        </div>
      ) : (
        <div className="panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px]">
              <thead
                style={isDark
                  ? { background: 'rgba(15, 23, 42, 0.8)' }
                  : { background: 'color-mix(in srgb, var(--surface-2) 88%, transparent)' }}
              >
                <tr>
                  {['From', 'To', 'Price ($)', 'Distance (km)', 'Status', 'Action'].map((label) => (
                    <th
                      key={label}
                      className={`px-4 py-4 text-left text-xs font-mono uppercase tracking-wider border-b ${
                        isDark ? 'text-slate-400' : 'muted-text'
                      }`}
                      style={isDark ? { borderColor: 'rgba(30, 41, 59, 0.9)' } : { borderColor: 'var(--border)' }}
                    >
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => {
                  const isSaving = savingKey === row.key;
                  return (
                    <tr
                      key={row.key}
                      className="border-t"
                      style={isDark
                        ? {
                            borderColor: 'rgba(30, 41, 59, 0.8)',
                            background: index % 2 === 0 ? 'rgba(2, 6, 23, 0.1)' : 'rgba(15, 23, 42, 0.18)',
                          }
                        : {
                            borderColor: 'var(--border)',
                            background: index % 2 === 0 ? 'transparent' : 'color-mix(in srgb, var(--surface-3) 32%, transparent)',
                          }}
                    >
                      <td className={`px-4 py-4 text-sm font-medium ${isDark ? 'text-slate-200' : 'text-[color:var(--text-primary)]'}`}>{row.fromName}</td>
                      <td className={`px-4 py-4 text-sm font-medium ${isDark ? 'text-slate-200' : 'text-[color:var(--text-primary)]'}`}>{row.toName}</td>
                      <td className="px-4 py-4">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={row.cost}
                          onChange={(event) => updateRow(row.key, 'cost', event.target.value)}
                          className="input-modern h-10 min-w-[140px]"
                          placeholder="0.00"
                        />
                      </td>
                      <td className="px-4 py-4">
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          value={row.distance}
                          onChange={(event) => updateRow(row.key, 'distance', event.target.value)}
                          className="input-modern h-10 min-w-[140px]"
                          placeholder="0.0"
                        />
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-mono uppercase tracking-wide ${
                            row.hasSavedValue
                              ? isDark
                                ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                                : 'bg-emerald-500/10 text-emerald-700 border border-emerald-500/30'
                              : isDark
                                ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
                                : 'bg-amber-500/10 text-amber-700 border border-amber-500/30'
                          }`}
                        >
                          {row.hasSavedValue ? 'Configured' : 'Pending'}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <button
                          type="button"
                          onClick={() => void saveRow(row)}
                          disabled={isSaving}
                          className="btn-primary inline-flex items-center gap-2"
                        >
                          <FloppyDisk size={16} />
                          {isSaving ? 'Saving...' : row.hasSavedValue ? 'Update' : 'Save'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
