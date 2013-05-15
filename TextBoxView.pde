
public class TextBoxView{

  /*public final class Align{
    public static final int LEFT = 0;
    public static final int RIGHT = 1;
    public static final int CENTER = 2;
  }*/
  
  private SpriteFont font;
  private String text;
  private int x, y;
  private int align;
  private boolean visible;
  
  public TextBoxView(){
    text = "";
    x = y = 0;
    visible = true;
  }
  
  public void setVisible(boolean vis){
    visible = vis;
  }
  
  public void setFont(String fontPath){
    font = new SpriteFont(fontPath, 14, 14, 2);
  }
  
  public void setPosition(int x, int y){
    this.x = x;
    this.y = y;
  }
  
  public void render(){
    if(visible == false){
      return;
    }
    
    if(font == null){
      return;
    }
    
    pushMatrix();
    translate(x, y);
    for(int i = 0; i < text.length(); i++){
      PImage charToPrint = font.getChar(text.charAt(i));
      image(charToPrint, x, y);
      x += font.getCharWidth() + 2;
    }
    popMatrix();
  }
  
  public void setText(String text){
    this.text = text;
  }

}
