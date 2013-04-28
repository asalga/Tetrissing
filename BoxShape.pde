public class BoxShape implements IShape{
  int[][] shape;
  int _color;
  
  BoxShape(){
    shape = new int[2][2];
    shape[0] = new int[]{1, 1};
    shape[1] = new int[]{1, 1};
    _color = getRandomInt(1,4);
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
    return _color;
  }
}
