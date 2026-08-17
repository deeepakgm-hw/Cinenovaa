const axios = require('axios');

(async () => {
    try {
        const apiKey = "8265bd1679663a7ea12ac168da84d2e8";
        const query = "Inception";
        const url = `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${encodeURIComponent(query)}&language=en-US&page=1`;
        console.log("Searching TMDB...");
        const res = await axios.get(url);
        console.log("Success! Results count:", res.data.results.length);
        if (res.data.results.length > 0) {
            console.log("First result:", {
                id: res.data.results[0].id,
                title: res.data.results[0].title,
                poster_path: res.data.results[0].poster_path,
                backdrop_path: res.data.results[0].backdrop_path
            });
        }
    } catch (err) {
        console.error("Error:", err.message);
    }
})();
