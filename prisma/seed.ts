import { PrismaClient, Role, MissionStatus, LicenseType } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const adminPassword = await bcrypt.hash('admin123', 10)
  await prisma.user.upsert({
    where: { email: 'admin@skillzhub.com' },
    update: {},
    create: {
      email: 'admin@skillzhub.com',
      name: 'Admin User',
      password_hash: adminPassword,
      role: Role.ADMIN,
    },
  })

  const companyPassword = await bcrypt.hash('company123', 10)
  const company1 = await prisma.user.upsert({
    where: { email: 'tesla@company.com' },
    update: {},
    create: {
      email: 'tesla@company.com',
      name: 'Tesla Robotics',
      password_hash: companyPassword,
      role: Role.COMPANY,
    },
  })

  const creatorPassword = await bcrypt.hash('creator123', 10)
  await prisma.user.upsert({
    where: { email: 'creator@example.com' },
    update: {},
    create: {
      email: 'creator@example.com',
      name: 'FPV Pro',
      password_hash: creatorPassword,
      role: Role.CREATOR,
    },
  })

  const existingMission = await prisma.mission.findFirst()
  if (!existingMission) {
    await prisma.mission.create({
      data: {
        company_id: company1.id,
        title: 'Kitchen manipulation tasks',
        description: 'First person POV picking up objects in a kitchen environment',
        task_type: 'manipulation',
        environment_type: 'kitchen',
        constraints: { lighting: 'well-lit', objects: ['cup', 'plate', 'knife'] },
        required_resolution: '1080p',
        required_fps: 60,
        min_duration_seconds: 30,
        max_duration_seconds: 300,
        price_per_minute: 1.50,
        license_type: LicenseType.EXCLUSIVE,
        status: MissionStatus.OPEN
      }
    })

    await prisma.mission.create({
      data: {
        company_id: company1.id,
        title: 'Garage navigation and tool use',
        description: 'Navigating through a cluttered garage and using a power drill',
        task_type: 'navigation_and_tool_use',
        environment_type: 'garage',
        constraints: { lighting: 'varied', objects: ['drill', 'screws', 'wood'] },
        required_resolution: '1080p',
        required_fps: 30,
        min_duration_seconds: 60,
        max_duration_seconds: 600,
        price_per_minute: 2.00,
        license_type: LicenseType.NON_EXCLUSIVE,
        status: MissionStatus.OPEN
      }
    })
  }

  console.log('Seeding finished.')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
