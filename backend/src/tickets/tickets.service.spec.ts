import { ForbiddenException } from '@nestjs/common';
import { TicketsService } from './tickets.service';

describe('TicketsService security', () => {
  const createService = () => {
    const queryChain = {
      populate: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      exec: jest.fn(),
    };

    const ticketModel = {
      find: jest.fn().mockReturnValue(queryChain),
      findById: jest.fn(),
      countDocuments: jest.fn(),
    };

    const transportModel = {
      findById: jest.fn(),
    };

    const locationModel = {
      findById: jest.fn(),
    };

    const locationCostsService = {
      findCost: jest.fn(),
    };

    const realtimeService = {
      emitTicketUpdate: jest.fn(),
    };

    const service = new TicketsService(
      ticketModel as any,
      transportModel as any,
      locationModel as any,
      locationCostsService as any,
      realtimeService as any,
    );

    return {
      service,
      ticketModel,
      transportModel,
      locationModel,
      locationCostsService,
      realtimeService,
      queryChain,
    };
  };

  it('filters list queries to the logged-in citizen', async () => {
    const { service, ticketModel, queryChain } = createService();
    queryChain.exec.mockResolvedValue([]);

    await service.findAll({}, { sub: 'user-1', role: 'USER' });

    expect(ticketModel.find).toHaveBeenCalledWith({ userId: 'user-1' });
  });

  it('filters list queries to the logged-in vendor', async () => {
    const { service, ticketModel, queryChain } = createService();
    queryChain.exec.mockResolvedValue([]);

    await service.findAll({}, { sub: 'vendor-user', role: 'VENDOR', vendorId: 'vendor-1' });

    expect(ticketModel.find).toHaveBeenCalledWith({ vendorId: 'vendor-1' });
  });

  it('blocks a citizen from reading another user ticket', async () => {
    const { service, ticketModel } = createService();
    ticketModel.findById.mockReturnValue({
      populate: jest.fn().mockResolvedValue({ _id: 'ticket-1', userId: 'user-2' }),
    });

    await expect(service.findOne('ticket-1', { sub: 'user-1', role: 'USER' })).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('blocks vendor assignment of another vendor transport', async () => {
    const { service, ticketModel, transportModel } = createService();
    ticketModel.findById.mockResolvedValue({
      status: 'PENDING',
      vendorId: 'vendor-1',
    });
    transportModel.findById.mockReturnValue({
      populate: jest.fn().mockResolvedValue({ _id: 'transport-2', vendorId: 'vendor-2' }),
    });

    await expect(
      service.assignTransport('ticket-1', 'transport-2', {
        sub: 'vendor-user',
        role: 'VENDOR',
        vendorId: 'vendor-1',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('blocks transport users from starting another transport ticket', async () => {
    const { service, ticketModel } = createService();
    ticketModel.findById.mockResolvedValue({
      _id: 'ticket-1',
      status: 'ASSIGNED',
      transportId: 'transport-2',
    });

    await expect(
      service.startRide('ticket-1', {
        sub: 'transport-user',
        role: 'TRANSPORT',
        transportId: 'transport-1',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
