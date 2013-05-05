public class TShape extends Shape{
  
  TShape(){
    size = 3;
    numStates = 4;
    _color = OLIVE;  
    changeShape();
  }
  
  public void changeShape(){
    if(state == 0){
      spacesOnRight = 0;
      spacesOnLeft = 0;
      shape = new int[][] { {0, 1, 0},
                            {1, 1, 1},
                            {0, 0, 0}
                          };
    }
    else if(state == 1){
      spacesOnRight = 0;
      spacesOnLeft = 1;
      shape = new int[][] { {0, 1, 0},
                            {0, 1, 1},
                            {0, 1, 0}
                          };
    }
    else if(state == 2){
      spacesOnRight = 0;
      spacesOnLeft = 0;
      shape = new int[][] { {0, 0, 0},
                            {1, 1, 1},
                            {0, 1, 0}
                          };
    }
    else{
      spacesOnRight = 0;
      spacesOnLeft = 0;
      shape = new int[][] { {0, 1, 0},
                            {1, 1, 0},
                            {0, 1, 0}
                          };
    }
  }
}
