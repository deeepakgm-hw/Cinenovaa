package cineplex.model;

import java.io.Serializable;

public class Seat implements Serializable {
    private int id;
    private int screenId;
    private String seatNumber;
    private String seatType; // STANDARD, PREMIUM, VIP

    public Seat() {}

    public Seat(int id, int screenId, String seatNumber, String seatType) {
        this.id = id;
        this.screenId = screenId;
        this.seatNumber = seatNumber;
        this.seatType = seatType;
    }

    public int getId() { return id; }
    public void setId(int id) { this.id = id; }
    public int getScreenId() { return screenId; }
    public void setScreenId(int screenId) { this.screenId = screenId; }
    public String getSeatNumber() { return seatNumber; }
    public void setSeatNumber(String seatNumber) { this.seatNumber = seatNumber; }
    public String getSeatType() { return seatType; }
    public void setSeatType(String seatType) { this.seatType = seatType; }
}
