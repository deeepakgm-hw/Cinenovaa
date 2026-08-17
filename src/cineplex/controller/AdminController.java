package cineplex.controller;

import cineplex.dao.MovieDAO;
import cineplex.dao.ShowtimeDAO;
import cineplex.model.Movie;
import cineplex.model.Showtime;

import java.util.List;

public class AdminController {
    private MovieDAO movieDAO;
    private ShowtimeDAO showtimeDAO;

    public AdminController() {
        this.movieDAO = new MovieDAO();
        this.showtimeDAO = new ShowtimeDAO();
    }

    public boolean addMovie(Movie movie) {
        return movieDAO.addMovie(movie);
    }

    public List<Movie> getAllMovies() {
        return movieDAO.getAllMovies();
    }

    public boolean updateMovie(Movie movie) {
        return movieDAO.updateMovie(movie);
    }

    public boolean addShowtime(Showtime showtime) {
        return showtimeDAO.addShowtime(showtime);
    }
}
