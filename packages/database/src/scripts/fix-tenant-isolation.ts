import { withSystemContext, users, operators, operatorMembers } from '../index.js';
import { eq, or, inArray } from 'drizzle-orm';

async function fixTenantIsolation() {
  console.log('🔄 Fixing operator and tenant isolation in database...');

  await withSystemContext(async (tx) => {
    // 1. Find or create dedicated operator for Test Owner (9876543999)
    let [testOp] = await tx
      .select()
      .from(operators)
      .where(eq(operators.contactPhone, '9876543999'))
      .limit(1);

    if (!testOp) {
      const [created] = await tx
        .insert(operators)
        .values({
          companyName: 'Test Owner Transit',
          businessCode: 'TEST-OWNER-01',
          contactPhone: '9876543999',
          contactEmail: 'testowner@ruralbus.local',
          corridor: 'State Rural Corridor',
          status: 'ACTIVE',
        })
        .returning();
      testOp = created;
      console.log('✅ Created dedicated operator for Test Owner:', testOp.id);
    } else {
      console.log('ℹ️ Found existing operator for Test Owner:', testOp.id);
    }

    // 2. Link Test Owner user (9876543999) to Test Owner Transit ONLY
    const [testUser] = await tx
      .select()
      .from(users)
      .where(eq(users.phone, '9876543999'))
      .limit(1);

    if (testUser) {
      await tx.delete(operatorMembers).where(eq(operatorMembers.userId, testUser.id));
      await tx.insert(operatorMembers).values({
        userId: testUser.id,
        tenantId: testOp.id,
        role: 'OPERATOR_ADMIN',
        isActive: true,
      });
      console.log(`✅ Test Owner (${testUser.phone}) linked strictly to operator: ${testOp.companyName} (${testOp.id})`);
    }

    // 3. Remove other operator's staff from KSRTC South Telemetry if they don't belong there
    // For test operators, ensure each operator only has their own members
    const opList = await tx.select().from(operators);
    console.log(`ℹ️ Total operators in DB: ${opList.length}`);

    // Clean up duplicate memberships for other owner accounts
    const allOwners = await tx.select().from(users).where(eq(users.role, 'OPERATOR_ADMIN'));
    for (const owner of allOwners) {
      if (owner.phone === '9876543999') continue; // already handled
      // Find matching operator by phone
      if (owner.phone) {
        const [matchingOp] = await tx.select().from(operators).where(eq(operators.contactPhone, owner.phone)).limit(1);
        if (matchingOp) {
          await tx.delete(operatorMembers).where(eq(operatorMembers.userId, owner.id));
          await tx.insert(operatorMembers).values({
            userId: owner.id,
            tenantId: matchingOp.id,
            role: 'OPERATOR_ADMIN',
            isActive: true,
          });
        }
      }
    }

    // Also check staff created specifically for Test Owner
    const testOwnerStaff = await tx
      .select()
      .from(operatorMembers)
      .where(eq(operatorMembers.tenantId, testOp.id));
    console.log(`🎉 Test Owner Staff Count: ${testOwnerStaff.filter(s => s.role !== 'OPERATOR_ADMIN').length}`);
  });

  console.log('✅ Tenant isolation fix completed successfully.');
}

fixTenantIsolation()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Error fixing tenant isolation:', err);
    process.exit(1);
  });
