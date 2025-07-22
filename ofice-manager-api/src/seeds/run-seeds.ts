import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { UserTypeSeed } from './user-type.seed';
import { UserSeed } from './user.seed';
import { MeetingRoomSeed } from './meeting-room.seed';

dotenv.config();

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'office_user',
  password: process.env.DB_PASSWORD || 'office_password',
  database: process.env.DB_DATABASE || 'office_manager',
  entities: ['src/entities/*.entity.ts'],
  synchronize: false,
  logging: true,
});

async function runSeeds() {
  try {
    await AppDataSource.initialize();
    console.log('Database connection established');

    // Run seeds in order
    await UserTypeSeed.run(AppDataSource);
    await UserSeed.run(AppDataSource);
    await MeetingRoomSeed.run(AppDataSource);

    console.log('All seeds completed successfully');
  } catch (error) {
    console.error('Error running seeds:', error);
  } finally {
    await AppDataSource.destroy();
  }
}

runSeeds();