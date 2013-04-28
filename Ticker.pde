/**
 * A ticker class to manage animation timing.
*/
public class Ticker{

  private int lastTime;
  private float deltaTime;
  private boolean isPaused;
  
  public Ticker(){
    reset();
  }
  
  public void reset(){
    deltaTime = 0f;
    lastTime = -1;
    isPaused = false;
  }
  
  //
  public void pause(){
    isPaused = true;
  }
  
  public void resume(){
    if(isPaused == true){
      reset();
    }
  }
  
  /*
   */
  public float getDeltaSec(){
    if(isPaused){
      return 0;
    }
    return deltaTime;
  }
  
  /*
   * Calculates how many seconds passed since the last call to this method.
   *
   */
  public void tick(){
    
   // if(isPaused){
     // return 0;
    //}
    
    if(lastTime == -1){
      lastTime = millis();
    }
    
    int delta = millis() - lastTime;
    lastTime = millis();
    deltaTime = delta/1000f;
    //return delta/1000f;
  }
}
