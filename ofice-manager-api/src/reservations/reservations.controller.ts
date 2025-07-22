import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  ValidationPipe,
} from '@nestjs/common';
import { ReservationsService } from './reservations.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { UpdateReservationDto } from './dto/update-reservation.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('reservations')
@UseGuards(JwtAuthGuard)
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @Post()
  create(
    @Body(ValidationPipe) createReservationDto: CreateReservationDto,
    @Request() req: any,
  ) {
    return this.reservationsService.create(createReservationDto, req.user.userId);
  }

  @Get()
  findAll() {
    return this.reservationsService.findAll();
  }

  @Get('my-reservations')
  findMyReservations(@Request() req: any) {
    return this.reservationsService.findByUser(req.user.userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.reservationsService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body(ValidationPipe) updateReservationDto: UpdateReservationDto,
    @Request() req: any,
  ) {
    return this.reservationsService.update(+id, updateReservationDto, req.user.userId);
  }

  @Patch(':id/cancel')
  cancel(@Param('id') id: string, @Request() req: any) {
    return this.reservationsService.cancel(+id, req.user.userId);
  }
}