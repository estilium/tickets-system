import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Clean existing data
  await prisma.ticketMessage.deleteMany({});
  await prisma.ticketAttachment.deleteMany({});
  await prisma.ticket.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.category.deleteMany({});
  await prisma.ticketLocation.deleteMany({});

  // Create users
  const hashPassword = async (password: string) => {
    return bcrypt.hash(password, 10);
  };

  const adminPassword = await hashPassword('admin123');
  const agentPassword = await hashPassword('agent123');
  const requesterPassword = await hashPassword('requester123');

  const admin = await prisma.user.create({
    data: {
      email: 'admin@admin.com',
      username: 'admin',
      name: 'Walter',
      password: adminPassword,
      role: 'ADMIN',
    },
  });

  const agent1 = await prisma.user.create({
    data: {
      email: 'agent1@test.com',
      username: 'agent1',
      name: 'Agent One',
      password: agentPassword,
      role: 'AGENT',
    },
  });

  const agent2 = await prisma.user.create({
    data: {
      email: 'agent2@test.com',
      username: 'agent2',
      name: 'Agent Two',
      password: agentPassword,
      role: 'AGENT',
    },
  });

  const requester = await prisma.user.create({
    data: {
      email: 'requester@test.com',
      username: 'requester',
      name: 'John Requester',
      password: requesterPassword,
      role: 'REQUESTER',
    },
  });

  // Create categories
  const cat1 = await prisma.category.create({
    data: { name: 'Bug Report' },
  });

  const cat2 = await prisma.category.create({
    data: { name: 'Feature Request' },
  });

  const cat3 = await prisma.category.create({
    data: { name: 'General Support' },
  });

  await prisma.ticketLocation.createMany({
    data: [
      { name: 'Oficina General', order: 0 },
      { name: 'Oficina Inyección', order: 1 },
      { name: 'Oficina Pintura', order: 2 },
      { name: 'Pintura', order: 3 },
      { name: 'Inyección', order: 4 },
      { name: 'Embarques', order: 5 },
      { name: 'almacen', order: 6 },
      { name: 'moldes', order: 7 },
      { name: 'HR', order: 8 },
      { name: 'Enfermería', order: 9 },
      { name: 'Ensamble', order: 10 },
    ],
  });

  console.log('✅ Database seeded successfully!');
  console.log('\n📋 Created Users:');
  console.log(`  Admin: ${admin.email} (ID: ${admin.id})`);
  console.log(`  Agent 1: ${agent1.email} (ID: ${agent1.id})`);
  console.log(`  Agent 2: ${agent2.email} (ID: ${agent2.id})`);
  console.log(`  Requester: ${requester.email} (ID: ${requester.id})`);
  console.log('\n📂 Created Categories:');
  console.log(`  ${cat1.name} | ${cat2.name} | ${cat3.name}`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
