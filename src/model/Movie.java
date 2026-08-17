package model;

import java.sql.Date;

public class Movie {
    private int id;
    private String title;
    private String description;
    private int duration;
    private String genre;
    private String language;
    private Date releaseDate;
    private String posterUrl;
    private String rating;
    private String status;
    private String castMembers;
    private String trailerUrl;
    private String movieApiId;
    private String backdropUrl;

    public Movie() {}

    public Movie(int id, String title, String description, int duration, String genre, Date releaseDate, String posterUrl) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.duration = duration;
        this.genre = genre;
        this.releaseDate = releaseDate;
        this.posterUrl = posterUrl;
        this.language = "English";
        this.rating = "PG-13";
        this.status = "NOW_SHOWING";
        this.castMembers = "";
        this.trailerUrl = "";
        this.movieApiId = null;
        this.backdropUrl = null;
    }

    public Movie(int id, String title, String description, int duration, String genre, String language, Date releaseDate, String posterUrl, String rating) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.duration = duration;
        this.genre = genre;
        this.language = language;
        this.releaseDate = releaseDate;
        this.posterUrl = posterUrl;
        this.rating = rating;
        this.status = "NOW_SHOWING";
        this.castMembers = "";
        this.trailerUrl = "";
        this.movieApiId = null;
        this.backdropUrl = null;
    }

    public Movie(int id, String title, String description, int duration, String genre, String language, Date releaseDate, String posterUrl, String rating, String status, String castMembers, String trailerUrl) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.duration = duration;
        this.genre = genre;
        this.language = language;
        this.releaseDate = releaseDate;
        this.posterUrl = posterUrl;
        this.rating = rating;
        this.status = status;
        this.castMembers = castMembers;
        this.trailerUrl = trailerUrl;
        this.movieApiId = null;
        this.backdropUrl = null;
    }

    public Movie(int id, String title, String description, int duration, String genre, String language, Date releaseDate, String posterUrl, String rating, String status, String castMembers, String trailerUrl, String movieApiId) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.duration = duration;
        this.genre = genre;
        this.language = language;
        this.releaseDate = releaseDate;
        this.posterUrl = posterUrl;
        this.rating = rating;
        this.status = status;
        this.castMembers = castMembers;
        this.trailerUrl = trailerUrl;
        this.movieApiId = movieApiId;
        this.backdropUrl = null;
    }

    public Movie(int id, String title, String description, int duration, String genre, String language, Date releaseDate, String posterUrl, String rating, String status, String castMembers, String trailerUrl, String movieApiId, String backdropUrl) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.duration = duration;
        this.genre = genre;
        this.language = language;
        this.releaseDate = releaseDate;
        this.posterUrl = posterUrl;
        this.rating = rating;
        this.status = status;
        this.castMembers = castMembers;
        this.trailerUrl = trailerUrl;
        this.movieApiId = movieApiId;
        this.backdropUrl = backdropUrl;
    }

    // Getters and Setters
    public int getMovieId() { return id; }
    public void setMovieId(int id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public int getDuration() { return duration; }
    public void setDuration(int duration) { this.duration = duration; }

    public String getGenre() { return genre; }
    public void setGenre(String genre) { this.genre = genre; }

    public String getLanguage() { return language; }
    public void setLanguage(String language) { this.language = language; }

    public Date getReleaseDate() { return releaseDate; }
    public void setReleaseDate(Date releaseDate) { this.releaseDate = releaseDate; }

    public String getPosterUrl() { return posterUrl; }
    public void setPosterUrl(String posterUrl) { this.posterUrl = posterUrl; }

    public String getRating() { return rating; }
    public void setRating(String rating) { this.rating = rating; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getCastMembers() { return castMembers; }
    public void setCastMembers(String castMembers) { this.castMembers = castMembers; }

    public String getTrailerUrl() { return trailerUrl; }
    public void setTrailerUrl(String trailerUrl) { this.trailerUrl = trailerUrl; }

    public String getMovieApiId() { return movieApiId; }
    public void setMovieApiId(String movieApiId) { this.movieApiId = movieApiId; }

    public String getBackdropUrl() { return backdropUrl; }
    public void setBackdropUrl(String backdropUrl) { this.backdropUrl = backdropUrl; }
}
