package service;

import model.Movie;
import java.io.FileInputStream;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.sql.Date;
import java.time.Duration;
import java.util.*;
import java.util.logging.Level;
import java.util.logging.Logger;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class MovieApiService {
    private static final Logger LOG = Logger.getLogger(MovieApiService.class.getName());
    private static final String TMDB_BASE_URL = "https://api.tmdb.org/3";
    private static String apiKey = "";
    private static final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(6))
            .build();

    static {
        loadApiKey();
    }

    private static void loadApiKey() {
        try (FileInputStream fis = new FileInputStream("src/db.properties")) {
            Properties props = new Properties();
            props.load(fis);
            apiKey = props.getProperty("tmdb.api.key", "").trim();
            if (apiKey.isEmpty() || apiKey.startsWith("your_")) {
                apiKey = ""; // treat as unconfigured
            }
        } catch (Exception e) {
            LOG.log(Level.WARNING, "Failed to load TMDB API key from db.properties: " + e.getMessage());
        }
    }

    public static boolean isApiConfigured() {
        return !apiKey.isEmpty();
    }

    public static List<Movie> getNowPlayingMovies() {
        if (!isApiConfigured()) {
            return getFallbackMovies("NOW_SHOWING");
        }
        return fetchFromTmdb("/movie/now_playing", "NOW_SHOWING");
    }

    public static List<Movie> getUpcomingMovies() {
        if (!isApiConfigured()) {
            return getFallbackMovies("COMING_SOON");
        }
        return fetchFromTmdb("/movie/upcoming", "COMING_SOON");
    }

    public static List<Movie> getPopularMovies() {
        if (!isApiConfigured()) {
            return getFallbackMovies("POPULAR");
        }
        return fetchFromTmdb("/movie/popular", "POPULAR");
    }

    public static List<Movie> searchMovies(String query) {
        if (query == null || query.trim().isEmpty()) {
            return new ArrayList<>();
        }
        if (!isApiConfigured()) {
            return new ArrayList<>();
        }
        try {
            String encoded = URLEncoder.encode(query, StandardCharsets.UTF_8);
            return fetchFromTmdb("/search/movie?query=" + encoded, "NOW_SHOWING");
        } catch (Exception e) {
            LOG.log(Level.SEVERE, "Failed to encode search query", e);
            return new ArrayList<>();
        }
    }

    private static List<Movie> fetchFromTmdb(String endpoint, String status) {
        List<Movie> movies = new ArrayList<>();
        try {
            String connector = endpoint.contains("?") ? "&" : "?";
            String url = TMDB_BASE_URL + endpoint + connector + "api_key=" + apiKey + "&language=en-US&page=1";
            
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .timeout(Duration.ofSeconds(8))
                    .GET()
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() != 200) {
                LOG.warning("TMDB API returned code " + response.statusCode() + " for URL: " + url);
                return getFallbackMovies(status);
            }

            String body = response.body();
            List<String> results = splitJsonArray(body);
            int limit = Math.min(results.size(), 12); // limit to 12 items to prevent overloading details calls
            for (int i = 0; i < limit; i++) {
                String movieJson = results.get(i);
                String apiId = getJsonRaw(movieJson, "id");
                if (apiId.isEmpty()) continue;
                
                // Fetch full details to get cast, runtime, trailer
                Movie detailed = fetchMovieDetails(apiId, status);
                if (detailed != null) {
                    movies.add(detailed);
                }
            }
        } catch (Exception e) {
            LOG.log(Level.SEVERE, "Error calling TMDB API: " + e.getMessage(), e);
            return getFallbackMovies(status);
        }
        return movies;
    }

    private static Movie fetchMovieDetails(String apiId, String status) {
        try {
            String url = TMDB_BASE_URL + "/movie/" + apiId + "?api_key=" + apiKey + "&append_to_response=credits,videos";
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .timeout(Duration.ofSeconds(6))
                    .GET()
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() != 200) return null;

            String body = response.body();
            String title = getJsonString(body, "title");
            String description = getJsonString(body, "overview");
            int duration = Integer.parseInt(getJsonRaw(body, "runtime"));
            if (duration <= 0) duration = 120; // default duration

            // Parse genres
            List<String> genreNames = new ArrayList<>();
            Pattern pGenre = Pattern.compile("\"name\"\\s*:\\s*\"([^\"]+)\"");
            int genresStart = body.indexOf("\"genres\"");
            if (genresStart != -1) {
                int genresEnd = body.indexOf("]", genresStart);
                if (genresEnd != -1) {
                    Matcher mGenre = pGenre.matcher(body.substring(genresStart, genresEnd));
                    while (mGenre.find()) {
                        genreNames.add(mGenre.group(1));
                    }
                }
            }
            String genre = genreNames.isEmpty() ? "Cinema" : String.join(", ", genreNames);

            // Parse language
            String langCode = getJsonString(body, "original_language");
            String language = "English";
            if ("hi".equalsIgnoreCase(langCode)) language = "Hindi";
            else if ("kn".equalsIgnoreCase(langCode)) language = "Kannada";
            else if ("te".equalsIgnoreCase(langCode)) language = "Telugu";
            else if ("ta".equalsIgnoreCase(langCode)) language = "Tamil";

            // Parse release date
            String relDateStr = getJsonString(body, "release_date");
            Date releaseDate;
            try {
                releaseDate = Date.valueOf(relDateStr);
            } catch (Exception e) {
                releaseDate = new Date(System.currentTimeMillis());
            }

            // Poster URL
            String posterPath = getJsonString(body, "poster_path");
            String posterUrl = posterPath.isEmpty() ? "" : "https://image.tmdb.org/t/p/w500" + posterPath;

            // Backdrop URL
            String backdropPath = getJsonString(body, "backdrop_path");
            String backdropUrl = backdropPath.isEmpty() ? "" : "https://image.tmdb.org/t/p/w1280" + backdropPath;

            // Rating
            double ratingVal = Double.parseDouble(getJsonRaw(body, "vote_average"));
            String rating = String.format(Locale.ROOT, "%.1f", ratingVal);

            // Cast members (Credits -> Cast)
            List<String> castList = new ArrayList<>();
            int creditsStart = body.indexOf("\"credits\"");
            if (creditsStart != -1) {
                int castStart = body.indexOf("\"cast\"", creditsStart);
                if (castStart != -1) {
                    int castEnd = body.indexOf("]", castStart);
                    if (castEnd != -1) {
                        Matcher mCast = pGenre.matcher(body.substring(castStart, castEnd)); // name is the field
                        while (mCast.find()) {
                            castList.add(mCast.group(1));
                            if (castList.size() >= 5) break;
                        }
                    }
                }
            }
            String castMembers = castList.isEmpty() ? "N/A" : String.join(", ", castList);

            // Trailer URL (Videos -> results)
            String trailerUrl = "";
            int videosStart = body.indexOf("\"videos\"");
            if (videosStart != -1) {
                int videosEnd = body.indexOf("]", videosStart);
                if (videosEnd != -1) {
                    String videosSection = body.substring(videosStart, videosEnd);
                    // Match a YouTube trailer key
                    Pattern pVideo = Pattern.compile("\"key\"\\s*:\\s*\"([^\"]+)\"");
                    Matcher mVideo = pVideo.matcher(videosSection);
                    if (mVideo.find()) {
                        trailerUrl = "https://www.youtube.com/watch?v=" + mVideo.group(1);
                    }
                }
            }
            if (trailerUrl.isEmpty()) {
                trailerUrl = "https://www.youtube.com/watch?v=YoHD9XEInc0"; // fallback
            }

            return new Movie(0, title, description, duration, genre, language, releaseDate, posterUrl, rating, status, castMembers, trailerUrl, apiId, backdropUrl);
        } catch (Exception e) {
            LOG.log(Level.SEVERE, "Failed parsing movie details for API ID: " + apiId, e);
            return null;
        }
    }

    private static List<String> splitJsonArray(String json) {
        List<String> items = new ArrayList<>();
        int start = json.indexOf("\"results\"");
        if (start == -1) return items;
        
        int arrayStart = json.indexOf("[", start);
        if (arrayStart == -1) return items;
        
        int bracketCount = 1;
        int i = arrayStart + 1;
        for (; i < json.length(); i++) {
            char c = json.charAt(i);
            if (c == '[') bracketCount++;
            else if (c == ']') {
                bracketCount--;
                if (bracketCount == 0) break;
            }
        }
        if (i >= json.length()) return items;
        String arrayContent = json.substring(arrayStart + 1, i).trim();
        if (arrayContent.isEmpty()) return items;
        
        int objBracketCount = 0;
        int objStart = -1;
        for (int j = 0; j < arrayContent.length(); j++) {
            char c = arrayContent.charAt(j);
            if (c == '{') {
                if (objBracketCount == 0) objStart = j;
                objBracketCount++;
            } else if (c == '}') {
                objBracketCount--;
                if (objBracketCount == 0 && objStart != -1) {
                    items.add(arrayContent.substring(objStart, j + 1));
                }
            }
        }
        return items;
    }

    private static String getJsonString(String json, String key) {
        Pattern p = Pattern.compile("\"" + key + "\"\\s*:\\s*\"([^\"]*)\"");
        Matcher m = p.matcher(json);
        if (m.find()) return m.group(1);
        return "";
    }

    private static String getJsonRaw(String json, String key) {
        Pattern p = Pattern.compile("\"" + key + "\"\\s*:\\s*([^,}\\s\\]]+)");
        Matcher m = p.matcher(json);
        if (m.find()) return m.group(1).trim().replace("\"", "");
        return "";
    }

    public static List<Movie> getFallbackMovies(String statusFilter) {
        List<Movie> list = new ArrayList<>();
        
        // Movie 1: The Dark Knight
        Movie m1 = new Movie(
            0,
            "The Dark Knight",
            "When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests of his ability to fight injustice.",
            152,
            "Action, Crime, Drama",
            "English",
            Date.valueOf("2008-07-18"),
            "resources/images/posters/dark_knight.jpg",
            "9.0",
            "NOW_SHOWING",
            "Christian Bale, Heath Ledger, Aaron Eckhart",
            "https://www.youtube.com/watch?v=EXeTwQWrcwY",
            "fb_dark_knight",
            null
        );

        // Movie 2: Inception
        Movie m2 = new Movie(
            0,
            "Inception",
            "A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.",
            148,
            "Action, Sci-Fi, Adventure",
            "English",
            Date.valueOf("2010-07-16"),
            "resources/images/posters/inception.jpg",
            "8.8",
            "NOW_SHOWING",
            "Leonardo DiCaprio, Joseph Gordon-Levitt, Elliot Page",
            "https://www.youtube.com/watch?v=YoHD9XEInc0",
            "fb_inception",
            null
        );

        // Movie 3: Interstellar
        Movie m3 = new Movie(
            0,
            "Interstellar",
            "A team of explorers travel through a wormhole in space in an attempt to ensure humanity's survival.",
            169,
            "Sci-Fi, Drama, Adventure",
            "English",
            Date.valueOf("2014-11-07"),
            "resources/images/posters/interstellar.jpg",
            "8.7",
            "NOW_SHOWING",
            "Matthew McConaughey, Anne Hathaway, Jessica Chastain",
            "https://www.youtube.com/watch?v=zSWdZATo3Dc",
            "fb_interstellar",
            null
        );

        // Movie 4: Kantara
        Movie m4 = new Movie(
            0,
            "Kantara",
            "When greed paves the way for betrayal, scheming and rebellion, a young man reluctantly takes on the mantle of his ancestors to settle the unrest in his village.",
            150,
            "Action, Thriller, Drama",
            "Kannada",
            Date.valueOf("2022-09-30"),
            "resources/images/posters/karuppu.jpg",
            "8.4",
            "NOW_SHOWING",
            "Rishab Shetty, Sapthami Gowda, Kishore Kumar G.",
            "https://www.youtube.com/watch?v=YoHD9XEInc0",
            "fb_kantara",
            null
        );

        // Movie 5: Avatar: The Way of Water (Upcoming)
        Movie m5 = new Movie(
            0,
            "Avatar: The Way of Water",
            "Jake Sully lives with his newfound family formed on the extraterrestrial pandoran moon. Once a familiar threat returns to finish what was previously started, Jake must work with Neytiri and the army of the Na'vi race to protect their home.",
            192,
            "Sci-Fi, Action, Adventure",
            "English",
            Date.valueOf("2022-12-16"),
            "resources/images/posters/default_poster.png",
            "7.8",
            "COMING_SOON",
            "Sam Worthington, Zoe Saldana, Sigourney Weaver",
            "https://www.youtube.com/watch?v=YoHD9XEInc0",
            "fb_avatar2",
            null
        );

        // Movie 6: The Dark Knight Rises (Upcoming)
        Movie m6 = new Movie(
            0,
            "The Dark Knight Rises",
            "Eight years after the Joker's reign of anarchy, Batman, with the help of the enigmatic Catwoman, is forced from his exile to save Gotham City from the brutal guerrilla terrorist Bane.",
            165,
            "Action, Thriller",
            "English",
            Date.valueOf("2012-07-20"),
            "resources/images/posters/dark_knight.jpg",
            "8.4",
            "COMING_SOON",
            "Christian Bale, Tom Hardy, Anne Hathaway",
            "https://www.youtube.com/watch?v=YoHD9XEInc0",
            "fb_dkr",
            null
        );

        List<Movie> all = Arrays.asList(m1, m2, m3, m4, m5, m6);
        for (Movie m : all) {
            if ("NOW_SHOWING".equals(statusFilter) || "POPULAR".equals(statusFilter)) {
                if ("NOW_SHOWING".equals(m.getStatus())) {
                    list.add(m);
                }
            } else if ("COMING_SOON".equals(statusFilter)) {
                if ("COMING_SOON".equals(m.getStatus())) {
                    list.add(m);
                }
            }
        }
        return list;
    }
}
