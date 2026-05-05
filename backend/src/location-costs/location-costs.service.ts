import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as XLSX from 'xlsx';
import { City, CityDocument } from '../cities/schemas/city.schema';
import { Location, LocationDocument } from '../locations/schemas/location.schema';
import { LocationCost, LocationCostDocument } from './schemas/location-cost.schema';
import { throwIfDuplicateKey } from '../common/utils/mongo-exception.util';
import { refIdFilter } from '../common/utils/mongo-id.util';

type ImportHeader = 'pickup' | 'dropoff' | 'amount' | 'city';

interface ParsedImportRow {
  rowNumber: number;
  pickup: string;
  dropoff: string;
  city: string;
  amount: number;
}

export interface ImportRowError {
  rowNumber: number;
  message: string;
}

interface ParsedImportSheet {
  rows: ParsedImportRow[];
  errors: ImportRowError[];
}

export interface ImportPlanRow extends ParsedImportRow {
  action: 'create' | 'update' | 'unchanged';
}

export interface LocationCostImportResult {
  importedRows: number;
  validRows: number;
  citiesCreated: number;
  locationsCreated: number;
  routesCreated: number;
  routesUpdated: number;
  routesUnchanged: number;
}

export interface LocationCostImportPreview extends LocationCostImportResult {
  errors: ImportRowError[];
  canImport: boolean;
  previewRows: ImportPlanRow[];
}

interface ImportPlan {
  rows: ImportPlanRow[];
  errors: ImportRowError[];
  summary: LocationCostImportResult;
}

@Injectable()
export class LocationCostsService {
  constructor(
    @InjectModel(LocationCost.name) private model: Model<LocationCostDocument>,
    @InjectModel(City.name) private cityModel: Model<CityDocument>,
    @InjectModel(Location.name) private locationModel: Model<LocationDocument>,
  ) {}
  async findAll() { return this.model.find().populate('fromLocationId toLocationId cityId').exec(); }
  async findByCity(cityId: string) { return this.model.find(refIdFilter('cityId', cityId)).populate('fromLocationId toLocationId cityId').exec(); }
  async create(data: any) {
    if (data.fromLocationId === data.toLocationId) {
      throw new BadRequestException('From and to locations must be different');
    }
    this.assertPositiveCost(data.cost);
    try {
      return await new this.model(data).save();
    } catch (error) {
      throwIfDuplicateKey(error, 'Location cost already exists for this route');
      throw error;
    }
  }
  async update(id: string, data: any) {
    const current = await this.model.findById(id);
    if (!current) throw new NotFoundException();
    const nextFrom = data.fromLocationId || String(current.fromLocationId);
    const nextTo = data.toLocationId || String(current.toLocationId);
    if (nextFrom === nextTo) {
      throw new BadRequestException('From and to locations must be different');
    }
    if (data.cost !== undefined) {
      this.assertPositiveCost(data.cost);
    }
    try {
      const d = await this.model.findByIdAndUpdate(id, data, { returnDocument: 'after' });
      if (!d) throw new NotFoundException();
      return d;
    } catch (error) {
      throwIfDuplicateKey(error, 'Location cost already exists for this route');
      throw error;
    }
  }
  async delete(id: string) { const d = await this.model.findByIdAndDelete(id); if (!d) throw new NotFoundException(); return { deleted: true }; }
  async findCost(fromId: string, toId: string) { return this.model.findOne({ $and: [refIdFilter('fromLocationId', fromId), refIdFilter('toLocationId', toId)] }); }

  async importExcel(file: { buffer?: Buffer; originalname?: string } | undefined): Promise<LocationCostImportResult> {
    if (!file?.buffer) {
      throw new BadRequestException('Upload an Excel file');
    }

    const plan = await this.buildImportPlan(file.buffer);
    if (plan.errors.length) {
      throw new BadRequestException({
        message: 'Fix the Excel row errors before importing',
        errors: plan.errors,
        summary: plan.summary,
      });
    }
    if (!plan.rows.length) {
      throw new BadRequestException('No route pricing rows found. Required columns: Location pick Up, Drop Off Location, Amount, City');
    }

    let citiesCreated = 0;
    let locationsCreated = 0;
    let routesCreated = 0;
    let routesUpdated = 0;
    let routesUnchanged = 0;

    for (const row of plan.rows) {
      if (row.action === 'unchanged') {
        routesUnchanged++;
        continue;
      }

      const city = await this.findOrCreateCity(row.city);
      if (city.created) citiesCreated++;

      const cityId = city.doc._id as Types.ObjectId;
      const pickup = await this.findOrCreateLocation(row.pickup, cityId);
      if (pickup.created) locationsCreated++;

      const dropoff = await this.findOrCreateLocation(row.dropoff, cityId);
      if (dropoff.created) locationsCreated++;

      const existing = await this.model.findOne({
        cityId,
        fromLocationId: pickup.doc._id,
        toLocationId: dropoff.doc._id,
      });

      if (existing) {
        existing.cost = row.amount;
        await existing.save();
        routesUpdated++;
      } else {
        await new this.model({
          cityId,
          fromLocationId: pickup.doc._id,
          toLocationId: dropoff.doc._id,
          cost: row.amount,
        }).save();
        routesCreated++;
      }
    }

    return {
      importedRows: plan.rows.length,
      validRows: plan.rows.length,
      citiesCreated,
      locationsCreated,
      routesCreated,
      routesUpdated,
      routesUnchanged,
    };
  }

  async previewImport(file: { buffer?: Buffer; originalname?: string } | undefined): Promise<LocationCostImportPreview> {
    if (!file?.buffer) {
      throw new BadRequestException('Upload an Excel file');
    }

    const plan = await this.buildImportPlan(file.buffer);
    return {
      ...plan.summary,
      errors: plan.errors,
      canImport: plan.errors.length === 0 && plan.rows.length > 0,
      previewRows: plan.rows.slice(0, 20),
    };
  }

  private async buildImportPlan(buffer: Buffer): Promise<ImportPlan> {
    const parsed = this.parseImportRows(buffer);
    const errors = [...parsed.errors];
    const rows: ImportPlanRow[] = [];
    const seenRoutes = new Map<string, number>();
    const plannedCities = new Set<string>();
    const plannedLocations = new Set<string>();

    const [cities, locations, costs] = await Promise.all([
      this.cityModel.find().select('cityName').lean().exec(),
      this.locationModel.find().select('locationName cityId').lean().exec(),
      this.model.find().select('cityId fromLocationId toLocationId cost').lean().exec(),
    ]);

    const cityByName = new Map(cities.map((city) => [this.normalizeName(city.cityName), city]));
    const existingLocations = new Set(
      locations.map((location) => `${String(location.cityId)}:${this.normalizeName(location.locationName)}`),
    );
    const locationIdByName = new Map(
      locations.map((location) => [`${String(location.cityId)}:${this.normalizeName(location.locationName)}`, String(location._id)]),
    );
    const existingRouteCosts = new Map(
      costs.map((cost) => [
        `${String(cost.cityId)}:${String(cost.fromLocationId)}:${String(cost.toLocationId)}`,
        Number(cost.cost),
      ]),
    );

    for (const row of parsed.rows) {
      const normalizedCity = this.normalizeName(row.city);
      const normalizedPickup = this.normalizeName(row.pickup);
      const normalizedDropoff = this.normalizeName(row.dropoff);
      const routeKey = `${normalizedCity}:${normalizedPickup}:${normalizedDropoff}`;

      if (normalizedPickup === normalizedDropoff) {
        errors.push({ rowNumber: row.rowNumber, message: 'Pickup and drop-off locations must be different' });
        continue;
      }

      const firstSeenRow = seenRoutes.get(routeKey);
      if (firstSeenRow) {
        errors.push({ rowNumber: row.rowNumber, message: `Duplicate route also appears on row ${firstSeenRow}` });
        continue;
      }
      seenRoutes.set(routeKey, row.rowNumber);

      const existingCity = cityByName.get(normalizedCity);
      const cityKey = existingCity ? String(existingCity._id) : `new:${normalizedCity}`;
      if (!existingCity) plannedCities.add(normalizedCity);

      const pickupLocationKey = `${cityKey}:${normalizedPickup}`;
      const dropoffLocationKey = `${cityKey}:${normalizedDropoff}`;
      const pickupExists = existingLocations.has(pickupLocationKey) || plannedLocations.has(pickupLocationKey);
      const dropoffExists = existingLocations.has(dropoffLocationKey) || plannedLocations.has(dropoffLocationKey);

      if (!pickupExists) plannedLocations.add(pickupLocationKey);
      if (!dropoffExists) plannedLocations.add(dropoffLocationKey);

      let action: ImportPlanRow['action'] = 'create';
      if (existingCity && pickupExists && dropoffExists) {
        const pickupId = locationIdByName.get(pickupLocationKey);
        const dropoffId = locationIdByName.get(dropoffLocationKey);
        if (pickupId && dropoffId) {
          const existingCost = existingRouteCosts.get(`${String(existingCity._id)}:${pickupId}:${dropoffId}`);
          if (existingCost !== undefined) {
            action = existingCost === row.amount ? 'unchanged' : 'update';
          }
        }
      }

      rows.push({ ...row, action });
    }

    const routesCreated = rows.filter((row) => row.action === 'create').length;
    const routesUpdated = rows.filter((row) => row.action === 'update').length;
    const routesUnchanged = rows.filter((row) => row.action === 'unchanged').length;

    return {
      rows,
      errors,
      summary: {
        importedRows: parsed.rows.length,
        validRows: rows.length,
        citiesCreated: plannedCities.size,
        locationsCreated: plannedLocations.size,
        routesCreated,
        routesUpdated,
        routesUnchanged,
      },
    };
  }

  private parseImportRows(buffer: Buffer): ParsedImportSheet {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const rows: ParsedImportRow[] = [];
    const errors: ImportRowError[] = [];

    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];
      const matrix = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, defval: '', raw: false });
      const firstSheetRow = sheet['!ref'] ? XLSX.utils.decode_range(sheet['!ref']).s.r : 0;
      let headerMap: Partial<Record<ImportHeader, number>> = {};

      matrix.forEach((row, index) => {
        const rowNumber = firstSheetRow + index + 1;
        const detected = this.detectHeader(row);
        if (detected) {
          headerMap = detected;
          return;
        }

        if (!this.hasAllHeaders(headerMap) || row.every((cell) => !this.cellText(cell))) return;

        const pickup = this.cellText(row[headerMap.pickup]);
        const dropoff = this.cellText(row[headerMap.dropoff]);
        const city = this.cellText(row[headerMap.city]);
        const amountText = this.cellText(row[headerMap.amount]);
        const amount = Number(amountText.replace(/[$,\s]/g, ''));

        if (!pickup && !dropoff && !city && !amountText) return;
        if (!pickup || !dropoff || !city || !amountText || Number.isNaN(amount) || amount <= 0) {
          errors.push({ rowNumber, message: 'Pickup, drop-off, city, and an amount greater than 0 are required' });
          return;
        }

        rows.push({ rowNumber, pickup, dropoff, city, amount });
      });
    }

    if (!rows.length && !errors.length) {
      errors.push({ rowNumber: 0, message: 'No route pricing rows found. Required columns: Location pick Up, Drop Off Location, Amount, City' });
    }

    return { rows, errors };
  }

  private detectHeader(row: string[]): Partial<Record<ImportHeader, number>> | null {
    const headerMap: Partial<Record<ImportHeader, number>> = {};

    row.forEach((cell, index) => {
      const value = this.normalizeHeader(cell);
      if (['locationpickup', 'pickup', 'pickuplocation', 'from', 'fromlocation'].includes(value)) headerMap.pickup = index;
      if (['dropofflocation', 'dropoff', 'drop', 'droplocation', 'to', 'tolocation'].includes(value)) headerMap.dropoff = index;
      if (['amount', 'price', 'cost', 'rate'].includes(value)) headerMap.amount = index;
      if (value === 'city') headerMap.city = index;
    });

    return this.hasAllHeaders(headerMap) ? headerMap : null;
  }

  private hasAllHeaders(headerMap: Partial<Record<ImportHeader, number>>): headerMap is Record<ImportHeader, number> {
    return headerMap.pickup !== undefined && headerMap.dropoff !== undefined && headerMap.amount !== undefined && headerMap.city !== undefined;
  }

  private async findOrCreateCity(cityName: string) {
    const existing = await this.findCityByName(cityName);
    if (existing) return { doc: existing, created: false };

    const city = await new this.cityModel({
      cityName,
      cityId: await this.nextCityCode(cityName),
    }).save();
    return { doc: city, created: true };
  }

  private async findOrCreateLocation(locationName: string, cityId: Types.ObjectId) {
    const existing = await this.findLocationByName(locationName, cityId);
    if (existing) return { doc: existing, created: false };

    const location = await new this.locationModel({ locationName, cityId }).save();
    return { doc: location, created: true };
  }

  private async nextCityCode(cityName: string) {
    const base = this.normalizeHeader(cityName).toUpperCase().slice(0, 16) || 'CITY';
    let code = base;
    let suffix = 1;

    while (await this.cityModel.exists({ cityId: code })) {
      suffix++;
      code = `${base.slice(0, 16 - String(suffix).length)}${suffix}`;
    }

    return code;
  }

  private async findCityByName(cityName: string) {
    const cities = await this.cityModel.find().select('cityName').exec();
    return cities.find((city) => this.normalizeName(city.cityName) === this.normalizeName(cityName)) || null;
  }

  private async findLocationByName(locationName: string, cityId: Types.ObjectId) {
    const locations = await this.locationModel.find(refIdFilter('cityId', cityId)).select('locationName').exec();
    return locations.find((location) => this.normalizeName(location.locationName) === this.normalizeName(locationName)) || null;
  }

  private normalizeHeader(value: unknown) {
    return this.cellText(value).toLowerCase().replace(/[^a-z0-9]/g, '');
  }

  private normalizeName(value: unknown) {
    return this.cellText(value).toLowerCase().replace(/\s+/g, ' ').trim();
  }

  private cellText(value: unknown) {
    return String(value ?? '').trim();
  }

  private assertPositiveCost(value: unknown) {
    const cost = Number(value);
    if (Number.isNaN(cost) || cost <= 0) {
      throw new BadRequestException('Route price must be greater than 0');
    }
  }
}
