import { Controller, Get, Post, Param, Body, Res, UseGuards } from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { Response } from 'express';

@Controller('invoice')
@UseGuards(JwtAuthGuard)
export class InvoicesController {
  constructor(private svc: InvoicesService) {}

  @Get()
  findAll() { return this.svc.findAll(); }

  @Post('generate')
  generate(@Body() body: { vendorId: string; month: number; year: number }) {
    return this.svc.generate(body.vendorId, body.month, body.year);
  }

  @Get(':id/download')
  download(@Param('id') id: string, @Res() res: any) {
    return this.svc.downloadPdf(id, res);
  }
}
