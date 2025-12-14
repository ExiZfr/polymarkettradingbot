import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanWhaleProfiles() {
    console.log('🧹 Cleaning whale profiles with no transactions...');

    try {
        // Find whale profiles that have zero transactions
        const orphanedProfiles = await prisma.whaleProfile.findMany({
            include: {
                _count: {
                    select: { transactions: true }
                }
            }
        });

        const toDelete = orphanedProfiles.filter(p => p._count.transactions === 0);

        console.log(`Found ${toDelete.length} whale profiles with no transactions`);

        // Delete them
        if (toDelete.length > 0) {
            await prisma.whaleProfile.deleteMany({
                where: {
                    id: {
                        in: toDelete.map(p => p.id)
                    }
                }
            });

            console.log(`✅ Deleted ${toDelete.length} orphaned whale profiles`);
        }

        console.log('🎉 Whale profiles cleaned!');

    } catch (error) {
        console.error('❌ Error cleaning whale profiles:', error);
    } finally {
        await prisma.$disconnect();
    }
}

cleanWhaleProfiles();
