import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  ValidationPipe,
} from '@nestjs/common';
import { MeetingRoomsService } from './meeting-rooms.service';
import { CreateMeetingRoomDto } from './dto/create-meeting-room.dto';
import { UpdateMeetingRoomDto } from './dto/update-meeting-room.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('meeting-rooms')
@UseGuards(JwtAuthGuard)
export class MeetingRoomsController {
  constructor(private readonly meetingRoomsService: MeetingRoomsService) {}

  @Post()
  create(@Body(ValidationPipe) createMeetingRoomDto: CreateMeetingRoomDto) {
    return this.meetingRoomsService.create(createMeetingRoomDto);
  }

  @Get()
  findAll() {
    return this.meetingRoomsService.findAll();
  }

  @Get('available')
  getAvailableRooms(
    @Query('startTime') startTime: string,
    @Query('endTime') endTime: string,
  ) {
    return this.meetingRoomsService.getAvailableRooms(
      new Date(startTime),
      new Date(endTime),
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.meetingRoomsService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body(ValidationPipe) updateMeetingRoomDto: UpdateMeetingRoomDto,
  ) {
    return this.meetingRoomsService.update(+id, updateMeetingRoomDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.meetingRoomsService.remove(+id);
  }
}