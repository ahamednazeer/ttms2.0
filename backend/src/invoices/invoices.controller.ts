import { Body, Controller, Delete, Get, Param, Post, Query, Res, UseGuards } from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { Response } from 'express';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { ParseObjectIdPipe } from '../common/pipes/parse-object-id.pipe';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';

@Controller('invoice')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPERADMIN')
export class InvoicesController {
  constructor(private svc: InvoicesService) {}

  @Get()
  findAll(@Query() query: PaginationQueryDto) { return this.svc.findAll(query); }

  @Post('generate')
  generate(@Body() body: { vendorId: string; month: number; year: number }) {
    return this.svc.generate(body.vendorId, body.month, body.year);
  }

  @Post(':id/approve')
  approve(@Param('id', ParseObjectIdPipe) id: string) {
    return this.svc.approve(id);
  }

  @Post(':id/reject')
  reject(@Param('id', ParseObjectIdPipe) id: string, @Body() body: { remarks: string }) {
    return this.svc.reject(id, body.remarks || '');
  }

  @Delete(':id')
  delete(@Param('id', ParseObjectIdPipe) id: string) {
    return this.svc.delete(id);
  }

  @Get(':id/download')
  download(@Param('id', ParseObjectIdPipe) id: string, @Res() res: Response) {
    return this.svc.downloadPdf(id, res);
  }
}
