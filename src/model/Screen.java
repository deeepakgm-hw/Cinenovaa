package model;

public class Screen {
    private int id;
    private int theatreId;
    private String name;
    private int totalSeats;

    public Screen() {}

    public Screen(int id, int theatreId, String name, int totalSeats) {
        this.id = id;
        this.theatreId = theatreId;
        this.name = name;
        this.totalSeats = totalSeats;
    }

    public int getId() { return id; }
    public void setId(int id) { this.id = id; }

    public int getTheatreId() { return theatreId; }
    public void setTheatreId(int theatreId) { this.theatreId = theatreId; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public int getTotalSeats() { return totalSeats; }
    public void setTotalSeats(int totalSeats) { this.totalSeats = totalSeats; }

    @Override
    public String toString() {
        return name;
    }
}
