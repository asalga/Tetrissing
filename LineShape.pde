public class LineShape implements IShape{
  
  int[][] shape;
  int state;
  int _color;
  
  LineShape(){
    shape = new int[4][4];
    state = 0;
    changeShape();
    _color = getRandomInt(1, 4);
  }
  
  public int[][] getArr(){
    return shape;
  }
  
  public void rotate(){
    state++;
    if(state > 1 ){
      state = 0;
    }
    
    changeShape();
  }
  
  public void unRotate(){
    state--;
    if(state < 0){
      state = 1;
    }
    changeShape();
  }
  
  public int getSize(){
    return 4;
  }
  
  public int getColor(){
    return _color;
  }
  
  public void changeShape(){
    if(state == 0){
      shape[0] = new int[]{0, 1, 0, 0};
      shape[1] = new int[]{0, 1, 0, 0};
      shape[2] = new int[]{0, 1, 0, 0};
      shape[3] = new int[]{0, 1, 0, 0};
    }
    else if(state == 1){
      shape[0] = new int[]{0, 0, 0, 0};
      shape[1] = new int[]{0, 0, 0, 0};
      shape[2] = new int[]{1, 1, 1, 1};
      shape[3] = new int[]{0, 0, 0, 0};
    }
  }
}
