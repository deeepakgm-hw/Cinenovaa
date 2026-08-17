const axios = require('axios');

(async () => {
    try {
        const url = "https://image.tmdb.org/t/p/w500/8IB2e4R45TdURH6haZqQz5H0sVv.jpg";
        console.log("Fetching test url:", url);
        const res = await axios.get(url, { timeout: 5000 });
        console.log("Success! Status:", res.status);
    } catch (err) {
        console.error("Error code:", err.code);
        console.error("Error message:", err.message);
        if (err.response) {
            console.error("Response status:", err.response.status);
            console.error("Response headers:", err.response.headers);
        }
    }
})();
