import { IsDateString, IsMongoId } from 'class-validator';

export class CreateTicketDto {
  @IsMongoId()
  pickupLocationId!: string;

  @IsMongoId()
  dropLocationId!: string;

  @IsDateString()
  pickupDate!: string;
}
