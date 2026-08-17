/**
 * Application Entry Point — CinePlex Movie Booking System
 * Delegates to cineplex.Main which uses the fully-wired
 * cineplex.view.LoginView → MovieList → Showtime → Seat → Snack → Payment → Ticket flow.
 */
public class Main {
    public static void main(String[] args) {
        // Start the REST API server for the CineNova React frontend
        util.ApiServer.startServer();
        
        // Start Java Background Movie Sync Service
        service.MovieSyncService.startSyncService();
        
        // Launch Swing desktop UI fallback
        cineplex.Main.main(args);
    }
}
