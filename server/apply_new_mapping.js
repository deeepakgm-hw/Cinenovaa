const fs = require('fs');
const path = require('path');

// TMDB verified mapping mapping details
const mappings = {
  "Inception": { id: "27205", poster: "/xlaY2zyzMfkhk0HSC5VUwzoZPU1.jpg", backdrop: "/8ZTVqvKDQ8emSGUEMjsS4yHAwrp.jpg" },
  "The Dark Knight": { id: "155", poster: "/qJ2tW6WMUDux911r6m7haRef0WH.jpg", backdrop: "/cfT29Im5VDvjE0RpyKOSdCKZal7.jpg" },
  "Interstellar": { id: "157336", poster: "/yQvGrMoipbRoddT0ZR8tPoR7NfX.jpg", backdrop: "/2ssWTSVklAEc98frZUQhgtGHx7s.jpg" },
  "Oppenheimer": { id: "872585", poster: "/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg", backdrop: "/neeNHeXjMF5fXoCJRsOmkNGC7q.jpg" },
  "Barbie": { id: "346698", poster: "/iuFNMS8U5cb6xfzi51Dbkovj7vM.jpg", backdrop: "/mbYTRO33LJAgpCMrIn9ibiWHbMH.jpg" },
  "Dune: Part Two": { id: "693134", poster: "/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg", backdrop: "/xOMo8BRK7PfcJv9JCnx7s5hj0PX.jpg" },
  "Avatar: The Way of Water": { id: "76600", poster: "/t6HIqrRAclMCA60NsSmeqe9RmNV.jpg", backdrop: "/kJsPVzdyBrYHLomuNv5SJDXUQ2f.jpg" },
  "Kantara": { id: "858485", poster: "/jIsKmkxMzdCZ0Ux1GVSnu8m6Na6.jpg", backdrop: "/kXElm7wt2kAXEVwJqW4cFhP43nW.jpg" },
  "K.G.F: Chapter 2": { id: "587412", poster: "/khNVygolU0TxLIDWff5tQlAhZ23.jpg", backdrop: "/nsV5Mfi9FAV4w8eDsdr7uqVswOk.jpg" },
  "RRR": { id: "579974", poster: "/u0XUBNQWlOvrh0Gd97ARGpIkL0.jpg", backdrop: "/i0Y0wP8H6SRgjr6QmuwbtQbS24D.jpg" },
  "Pushpa: The Rise": { id: "690957", poster: "/oaRk2HgOirEeNuDCwwScmq7rKvS.jpg", backdrop: "/jQIcn51nsvMrpB9NFwEOb9QHhFt.jpg" },
  "Jailer": { id: "937020", poster: "/pTmMxAHqX4vsIDE6HPPxOR0Q6TN.jpg", backdrop: "/ownDZBS9ecoPbWjW5V5L8jknGF.jpg" },
  "Pathaan": { id: "864692", poster: "/arf00BkwvXo0CFKbaD9OpqdE4Nu.jpg", backdrop: "/9wRAIQeOv2qzcgpfvA4dYZKeezl.jpg" },
  "Jawan": { id: "872906", poster: "/jFt1gS4BGHlK8xt76Y81Alp4dbt.jpg", backdrop: "/5LtSjMNw6j3LkG29Oa4O0iY5U8.jpg" },
  "Spider-Man: Across the Spider-Verse": { id: "569094", poster: "/8Vt6mWEReuy4Of61Lnj5Xj704m8.jpg", backdrop: "/9xfDWXAUbFXQK585JvByT5pEAhe.jpg" },
  "Coco": { id: "354912", poster: "/6Ryitt95xrO8KXuqRGm1fUuNwqF.jpg", backdrop: "/g7CHF8gTLGooTbP4GznIGwaqAGL.jpg" },
  "The Lion King": { id: "420818", poster: "/dzBtMocZuJbjLOXvrl4zGYigDzh.jpg", backdrop: "/1TUg5pO1VZ4B0Q1amk3OlXvlpXV.jpg" },
  "Gladiator II": { id: "558449", poster: "/2cxhvwyEwRlysAmRH4iodkvo0z5.jpg", backdrop: "/tOqIwliWMovSIZ9DyvHcHI7p2im.jpg" },
  "Avengers: Secret Wars": { id: "1003598", poster: "/f0YBuh4hyiAheXhh4JnJWoKi9g5.jpg", backdrop: "/rytc6Lf4447C0CDncwFa4gxe0vY.jpg" },
  "Kalki 2898 AD": { id: "801688", poster: "/rstcAnBeCkxNQjNp3YXrF6IP1tW.jpg", backdrop: "/o8XSR1SONnjcsv84NRu6Mwsl5io.jpg" },
  "Pushpa 2: The Rule": { id: "857598", poster: "/bhxZj3y59cK7JtGdV285dhDRaMe.jpg", backdrop: "/keC82cQ8q0ZHthrbvzWq04kGnbv.jpg" },
  "Toxic": { id: "1315091", poster: "/knG84vSv8kRMeopgIcrTpsYYHSs.jpg", backdrop: "/koHoI4EebSVv4vgI1Fh3KAIaYo6.jpg" },
  "Singham Again": { id: "1014214", poster: "/2JbNkHg8m7LaBy61LyrnnlenaxY.jpg", backdrop: "/kQGJ3Cv7AKAvmdUaCLihkxVMMqs.jpg" },
  "Thug Life": { id: "1045021", poster: "/DmBbUtbA3T9sdVXDgIJ8bsIDw0.jpg", backdrop: "/of9YQ9XE2aUVbiorECRnFCu5iIn.jpg" },
  "Coolie": { id: "1153399", poster: "/kr36awqmziEI5mfUElsHB0pj9zP.jpg", backdrop: "/bLn0CPzrrqFLicjNTgrzaIyE0gZ.jpg" },
  "Kantaram: Chapter 1": { id: "1083637", poster: "/3CP7crYcSBV0k8JP6fl0XaMPpDY.jpg", backdrop: "/w57nxiBIODAYHLRs1xmrCY9zEFe.jpg" },
  "Moana 2": { id: "1241982", poster: "/aLVkiINlIeCkcZIzb7XHzPYgO6L.jpg", backdrop: "/zo8CIjJ2nfNOevqNajwMRO6Hwka.jpg" },
  "Mufasa: The Lion King": { id: "762509", poster: "/jbOSUAWMGzGL1L4EaUF8K6zYFo7.jpg", backdrop: "/1w8kutrRucTd3wlYyu5QlUDMiG1.jpg" }
};

// 1. Update server/services/movieSyncService.js
const servicePath = path.join(__dirname, 'services/movieSyncService.js');
let serviceCode = fs.readFileSync(servicePath, 'utf8');

const fallbackRegex = /const fallbackMovies = \[\s*([\s\S]*?)\s*\];/;
const match = serviceCode.match(fallbackRegex);
if (match) {
    const originalBlock = match[1];
    
    // Parse individual movie objects in Javascript and update
    // Simple way: split by newlines, identify title, and replace fields
    const lines = originalBlock.split('\n');
    const updatedLines = lines.map(line => {
        let trimmed = line.trim();
        if (!trimmed.startsWith('{') || !(trimmed.endsWith('},') || trimmed.endsWith('}'))) return line;
        
        // Find title
        const titleMatch = trimmed.match(/title:\s*"([^"]+)"/);
        if (!titleMatch) return line;
        
        const title = titleMatch[1];
        const map = mappings[title];
        if (!map) {
            console.warn(`No mapping found for ${title} in movieSyncService`);
            return line;
        }
        
        // Construct official URLs
        const posterUrl = `https://image.tmdb.org/t/p/w500${map.poster}`;
        const backdropUrl = `https://image.tmdb.org/t/p/w1280${map.backdrop}`;
        
        // Replace poster_url, movie_api_id, backdrop_url
        let updatedLine = line
            .replace(/poster_url:\s*"[^"]*"/, `poster_url: "${posterUrl}"`)
            .replace(/movie_api_id:\s*"[^"]*"/, `movie_api_id: "${map.id}"`)
            .replace(/backdrop_url:\s*"[^"]*"/, `backdrop_url: "${backdropUrl}"`);
            
        return updatedLine;
    });
    
    const newBlock = updatedLines.join('\n');
    serviceCode = serviceCode.replace(originalBlock, newBlock);
    fs.writeFileSync(servicePath, serviceCode, 'utf8');
    console.log("Successfully updated movieSyncService.js fallbackMovies!");
} else {
    console.error("Failed to find fallbackMovies block in movieSyncService.js");
}

// 2. Update src/service/MovieApiService.java
const javaPath = path.join(__dirname, '../src/service/MovieApiService.java');
if (fs.existsSync(javaPath)) {
    let javaCode = fs.readFileSync(javaPath, 'utf8');
    
    // Find all.add(new Movie(...)) lines in getFallbackMovies
    const lines = javaCode.split('\n');
    let insideFallback = false;
    
    const updatedLines = lines.map(line => {
        if (line.includes("getFallbackMovies(String statusFilter)")) {
            insideFallback = true;
        }
        if (insideFallback && line.includes("return filtered;")) {
            insideFallback = false;
        }
        
        if (insideFallback && line.trim().startsWith("all.add(new Movie(")) {
            // Extract the arguments
            // Format: all.add(new Movie(id, title, description, duration, genre, language, Date.valueOf(date), poster, rating, status, cast, trailer, apiId));
            const movieMatch = line.match(/all\.add\(new Movie\(\s*(\d+)\s*,\s*"([^"]+)"\s*,\s*([\s\S]+)\s*\)\);/);
            if (movieMatch) {
                const id = movieMatch[1];
                const title = movieMatch[2];
                const map = mappings[title];
                if (map) {
                    const posterUrl = `https://image.tmdb.org/t/p/w500${map.poster}`;
                    
                    // Replace the poster path argument (8th argument) and apiId argument (13th argument)
                    // The easiest and safest way to parse parameters while handling nested quotes and commas:
                    // Let's use regex to swap "F-X" at the end with map.id, and the poster path argument
                    let updatedLine = line;
                    
                    // Replace the F-X apiId at the end
                    updatedLine = updatedLine.replace(/"F-\d+"/, `"${map.id}"`);
                    
                    // Replace the posterUrl
                    // Look for poster path which could be "resources/images/posters/..." or a TMDB URL
                    updatedLine = updatedLine.replace(/"resources\/images\/posters\/[^"]*"/, `"${posterUrl}"`);
                    updatedLine = updatedLine.replace(/"https:\/\/image\.tmdb\.org\/t\/p\/w500\/[^"]*"/, `"${posterUrl}"`);
                    
                    return updatedLine;
                }
            }
        }
        return line;
    });
    
    fs.writeFileSync(javaPath, updatedLines.join('\n'), 'utf8');
    console.log("Successfully updated MovieApiService.java fallbackMovies!");
} else {
    console.warn("MovieApiService.java not found at:", javaPath);
}
