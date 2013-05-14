public class ClearLineAnimator{
  
  private Ticker lifeTimeTicker;
  private Ticker ticker;
  
  private ArrayList rowIndicesToClear;
  //private ArrayList<float> sd;
  
  private boolean alive;
  private boolean doesAffectBoard;
  private boolean drawingClearLine;
  
  public boolean isAlive(){
    return alive;
  }
  
  public ClearLineAnimator(){
    ticker = new Ticker();
    lifeTimeTicker = new Ticker();
    alive = true;
    doesAffectBoard = true;
    drawingClearLine = true;
  }
  
  public void setRowIndicesToClear(ArrayList rowIndicesToClear){
    this.rowIndicesToClear = rowIndicesToClear;
  }
  
  public boolean DoesAffectBoard(){
    return doesAffectBoard;
  }
  
  public void update(){
    ticker.tick();
    lifeTimeTicker.tick();
    
    if(lifeTimeTicker.getTotalTime() > 0.25f){
      doesAffectBoard = false;
    }
    
    if(lifeTimeTicker.getTotalTime() > 0.25f){
      alive = false;
    }
    
    if(ticker.getTotalTime() > 0.01f){
      ticker.reset();
      drawingClearLine = !drawingClearLine;
    }
  }
  
  public void draw(){
    
    if(drawingClearLine){
      noStroke();
      fill(0);
      
      pushMatrix();
      translate(BOARD_START_X + BLOCK_SIZE, BOARD_START_Y);
      
      for(int i = 0; i < rowIndicesToClear.size(); i++){
        rect(0, ((Integer)rowIndicesToClear.get(i)).intValue() * BLOCK_SIZE, (NUM_COLS-2) * BLOCK_SIZE, BLOCK_SIZE);
      }
      
      popMatrix();
    }
  }
  
}
