import { PartialType } from '@nestjs/mapped-types';
import { CreateMeetingRoomDto } from './create-meeting-room.dto';

export class UpdateMeetingRoomDto extends PartialType(CreateMeetingRoomDto) {}