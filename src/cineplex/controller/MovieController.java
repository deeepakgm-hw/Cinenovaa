package cineplex.controller;

import cineplex.dao.MovieDAO;
import cineplex.dao.ShowtimeDAO;
import cineplex.dao.SeatDAO;
import cineplex.model.Movie;
import cineplex.model.Showtime;
import cineplex.model.Seat;

import java.util.List;

public class MovieController {
    private MovieDAO movieDAO;
    private ShowtimeDAO showtimeDAO;
    private SeatDAO seatDAO;

    public MovieController() {
        this.movieDAO = new MovieDAO();
        this.showtimeDAO = new ShowtimeDAO();
        this.seatDAO = new SeatDAO();
    }

    public List<Movie> getAllMovies() {
        return movieDAO.getAllMovies();
    }

    public List<Showtime> getShowtimesForMovie(int movieId) {
        return showtimeDAO.getShowtimesForMovie(movieId);
    }

    public List<Seat> getSeatsForScreen(int screenId) {
        return seatDAO.getSeatsForScreen(screenId);
    }

    public List<String> getBookedSeats(int showtimeId) {
        return seatDAO.getBookedSeatNumbers(showtimeId);
    }
    
    public Showtime getShowtimeById(int id) {
        return showtimeDAO.getShowtimeById(id);
    }
}
