const cron = require('node-cron');
const Report = require('../models/Report');

/**
 * Initialize background jobs
 */
const initCronJobs = () => {
    // Run every hour to check for 24h old tickets
    cron.schedule('0 * * * *', async () => {
        console.log('🕒 Running cron job: Checking for delayed tickets to escalate...');
        
        try {
            const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
            
            // Find tickets that are 'open' or 'in-progress' and created more than 24h ago
            // and haven't been escalated yet.
            const delayedTickets = await Report.find({
                status: { $in: ['open', 'in-progress'] },
                createdAt: { $lt: twentyFourHoursAgo },
                isEscalated: { $ne: true }
            });

            if (delayedTickets.length > 0) {
                console.log(`🚀 Escalating ${delayedTickets.length} delayed tickets.`);
                
                for (const ticket of delayedTickets) {
                    ticket.status = 'escalated';
                    ticket.isEscalated = true;
                    ticket.escalatedAt = new Date();
                    ticket.priority = 'urgent';
                    await ticket.save();
                }
            } else {
                console.log('✅ No tickets require escalation at this time.');
            }
        } catch (error) {
            console.error('❌ Cron Job Error:', error);
        }
    });

    console.log('🛠️ Background cron jobs initialized.');
};

module.exports = { initCronJobs };
