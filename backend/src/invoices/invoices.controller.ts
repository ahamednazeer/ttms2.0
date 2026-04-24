import { Body, Controller, Get, Param, Post, Res, UseGuards } from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { Response } from 'express';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { ParseObjectIdPipe } from '../common/pipes/parse-object-id.pipe';

@Controller('invoice')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPERADMIN')
export class InvoicesController {
  constructor(private svc: InvoicesService) {}

  @Get()
  findAll() { return this.svc.findAll(); }

  @Post('generate')
  generate(@Body() body: { vendorId: string; month: number; year: number }) {
    return this.svc.generate(body.vendorId, body.month, body.year);
  }

  @Get(':id/download')
  download(@Param('id', ParseObjectIdPipe) id: string, @Res() res: Response) {
    return this.svc.downloadPdf(id, res);
  }
}
