public class Poll {
    int id;
    String name;

    Poll(int id, String name) {
      this.id = id;
      this.name = name;
    }

    @Override
    public String toString() {
      return "Poll = " + name + " with id " + id;
    }
}
