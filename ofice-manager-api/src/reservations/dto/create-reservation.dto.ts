import {
  IsNotEmpty,
  IsNumber,
  IsDateString,
  IsOptional,
  IsString,
  IsInt,
  Min,
  Max,
} from 'class-validator';

export class CreateReservationDto {
  @IsNumber()
  @IsNotEmpty()
  roomId: number;

  @IsDateString()
  @IsNotEmpty()
  startTime: string;

  @IsInt()
  @Min(1)
  @Max(1)
  @IsNotEmpty()
  duration: number; // Duration in hours (1 hour maximum)

  @IsString()
  @IsOptional()
  purpose?: string;
}