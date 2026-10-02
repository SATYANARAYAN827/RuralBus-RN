import { withSystemContext } from '../index.js';
import * as schema from '../schema/index.js';
import { eq } from 'drizzle-orm';
import { setupOperator, getOperatorConfig } from './setup-demo-travel.js';

export async function seed() {
  console.log('🌱 Starting Rural Bus database seed (All Core & Demo Roles)...');

  // 1. Argon2id hash for 'Password123!' (OWASP recommended parameters: m=65536, t=3, p=4)
  const defaultPasswordHash =
    '$argon2id$v=19$m=65536,t=3,p=4$hK5lSeRKF+xm0QpoG1155w$2D8MA2a6EQhW6tM3SmC6F0ns11VmZ3jMOR5Jb1iktXs';

  const demoAccounts = [
    {
      phone: '9876500000',
      fullName: 'State Transport Super Admin',
      email: 'superadmin@ruralbus.gov.in',
      role: 'PLATFORM_ADMIN' as const,
    },
    {
      phone: '9861465410',
      fullName: 'Satya Demo Travel',
      email: 'satya.travels@ruralbus.demo',
      role: 'OPERATOR_ADMIN' as const,
    },
    {
      phone: '9876543202',
      fullName: 'Bishnu Charan Sahoo',
      email: 'driver.bishnu@ruralbus.demo',
      role: 'DRIVER' as const,
    },
    {
      phone: '9876543203',
      fullName: 'Demo Conductor',
      email: 'conductor.demo@ruralbus.demo',
      role: 'CONDUCTOR' as const,
    },
    {
      phone: '7381319957',
      fullName: 'Rahul Sharma',
      email: 'passenger.rahul@ruralbus.demo',
      role: 'PASSENGER' as const,
    },
  ];

  await withSystemContext(async (tx) => {
    for (const acc of demoAccounts) {
      const [existing] = await tx
        .select()
        .from(schema.users)
        .where(eq(schema.users.phone, acc.phone))
        .limit(1);

      if (existing) {
        await tx
          .update(schema.users)
          .set({
            fullName: acc.fullName,
            email: acc.email,
            role: acc.role,
            isActive: true,
            mustChangePassword: false,
            phoneVerified: true,
            passwordHash: defaultPasswordHash,
            developmentPassword: process.env.NODE_ENV === 'production' ? null : 'Password123!',
            updatedAt: new Date(),
          })
          .where(eq(schema.users.id, existing.id));
        console.log(`✅ User updated: ${acc.role} (${acc.phone})`);
      } else {
        await tx.insert(schema.users).values({
          fullName: acc.fullName,
          email: acc.email,
          phone: acc.phone,
          role: acc.role,
          passwordHash: defaultPasswordHash,
          developmentPassword: process.env.NODE_ENV === 'production' ? null : 'Password123!',
          isActive: true,
          mustChangePassword: false,
          phoneVerified: true,
        });
        console.log(`✅ User created: ${acc.role} (${acc.phone})`);
      }
    }
  });

  // Provision Demo Travel operator, fleet buses, routes, and crew assignments
  try {
    const opConfig = getOperatorConfig();
    await setupOperator(opConfig);
  } catch (err: any) {
    console.warn('⚠️ setupOperator note:', err?.message || err);
  }

  console.log('🎉 Rural Bus database seed finished successfully with all active demo roles.');
}

// Execute seed if executed directly
if (process.argv[1]?.includes('seeds') || process.argv[1]?.includes('seed')) {
  seed()
    .then(() => {
      console.log('Seed completed successfully.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('❌ Seed failed:', err);
      process.exit(1);
    });
}
