/*
 @pjs preload="data/images/bk.png,data/fonts/null_terminator_2x.png,data/images/red.png,data/images/blue.png,data/images/babyblue.png,data/images/green.png, data/images/orange.png, data/images/pink.png";
 */ 
import ddf.minim.*;

final boolean DEBUG = false;

final int T_SHAPE = 0;
final int L_SHAPE = 1;
final int J_SHAPE = 2;
final int I_SHAPE = 3;
final int O_SHAPE = 4;
final int Z_SHAPE = 5;
final int S_SHAPE = 6;

final int EMPTY    = 0;
final int RED      = 1;
final int ORANGE   = 2;
final int PINK     = 3;
final int BLUE     = 4;
final int GREEN    = 5;
final int PURPLE   = 6;
final int BABYBLUE = 7;
final int WHITE    = 8;

// TODO: fix this
PImage[] images = new PImage[9];

int level;
int score;

final int SCORE_1_LINE  = 100;
final int SCORE_2_LINES = 250;
final int SCORE_3_LINES = 500;
final int SCORE_4_LINES = 600;

final int MAX_LEVELS = 5;
int scoreForThisLevel;
int[] scoreReqForNextLevel = new int[]{  SCORE_4_LINES * 2,
                                         SCORE_4_LINES * 4,
                                         SCORE_4_LINES * 6,
                                         SCORE_4_LINES * 8,
                                         SCORE_4_LINES * 10};

Ticker clearLineTicker;



boolean clearingLines = false;

int[] shapeStats;

Shape currentShape;
int currShapeCol;
int currShapeRow;

Queue nextPieceQueue;

PImage backgroundImg;

//
int ghostShapeCol;
int ghostShapeRow;

boolean hasLostGame;
boolean didDrawGameOver = false;


final float TAP_LEN_IN_SEC = 0.1f;
boolean holdingDownLeft = false;
float moveBuffer = 0f;

boolean holdingDownRight = false;
float rightBuffer = 0f;

float blocksPerSecond = 10.0f;

// Add 2 for left and right borders and 1 for floor
final int NUM_COLS = 12;  // 10 cols + 2 for border
final int NUM_ROWS = 25;  // 25 rows + 1 floor + 4 extra
final int CUT_OFF_INDEX = 3;

// Don't include the floor
final int LAST_ROW_INDEX = NUM_ROWS - 2;

// TODO: refactor to BLOCK_SIZE
int BOX_SIZE = 16;

final int BOARD_W_IN_PX = NUM_COLS * BOX_SIZE;
final int BOARD_H_IN_PX = NUM_ROWS * BOX_SIZE + (BOX_SIZE * 4);

int[][] grid = new int[NUM_COLS][NUM_ROWS];

float sideSpeed = 3f;
float dropSpeed = 0.5f;

Debugger debug;
Ticker dropTicker;
Ticker leftMoveTicker;
Ticker rightMoveTicker;

SoundManager soundManager;

// --- FEATURES ---
boolean allowKickBack= true;
boolean allowDrawingGhost = false;
boolean allowFadeEffect = false;

// Font stuff
SpriteFont largeFont;
SpriteFont smallFont;

/*
 */
public void setup(){
  size(284, 464);
  
  // TODO: fix this
  //images[0] = loadImage("data/images/red.png");
  images[RED] = loadImage("data/images/red.png");
  images[ORANGE] = loadImage("data/images/orange.png");
  images[BLUE] = loadImage("data/images/blue.png");
  images[PINK] = loadImage("data/images/pink.png");
  images[GREEN] = loadImage("data/images/green.png");
  images[PURPLE] = loadImage("data/images/purple.png");
  images[BABYBLUE] = loadImage("data/images/babyblue.png");
  images[WHITE] = loadImage("data/images/babyblue.png");
  
  backgroundImg = loadImage("data/images/bk.png");
  
  // Large font used for level, score, "Game Over" and "Paused"
  // Small font is used for some instructions
  largeFont = new SpriteFont("data/fonts/null_terminator_2x.png", 14, 14, 2);
  smallFont = new SpriteFont("data/fonts/null_terminator.png", 7, 7, 1);
  
  debug = new Debugger();
  soundManager = new SoundManager(this);
  soundManager.init();
  
  // Timers
  clearLineTicker = new Ticker();
  dropTicker = new Ticker();
  leftMoveTicker = new Ticker();
  rightMoveTicker = new Ticker();

  restartGame();
  
  // P = pause
  // G = ghost
  // F = fade
  // K = kickback
  // M = mute
  Keyboard.lockKeys(new int[]{KEY_P, KEY_G, KEY_F, KEY_K, KEY_M});
  
  // Assume the user wants kickback and muted
  Keyboard.setKeyDown(KEY_K, true);
  Keyboard.setKeyDown(KEY_M, true);
}

/*
 */
public void drawShape(Shape shape, int colPos, int rowPos){
  int[][] arr = shape.getArr();
  int shapeSize = shape.getSize();
    
  for(int c = 0; c < shapeSize; c++){
    for(int r = 0; r < shapeSize; r++){
      
      // Transposing here!
      if(arr[r][c] != 0){
        image(getImageFromID(shape.getColor()), (c * BOX_SIZE) + (colPos * BOX_SIZE), (r * BOX_SIZE) + (rowPos * BOX_SIZE));
      }
    }
  }
}

/*
 */
public Shape getRandomPiece(){
  int randInt = getRandomInt(0, 6);
  
  shapeStats[randInt]++;
  
  if(randInt == T_SHAPE) return new TShape();
  if(randInt == L_SHAPE) return new LShape();
  if(randInt == Z_SHAPE) return new ZShape();
  if(randInt == O_SHAPE) return new OShape();
  if(randInt == J_SHAPE) return new JShape();
  if(randInt == I_SHAPE) return new IShape();
  else                   return new SShape();
}

public void createPiece(){
  currentShape = (Shape)nextPieceQueue.popFront(); 
  
  currShapeRow = 0;
  currShapeCol = NUM_COLS/2;
  
  nextPieceQueue.pushBack(getRandomPiece());
}

/**
 */
public void clearGrid(){
  for(int c = 0; c < NUM_COLS; c++){
    for(int r = 0; r < NUM_ROWS; r++){
      grid[c][r] = EMPTY;
    }
  }
}

/*
 */
public void createBorders(){
  for(int col = 0; col < NUM_COLS; col++){
    grid[col][NUM_ROWS - 1] = WHITE;
  }
  
  for(int row = 0; row < NUM_ROWS; row++){
    grid[0][row] = WHITE;
  }

  for(int row = 0; row < NUM_ROWS; row++){
    grid[NUM_COLS-1][row] = WHITE;
  }
}

/* Start from the position of the current shape and 
 * keep going down until we find a collision.
 */
public void findGhostPiecePosition(){
  //
  //if(allowDrawingGhost == false){
  //  return;
  //}
  
  ghostShapeCol = currShapeCol;
  ghostShapeRow = currShapeRow;
  
  // If we move the shape down one row and it will not result in a collision, 
  // we can safely move the ghost piece row.
  while(checkShapeCollision(currentShape, ghostShapeCol, ghostShapeRow + 1) == false){
    ghostShapeRow++;
  }
}

/*
 */
public void drawBackground(){
  pushStyle();
  noFill();
  strokeWeight(1);
  stroke(255, 16);
  
  // Draw a translucent grid
  for(int cols = 0; cols < NUM_COLS; cols++){
    for(int rows = CUT_OFF_INDEX; rows < NUM_ROWS; rows++){
      rect(cols * BOX_SIZE, rows * BOX_SIZE, BOX_SIZE, BOX_SIZE);
    }
  }
  popStyle();
}

/*
 */
public boolean checkShapeCollision(Shape shape, int shapeCol, int shapeRow){
  int[][] arr = shape.getArr();
  int shapeSize = shape.getSize();
  
  // Iterate over the shape
  for(int c = 0; c < shapeSize; c++){
    for(int r = 0; r < shapeSize; r++){
     
      // An IShape could trigger an out of bounds exception.
      if(shapeCol + c >= NUM_COLS){
        continue;
      }
      
      if(shapeCol + c < 0){
        continue;
      }

      if(shapeRow + r >= NUM_ROWS){
        continue;
      }
      
      // Shape starts out out of the grid bounds.
      if(shapeRow + r < 0){
        continue;
      }
   
      // Transposed here!
      if(grid[shapeCol + c][shapeRow + r] != EMPTY && arr[r][c] != EMPTY){
        return true;
      }
    }
  }
  
  return false;
}


/**
 * Try to move a shape left or right. Use -ve values to move it left
 * and +ve values to move it right.
 */
public void moveSideways(int amt){
  currShapeCol += amt;
  
  if(checkShapeCollision(currentShape, currShapeCol, currShapeRow)){
    currShapeCol -= amt;
  }
}
    
/*
 */
public void update(){
  
  soundManager.setMute(Keyboard.isKeyDown(KEY_M));
  
  dropSpeed =  Keyboard.isKeyDown(KEY_DOWN)  ? 0.001f : 0.5f;
  sideSpeed =  Keyboard.isKeyDown(KEY_LEFT) ||  Keyboard.isKeyDown(KEY_RIGHT) ? 0.08f : 0f;
  
  // Features
  allowFadeEffect   = Keyboard.isKeyDown(KEY_F);
  allowKickBack     = Keyboard.isKeyDown(KEY_K);
  allowDrawingGhost = Keyboard.isKeyDown(KEY_G);
    
  dropTicker.tick();
  
  if(dropTicker.getTotalTime() >= dropSpeed){
    dropTicker.reset();
    
    if(currentShape != null){
      
      // If moving the current piece down one row results in a collision, we can add it to the board
      if(checkShapeCollision(currentShape, currShapeCol, currShapeRow + 1)){
        addPieceToBoard(currentShape);
      }
      else{
        currShapeRow++;
      }
    }
  }
  

  
  if(Keyboard.isKeyDown(KEY_LEFT) && Keyboard.isKeyDown(KEY_RIGHT)){
    rightMoveTicker.reset();
  }
  
  // If the player just let go of the left key, but they were holding it down, make sure not
  // to move and extra bit that the tap key condition would hit.
  else if(Keyboard.isKeyDown(KEY_LEFT) == false && holdingDownLeft == true){
    holdingDownLeft = false;
    leftMoveTicker.reset();
    moveBuffer = 0f;
  }
  // If the key hit was a tap, nudge the piece one block
  else if(Keyboard.isKeyDown(KEY_LEFT) == false && moveBuffer > 0f){
    leftMoveTicker.reset();
    moveBuffer = 0;
    moveSideways(-1);
  }
  // If the user is holding down the left key
  else if( Keyboard.isKeyDown(KEY_LEFT) ){
    leftMoveTicker.tick();
    
    moveBuffer += leftMoveTicker.getDeltaSec() * blocksPerSecond;
     
    // If we passed the tap threshold
    if(leftMoveTicker.getTotalTime() >= 0.1f){
      holdingDownLeft = true;
      
      // Only alllow moving one block at a time to prevent the need to move
      // back if a collision occurred.
      if(moveBuffer > 1.0f){
        moveBuffer -= 1.0f;
        moveSideways(-1);
      }
    }
  }
  
    
  // If the player just let go of the right key, but they were holding it down, make sure not
  // to move and extra bit that the tap key condition would hit.
  else if( Keyboard.isKeyDown(KEY_RIGHT) == false && holdingDownRight == true){
    holdingDownRight = false;
    rightMoveTicker.reset();
    rightBuffer = 0f;
  }
  // If the key hit was a tap, nudge the piece one block
  else if(Keyboard.isKeyDown(KEY_RIGHT) == false && rightBuffer > 0f){
    rightMoveTicker.reset();
    rightBuffer = 0;
    moveSideways(1);
  }
  
  // If the user is holding down the right key
  else if( Keyboard.isKeyDown(KEY_RIGHT) ){
    rightMoveTicker.tick();
    rightBuffer += rightMoveTicker.getDeltaSec() * blocksPerSecond;
    
    // If we passed the tap threshold
    if(rightMoveTicker.getTotalTime() >= 0.12f){
      holdingDownRight = true;
      
      // Only alllow moving one block at a time to prevent the need to move
      // back if a collision occurred.
      if(rightBuffer > 1.0f){
        rightBuffer -= 1.0f;
        moveSideways(1);
      }
    }
  }
  
  findGhostPiecePosition();
  
  //debug.addString("----------------");
  /*debug.addString("F - Toggle Fade effect " + getOnStr(Keyboard.isKeyDown(KEY_F)));
  debug.addString("G - Toggle Ghost piece ");
  debug.addString("K - Toggle Kick back " + getOnStr(Keyboard.isKeyDown(KEY_K)));
  debug.addString("M - Mute " + getOnStr(Keyboard.isKeyDown(KEY_M)));
  debug.addString("P - Pause game");*/
}

public String getOnStr(boolean b){
  return b ? "(on)" : "(off)";
}

/*
* 
*/
public void addPieceToBoard(Shape shape){
  int[][] arr = shape.getArr();
  int shapeSize = shape.getSize();
  int col = shape.getColor();
  
  for(int c = 0; c < shapeSize; c++){
    for(int r = 0; r < shapeSize; r++){
      
      // Transposing here!
      if(arr[r][c] != EMPTY){
        grid[currShapeCol + c][currShapeRow + r] = col;
      }
    }
  }
  
  if(addedBoxInCutoff()){
    hasLostGame = true;
    return;
  }
  
  int numLinesToClear = getNumLinesToClear();
  
  // TODO: clean this
  switch(numLinesToClear){
    case 0: soundManager.playDropPieceSound(); break;
    case 1: scoreForThisLevel += 100;score += 100;break;
    case 2: scoreForThisLevel += 250;score += 250;break;
    case 3: scoreForThisLevel += 450;score += 450;break;
    case 4: soundManager.playClearLinesSound();scoreForThisLevel += 800;score += 800;break;
    default: break;
  }
  
  
  // play score sound
  //
  
  // increse score
  //
  
  
  //
  if(level < MAX_LEVELS - 1 && scoreForThisLevel >= scoreReqForNextLevel[level]){
    scoreForThisLevel = 0;
    level++;
  }
  
  removeFilledLines();
  
  createPiece();
}

/**
 * returns a value from 0 - 4
 */
public int getNumLinesToClear(){
  int numLinesToClear = 0;
  
  // Don't include the floor and we technically
  // don't need to include the cut off index.
  for(int row = LAST_ROW_INDEX; row > CUT_OFF_INDEX; row--){
    
    boolean lineFull = true;
    for(int col = 1; col < NUM_COLS - 1; col++){
      if(grid[col][row] == EMPTY){
        lineFull = false;
      }
    }
    
    if(lineFull){
      numLinesToClear++;
    }
  }
  
  return numLinesToClear;
}

/* Start from the bottom row. If we found a full line,
 * copy everythng from the row above that line to
 * the current one.
 */
public void removeFilledLines(){

  for(int row = LAST_ROW_INDEX; row > CUT_OFF_INDEX; row--){
    boolean isLineFull = true;
    for(int col = 1; col < NUM_COLS - 1; col++){
      if(grid[col][row] == EMPTY){
        isLineFull = false;
      }
    }
    
    if(isLineFull){
      moveBlocksDownAboveRow(row);
      clearingLines = true;
      
      // Start from the bottom again
      row = NUM_ROWS - 1;
    }
  }
}

/* This is separate from removeFilledLines to keep the code a bit more clear.
 * Move all the blocks that are above the given row down 1 block
 * @see removeFilledLines
 */
public void moveBlocksDownAboveRow(int row){
  // TODO: add bounds check
  if(row >= NUM_ROWS || row <= CUT_OFF_INDEX){
    return;
  }
  
  // Go from given row to top of the board.
  for(int r = row; r > CUT_OFF_INDEX; r--){
    for(int c = 1; c < NUM_COLS-1; c++){
      grid[c][r] = grid[c][r-1];
    }
  }
}

/** Immediately place the piece into the board.
 */
public void dropPiece(){
  boolean foundCollision = false;
  
  while(foundCollision == false){ 
    currShapeRow++;
    if(checkShapeCollision(currentShape, currShapeCol, currShapeRow)){
      currShapeRow--;
      addPieceToBoard(currentShape);
      foundCollision = true;
    }
  }
}

/* Inspects the board and checks if the player tried
 * to add a part of a piece in the cutoff row, they lose.
 */
public boolean addedBoxInCutoff(){
  for(int c = 1; c < NUM_COLS - 1; c++){
    if(grid[c][CUT_OFF_INDEX] != EMPTY){
      return true;
    }
  }
  return false;
}

/*
 */
public int getRandomInt(int minVal, int maxVal) {
  return (int)random(minVal, maxVal + 1);
}

/**
 */
public void draw(){
  
  if(hasLostGame && Keyboard.isKeyDown(KEY_R)){
    restartGame();
  }
  
  if(didDrawGameOver){
    return;
  }

  if(hasLostGame){
    showGameOver();
    return;
  }
  
  if(Keyboard.isKeyDown(KEY_P) ){
    showGamePaused();
    return;
  }
  
  
  
  update();
  
  /*if(clearingLines){
    clearLineTicker.tick();
    if(clearLineTicker.getTotalTime() < 0.5f){
      return;
    }
    else{
      clearLineTicker.reset();
      clearingLines = false;
    }
  }*/
  
  if(allowFadeEffect){
    pushStyle();
    fill(0, 32);
    noStroke();
    rect(0, 0, width, height);
    popStyle();  
  }
  else{
    background(0);
  }
  
  
  
  
  // Draw cutoff
  /*pushMatrix();
  translate(0, BOX_SIZE * 3);
  pushStyle();
  fill(45, 0, 0, 200);
  rect(0, 0, BOX_SIZE * NUM_COLS, BOX_SIZE);
  popStyle();
  popMatrix();*/
  
  pushMatrix();
  translate(10, BOX_SIZE * 4 -4);
  drawBoard();
  
  
  
  findGhostPiecePosition();
  drawGhostPiece();

  drawShape(currentShape, currShapeCol, currShapeRow);
  
  //drawBackground();
    popMatrix();
    
    
  image(backgroundImg, 0, 0);
  //drawBorders();
  
  pushMatrix();
  translate(-100, 200);
  drawNextShape();
  popMatrix();
    
  // Draw debugging stuff on top of everything else
  pushMatrix();
  translate(200, 40);
  pushStyle();
  stroke(255);
  debug.draw();
  popStyle();
  popMatrix();

  drawScoreAndLevel();
      
  debug.clear();
}

/**
 */
public void drawScoreAndLevel(){
  drawText(largeFont, "LEVEL " + str(level+1), 50, 20);
  drawText(largeFont, "SCORE " + str(score), 50, 40);
}

// Encapsulate
public int charCodeAt(char ch){
  return ch;
}

/**
 */
public void restartGame(){
  
  // We 'add' 1 to this before we render
  level = 0;
  scoreForThisLevel = 0;
  score = 0;
  hasLostGame = false;
  didDrawGameOver = false;
  
  shapeStats = new int[]{0, 0, 0, 0, 0, 0, 0};
  
  clearGrid();
  createBorders();

  // It would be strange if the next pieces always stuck
  // around from end of one game to the start of the next.
  nextPieceQueue = new Queue();
  for(int i = 0; i < 3; i++){
    nextPieceQueue.pushBack(getRandomPiece());
  }
  
  createPiece();
}

/**
  * TODO: fix me
 */
public void drawText(SpriteFont font, String text, int x, int y){
  
  for(int i = 0; i < text.length(); i++){
    PImage charToPrint = font.getChar(text.charAt(i));
    image(charToPrint, x, y);
    x += font.getCharWidth() + 2;
  }
}

/**
 */
public void drawNextShape(){
  Shape nextShape = (Shape)nextPieceQueue.peekFront();
  drawShape(nextShape, 20, 0);
}

/* A ghost piece shows where the piece the user
 * is currently holding will end up.
 */
public void drawGhostPiece(){
  if(allowDrawingGhost == false){
    return;
  }
  
  //pushStyle();
  //color col = getColorFromID(currentShape.getColor());
  //float opacity = (ghostShapeRow - currShapeRow) / (float)NUM_ROWS * 32;
  //fill(col, opacity);
  //stroke(col, opacity * 5); 
  drawShape(currentShape, ghostShapeCol, ghostShapeRow);
  //popStyle();
}

public PImage getImageFromID(int col){
  return images[col];
}

/*
 * Rotating the shape may fail if rotating the shape results in
 * a collision with another piece on the board.
 */
public void requestRotatePiece(){
  
  // We try to rotate the shape, if it fails, we undo the rotation.
  currentShape.rotate();
      
  //
  //
  //
  int pos = currShapeCol;  
  int size = currentShape.getSize();
  int emptyRightSpaces = currentShape.getEmptySpacesOnRight();
  int emptyLeftSpaces = currentShape.getEmptySpacesOnLeft();
  
  int amountToShiftLeft = pos + size - emptyRightSpaces - (NUM_COLS-1);
  int amountToShiftRight = 1 - (pos - emptyLeftSpaces);
  
  if(DEBUG){
    println("pos: " + pos);
    println("amountToShiftLeft: " + amountToShiftLeft);
    println("amountToShiftRight: " + amountToShiftRight);
    println("emptyLeftSpaces: " + emptyLeftSpaces);
  }
  
  // If we are allowing the user to rotate the piece, even
  // if the piece is flush against the wall. 
  if(allowKickBack){
    // TODO: fix this hack
    // If one part of the piece is touching the right border
    if(amountToShiftRight > 0 && pos <= 0){
      currShapeCol += amountToShiftRight;
  
      // If the shape is still colliding (maybe from hitting somehtnig on the left side of the shape
      if(checkShapeCollision(currentShape, currShapeCol, currShapeRow)){
        currShapeCol -= amountToShiftRight;
      }
    }
    
    if(amountToShiftLeft > 0 ){
      currShapeCol -= amountToShiftLeft;
  
      // If the shape is still colliding (maybe from hitting somehtnig on the left side of the shape
      if(checkShapeCollision(currentShape, currShapeCol, currShapeRow)){
        currShapeCol += amountToShiftLeft;
      }
    }
  }
    
  if(checkShapeCollision(currentShape, currShapeCol, currShapeRow)){
    currentShape.unRotate();
  }
}

/*
 */
public void keyPressed(){
  
  if(keyCode == KEY_UP){
    requestRotatePiece();
  }
  
  Keyboard.setKeyDown(keyCode, true);
}

public void keyReleased(){
 
  if(keyCode == KEY_SPACE){
    dropPiece();
  }
  
  Keyboard.setKeyDown(keyCode, false);
}

/**
 * Iterate from 1 to NUM_COLS-1 because we don't want to draw the borders.
 * Same goes for not drawing the last row.
 */
public void drawBoard(){
  for(int cols = 1; cols < NUM_COLS-1; cols++){
    for(int rows = 0; rows < NUM_ROWS-1; rows++){
      drawBox(cols, rows, grid[cols][rows]);
    }
  }
}

/* Draw the board borders
 */
public void drawBorders(){
  pushStyle();
  noStroke();
  fill(256, 256, 256);
  
  // Floor
  for(int col = 0; col < NUM_COLS; col++){
    rect(col * BOX_SIZE, (NUM_ROWS-1) * BOX_SIZE, BOX_SIZE, BOX_SIZE);
  }
  
  for(int row = 2; row < NUM_ROWS; row++){
    rect(0, row * BOX_SIZE, BOX_SIZE, BOX_SIZE);
  }

  for(int row = 2; row < NUM_ROWS; row++){
    rect((NUM_COLS-1) * BOX_SIZE, row * BOX_SIZE, BOX_SIZE, BOX_SIZE);
  }
  popStyle();
}

/*
 *
 */
public void drawBox(int col, int row, int _color){
  if(_color != EMPTY){
    image(getImageFromID(_color), col * BOX_SIZE, row * BOX_SIZE);
  }
}

/*
 */
public void showGamePaused(){
  pushStyle();
  fill(128, 0, 0, 1);
  noStroke();
  rect(0, 0, width, height);
  popStyle();
  
  image(backgroundImg, 0, 0);
  
  drawText(largeFont, "PAUSED", 60, 250);
  drawText(smallFont, "Hit P to unpause", 30, 300);
  
  drawScoreAndLevel();
}

/*
 * Overlay a semi-transparent layer on top of the board to hint
 * the game is no longer playable.
 */
public void showGameOver(){
  pushStyle();
  fill(128, 0,0,128);
  noStroke();
  rect(0, 0, width, height);
  popStyle();
  
  image(backgroundImg, 0, 0);
  drawText(largeFont, "GAME OVER", 30, 250);
  
  drawScoreAndLevel();
  
  drawText(smallFont, "Hit R to restart", 30, 300);
  
  didDrawGameOver = true;
}
/*
 * Prints text on top of everything for real-time object tracking.
 */
class Debugger{
  private ArrayList strings;
  private PFont font;
  private int fontSize;
  private boolean isOn;
  
  public Debugger(){
    isOn = true;
    strings = new ArrayList();
    fontSize = 15;
    font = createFont("Arial", fontSize);
  }
  
  public void addString(String s){
    if(isOn){
      strings.add(s);
    }
  }
  
  /*
   * Should be called after every frame
   */
  public void clear(){
    strings.clear();
  }
  
  /**
    If the debugger is off, it will ignore calls to addString and draw saving
    some processing time.
  */
  public void toggle(){
    isOn = !isOn;
  }
  
  public void draw(){
    if(isOn){
      int y = 20;
      fill(255);
      for(int i = 0; i < strings.size(); i++, y+=fontSize){
        textFont(font);
        text((String)strings.get(i),0,y);
      }
    }
  }
}

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
public class LShape extends Shape{
  
  LShape(){
    size = 3;
    numStates = 4;
    _color = PINK;
    changeShape();
  }
  
  public void changeShape(){
    if(state == 0){
      spacesOnLeft = 0;
      spacesOnRight = 0;
      shape = new int[][] { {0, 0, 0},
                            {1, 1, 1},
                            {1, 0, 0}
                          };
    }
    else if(state == 1){
      spacesOnRight = 1;
      spacesOnLeft = 0;
      shape = new int[][] { {1, 1, 0},
                            {0, 1, 0},
                            {0, 1, 0}
                          };
    }
    else if(state == 2){
      spacesOnRight = 0;
      spacesOnLeft = 0;
      shape = new int[][] { {0, 0, 1},
                            {1, 1, 1},
                            {0, 0, 0}
                          };
    }
    else if(state == 3){
      spacesOnRight = 0;
      spacesOnLeft = 1;
      shape = new int[][] { {0, 1, 0},
                            {0, 1, 0},
                            {0, 1, 1}
                          };
    }
  }
}
/*
 A Queue for the next few pieces.
*/
public class Queue<T>{
  private ArrayList<T> items;
  
  public Queue(){
    items = new ArrayList<T>();
  }

  public void pushBack(T i){
    items.add(i);
  }
 
  public T popFront(){
    T item = items.get(0);
    items.remove(0);
    return item;
  }
  
  public boolean isEmpty(){
    return items.isEmpty();
  }
  
  public int size(){
    return items.size();
  }
  
  public T peekFront(){
    return items.get(0);
  }
  
  public void clear(){
    items.clear();
  }
}
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
/**
 * A ticker class to manage animation timing.
*/
public class Ticker{

  private int lastTime;
  private float deltaTime;
  private boolean isPaused;
  private float totalTime;
  
  public Ticker(){
    reset();
  }
  
  public void reset(){
    deltaTime = 0f;
    lastTime = -1;
    isPaused = false;
    totalTime = 0f;
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
  
  public float getTotalTime(){
    return totalTime;
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
    if(lastTime == -1){
      lastTime = millis();
    }
    
    int delta = millis() - lastTime;
    lastTime = millis();
    deltaTime = delta/1000f;
    totalTime += deltaTime;
  }
}
public class IShape extends Shape{
  
  IShape(){
    size = 4;
    numStates = 2;
    _color = RED;
    changeShape();
  }
  
  public void changeShape(){
    if(state == 0){
      spacesOnRight = 2;
      spacesOnLeft = 1;
      shape = new int[][] { {0, 1, 0, 0},
                            {0, 1, 0, 0},
                            {0, 1, 0, 0},
                            {0, 1, 0, 0}
                          };
    }
    else if(state == 1){
      spacesOnRight = 0;
      spacesOnLeft = 0;
      shape = new int[][] { {0, 0, 0, 0},
                            {0, 0, 0, 0},
                            {1, 1, 1, 1},
                            {0, 0, 0, 0}
                          };
    }
  }
}
/*
 * Classes poll keyboard state to get state of keys.
 */
public static class Keyboard{
  
  private static final int NUM_KEYS = 128;
  
  // Locking keys are good for toggling things.
  // After locking a key, when a user presses and releases a key, it will register and
  // being 'down' (even though it has been released). Once the user presses it again,
  // it will register as 'up'.
  private static boolean[] lockableKeys = new boolean[NUM_KEYS];
  
  // Use char since we only need to store 2 states (0, 1)
  private static char[] lockedKeyPresses = new char[NUM_KEYS];
  
  // The key states, true if key is down, false if key is up.
  private static boolean[] keys = new boolean[NUM_KEYS];
  
  /*
   * The specified keys will stay down even after user releases the key.
   * Once they press that key again, only then will the key state be changed to up(false).
   */
  public static  void lockKeys(int[] keys){
    for(int k : keys){
      if( k > -1 && k < NUM_KEYS){
        lockableKeys[k] = true;
      }
    }
  }
  
  /*
   * TODO: if the key was locked and is down, then we unlock it, it needs to 'pop' back up.
   */
  public static void unlockKeys(int[] keys){
    for(int k : keys){
      if(k > -1 && k < NUM_KEYS){
        lockableKeys[k] = false;
      }
    }
  }
  
  /*
   * Set the state of a key to either down (true) or up (false)
   */
  public static void setKeyDown(int key, boolean state){
    
    if(key <= -1 || key >= NUM_KEYS){
      return;
    }
    
    // If the key is lockable, as soon as we tell the class the key is down, we lock it.
    if( lockableKeys[key] ){
    
        // 0 - key is up.
        // 1 - key is down
        if( state == true ){
          lockedKeyPresses[key]++; // 1, 
          keys[key] = true;
        }
        // We tell the key that we released
        else{
          // But is this the second release or the first?
          if(lockedKeyPresses[key] == 1){
            // first release, do nothing
          }
          // On the second release, let go of the key.
          else if(lockedKeyPresses[key] == 2){
            lockedKeyPresses[key] = 0;
            keys[key] = false;
          }
        }
    }
    else{
      keys[key] = state;
    }
  }
  
  /* 
   * Returns true if the specified key is down.
   */
  public static boolean isKeyDown(int key){
    return keys[key];
  }
}

// These are outside of keyboard simply because I don't want to keep
// typing Keyboard.KEY_*
final int KEY_SPACE  = 32;
final int KEY_LEFT   = 37;
final int KEY_UP     = 38;
final int KEY_RIGHT  = 39;
final int KEY_DOWN   = 40;

final int KEY_0 = 48;
final int KEY_1 = 49;
final int KEY_2 = 50;
final int KEY_3 = 51;
final int KEY_4 = 52;
final int KEY_5 = 53;
final int KEY_6 = 54;
final int KEY_7 = 55;
final int KEY_8 = 56;
final int KEY_9 = 57;

final int KEY_A = 65;
final int KEY_B = 66;
final int KEY_C = 67;
final int KEY_D = 68;
final int KEY_E = 69;
final int KEY_F = 70;
final int KEY_G = 71;
final int KEY_H = 72;
final int KEY_I = 73;
final int KEY_J = 74;
final int KEY_K = 75;
final int KEY_L = 76;
final int KEY_M = 77;
final int KEY_N = 78;
final int KEY_O = 79;
final int KEY_P = 80;
final int KEY_Q = 81;
final int KEY_R = 82;
final int KEY_S = 83;
final int KEY_T = 84;
final int KEY_U = 85;
final int KEY_V = 86;
final int KEY_W = 87;
final int KEY_X = 88;
final int KEY_Y = 89;
final int KEY_Z = 90;

// Lowercase
final int KEY_a = 97;
final int KEY_b = 98;
final int KEY_c = 99;
final int KEY_d = 100;
final int KEY_e = 101;
final int KEY_f = 102;
final int KEY_g = 103;
final int KEY_h = 104;
final int KEY_i = 105;
final int KEY_j = 106;
final int KEY_k = 107;
final int KEY_l = 108;
final int KEY_m = 109;
final int KEY_n = 110;
final int KEY_o = 111;
final int KEY_p = 112;
final int KEY_q = 113;
final int KEY_r = 114;
final int KEY_s = 115;
final int KEY_t = 116;
final int KEY_u = 117;
final int KEY_v = 118;
final int KEY_w = 119;
final int KEY_x = 120;
final int KEY_y = 121;
final int KEY_z = 122;
public class OShape extends Shape{
 
  OShape(){
    size = 2;
    numStates = 1;
    _color = BLUE;
    shape = new int[][]{{1, 1},
                        {1, 1}};
  }
}
public class SShape extends Shape{
  
  SShape(){
    size = 3;
    numStates = 2;
    _color = GREEN; 
    changeShape();
  }
  
  public void changeShape(){

    if(state == 0){
      spacesOnRight = 0;
      spacesOnLeft = 0;
      shape = new int[][]{ {0, 1, 1},
                           {1, 1, 0},
                           {0, 0, 0}
                          };
    }
    else if(state == 1){
      spacesOnRight = 0;
      spacesOnLeft = 1;
      shape = new int[][]{ {0, 1, 0},
                           {0, 1, 1},
                           {0, 0, 1}
                          };
    }
  }
}
public class TShape extends Shape{
  
  TShape(){
    size = 3;
    numStates = 4;
    _color = PURPLE;  
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
/*
 * 
 */
function SoundManager(){
  var that = this;

  var muted;  
  var hasWebAudio;

  var basePath = "data/audio/";

  var sources = [];
  var paths = [basePath + "dropPiece.ogg", basePath + "clearLine.ogg"];
  var contexts = [];

  var TETRIS = 2;
  var DROP = 0;
  var LINES = 1;

  this.init = function(){
    var that = this;
    
    hasWebAudio = typeof webkitAudioContext != 'undefined' ? true : false;

    if(hasWebAudio){
      for(var i = 0; i < paths.length; i++){
     
        contexts[i] = new webkitAudioContext();
        var getSound = new XMLHttpRequest();
        getSound.open("GET", paths[i], true);
        getSound.responseType = "arraybuffer";
        
	getSound.onload = (function(i, s){
	  return function(){
	    contexts[i].decodeAudioData(s.response, function(buff){sources[i] = buff});
	  };
	})(i, getSound);

	getSound.send();      
      } 
    }
  };

  this.setMute = function(mute){
    muted = mute;
  };

  this.playSound = function(soundID){
    if(muted){
      return;
    }

    if(contexts[soundID]){
      var playSound = contexts[soundID].createBufferSource();
      playSound.buffer = sources[soundID];
      playSound.connect(contexts[soundID].destination);
      playSound.noteOn(0);
    }
  };

  this.playDropPieceSound = function(){
    this.playSound(DROP);
  };

  this.playClearLinesSound = function(){
    this.playSound(LINES);
  };

  this.playClearTetrisSound = function(){
  };
}




/*
function Minim(){
  this.loadFile = function(str){
    return new AudioPlayer(str);
  }
}

function AudioPlayer(){
  this.play = function(){
  };

  this.rewind = function(){
  };
}
*/
function charCodeAt = function(ch){
  return ch.charCodeAt(0);
}
