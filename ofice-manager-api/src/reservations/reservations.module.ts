import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReservationsService } from './reservations.service';
import { ReservationsController } from './reservations.controller';
import { Reservation } from '../entities/reservation.entity';
import { User } from '../entities/user.entity';
import { MeetingRoom } from '../entities/meeting-room.entity';
import { UserType } from '../entities/user-type.entity';
import { SystemConfigModule } from '../system-config/system-config.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Reservation, User, MeetingRoom, UserType]),
    SystemConfigModule,
  ],
  controllers: [ReservationsController],
  providers: [ReservationsService],
  exports: [ReservationsService],
})
export class ReservationsModule {}
