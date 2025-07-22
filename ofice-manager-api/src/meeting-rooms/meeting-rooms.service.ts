import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MeetingRoom } from '../entities/meeting-room.entity';
import { CreateMeetingRoomDto } from './dto/create-meeting-room.dto';
import { UpdateMeetingRoomDto } from './dto/update-meeting-room.dto';

@Injectable()
export class MeetingRoomsService {
  constructor(
    @InjectRepository(MeetingRoom)
    private readonly meetingRoomRepository: Repository<MeetingRoom>,
  ) {}

  async create(createMeetingRoomDto: CreateMeetingRoomDto): Promise<MeetingRoom> {
    const meetingRoom = this.meetingRoomRepository.create(createMeetingRoomDto);
    return this.meetingRoomRepository.save(meetingRoom);
  }

  async findAll(): Promise<MeetingRoom[]> {
    return this.meetingRoomRepository.find({
      where: { isActive: true },
      order: { name: 'ASC' },
    });
  }

  async findOne(id: number): Promise<MeetingRoom> {
    const meetingRoom = await this.meetingRoomRepository.findOne({
      where: { id, isActive: true },
    });

    if (!meetingRoom) {
      throw new NotFoundException(`Meeting room with ID ${id} not found`);
    }

    return meetingRoom;
  }

  async update(id: number, updateMeetingRoomDto: UpdateMeetingRoomDto): Promise<MeetingRoom> {
    const meetingRoom = await this.findOne(id);
    Object.assign(meetingRoom, updateMeetingRoomDto);
    return this.meetingRoomRepository.save(meetingRoom);
  }

  async remove(id: number): Promise<void> {
    const meetingRoom = await this.findOne(id);
    meetingRoom.isActive = false;
    await this.meetingRoomRepository.save(meetingRoom);
  }

  async getAvailableRooms(startTime: Date, endTime: Date): Promise<MeetingRoom[]> {
    const query = `
      SELECT mr.* FROM meeting_rooms mr
      WHERE mr.is_active = true
      AND mr.id NOT IN (
        SELECT DISTINCT r.room_id 
        FROM reservations r
        WHERE r.status = 'confirmed'
        AND (
          (r.start_time <= $1 AND r.end_time > $1) OR
          (r.start_time < $2 AND r.end_time >= $2) OR
          (r.start_time >= $1 AND r.end_time <= $2)
        )
      )
      ORDER BY mr.name;
    `;

    return this.meetingRoomRepository.query(query, [startTime, endTime]);
  }
}