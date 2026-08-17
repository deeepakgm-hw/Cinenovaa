package cineplex.util;

import cineplex.model.Movie;
import cineplex.model.Showtime;
import cineplex.model.Theatre;
import cineplex.view.*;
import model.Booking;
import main.CinePlexApp;

import javax.swing.JFrame;
import java.sql.Timestamp;

public class NavigationManager {
    private static NavigationManager instance;
    private int selectedCityId = -1;
    private String selectedCityName = "";
    private int selectedTheatreId = -1;
    private String selectedTheatreName = "";
    private Movie selectedMovie;
    private Showtime selectedShowtime;

    private NavigationManager() {}

    public static synchronized NavigationManager getInstance() {
        if (instance == null) {
            instance = new NavigationManager();
        }
        return instance;
    }

    public int getSelectedCityId() { return selectedCityId; }
    public void setSelectedCityId(int id) { this.selectedCityId = id; }
    public String getSelectedCityName() { return selectedCityName; }
    public void setSelectedCityName(String name) { this.selectedCityName = name; }

    public int getSelectedTheatreId() { return selectedTheatreId; }
    public void setSelectedTheatreId(int id) { this.selectedTheatreId = id; }
    public String getSelectedTheatreName() { return selectedTheatreName; }
    public void setSelectedTheatreName(String name) { this.selectedTheatreName = name; }

    public Movie getSelectedMovie() { return selectedMovie; }
    public void setSelectedMovie(Movie movie) { this.selectedMovie = movie; }

    public Showtime getSelectedShowtime() { return selectedShowtime; }
    public void setSelectedShowtime(Showtime showtime) { this.selectedShowtime = showtime; }

    // Navigation methods
    public void showLogin(JFrame currentFrame) {
        if (currentFrame != null) currentFrame.dispose();
        new LoginView().setVisible(true);
    }

    public void showCitySelection(JFrame currentFrame) {
        if (currentFrame != null) currentFrame.dispose();
        new CitySelectionView().setVisible(true);
    }

    public void showMovieList(JFrame currentFrame) {
        if (currentFrame != null) currentFrame.dispose();
        new MovieListView().setVisible(true);
    }

    public void showMovieDetail(JFrame currentFrame, Movie movie) {
        if (currentFrame != null) currentFrame.dispose();
        new MovieDetailView(movie).setVisible(true);
    }

    public void showTheatreSelection(JFrame currentFrame) {
        if (currentFrame != null) currentFrame.dispose();
        new TheatreSelectionView().setVisible(true);
    }

    public void showShowtimeSelection(JFrame currentFrame) {
        if (currentFrame != null) currentFrame.dispose();
        new ShowtimeSelectionView(selectedMovie).setVisible(true);
    }

    public void showSeatSelection(JFrame currentFrame) {
        if (currentFrame != null) currentFrame.dispose();
        new SeatSelectionView(selectedMovie, selectedShowtime).setVisible(true);
    }

    public void showCheckout(JFrame currentFrame, String seats, double totalAmount) {
        if (currentFrame != null) currentFrame.dispose();
        
        Booking newBooking = new Booking();
        newBooking.setBookingId("BKG-" + System.currentTimeMillis());
        newBooking.setUserId(String.valueOf(SessionManager.getInstance().getCurrentUserId()));
        newBooking.setShowtimeId(selectedShowtime.getId());
        newBooking.setMovieName(selectedMovie.getTitle());
        newBooking.setTheatreName(selectedTheatreName != null && !selectedTheatreName.isEmpty() ? selectedTheatreName : "CineNova Theatre");
        newBooking.setShowTime(selectedShowtime.getShowTime());
        newBooking.setSeats(seats);
        newBooking.setTotalAmount(totalAmount);
        newBooking.setBookingStatus("PENDING");

        new CinePlexApp(newBooking).setVisible(true);
    }
}
