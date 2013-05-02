public class OShape implements Shape{
  int[][] shape;
  
  OShape(){
    shape = new int[][]{{1, 1},
                        {1, 1}};
  }
  
  // This shape is perfectly packed tight, there is no empty space
  public int getEmptySpacesOnRight(){
    return 0;
  }

  public int getEmptySpacesOnLeft(){
    return 0;
  }
  
  public int[][] getArr(){
    return shape;
  }
  
  public void rotate(){}
  public void unRotate(){}
  
  public int getSize(){
    return 2;
  }
  
  public int getColor(){
    return BLUE;
  }
}
