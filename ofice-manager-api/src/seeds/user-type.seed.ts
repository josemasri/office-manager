import { DataSource } from 'typeorm';
import { UserType } from '../entities/user-type.entity';

export class UserTypeSeed {
  public static async run(dataSource: DataSource): Promise<void> {
    const repository = dataSource.getRepository(UserType);

    // Check if data already exists
    const existingCount = await repository.count();
    if (existingCount > 0) {
      console.log('UserType seed data already exists, skipping...');
      return;
    }

    const userTypes = [
      {
        name: 'Basic',
        weeklyHoursLimit: 4,
        description: 'Basic membership with 4 hours per week',
      },
      {
        name: 'Premium',
        weeklyHoursLimit: 10,
        description: 'Premium membership with 10 hours per week',
      },
      {
        name: 'VIP',
        weeklyHoursLimit: 20,
        description: 'VIP membership with 20 hours per week',
      },
      {
        name: 'Unlimited',
        weeklyHoursLimit: 999,
        description: 'Unlimited access for special members',
      },
    ];

    for (const userTypeData of userTypes) {
      const userType = repository.create(userTypeData);
      await repository.save(userType);
    }

    console.log('UserType seed completed');
  }
}