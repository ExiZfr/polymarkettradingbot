// Quick script to delete old "Unknown Market" transactions
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanDatabase() {
    try {
        console.log('🗑️ Cleaning old transactions...');

        const result = await prisma.whaleTransaction.deleteMany({
            where: {
                OR: [
                    { marketQuestion: 'Unknown Market' },
                    { marketQuestion: { contains: 'Unknown' } },
                    { marketSlug: '' },
                    { marketSlug: null }
                ]
            }
        });

        console.log(`✅ Deleted ${result.count} old transactions`);
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

cleanDatabase();
