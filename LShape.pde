public class LShape implements Shape{
  
  int[][] shape;
  int state;
  
  LShape(){
    shape = new int[3][3];
    state = 0;
    changeShape();
  }
  
  public int[][] getArr(){
    return shape;
  }
  
  public void rotate(){
    state++;
    if(state > 3 ){
      state = 0;
    }
    
    changeShape();
  }
  
  public void unRotate(){
    state--;
    if(state < 0){
      state = 3;
    }
    changeShape();
  }
  
  public int getSize(){
    return 3;
  }
  
  public int getColor(){
    return MAGENTA;
  }
  
  public void changeShape(){
    if(state == 0){
      shape[0] = new int[]{0, 0, 0};
      shape[1] = new int[]{1, 1, 1};
      shape[2] = new int[]{0, 0, 1};
    }
    else if(state == 1){
      shape[0] = new int[]{0, 1, 0};
      shape[1] = new int[]{0, 1, 0};
      shape[2] = new int[]{1, 1, 0};
    }
    else if(state == 2){
      shape[0] = new int[]{1, 0, 0};
      shape[1] = new int[]{1, 1, 1};
      shape[2] = new int[]{0, 0, 0};
    }
    else if(state == 3){
      shape[0] = new int[]{0, 1, 1};
      shape[1] = new int[]{0, 1, 0};
      shape[2] = new int[]{0, 1, 0};
    }
  }
}
