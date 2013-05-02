/**
*/
public interface Shape{
  public int[][] getArr();
  
  public void rotate();
  public void unRotate();
  
  public int getColor();
  public int getSize();
  
  public int getEmptySpacesOnRight();
  public int getEmptySpacesOnLeft();
}
