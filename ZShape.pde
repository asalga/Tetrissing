public class ZShape extends Shape{
  
  ZShape(){
    size = 3;
    numStates = 2;
    _color = BABYBLUE;
    changeShape();
  }
    
  public void changeShape(){
    if(state == 0){
      spacesOnRight = 0;
      spacesOnLeft = 0;
      shape = new int[][]{ {1, 1, 0},
                           {0, 1, 1},
                           {0, 0, 0}
                          };
    }
    else if(state == 1){
      spacesOnRight = 1;
      spacesOnLeft = 0;
      shape = new int[][]{ {0, 1, 0},
                           {1, 1, 0},
                           {1, 0, 0}
                          };
    }
  }
}
