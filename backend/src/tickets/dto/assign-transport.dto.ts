import { IsMongoId } from 'class-validator';

export class AssignTransportDto {
  @IsMongoId()
  transportId!: string;
}
