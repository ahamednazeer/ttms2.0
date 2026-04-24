import { Injectable } from '@nestjs/common';
import { CitiesService } from '../cities/cities.service';
import { LocationsService } from '../locations/locations.service';
import { VendorsService } from '../vendors/vendors.service';
import { UsersService } from '../users/users.service';
import { TransportsService } from '../transports/transports.service';
import { TicketsService } from '../tickets/tickets.service';

@Injectable()
export class DashboardService {
  constructor(
    private citiesService: CitiesService,
    private locationsService: LocationsService,
    private vendorsService: VendorsService,
    private usersService: UsersService,
    private transportsService: TransportsService,
    private ticketsService: TicketsService,
  ) {}

  async getStats(actor?: { role: string; vendorId?: string }) {
    if (actor?.role === 'VENDOR') {
      const vendor = actor.vendorId ? await this.vendorsService.findOne(actor.vendorId) : null;
      const vendorCityId = vendor && typeof vendor.cityId !== 'string' ? vendor.cityId?._id : undefined;
      const pendingQueueCount = vendorCityId
        ? await this.ticketsService.count({ status: 'PENDING', cityId: vendorCityId })
        : 0;
      const [transportCount, assignedCount, completedCount] = await Promise.all([
        this.transportsService.count(actor.vendorId ? { vendorId: actor.vendorId } : { _id: null }),
        this.ticketsService.count(actor.vendorId ? { vendorId: actor.vendorId } : { _id: null }),
        this.ticketsService.count(actor.vendorId ? { vendorId: actor.vendorId, status: 'COMPLETED' } : { _id: null }),
      ]);

      return {
        transportCount,
        rideTicketCount: pendingQueueCount + assignedCount,
        ticketsByStatus: {
          PENDING: pendingQueueCount,
          COMPLETED: completedCount,
        },
      };
    }

    const [cityCount, locationCount, vendorCount, userCount, transportCount, rideTicketCount, ticketsByStatus] =
      await Promise.all([
        this.citiesService.count(),
        this.locationsService.count(),
        this.vendorsService.count(),
        this.usersService.count(),
        this.transportsService.count(),
        this.ticketsService.count(),
        this.ticketsService.getStatusCounts(),
      ]);

    return { cityCount, locationCount, vendorCount, userCount, transportCount, rideTicketCount, ticketsByStatus };
  }
}
