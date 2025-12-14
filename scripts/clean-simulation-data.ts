import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanSimulationData() {
    console.log('🧹 Cleaning simulation data from radar...');

    try {
        // Delete all transactions where tx_hash starts with "sim_"
        const result = await prisma.radarTransaction.deleteMany({
            where: {
                txHash: {
                    startsWith: 'sim_'
                }
            }
        });

        console.log(`✅ Deleted ${result.count} simulation transactions`);
        console.log('🎉 Radar is now clean! Only real whale detections will remain.');

    } catch (error) {
        console.error('❌ Error cleaning simulation data:', error);
    } finally {
        await prisma.$disconnect();
    }
}

cleanSimulationData();
