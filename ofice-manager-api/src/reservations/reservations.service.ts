import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Reservation, ReservationStatus } from '../entities/reservation.entity';
import { User } from '../entities/user.entity';
import { MeetingRoom } from '../entities/meeting-room.entity';
import { UserType } from '../entities/user-type.entity';
import { SystemConfigService } from '../system-config/system-config.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { UpdateReservationDto } from './dto/update-reservation.dto';

@Injectable()
export class ReservationsService {
  constructor(
    @InjectRepository(Reservation)
    private readonly reservationRepository: Repository<Reservation>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(MeetingRoom)
    private readonly meetingRoomRepository: Repository<MeetingRoom>,
    @InjectRepository(UserType)
    private readonly userTypeRepository: Repository<UserType>,
    private readonly systemConfigService: SystemConfigService,
  ) {}

  async create(createReservationDto: CreateReservationDto, userId: number): Promise<Reservation> {
    const { roomId, startTime, duration, purpose } = createReservationDto;

    // Validate and process start time
    const start = new Date(startTime);
    
    // Get current time in system timezone for comparison
    const currentTimeInSystemTz = await this.systemConfigService.getCurrentDateInSystemTimezone();
    
    if (start < currentTimeInSystemTz) {
      throw new BadRequestException('No se pueden hacer reservaciones en el pasado');
    }

    // Validate that start time is on the hour (minutes and seconds should be 0)
    if (start.getMinutes() !== 0 || start.getSeconds() !== 0 || start.getMilliseconds() !== 0) {
      throw new BadRequestException('Las reservaciones deben comenzar al inicio de una hora (ej. 09:00, 10:00)');
    }

    // Calculate end time based on duration
    const end = new Date(start.getTime() + (duration * 60 * 60 * 1000));
    const totalHours = duration;

    // Check if user exists
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['userType'],
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Check if room exists
    const room = await this.meetingRoomRepository.findOne({
      where: { id: roomId, isActive: true },
    });

    if (!room) {
      throw new NotFoundException('Sala de reuniones no encontrada');
    }

    // Check for conflicting reservations
    const conflictingReservation = await this.reservationRepository
      .createQueryBuilder('reservation')
      .where('reservation.roomId = :roomId', { roomId })
      .andWhere('reservation.status = :status', { status: ReservationStatus.CONFIRMED })
      .andWhere(
        '(reservation.startTime <= :startTime AND reservation.endTime > :startTime) OR ' +
        '(reservation.startTime < :endTime AND reservation.endTime >= :endTime) OR ' +
        '(reservation.startTime >= :startTime AND reservation.endTime <= :endTime)',
        { startTime: start, endTime: end }
      )
      .getOne();

    if (conflictingReservation) {
      throw new BadRequestException('La sala ya está reservada para este período de tiempo');
    }

    // Check for consecutive reservations (max 1 hour consecutive)
    await this.validateConsecutiveReservations(userId, start, end);

    // Check weekly hours limit
    await this.validateWeeklyHoursLimit(userId, totalHours);

    // Create reservation
    const reservation = this.reservationRepository.create({
      userId,
      roomId,
      startTime: start,
      endTime: end,
      purpose,
      totalHours,
      status: ReservationStatus.CONFIRMED,
    });

    return this.reservationRepository.save(reservation);
  }

  async findAll(): Promise<Reservation[]> {
    return this.reservationRepository.find({
      relations: ['user', 'room'],
      order: { startTime: 'DESC' },
    });
  }

  async findByUser(userId: number): Promise<Reservation[]> {
    return this.reservationRepository.find({
      where: { userId },
      relations: ['room'],
      order: { startTime: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Reservation> {
    const reservation = await this.reservationRepository.findOne({
      where: { id },
      relations: ['user', 'room'],
    });

    if (!reservation) {
      throw new NotFoundException(`Reservación con ID ${id} no encontrada`);
    }

    return reservation;
  }

  async update(id: number, updateReservationDto: UpdateReservationDto, userId: number): Promise<Reservation> {
    const reservation = await this.findOne(id);

    // Check if user owns the reservation or is admin
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (reservation.userId !== userId && user?.role !== 'admin') {
      throw new ForbiddenException('Solo puedes actualizar tus propias reservaciones');
    }

    Object.assign(reservation, updateReservationDto);
    return this.reservationRepository.save(reservation);
  }

  async cancel(id: number, userId: number): Promise<Reservation> {
    const reservation = await this.findOne(id);

    // Check if user owns the reservation or is admin
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (reservation.userId !== userId && user?.role !== 'admin') {
      throw new ForbiddenException('Solo puedes cancelar tus propias reservaciones');
    }

    reservation.status = ReservationStatus.CANCELLED;
    return this.reservationRepository.save(reservation);
  }

  private async validateWeeklyHoursLimit(userId: number, additionalHours: number): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['userType'],
    });

    if (!user?.userType) {
      throw new BadRequestException('Tipo de usuario no encontrado');
    }

    // Get current week's usage
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 7);

    const currentUsage = await this.reservationRepository
      .createQueryBuilder('reservation')
      .select('SUM(reservation.totalHours)', 'totalHours')
      .where('reservation.userId = :userId', { userId })
      .andWhere('reservation.status = :status', { status: ReservationStatus.CONFIRMED })
      .andWhere('reservation.startTime >= :startOfWeek', { startOfWeek })
      .andWhere('reservation.startTime < :endOfWeek', { endOfWeek })
      .getRawOne();

    const currentHours = parseFloat(currentUsage.totalHours) || 0;
    const totalHours = currentHours + additionalHours;

    if (totalHours > user.userType.weeklyHoursLimit) {
      throw new BadRequestException(
        `Esta reservación excedería tu límite semanal de ${user.userType.weeklyHoursLimit} horas. ` +
        `Uso actual: ${currentHours} horas, Solicitado: ${additionalHours} horas`
      );
    }
  }

  private async validateConsecutiveReservations(userId: number, start: Date, end: Date): Promise<void> {
    // Check for existing reservations that are adjacent to the new reservation
    const adjacentReservations = await this.reservationRepository
      .createQueryBuilder('reservation')
      .where('reservation.userId = :userId', { userId })
      .andWhere('reservation.status = :status', { status: ReservationStatus.CONFIRMED })
      .andWhere(
        '(reservation.endTime = :startTime) OR (reservation.startTime = :endTime)',
        { startTime: start, endTime: end }
      )
      .getMany();

    if (adjacentReservations.length > 0) {
      throw new BadRequestException(
        'No se pueden hacer reservaciones consecutivas. Máximo una hora por reservación.'
      );
    }
  }
}