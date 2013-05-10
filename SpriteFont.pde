/*
  - Allow drawing with \n
  - Allow specifying block
  - Kerning should be taken care of automatically when drawing text
  - 
*/
public class SpriteFont{
  private PImage chars[];
  private int charWidth;
  
  /*
    inImage
  */
  PImage truncateImage(PImage inImage){
    
    int startX = 0;
    int endX = inImage.width - 1;
    int x, y;

    // Find the starting X coord of the image.
    for(x = inImage.width; x >= 0 ; x--){
      for(y = 0; y < inImage.height; y++){
        
        color testColor = inImage.get(x,y);
        if( alpha(testColor) > 0.0){
          startX = x;
        }
      }
    }

   // Find the ending coord
    for(x = 0; x < inImage.width; x++){
      for(y = 0; y < inImage.height; y++){
        
        color testColor = inImage.get(x,y);
        if( alpha(testColor) > 0.0){
          endX = x;
        }
      }
    }
    
    return inImage.get(startX, 0, endX+1, inImage.height); 
  }
  
  
  // Do not instantiate directly
  public SpriteFont(String imageFilename, int charWidth, int charHeight, int borderSize){
    this.charWidth = charWidth;
    
    PImage fontSheet = loadImage(imageFilename);
    
    chars = new PImage[96];
    
    int x = 0;
    int y = 0;
    
    //
    //
    for(int currChar = 0; currChar < 96; currChar++){  
      chars[currChar] = fontSheet.get(x, y, charWidth, charHeight);
     // image(chars[currChar], x, y);
      x += charWidth + borderSize;
      if(x >= fontSheet.width){
        x = 0;
        y += charHeight + borderSize;
      }
    }
    
    
    // For each character, truncate the x margin
    for(int currChar = 0; currChar < 96; currChar++){
      chars[currChar] = truncateImage( chars[currChar] );
    }
  }
  
  //public static void create(String imageFilename, int charWidth, int charHeight, int borderSize){ 
  //PImage fontSheet = loadImage(imageFilename);
  public PImage getChar(char ch){
    int asciiCode = charCodeAt(ch);
    return chars[asciiCode-32];
  }
  
  public int getCharWidth(){
    return charWidth;
  }
}
