import { hashPassword } from '../services/password.service.js';
import { db, withSystemContext, users } from '@ruralbus/database';
import { eq } from 'drizzle-orm';

async function main() {
  const phone = process.argv[2] || '9876543999';
  const newPass = process.argv[3] || 'Admin@123';

  console.log(`Setting password for ${phone} to ${newPass}...`);
  const hash = await hashPassword(newPass);
  console.log('Argon2id Hash:', hash);

  await withSystemContext(async (tx) => {
    const updated = await tx
      .update(users)
      .set({
        passwordHash: hash,
        developmentPassword: newPass,
        isActive: true,
        mustChangePassword: false,
        updatedAt: new Date(),
      })
      .where(eq(users.phone, phone))
      .returning({ id: users.id, phone: users.phone, fullName: users.fullName, role: users.role });

    console.log('Updated user:', updated);
  });

  console.log('Done!');
  process.exit(0);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
