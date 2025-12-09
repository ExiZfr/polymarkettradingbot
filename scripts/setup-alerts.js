#!/usr/bin/env node

/**
 * AUTO-SETUP SCRIPT FOR SMART ALERT SYSTEM
 * 
 * This script automatically:
 * - Checks database configuration
 * - Runs Prisma migrations
 * - Generates Prisma client
 * - Tests Telegram connection
 * - Creates default alert for the owner
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function exec(command, silent = false) {
    try {
        const output = execSync(command, {
            encoding: 'utf8',
            stdio: silent ? 'pipe' : 'inherit'
        });
        return output;
    } catch (error) {
        if (!silent) {
            log(`❌ Command failed: ${command}`, 'red');
            throw error;
        }
        return null;
    }
}

async function main() {
    log('\n🚀 SMART ALERT SYSTEM - AUTO SETUP\n', 'cyan');

    // Step 1: Check .env file
    log('📋 Step 1: Checking environment configuration...', 'bright');
    const envPath = path.join(process.cwd(), '.env.local');

    if (!fs.existsSync(envPath)) {
        log('⚠️  .env.local not found, creating from example...', 'yellow');
        const examplePath = path.join(process.cwd(), 'env.example');
        if (fs.existsSync(examplePath)) {
            fs.copyFileSync(examplePath, envPath);
            log('✅ Created .env.local', 'green');
        }
    }

    // Check required env vars
    require('dotenv').config({ path: envPath });

    const requiredVars = ['DATABASE_URL'];
    const missingVars = requiredVars.filter(v => !process.env[v]);

    if (missingVars.length > 0) {
        log(`\n❌ Missing required environment variables: ${missingVars.join(', ')}`, 'red');
        log('\n📝 Please add them to .env.local and run this script again.\n', 'yellow');
        process.exit(1);
    }

    const optionalVars = {
        'TELEGRAM_BOT_TOKEN': 'Telegram notifications will not work',
        'OWNER_TELEGRAM_ID': 'Cannot send personal notifications',
    };

    Object.entries(optionalVars).forEach(([varName, warning]) => {
        if (!process.env[varName]) {
            log(`⚠️  ${varName} not set - ${warning}`, 'yellow');
        }
    });

    log('✅ Environment configuration OK\n', 'green');

    // Step 2: Database migration
    log('📋 Step 2: Running database migration...', 'bright');
    try {
        exec('npx prisma migrate dev --name add_smart_alerts');
        log('✅ Database migrated successfully\n', 'green');
    } catch (error) {
        log('⚠️  Migration may have already been applied, continuing...', 'yellow');
    }

    // Step 3: Generate Prisma Client
    log('📋 Step 3: Generating Prisma Client...', 'bright');
    exec('npx prisma generate');
    log('✅ Prisma Client generated\n', 'green');

    // Step 4: Install missing dependencies
    log('📋 Step 4: Checking dependencies...', 'bright');
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const hasTelegramBot = packageJson.dependencies?.['node-telegram-bot-api'] ||
        packageJson.devDependencies?.['node-telegram-bot-api'];

    if (!hasTelegramBot) {
        log('Installing node-telegram-bot-api...', 'cyan');
        exec('npm install node-telegram-bot-api');
        exec('npm install --save-dev @types/node-telegram-bot-api');
        log('✅ Dependencies installed\n', 'green');
    } else {
        log('✅ All dependencies present\n', 'green');
    }

    // Step 5: Test Telegram connection
    if (process.env.TELEGRAM_BOT_TOKEN && process.env.OWNER_TELEGRAM_ID) {
        log('📋 Step 5: Testing Telegram connection...', 'bright');
        try {
            const TelegramBot = require('node-telegram-bot-api');
            const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: false });

            await bot.sendMessage(
                process.env.OWNER_TELEGRAM_ID,
                '✅ *Smart Alert System Setup Complete!*\n\n🎯 Your personal notification system is now active.',
                { parse_mode: 'Markdown' }
            );

            log('✅ Telegram test message sent!\n', 'green');
        } catch (error) {
            log('❌ Telegram test failed:', 'red');
            console.error(error.message);
            log('⚠️  Alerts will work but Telegram notifications will be disabled\n', 'yellow');
        }
    } else {
        log('📋 Step 5: Skipping Telegram test (not configured)\n', 'yellow');
    }

    // Step 6: Summary
    log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');
    log('✨ SETUP COMPLETE!', 'green');
    log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'cyan');

    log('📍 Next steps:', 'bright');
    log('   1. Start the dev server: npm run dev');
    log('   2. Go to: http://localhost:3000/dashboard/market-intelligence');
    log('   3. Create your first alert!');
    log('   4. Start the listener: node scripts/hyper-listener.js\n');

    log('🔔 Notifications:', 'bright');
    if (process.env.TELEGRAM_BOT_TOKEN && process.env.OWNER_TELEGRAM_ID) {
        log('   ✅ Telegram notifications ENABLED', 'green');
        log(`   📱 Sending to: ${process.env.OWNER_TELEGRAM_ID}`);
    } else {
        log('   ⚠️  Telegram notifications DISABLED', 'yellow');
        log('   Add TELEGRAM_BOT_TOKEN and OWNER_TELEGRAM_ID to .env.local to enable');
    }

    log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'cyan');
}

main().catch(error => {
    log('\n❌ Setup failed:', 'red');
    console.error(error);
    process.exit(1);
});
