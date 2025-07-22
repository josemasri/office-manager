import { DataSource } from 'typeorm';
import { MeetingRoom } from '../entities/meeting-room.entity';

export class MeetingRoomSeed {
  public static async run(dataSource: DataSource): Promise<void> {
    const repository = dataSource.getRepository(MeetingRoom);

    // Check if data already exists
    const existingCount = await repository.count();
    if (existingCount > 0) {
      console.log('MeetingRoom seed data already exists, skipping...');
      return;
    }

    const meetingRooms = [
      {
        name: 'Sala Ejecutiva',
        description: 'Sala moderna para reuniones ejecutivas',
        capacity: 8,
        equipment: ['Proyector', 'TV 65"', 'Pizarra', 'WiFi'],
        hourlyRate: 0,
        isActive: true,
      },
      {
        name: 'Sala Creativa',
        description: 'Espacio abierto para sesiones de brainstorming',
        capacity: 12,
        equipment: ['Pizarra grande', 'Materiales de arte', 'WiFi', 'Sonido'],
        hourlyRate: 0,
        isActive: true,
      },
      {
        name: 'Sala Privada',
        description: 'Sala pequeña para reuniones confidenciales',
        capacity: 4,
        equipment: ['WiFi', 'Teléfono'],
        hourlyRate: 0,
        isActive: true,
      },
      {
        name: 'Auditorio',
        description: 'Espacio grande para presentaciones',
        capacity: 50,
        equipment: ['Proyector', 'Sistema de sonido', 'Micrófono', 'WiFi'],
        hourlyRate: 0,
        isActive: true,
      },
    ];

    for (const roomData of meetingRooms) {
      const room = repository.create(roomData);
      await repository.save(room);
    }

    console.log('MeetingRoom seed completed');
  }
}