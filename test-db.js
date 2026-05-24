// test-db.js
const prisma = require('./src/config/db');

async function main() {
  try {
    console.log('Testing connection to PostgreSQL...');
    
    // Coba ambil data user (meski masih kosong)
    const users = await prisma.user.findMany();
    
    console.log('✅ Connection successful! Found users:', users);
  } catch (error) {
    console.error('❌ Connection failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();