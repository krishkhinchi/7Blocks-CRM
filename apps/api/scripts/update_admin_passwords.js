const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');

// Load production environment if available, otherwise local
if (process.env.VERCEL_ENV === 'production' || process.argv.includes('--production')) {
  dotenv.config({ path: path.resolve(__dirname, '../.env.production') });
} else {
  dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
}

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.POSTGRES_PRISMA_URL || process.env.DATABASE_URL
    }
  }
});

function generateSecurePassword(length = 20) {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // exclude ambiguous I, O
  const lower = 'abcdefghjkmnpqrstuvwxyz'; // exclude ambiguous l, o
  const numbers = '23456789'; // exclude 0, 1
  const special = '!@#$%^&*()-_=+[]{}|;:,.<>?';

  // Ensure minimum character type representation
  let pwd = [
    upper[crypto.randomInt(0, upper.length)],
    upper[crypto.randomInt(0, upper.length)],
    lower[crypto.randomInt(0, lower.length)],
    lower[crypto.randomInt(0, lower.length)],
    numbers[crypto.randomInt(0, numbers.length)],
    numbers[crypto.randomInt(0, numbers.length)],
    special[crypto.randomInt(0, special.length)],
    special[crypto.randomInt(0, special.length)]
  ];

  const allChars = upper + lower + numbers + special;
  while (pwd.length < length) {
    pwd.push(allChars[crypto.randomInt(0, allChars.length)]);
  }

  // Fisher-Yates shuffle
  for (let i = pwd.length - 1; i > 0; i--) {
    const j = crypto.randomInt(0, i + 1);
    [pwd[i], pwd[j]] = [pwd[j], pwd[i]];
  }

  return pwd.join('');
}

async function run() {
  console.log('Connecting to database...');
  const users = await prisma.user.findMany({
    where: { role: 'ADMIN' },
    orderBy: { createdAt: 'asc' }
  });

  console.log(`Found ${users.length} Admin users.`);
  if (users.length === 0) {
    console.error('No admin users found!');
    return;
  }

  const generatedCredentials = [];
  const usedPasswords = new Set();

  for (let i = 0; i < users.length; i++) {
    const user = users[i];
    let newPassword = generateSecurePassword(20);
    while (usedPasswords.has(newPassword)) {
      newPassword = generateSecurePassword(20);
    }
    usedPasswords.add(newPassword);

    // Hash password with bcryptjs
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Update ONLY passwordHash in database (preserves role, name, email, avatar, etc.)
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        isActive: true // ensure active
      }
    });

    // Verify hash matches
    const isMatch = await bcrypt.compare(newPassword, passwordHash);
    if (!isMatch) {
      throw new Error(`Hash verification failed for user ${user.email}`);
    }

    generatedCredentials.push({
      index: i + 1,
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      password: newPassword
    });
  }

  console.log('Successfully updated all Admin passwords in database.');
  return generatedCredentials;
}

if (require.main === module) {
  run()
    .then(creds => {
      console.log('CREDENTIALS_GENERATED:');
      console.log(JSON.stringify(creds, null, 2));
    })
    .catch(console.error)
    .finally(() => prisma.$disconnect());
}

module.exports = { run, generateSecurePassword };
