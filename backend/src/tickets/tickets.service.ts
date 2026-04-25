import { BadRequestException, ForbiddenException, forwardRef, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Ticket, TicketDocument } from './schemas/ticket.schema';
import { LocationCostsService } from '../location-costs/location-costs.service';
import { RealtimeService } from '../realtime/realtime.service';
import { Transport, TransportDocument } from '../transports/schemas/transport.schema';
import { Location, LocationDocument } from '../locations/schemas/location.schema';
import { Vendor, VendorDocument } from '../vendors/schemas/vendor.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { NotificationsService } from '../notifications/notifications.service';
import { InvoicesService } from '../invoices/invoices.service';

interface ActorContext {
  sub: string;
  role: string;
  cityId?: string;
  vendorId?: string;
  transportId?: string;
}

@Injectable()
export class TicketsService {
  constructor(
    @InjectModel(Ticket.name) private model: Model<TicketDocument>,
    @InjectModel(Transport.name) private transportModel: Model<TransportDocument>,
    @InjectModel(Location.name) private locationModel: Model<LocationDocument>,
    @InjectModel(Vendor.name) private vendorModel: Model<VendorDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private locationCostsService: LocationCostsService,
    private realtimeService: RealtimeService,
    private notificationsService: NotificationsService,
    @Inject(forwardRef(() => InvoicesService))
    private invoicesService: InvoicesService,
  ) {}

  private populateFields = 'userId cityId pickupLocationId dropLocationId transportId vendorId';

  async findAll(query?: any, actor?: ActorContext) {
    const filter: any = {};
    if (query?.status) filter.status = query.status;
    if (query?.cityId) filter.cityId = query.cityId;
    if (query?.vendorId) filter.vendorId = query.vendorId;
    if (query?.userId) filter.userId = query.userId;

    if (actor) {
      if (actor.role === 'USER') filter.userId = actor.sub;
      if (actor.role === 'VENDOR') {
        if (!actor.vendorId) return [];
        const vendor = await this.vendorModel.findById(actor.vendorId).select('cityId').lean();
        const vendorCityId = vendor?.cityId ? String(vendor.cityId) : actor.cityId;
        if (!vendorCityId) {
          filter.vendorId = actor.vendorId;
        } else {
          const baseFilter = { ...filter };
          delete baseFilter.vendorId;
          delete baseFilter.cityId;
          return this.model.find({
            ...baseFilter,
            $or: [
              { vendorId: actor.vendorId },
              { status: 'PENDING', cityId: vendorCityId },
            ],
          }).populate(this.populateFields).sort({ createdAt: -1 }).exec();
        }
      }
      if (actor.role === 'TRANSPORT') {
        if (!actor.transportId) return [];
        filter.transportId = actor.transportId;
      }
    }

    return this.model.find(filter).populate(this.populateFields).sort({ createdAt: -1 }).exec();
  }

  async findOne(id: string, actor?: ActorContext) {
    const ticket = await this.model.findById(id).populate(this.populateFields);
    if (!ticket) throw new NotFoundException('Ticket not found');
    if (actor?.role === 'VENDOR') {
      const vendor = actor.vendorId
        ? await this.vendorModel.findById(actor.vendorId).select('cityId').lean()
        : null;
      const vendorCityId = vendor?.cityId ? String(vendor.cityId) : actor.cityId;
      const matchesAssignedVendor = actor.vendorId && this.normalizeId(ticket.vendorId) === actor.vendorId;
      const matchesPendingCity =
        ticket.status === 'PENDING' &&
        !!vendorCityId &&
        this.normalizeId(ticket.cityId) === vendorCityId;

      if (!matchesAssignedVendor && !matchesPendingCity) {
        throw new ForbiddenException('Cannot access tickets outside your vendor scope');
      }
      return ticket;
    }
    if (actor) this.assertTicketAccess(ticket, actor);
    return ticket;
  }

  async create(data: any, userId: string) {
    const pickupLocation = await this.locationModel.findById(data.pickupLocationId);
    if (!pickupLocation) throw new NotFoundException('Pickup location not found');
    if (data.pickupLocationId === data.dropLocationId) {
      throw new BadRequestException('Pickup and drop locations must be different');
    }

    const ticket = new this.model({
      ...data,
      userId,
      cityId: pickupLocation.cityId,
      status: 'PENDING',
    });

    const saved = await ticket.save();
    const populated = await saved.populate(this.populateFields);
    this.emitTicketUpdate(populated, 'created');
    this.dispatchNotification(() => this.notifyTicketCreated(populated));
    return populated;
  }

  async assignTransport(ticketId: string, transportId: string, actor: ActorContext) {
    const ticket = await this.model.findById(ticketId);
    if (!ticket) throw new NotFoundException('Ticket not found');
    if (ticket.status !== 'PENDING') throw new BadRequestException('Ticket already assigned');

    const transport = await this.transportModel.findById(transportId).populate('vendorId');
    if (!transport) throw new NotFoundException('Transport not found');

    if (actor.role === 'VENDOR') {
      if (!actor.vendorId) throw new ForbiddenException('Vendor access is not configured');
      if (this.normalizeId(transport.vendorId) !== actor.vendorId) {
        throw new ForbiddenException('Cannot assign a transport from another vendor');
      }
      const vendor = await this.vendorModel.findById(actor.vendorId).select('cityId').lean();
      const vendorCityId = vendor?.cityId ? String(vendor.cityId) : actor.cityId;
      if (vendorCityId && this.normalizeId(ticket.cityId) !== vendorCityId) {
        throw new ForbiddenException('Cannot assign tickets outside your city scope');
      }
      if (ticket.vendorId && this.normalizeId(ticket.vendorId) !== actor.vendorId) {
        throw new ForbiddenException('Cannot assign tickets outside your vendor scope');
      }
    }

    ticket.transportId = transportId as any;
    ticket.vendorId = transport.vendorId as any;
    if (!ticket.cityId && transport.cityId) {
      ticket.cityId = transport.cityId as any;
    }
    ticket.status = 'ASSIGNED';

    const saved = await ticket.save();
    const populated = await saved.populate(this.populateFields);
    this.emitTicketUpdate(populated, 'assigned');
    this.dispatchNotification(() => this.notifyTicketAssigned(populated));
    return populated;
  }

  async startRide(ticketId: string, actor: ActorContext) {
    const ticket = await this.model.findById(ticketId);
    if (!ticket) throw new NotFoundException('Ticket not found');
    if (ticket.status !== 'ASSIGNED') throw new BadRequestException('Ticket not in ASSIGNED state');
    this.assertTransportOwnership(ticket, actor);

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    ticket.otp = otp;
    ticket.status = 'RIDE_STARTED';
    ticket.rideStartTime = new Date();

    const saved = await ticket.save();
    const populated = await saved.populate(this.populateFields);

    console.log(`OTP for ticket ${ticketId}: ${otp}`);

    this.emitTicketUpdate(populated, 'started');
    this.dispatchNotification(() => this.notifyRideStarted(populated));
    return populated;
  }

  async completeRide(ticketId: string, otp: string, actor: ActorContext) {
    const ticket = await this.model.findById(ticketId);
    if (!ticket) throw new NotFoundException('Ticket not found');
    if (ticket.status !== 'RIDE_STARTED') throw new BadRequestException('Ride not started');
    if (ticket.otp !== otp) throw new BadRequestException('Invalid OTP');
    this.assertTransportOwnership(ticket, actor);

    let cost = 0;
    try {
      const costEntry = await this.locationCostsService.findCost(
        ticket.pickupLocationId.toString(),
        ticket.dropLocationId.toString(),
      );
      if (costEntry) cost = costEntry.cost;
    } catch {
      console.warn('Cost lookup failed, defaulting to 0');
    }

    ticket.status = 'COMPLETED';
    ticket.rideEndTime = new Date();
    ticket.cost = cost;
    ticket.otp = '';

    const saved = await ticket.save();
    const populated = await saved.populate(this.populateFields);
    this.emitTicketUpdate(populated, 'completed');
    this.dispatchNotification(() => this.notifyRideCompleted(populated));
    return populated;
  }

  async count(filter?: any) {
    return this.model.countDocuments(filter || {});
  }

  async getStatusCounts() {
    const statuses = ['PENDING', 'ASSIGNED', 'RIDE_STARTED', 'COMPLETED', 'CANCELLED'];
    const result: any = {};
    for (const status of statuses) {
      result[status] = await this.model.countDocuments({ status });
    }
    return result;
  }

  async findByVendorAndPeriod(vendorId: string, month: number, year: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);
    return this.model.find({
      vendorId,
      status: 'COMPLETED',
      rideEndTime: { $gte: startDate, $lte: endDate },
    }).populate(this.populateFields).exec();
  }

  private emitTicketUpdate(ticket: any, action: 'created' | 'assigned' | 'started' | 'completed' | 'updated') {
    this.realtimeService.emitTicketUpdate({
      ticketId: String(ticket._id),
      status: ticket.status,
      action,
      ticket,
    });
  }

  private assertTicketAccess(ticket: any, actor: ActorContext) {
    if (actor.role === 'SUPERADMIN') return;

    if (actor.role === 'USER' && this.normalizeId(ticket.userId) !== actor.sub) {
      throw new ForbiddenException('Cannot access another user ticket');
    }

    if (actor.role === 'VENDOR') {
      if (!actor.vendorId) {
        throw new ForbiddenException('Cannot access tickets outside your vendor scope');
      }
      if (this.normalizeId(ticket.vendorId) === actor.vendorId) {
        return;
      }
      throw new ForbiddenException('Cannot access tickets outside your vendor scope');
    }

    if (actor.role === 'TRANSPORT') {
      if (!actor.transportId || this.normalizeId(ticket.transportId) !== actor.transportId) {
        throw new ForbiddenException('Cannot access tickets outside your transport scope');
      }
    }
  }

  private assertTransportOwnership(ticket: any, actor: ActorContext) {
    if (actor.role !== 'TRANSPORT') {
      throw new ForbiddenException('Only assigned transport can update ride status');
    }
    if (!actor.transportId || this.normalizeId(ticket.transportId) !== actor.transportId) {
      throw new ForbiddenException('Cannot update tickets outside your transport scope');
    }
  }

  private normalizeId(value: any) {
    if (!value) return '';
    if (typeof value === 'string') return value;
    if (value._id) return String(value._id);
    if (value.toString) return value.toString();
    return String(value);
  }

  private async notifyTicketCreated(ticket: any) {
    const citizen = this.toRecipient(ticket.userId);
    const journey = this.buildJourneyDetails(ticket);

    await Promise.allSettled([
      this.notificationsService.sendRideRequested(citizen, journey),
      this.notificationsService.sendVendorQueueAlerts(await this.getVendorDispatchRecipients(ticket.cityId), journey),
    ]);
  }

  private async notifyTicketAssigned(ticket: any) {
    const transportUser = await this.userModel.findOne({
      role: 'TRANSPORT',
      transportId: this.normalizeId(ticket.transportId),
      active: true,
      email: { $exists: true, $ne: '' },
    }).select('email firstName lastName').lean();

    const journey = this.buildJourneyDetails(ticket);
    await Promise.allSettled([
      this.notificationsService.sendRideAssigned(this.toRecipient(ticket.userId), journey),
      transportUser
        ? this.notificationsService.sendDriverAssigned(
            {
              email: transportUser.email,
              name: [transportUser.firstName, transportUser.lastName].filter(Boolean).join(' ').trim() || undefined,
            },
            journey,
          )
        : Promise.resolve(false),
    ]);
  }

  private async notifyRideStarted(ticket: any) {
    await this.notificationsService.sendRideStarted(
      this.toRecipient(ticket.userId),
      this.buildJourneyDetails(ticket),
    );
  }

  private async notifyRideCompleted(ticket: any) {
    const journey = this.buildJourneyDetails(ticket);
    await Promise.allSettled([
      this.notificationsService.sendRideCompleted(this.toRecipient(ticket.userId), journey),
      this.notificationsService.sendVendorJourneyCompleted(await this.getVendorRecipients(ticket.vendorId), journey),
      this.invoicesService.sendInvoiceOnJourneyCompletion(ticket),
    ]);
  }

  private async getVendorDispatchRecipients(cityId: any) {
    const vendors = await this.vendorModel.find({
      cityId: this.normalizeId(cityId),
      active: true,
    }).select('email vendorName').lean();

    const vendorIds = vendors.map((vendor) => vendor._id);
    const vendorUsers = vendorIds.length
      ? await this.userModel.find({
          role: 'VENDOR',
          vendorId: { $in: vendorIds },
          active: true,
          email: { $exists: true, $ne: '' },
        }).select('email firstName lastName').lean()
      : [];

    return [
      ...vendors.map((vendor) => ({ email: vendor.email, name: vendor.vendorName })),
      ...vendorUsers.map((user) => ({
        email: user.email,
        name: [user.firstName, user.lastName].filter(Boolean).join(' ').trim() || undefined,
      })),
    ].filter((recipient) => !!recipient.email);
  }

  private async getVendorRecipients(vendorId: any) {
    if (!vendorId) return [];
    const vendor = await this.vendorModel.findById(vendorId).select('email vendorName').lean();
    const vendorUsers = await this.userModel.find({
      role: 'VENDOR',
      vendorId: this.normalizeId(vendorId),
      active: true,
      email: { $exists: true, $ne: '' },
    }).select('email firstName lastName').lean();

    return [
      vendor?.email ? { email: vendor.email, name: vendor.vendorName } : null,
      ...vendorUsers.map((user) => ({
        email: user.email,
        name: [user.firstName, user.lastName].filter(Boolean).join(' ').trim() || undefined,
      })),
    ].filter(Boolean) as Array<{ email: string; name?: string }>;
  }

  private buildJourneyDetails(ticket: any) {
    return {
      requesterName: this.getDisplayName(ticket.userId),
      pickup: ticket.pickupLocationId?.locationName || 'N/A',
      drop: ticket.dropLocationId?.locationName || 'N/A',
      city: ticket.cityId?.cityName || 'N/A',
      date: ticket.pickupDate ? new Date(ticket.pickupDate).toLocaleString() : 'N/A',
      vehicleNo: ticket.transportId?.vehicleNo || 'N/A',
      driverName: ticket.transportId?.ownerDetails || 'N/A',
      contact: ticket.transportId?.contact || 'N/A',
      otp: ticket.otp || undefined,
      cost: ticket.cost,
    };
  }

  private toRecipient(entity: any) {
    return {
      email: entity?.email,
      name: this.getDisplayName(entity),
    };
  }

  private getDisplayName(entity: any) {
    if (!entity) return undefined;
    if (entity.firstName || entity.lastName) {
      return [entity.firstName, entity.lastName].filter(Boolean).join(' ').trim();
    }
    return entity.username || entity.vendorName || entity.ownerDetails || undefined;
  }

  private dispatchNotification(task: () => Promise<unknown>) {
    void task().catch(() => undefined);
  }
}
