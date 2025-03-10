// prisma/seed.ts

import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    // Create 10 Lecturers
    await prisma.lecturers.createMany({
        data: [
            {
                full_name: 'Alice Smith',
                faculty: 'CT',
                max_sessions_per_week: 4
            },
            {
                full_name: 'Bob Johnson',
                faculty: 'QS',
                max_sessions_per_week: 5
            },
            {
                full_name: 'Charlie Brown',
                faculty: 'CT',
                max_sessions_per_week: 3
            },
            {
                full_name: 'Diana Prince',
                faculty: 'QS',
                max_sessions_per_week: 6
            },
            {
                full_name: 'Eric Cartman',
                faculty: 'CT',
                max_sessions_per_week: 2
            },
            {
                full_name: 'Fiona Gallagher',
                faculty: 'QS',
                max_sessions_per_week: 3
            },
            {
                full_name: 'George Mason',
                faculty: 'CT',
                max_sessions_per_week: 5
            },
            {
                full_name: 'Hannah Wilson',
                faculty: 'QS',
                max_sessions_per_week: 4
            },
            {
                full_name: 'Isaac Newton',
                faculty: 'CT',
                max_sessions_per_week: 7
            },
            {
                full_name: 'Jane Eyre',
                faculty: 'QS',
                max_sessions_per_week: 5
            }
        ]
    })
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
