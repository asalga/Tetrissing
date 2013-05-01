public class IShape implements Shape{
  
  int[][] shape;
  int state;
  int spacesOnRight;
  int spacesOnLeft;
  
  IShape(){
    shape = null;
    state = 0;
    changeShape();
  }
  
  public int getEmptySpacesOnRight(){
    return spacesOnRight;
  }
  
  public int getEmptySpacesOnLeft(){
    return spacesOnLeft;
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
    return RED;
  }
  
  public void changeShape(){
    if(state == 0){
      spacesOnRight = 2;
      spacesOnLeft = 1;
      shape = new int[][] { {0, 1, 0, 0},
                            {0, 1, 0, 0},
                            {0, 1, 0, 0},
                            {0, 1, 0, 0}
                          };
    }
    else if(state == 1){
      spacesOnRight = 0;
      spacesOnLeft = 0;
      shape = new int[][] { {0, 0, 0, 0},
                            {0, 0, 0, 0},
                            {1, 1, 1, 1},
                            {0, 0, 0, 0}
                          };
    }
  }
}
