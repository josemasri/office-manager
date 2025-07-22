import { IsNotEmpty, IsString, IsNumber, IsArray, IsOptional } from 'class-validator';

export class CreateMeetingRoomDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @IsNotEmpty()
  capacity: number;

  @IsArray()
  @IsOptional()
  equipment?: string[];

  @IsNumber()
  @IsOptional()
  hourlyRate?: number;
}