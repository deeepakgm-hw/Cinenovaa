package cineplex.model;

import java.sql.Date;

public class UpcomingMovie {
    private int upcomingId;
    private String movieName;
    private String teaserDescription;
    private Date expectedReleaseDate;
    private String posterUrl;
    private String trailerUrl;
    private int notifyCount;
    private String status;

    public int getUpcomingId() { return upcomingId; }
    public void setUpcomingId(int upcomingId) { this.upcomingId = upcomingId; }
    public String getMovieName() { return movieName; }
    public void setMovieName(String movieName) { this.movieName = movieName; }
    public String getTeaserDescription() { return teaserDescription; }
    public void setTeaserDescription(String teaserDescription) { this.teaserDescription = teaserDescription; }
    public Date getExpectedReleaseDate() { return expectedReleaseDate; }
    public void setExpectedReleaseDate(Date expectedReleaseDate) { this.expectedReleaseDate = expectedReleaseDate; }
    public String getPosterUrl() { return posterUrl; }
    public void setPosterUrl(String posterUrl) { this.posterUrl = posterUrl; }
    public String getTrailerUrl() { return trailerUrl; }
    public void setTrailerUrl(String trailerUrl) { this.trailerUrl = trailerUrl; }
    public int getNotifyCount() { return notifyCount; }
    public void setNotifyCount(int notifyCount) { this.notifyCount = notifyCount; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
