const { runSync } = require('../server/services/movieSyncService');

(async () => {
    try {
        console.log("Triggering runSync manually...");
        const result = await runSync();
        console.log("Result:", result);
        process.exit(0);
    } catch (err) {
        console.error("Error during manual sync run:", err);
        process.exit(1);
    }
})();
