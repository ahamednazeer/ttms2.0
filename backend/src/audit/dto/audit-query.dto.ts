import { IsIn, IsISO8601, IsOptional, IsString } from 'class-validator';

export class AuditQueryDto {
  @IsOptional()
  @IsString()
  action?: string;

  @IsOptional()
  @IsIn(['SUCCESS', 'FAILURE'])
  status?: 'SUCCESS' | 'FAILURE';

  @IsOptional()
  @IsString()
  actorId?: string;

  @IsOptional()
  @IsString()
  actorUsername?: string;

  @IsOptional()
  @IsISO8601()
  dateFrom?: string;

  @IsOptional()
  @IsISO8601()
  dateTo?: string;
}
