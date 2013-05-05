/**
*/
public class Shape{
  
  int[][] shape;
  int spacesOnRight;
  int spacesOnLeft;
  int state;
  int size;
  int numStates;
  int _color;
  
  public Shape(){
    state = 0;
  }

  public int[][] getArr(){
    return shape;
  }
  public void changeShape(){
  }
  
  public void rotate(){
    state++;
    if(state >= numStates){
      state = 0;
    }
    changeShape();
  }
  

  
  public void unRotate(){
    state--;
    if(state < 0){
      state = numStates - 1;
    }
    changeShape();
  }
  
  public int getSize(){
    return size;
  }
  
  public int getColor(){
    return _color;
  }
  
  public int getEmptySpacesOnRight(){
    return spacesOnRight;
  }
  
  public int getEmptySpacesOnLeft(){
    return spacesOnLeft;
  }
}
