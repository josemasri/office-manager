import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1674123456789 implements MigrationInterface {
  name = 'InitialSchema1674123456789';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create user_types table
    await queryRunner.query(`
      CREATE TABLE "user_types" (
        "id" SERIAL NOT NULL,
        "name" character varying(50) NOT NULL,
        "weekly_hours_limit" integer NOT NULL,
        "description" text,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_user_types_name" UNIQUE ("name"),
        CONSTRAINT "PK_user_types_id" PRIMARY KEY ("id")
      )
    `);

    // Create users table
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" SERIAL NOT NULL,
        "email" character varying NOT NULL,
        "password_hash" character varying NOT NULL,
        "first_name" character varying(100) NOT NULL,
        "last_name" character varying(100) NOT NULL,
        "role" character varying NOT NULL DEFAULT 'user',
        "user_type_id" integer,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_users_email" UNIQUE ("email"),
        CONSTRAINT "CHK_users_role" CHECK ("role" IN ('admin', 'user')),
        CONSTRAINT "PK_users_id" PRIMARY KEY ("id")
      )
    `);

    // Create meeting_rooms table
    await queryRunner.query(`
      CREATE TABLE "meeting_rooms" (
        "id" SERIAL NOT NULL,
        "name" character varying(100) NOT NULL,
        "description" text,
        "capacity" integer NOT NULL,
        "equipment" text array NOT NULL DEFAULT '{}',
        "hourly_rate" numeric(10,2) NOT NULL DEFAULT '0',
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_meeting_rooms_id" PRIMARY KEY ("id")
      )
    `);

    // Create reservations table
    await queryRunner.query(`
      CREATE TABLE "reservations" (
        "id" SERIAL NOT NULL,
        "user_id" integer NOT NULL,
        "room_id" integer NOT NULL,
        "start_time" TIMESTAMP NOT NULL,
        "end_time" TIMESTAMP NOT NULL,
        "status" character varying NOT NULL DEFAULT 'confirmed',
        "purpose" text,
        "total_hours" numeric(5,2) NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "CHK_reservations_status" CHECK ("status" IN ('confirmed', 'cancelled', 'completed')),
        CONSTRAINT "PK_reservations_id" PRIMARY KEY ("id")
      )
    `);

    // Add foreign key constraints
    await queryRunner.query(`
      ALTER TABLE "users" ADD CONSTRAINT "FK_users_user_type_id" 
      FOREIGN KEY ("user_type_id") REFERENCES "user_types"("id") ON DELETE SET NULL ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "reservations" ADD CONSTRAINT "FK_reservations_user_id" 
      FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "reservations" ADD CONSTRAINT "FK_reservations_room_id" 
      FOREIGN KEY ("room_id") REFERENCES "meeting_rooms"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    // Create indexes
    await queryRunner.query(`CREATE INDEX "IDX_users_email" ON "users" ("email")`);
    await queryRunner.query(`CREATE INDEX "IDX_users_role" ON "users" ("role")`);
    await queryRunner.query(`CREATE INDEX "IDX_reservations_user_id" ON "reservations" ("user_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_reservations_room_id" ON "reservations" ("room_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_reservations_start_time" ON "reservations" ("start_time")`);
    await queryRunner.query(`CREATE INDEX "IDX_reservations_date_range" ON "reservations" ("start_time", "end_time")`);

    // Create function to update updated_at timestamp
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = CURRENT_TIMESTAMP;
          RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);

    // Create triggers to automatically update updated_at
    await queryRunner.query(`
      CREATE TRIGGER update_user_types_updated_at BEFORE UPDATE ON "user_types" 
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `);

    await queryRunner.query(`
      CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON "users" 
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `);

    await queryRunner.query(`
      CREATE TRIGGER update_meeting_rooms_updated_at BEFORE UPDATE ON "meeting_rooms" 
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `);

    await queryRunner.query(`
      CREATE TRIGGER update_reservations_updated_at BEFORE UPDATE ON "reservations" 
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `);

    // Create view for weekly hours usage
    await queryRunner.query(`
      CREATE VIEW weekly_hours_usage AS
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
      WHERE u.role = 'user' AND u.is_active = true
      GROUP BY u.id, u.email, u.first_name, u.last_name, ut.weekly_hours_limit;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop view
    await queryRunner.query(`DROP VIEW IF EXISTS weekly_hours_usage`);

    // Drop triggers
    await queryRunner.query(`DROP TRIGGER IF EXISTS update_reservations_updated_at ON "reservations"`);
    await queryRunner.query(`DROP TRIGGER IF EXISTS update_meeting_rooms_updated_at ON "meeting_rooms"`);
    await queryRunner.query(`DROP TRIGGER IF EXISTS update_users_updated_at ON "users"`);
    await queryRunner.query(`DROP TRIGGER IF EXISTS update_user_types_updated_at ON "user_types"`);

    // Drop function
    await queryRunner.query(`DROP FUNCTION IF EXISTS update_updated_at_column()`);

    // Drop indexes
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_reservations_date_range"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_reservations_start_time"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_reservations_room_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_reservations_user_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_users_role"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_users_email"`);

    // Drop foreign key constraints
    await queryRunner.query(`ALTER TABLE "reservations" DROP CONSTRAINT IF EXISTS "FK_reservations_room_id"`);
    await queryRunner.query(`ALTER TABLE "reservations" DROP CONSTRAINT IF EXISTS "FK_reservations_user_id"`);
    await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "FK_users_user_type_id"`);

    // Drop tables
    await queryRunner.query(`DROP TABLE IF EXISTS "reservations"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "meeting_rooms"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "user_types"`);
  }
}