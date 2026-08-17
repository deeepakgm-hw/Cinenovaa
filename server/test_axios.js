const axios = require('axios');

(async () => {
    try {
        const url = "https://image.tmdb.org/t/p/w500/edv5CZvWj09upOsy2Y6IwDhK8bt.jpg";
        console.log("Fetching test url:", url);
        const res = await axios.get(url, { timeout: 5000 });
        console.log("Success! Status:", res.status);
    } catch (err) {
        console.error("Error message:", err.message);
    }
})();
