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
    
    const subjects = await prisma.subject.findMany({
      select: {
        id: true,
        name: true
      }
    });
    
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkProfiles(); 