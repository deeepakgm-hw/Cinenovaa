package controller;

import dao.MovieDAO;
import dao.ShowtimeDAO;
import model.Movie;
import model.Showtime;

import java.util.List;

public class MovieController {
    private final MovieDAO movieDAO = new MovieDAO();
    private final ShowtimeDAO showtimeDAO = new ShowtimeDAO();

    public List<Movie> getAllMovies() {
        return movieDAO.getAllMovies();
    }

    public List<Showtime> getShowtimesForMovie(int movieId) {
        return showtimeDAO.getShowtimesForMovie(movieId);
    }

    public Movie getMovieById(int id) {
        return movieDAO.getMovieById(id);
    }
}
