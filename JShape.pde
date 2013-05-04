public class JShape implements Shape{
  
  int[][] shape;
  int state;
  int spacesOnLeft;
  int spacesOnRight;
  
  JShape(){
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
    return ORANGE;
  }
  
  public void changeShape(){
    if(state == 1){
      spacesOnLeft = 0;
      spacesOnRight = 1;
      shape = new int[][] { {0, 1, 0},
                            {0, 1, 0},
                            {1, 1, 0}
                          };
    }
    else if(state == 0){
      spacesOnLeft = 0;
      spacesOnRight = 0;
      shape = new int[][] { {0, 0, 0},
                            {1, 1, 1},
                            {0, 0, 1}
                          };
    }
    else if(state == 3){
      spacesOnLeft = 1;
      spacesOnRight = 0;
      shape = new int[][] { {0, 1, 1},
                            {0, 1, 0},
                            {0, 1, 0}
                          };
    }
    else if(state == 2){
      spacesOnLeft = 0;
      spacesOnRight = 0;
      shape = new int[][] { {1, 0, 0},
                            {1, 1, 1},
                            {0, 0, 0}
                          };
    }
  }
}
