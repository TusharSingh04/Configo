import { getDb, getUsersCollection } from '../src/db/mongo.js';
import { generateSalt, hashPassword } from '../src/utils/password.js';
import { UserDoc } from '../src/models/User.js';

async function seed() {
  try {
    // Ensure DB connection
    await getDb();
    const users = await getUsersCollection();

    // Admin user
    const adminEmail = 'admin@featureflags.local';
    const adminPassword = 'admin123';
    const adminExists = await users.findOne({ email: adminEmail });

    if (!adminExists) {
      const salt = generateSalt();
      const passwordHash = hashPassword(adminPassword, salt);
      const adminDoc: UserDoc = {
        email: adminEmail,
        role: 'admin',
        requestedRole: 'admin',
        status: 'approved',
        passwordHash,
        salt,
        createdAt: new Date(),
        approvedAt: new Date(),
        approvedBy: 'system',
      };
      await users.insertOne(adminDoc);
      console.log(`✅ Admin user created: ${adminEmail} / ${adminPassword}`);
    } else {
      console.log(`⚠️  Admin user already exists: ${adminEmail}`);
    }

    // Gmail test user (pending approval)
    const gmailEmail = 'tusharsingh00769@gmail.com';
    const gmailExists = await users.findOne({ email: gmailEmail });

    if (!gmailExists) {
      const gmailDoc: UserDoc = {
        email: gmailEmail,
        role: 'viewer',
        requestedRole: 'viewer',
        status: 'pending',
        // No password/salt for Gmail user (social login)
        createdAt: new Date(),
      };
      await users.insertOne(gmailDoc);
      console.log(`✅ Gmail test user created: ${gmailEmail} (pending approval)`);
    } else {
      console.log(`⚠️  Gmail user already exists: ${gmailEmail}`);
    }

    console.log('\n✨ Seed complete!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  }
}

seed();
