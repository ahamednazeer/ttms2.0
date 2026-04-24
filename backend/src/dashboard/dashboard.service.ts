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

  async getStats() {
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
