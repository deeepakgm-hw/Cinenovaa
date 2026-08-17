package service;

import dao.MovieDAO;
import model.Movie;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;
import java.util.logging.Level;
import java.util.logging.Logger;
import util.DatabaseConnection;

public class MovieSyncService {
    private static final Logger LOG = Logger.getLogger(MovieSyncService.class.getName());
    private static final ScheduledExecutorService scheduler = Executors.newSingleThreadScheduledExecutor(runnable -> {
        Thread thread = new Thread(runnable, "MovieSyncThread");
        thread.setDaemon(true);
        return thread;
    });
    private static final MovieDAO movieDAO = new MovieDAO();

    public static void startSyncService() {
        LOG.info("[SYNC SERVICE] Initializing Movie Sync Service...");
        
        // Run first sync immediately on a background thread to prevent blocking server startup
        new Thread(() -> {
            try {
                runSync();
            } catch (Exception e) {
                LOG.log(Level.SEVERE, "Initial movie sync failed", e);
            }
        }).start();

        // Schedule sync to run every 24 hours
        scheduler.scheduleAtFixedRate(() -> {
            try {
                runSync();
            } catch (Exception e) {
                LOG.log(Level.SEVERE, "Scheduled movie sync failed", e);
            }
        }, 24, 24, TimeUnit.HOURS);
    }

    public static synchronized void runSync() {
        LOG.info("[SYNC SERVICE] Starting Movie Database Sync...");
        int added = 0;
        int updated = 0;

        List<Movie> nowPlaying = MovieApiService.getNowPlayingMovies();
        List<Movie> upcoming = MovieApiService.getUpcomingMovies();
        List<Movie> popular = MovieApiService.getPopularMovies();

        if (nowPlaying.isEmpty() && upcoming.isEmpty() && popular.isEmpty()) {
            LOG.warning("[SYNC SERVICE] All API movie lists were empty. Falling back to offline fallback seed...");
            nowPlaying = MovieApiService.getFallbackMovies("NOW_SHOWING");
            upcoming = MovieApiService.getFallbackMovies("COMING_SOON");
            popular = MovieApiService.getFallbackMovies("POPULAR");
        }

        // 1. Sync Now Playing
        LOG.info("[SYNC SERVICE] Syncing Now Playing movies...");
        for (Movie m : nowPlaying) {
            m.setStatus("NOW_SHOWING");
            if (syncMovie(m)) updated++; else added++;
        }

        // 2. Sync Upcoming
        LOG.info("[SYNC SERVICE] Syncing Upcoming movies...");
        for (Movie m : upcoming) {
            m.setStatus("COMING_SOON");
            if (syncMovie(m)) updated++; else added++;
        }

        // 3. Sync Popular
        LOG.info("[SYNC SERVICE] Syncing Popular movies...");
        for (Movie m : popular) {
            m.setStatus("NOW_SHOWING");
            if (syncMovie(m)) updated++; else added++;
        }

        LOG.info(String.format("[SYNC SERVICE] Sync complete. Added: %d, Updated: %d movies.", added, updated));
    }

    private static boolean syncMovie(Movie m) {
        // Look up by movieApiId or details to prevent duplicates
        Movie existing = movieDAO.getMovieByApiIdOrDetails(m.getMovieApiId(), m.getTitle(), m.getReleaseDate());
        if (existing != null) {
            // Keep DB primary ID but update other properties from API
            m.setMovieId(existing.getMovieId());
            // If the movie language or rating is null, fallback to existing
            if (m.getLanguage() == null || m.getLanguage().isEmpty()) m.setLanguage(existing.getLanguage());
            if (m.getRating() == null || m.getRating().isEmpty()) m.setRating(existing.getRating());
            
            movieDAO.updateMovie(m);
            createShowtimesIfNeeded(existing.getMovieId(), m.getStatus());
            return true; // updated
        } else {
            movieDAO.addMovie(m);
            // Retrieve generated ID
            Movie inserted = movieDAO.getMovieByApiIdOrDetails(m.getMovieApiId(), m.getTitle(), m.getReleaseDate());
            if (inserted != null) {
                createShowtimesIfNeeded(inserted.getMovieId(), m.getStatus());
            }
            return false; // added
        }
    }

    private static void createShowtimesIfNeeded(int movieId, String status) {
        if (!"NOW_SHOWING".equals(status) && !"POPULAR".equals(status)) {
            return;
        }

        try (Connection conn = DatabaseConnection.getConnection()) {
            // Check if showtimes already exist for this movie
            String checkSql = "SELECT COUNT(*) FROM showtimes WHERE movie_id = ?";
            try (PreparedStatement checkStmt = conn.prepareStatement(checkSql)) {
                checkStmt.setInt(1, movieId);
                try (ResultSet rs = checkStmt.executeQuery()) {
                    if (rs.next() && rs.getInt(1) > 0) {
                        return; // Showtimes already exist
                    }
                }
            }

            // Fetch all screen IDs
            List<Integer> screenIds = new ArrayList<>();
            String screenSql = "SELECT id FROM screens";
            try (PreparedStatement screenStmt = conn.prepareStatement(screenSql);
                 ResultSet rs = screenStmt.executeQuery()) {
                while (rs.next()) {
                    screenIds.add(rs.getInt("id"));
                }
            }

            if (screenIds.isEmpty()) return;

            // Generate showtimes for the next 3 days at four standard timings
            String insertSql = "INSERT INTO showtimes (movie_id, screen_id, show_time, price) VALUES (?, ?, ?, ?)";
            try (PreparedStatement insertStmt = conn.prepareStatement(insertSql)) {
                long now = System.currentTimeMillis();
                String[] times = {"12:00:00", "15:00:00", "18:00:00", "21:00:00"};
                double[] prices = {250.00, 300.00, 350.00, 400.00};

                for (int day = 0; day < 3; day++) {
                    java.sql.Date date = new java.sql.Date(now + day * 24 * 60 * 60 * 1000L);
                    for (int t = 0; t < times.length; t++) {
                        // Assign screen using round-robin mapping
                        int screenId = screenIds.get((movieId + day + t) % screenIds.size());
                        String timestampStr = date.toString() + " " + times[t];
                        java.sql.Timestamp showTime = java.sql.Timestamp.valueOf(timestampStr);

                        insertStmt.setInt(1, movieId);
                        insertStmt.setInt(2, screenId);
                        insertStmt.setTimestamp(3, showTime);
                        insertStmt.setDouble(4, prices[t]);
                        insertStmt.addBatch();
                    }
                }
                insertStmt.executeBatch();
                LOG.info("[SYNC SERVICE] Dynamically created showtimes for live movie ID: " + movieId);
            }
        } catch (SQLException e) {
            LOG.log(Level.SEVERE, "Failed to dynamically seed showtimes for movie ID: " + movieId, e);
        }
    }
}
