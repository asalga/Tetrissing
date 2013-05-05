public class JShape extends Shape{
    
  JShape(){
    size = 3;
    numStates = 4;
    _color = ORANGE;
    changeShape();
  }
  
  public void changeShape(){
    if(state == 0){
      spacesOnLeft = 0;
      spacesOnRight = 0;
      shape = new int[][] { {0, 0, 0},
                            {1, 1, 1},
                            {0, 0, 1}
                          };
    }
    else if(state == 1){
      spacesOnLeft = 0;
      spacesOnRight = 1;
      shape = new int[][] { {0, 1, 0},
                            {0, 1, 0},
                            {1, 1, 0}
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
    else if(state == 3){
      spacesOnLeft = 1;
      spacesOnRight = 0;
      shape = new int[][] { {0, 1, 1},
                            {0, 1, 0},
                            {0, 1, 0}
                          };
    }
  }
}
