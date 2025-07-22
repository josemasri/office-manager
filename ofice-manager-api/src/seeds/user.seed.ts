import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from '../entities/user.entity';
import { UserType } from '../entities/user-type.entity';

export class UserSeed {
  public static async run(dataSource: DataSource): Promise<void> {
    const userRepository = dataSource.getRepository(User);
    const userTypeRepository = dataSource.getRepository(UserType);

    // Check if data already exists
    const existingCount = await userRepository.count();
    if (existingCount > 0) {
      console.log('User seed data already exists, skipping...');
      return;
    }

    // Get user types
    const unlimitedType = await userTypeRepository.findOne({
      where: { name: 'Unlimited' },
    });
    const premiumType = await userTypeRepository.findOne({
      where: { name: 'Premium' },
    });

    if (!unlimitedType || !premiumType) {
      throw new Error('UserType data must be seeded before User data');
    }

    // Hash password for admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);

    const users = [
      {
        email: 'admin@coworking.com',
        passwordHash: hashedPassword,
        firstName: 'Admin',
        lastName: 'User',
        role: UserRole.ADMIN,
        userTypeId: unlimitedType.id,
        isActive: true,
      },
      {
        email: 'user@coworking.com',
        passwordHash: await bcrypt.hash('user123', 10),
        firstName: 'John',
        lastName: 'Doe',
        role: UserRole.USER,
        userTypeId: premiumType.id,
        isActive: true,
      },
    ];

    for (const userData of users) {
      const user = userRepository.create(userData);
      await userRepository.save(user);
    }

    console.log('User seed completed');
  }
}