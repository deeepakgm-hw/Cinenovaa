const axios = require('axios');

(async () => {
    try {
        const apiKey = "8265bd1679663a7ea12ac168da84d2e8";
        const url = `https://api.themoviedb.org/3/movie/1083637?api_key=${apiKey}&language=en-US`;
        const res = await axios.get(url);
        console.log("Kantara: Chapter 1 Details:", {
            id: res.data.id,
            poster_path: res.data.poster_path,
            backdrop_path: res.data.backdrop_path
        });
    } catch (err) {
        console.error("Error:", err.message);
    }
})();
