const axios = require('axios');
const fs = require('fs');
const path = require('path');

const apiKey = "8265bd1679663a7ea12ac168da84d2e8";

const movies = [
    { title: "Inception", year: 2010 },
    { title: "The Dark Knight", year: 2008 },
    { title: "Interstellar", year: 2014 },
    { title: "Oppenheimer", year: 2023 },
    { title: "Barbie", year: 2023 },
    { title: "Dune: Part Two", year: 2024 },
    { title: "Avatar: The Way of Water", year: 2022 },
    { title: "Kantara", year: 2022 },
    { title: "K.G.F: Chapter 2", year: 2022 },
    { title: "RRR", year: 2022 },
    { title: "Pushpa: The Rise", year: 2021 },
    { title: "Jailer", year: 2023 },
    { title: "Pathaan", year: 2023 },
    { title: "Jawan", year: 2023 },
    { title: "Spider-Man: Across the Spider-Verse", year: 2023 },
    { title: "Coco", year: 2017 },
    { title: "The Lion King", year: 2019 },
    { title: "Gladiator II", year: 2024 },
    { title: "Avengers: Secret Wars", year: 2027 },
    { title: "Kalki 2898 AD", year: 2024 },
    { title: "Pushpa 2: The Rule", year: 2024 },
    { title: "Toxic", year: 2025 },
    { title: "Singham Again", year: 2024 },
    { title: "Thug Life", year: 2025 },
    { title: "Coolie", year: 2025 },
    { title: "Kantaram: Chapter 1", year: 2025 },
    { title: "Moana 2", year: 2024 },
    { title: "Mufasa: The Lion King", year: 2024 }
];

async function fetchMetadata() {
    const results = [];
    for (const m of movies) {
        console.log(`Searching TMDB for ${m.title}...`);
        try {
            const url = `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${encodeURIComponent(m.title)}&language=en-US&page=1`;
            const res = await axios.get(url);
            const list = res.data.results || [];
            
            // Find best match by title and year proximity
            let best = list[0];
            if (m.year) {
                const yearMatch = list.find(item => item.release_date && item.release_date.startsWith(String(m.year)));
                if (yearMatch) best = yearMatch;
            }
            
            if (best) {
                results.push({
                    title: m.title,
                    id: String(best.id),
                    poster_path: best.poster_path || '',
                    backdrop_path: best.backdrop_path || ''
                });
                console.log(`  -> Found ID: ${best.id}, Poster: ${best.poster_path}`);
            } else {
                results.push({
                    title: m.title,
                    id: `F-${results.length + 1}`,
                    poster_path: '',
                    backdrop_path: ''
                });
                console.log(`  -> NO MATCH FOUND for ${m.title}`);
            }
        } catch (err) {
            console.error(`  -> Failed search for ${m.title}:`, err.message);
            results.push({
                title: m.title,
                id: `F-${results.length + 1}`,
                poster_path: '',
                backdrop_path: ''
            });
        }
        // Small delay to be polite
        await new Promise(r => setTimeout(r, 200));
    }
    
    fs.writeFileSync(path.join(__dirname, 'tmdb_mapping.json'), JSON.stringify(results, null, 2));
    console.log("Mapping saved to tmdb_mapping.json!");
}

fetchMetadata();
