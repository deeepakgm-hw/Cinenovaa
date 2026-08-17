package cineplex.model;

import java.io.Serializable;

public class Theatre implements Serializable {
    private int id;
    private String name;
    private int cityId;
    private String location;

    public Theatre() {}

    public Theatre(int id, String name, int cityId, String location) {
        this.id = id;
        this.name = name;
        this.cityId = cityId;
        this.location = location;
    }

    public int getId() { return id; }
    public void setId(int id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public int getCityId() { return cityId; }
    public void setCityId(int cityId) { this.cityId = cityId; }
    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }

    @Override
    public String toString() {
        return name;
    }
}
