public class SoundManager{
  boolean muted = false;
  Minim minim;
  AudioPlayer dropPiece;
  AudioPlayer clearLine;
  
  public void init(){
  }
  
  public SoundManager(PApplet applet){
    minim = new Minim(applet);
  
    dropPiece = minim.loadFile("audio/dropPiece.wav");
    clearLine = minim.loadFile("audio/clearLine.wav");
  }
  
  public void setMute(boolean isMuted){
    muted = isMuted;
  }
  
  public  void playDropPieceSound(){
    if(muted){
      return;
    }
    dropPiece.play();
    dropPiece.rewind();
  }
  
  public void playClearLinesSound(){
    if(muted){
      return;
    }
    clearLine.play();
    clearLine.rewind();
  }
  
  /* Should we have 4 different sounds for the number of lines cleared?
   */
  public void playSoundByLinesCleared(int linesCleared){
    if(muted){
      return;
    }
    
    playClearLinesSound();
  }
  
  public void playClearTetrisSound(){
    if(muted){
      return;
    }
  }
  
  public void stop(){
    //dropPiece.close();
    // minim.stop();
    //super.stop();
  }
}
