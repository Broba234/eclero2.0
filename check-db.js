const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkProfiles() {
  try {
    const profiles = await prisma.profiles.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        name: true
      }
    });
    
    console.log('Found profiles:', profiles);
    
    const subjects = await prisma.subject.findMany({
      select: {
        id: true,
        name: true
      }
    });
    
    console.log('Found subjects:', subjects);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkProfiles(); 