import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { UserType } from '../entities/user-type.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserType)
    private readonly userTypeRepository: Repository<UserType>,
  ) {}

  async findAll(): Promise<User[]> {
    return this.userRepository.find({
      relations: ['userType'],
      where: { isActive: true },
    });
  }

  async findOne(id: number): Promise<User | null> {
    return this.userRepository.findOne({
      where: { id },
      relations: ['userType'],
    });
  }

  async getUserTypes(): Promise<UserType[]> {
    return this.userTypeRepository.find();
  }

  async getWeeklyUsage(userId: number): Promise<any> {
    const query = `
      SELECT 
        u.id as user_id,
        u.email,
        u.first_name,
        u.last_name,
        ut.weekly_hours_limit,
        COALESCE(SUM(r.total_hours), 0) as hours_used_this_week,
        ut.weekly_hours_limit - COALESCE(SUM(r.total_hours), 0) as hours_remaining
      FROM users u
      LEFT JOIN user_types ut ON u.user_type_id = ut.id
      LEFT JOIN reservations r ON u.id = r.user_id 
        AND r.start_time >= date_trunc('week', CURRENT_DATE)
        AND r.start_time < date_trunc('week', CURRENT_DATE) + INTERVAL '1 week'
        AND r.status = 'confirmed'
      WHERE u.id = $1 AND u.is_active = true
      GROUP BY u.id, u.email, u.first_name, u.last_name, ut.weekly_hours_limit;
    `;

    const result = await this.userRepository.query(query, [userId]);
    return result[0] || null;
  }
}