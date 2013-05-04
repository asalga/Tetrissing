import ddf.minim.*;

Minim minim;
AudioPlayer dropPiece;
AudioPlayer clearLine;

final boolean DEBUG = false;

final int T_SHAPE = 0;
final int L_SHAPE = 1;
final int J_SHAPE = 2;
final int I_SHAPE = 3;
final int O_SHAPE = 4;
final int Z_SHAPE = 5;
final int S_SHAPE = 6;

final int EMPTY   = 0;
final int RED     = 1;
final int ORANGE  = 2;
final int MAGENTA = 3;
final int BLUE    = 4;
final int GREEN   = 5;
final int OLIVE   = 6;
final int CYAN    = 7;
final int WHITE   = 8;

final int NUM_PIECES = 7;

int[] shapeStats = new int[]{0, 0, 0, 0, 0, 0, 0};

Shape currentShape;
int currShapeCol;
int currShapeRow;

Queue nextPieceQueue = new Queue();

PImage backgroundImg;
boolean upKeyState = false;

//
int ghostShapeCol;
int ghostShapeRow;

boolean hasLostGame = false;
boolean didDrawGameOver = false;


final float TAP_LEN_IN_SEC = 0.1f;
boolean holdingDownLeft = false;
float moveBuffer = 0f;

boolean holdingDownRight = false;
float rightBuffer = 0f;

float blocksPerSecond = 10.0f;

// Number of lines cleared and number
// Number of times user cleared 4 lines in one shot
int numLines;
int numTetrises;
int score;

// Add 2 for left and right borders and 1 for floor
int NUM_COLS = 10 + 2;
int NUM_ROWS = 22 + 1;

int BOX_SIZE = 16;

final int BOARD_W_IN_PX = NUM_COLS * BOX_SIZE;
final int BOARD_H_IN_PX = NUM_ROWS * BOX_SIZE + (BOX_SIZE * 3);

int[][] grid = new int[NUM_COLS][NUM_ROWS];

float sideSpeed = 3f;
float dropSpeed = 0.5f;

Debugger debug;
Ticker dropTicker;
Ticker leftMoveTicker;
Ticker rightMoveTicker;


// --- FEATURES ---
// InfiniteRotation - Allows player to keep rotating piece even if it fell
// kickback - If true, players can rotate pieces even if flush against wall.
boolean allowInfiniteRotation = false;
boolean allowKickBack= true;
boolean allowChainReactions = false;
boolean allowDrawingGhost = false;
boolean allowFadeEffect = false;


/*
 */
public void drawShape(Shape shape, int colPos, int rowPos){
  int[][] arr = shape.getArr();
  int shapeSize = shape.getSize();
    
  for(int c = 0; c < shapeSize; c++){
    for(int r = 0; r < shapeSize; r++){
      
      // Transposing here!
      if(arr[r][c] != 0){
        rect((c * BOX_SIZE) + (colPos * BOX_SIZE), (r * BOX_SIZE) + (rowPos * BOX_SIZE), BOX_SIZE, BOX_SIZE);
      }
    }
  }
}

public Shape getRandomShape(){
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

public void stop(){
  dropPiece.close();
  minim.stop();
  super.stop();
}

public void setup(){
  size(BOARD_W_IN_PX + 200, BOARD_H_IN_PX);
  debug = new Debugger();
  
  // Audio Stuff
  minim = new Minim(this);
  dropPiece = minim.loadFile("audio/dropPiece.wav");
  clearLine = minim.loadFile("audio/clearLine.wav");
  
  backgroundImg = loadImage("images/background.jpg");
  
  dropTicker = new Ticker();
  leftMoveTicker = new Ticker();
  rightMoveTicker = new Ticker();
  
  //
  for(int i = 0; i < 3; i++){
    nextPieceQueue.pushBack(getRandomShape());
  }


  // P = pause
  // G = ghost
  // F = fade
  // K = kickback
  Keyboard.lockKeys(new int[]{KEY_P, KEY_G, KEY_F, KEY_K});
  
  // Assume the user wants kickback
  Keyboard.setKeyDown(KEY_K, true);
  
  numLines = 0;
   
  for(int c = 0; c < NUM_COLS; c++){
    for(int r = 0; r < NUM_ROWS; r++){
      grid[c][r] = EMPTY;
    }
  }

  createPiece();
   
  createBorders();
}

public void createPiece(){
  currentShape = (Shape)nextPieceQueue.popFront(); 
  currShapeRow = -currentShape.getSize();
  currShapeCol = NUM_COLS/2;
  
  nextPieceQueue.pushBack(getRandomShape());
}

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
  //if(allowDrawingGhost == false){return;}
  
  ghostShapeCol = currShapeCol;
  ghostShapeRow = currShapeRow;
  
  // If we move the shape down one row and it will not result in a collision, 
  // we can safely move the ghost piece row.
  while(checkShapeCollision(currentShape, ghostShapeCol, ghostShapeRow + 1) == false){
    ghostShapeRow++;
  }
}

/*
 * 0 - no collision
 * 1 - collision
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
*/
public void moveShapeLeft(){
  currShapeCol--;
  
  if(checkShapeCollision(currentShape, currShapeCol, currShapeRow)){
    currShapeCol++;
  }
}

void moveShapeRight(){
  currShapeCol++;
  
  if(checkShapeCollision(currentShape, currShapeCol, currShapeRow)){
    currShapeCol--;
  }
}
    
/*
 */
public void update(){
  
  dropSpeed =  Keyboard.isKeyDown(KEY_DOWN)  ? 0.001f : 0.5f;
  sideSpeed =  Keyboard.isKeyDown(KEY_LEFT) ||  Keyboard.isKeyDown(KEY_RIGHT) ? 0.08f : 0f;
  allowFadeEffect = Keyboard.isKeyDown(KEY_F);
  allowKickBack = Keyboard.isKeyDown(KEY_K);
  
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
  
  allowDrawingGhost = Keyboard.isKeyDown(KEY_G);
  
  if(Keyboard.isKeyDown(KEY_LEFT) && Keyboard.isKeyDown(KEY_RIGHT)){
    return;
  }
  
  // If we just let got of the left key, but we were holding it down, make sure not
  // to move and extra bit that the tap key condition would hit.
  if(Keyboard.isKeyDown(KEY_LEFT) == false && holdingDownLeft == true){
    holdingDownLeft = false;
    leftMoveTicker.reset();
    moveBuffer = 0f;
  }
  // If the key hit was a tap, nudge the piece one block
  else if(Keyboard.isKeyDown(KEY_LEFT) == false && moveBuffer > 0f){
    leftMoveTicker.reset();
    moveBuffer = 0;
    moveShapeLeft();
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
        
        moveShapeLeft();
      }
    }
  }
  
    
  // If we just let got of the left key, but we were holding it down, make sure not
  // to move and extra bit that the tap key condition would hit.
  if( Keyboard.isKeyDown(KEY_RIGHT) == false && holdingDownRight == true){
    holdingDownRight = false;
    rightMoveTicker.reset();
    rightBuffer = 0f;
  }
  // If the key hit was a tap, nudge the piece one block
  else if(Keyboard.isKeyDown(KEY_RIGHT) == false && rightBuffer > 0f){
    rightMoveTicker.reset();
    rightBuffer = 0;
    moveShapeRight();
  }
  // If the user is holding down the left key
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
        moveShapeRight();
      }
    }
  }
  
  findGhostPiecePosition();
  
  //debug.addString("FPS:" + (int)frameRate);
  debug.addString("Score: " + score);
  debug.addString("----------------");
  debug.addString("F - Toggle Fade effect " + getOnStr(Keyboard.isKeyDown(KEY_F)));
  debug.addString("G - Toggle Ghost piece ");
  debug.addString("K - Toggle Kick back " + getOnStr(Keyboard.isKeyDown(KEY_K)));
  debug.addString("P - Pause game");
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
  
  if(currShapeRow < 0){
    hasLostGame = true;
    return;
  }
    
  for(int c = 0; c < shapeSize; c++){
    for(int r = 0; r < shapeSize; r++){
      
      // Transposing here!
      if(arr[r][c] != EMPTY){
        grid[currShapeCol + c][currShapeRow + r] = col;
      }
    }
  }
  
  dropPiece.play();
  dropPiece.rewind();
  
  removeFilledLines();
  
  createPiece();
}

/* Start from the bottom row. If we found a full line,
 * copy everythng from the row above that line to
 * the current one.
 */
public void removeFilledLines(){
  for(int row = NUM_ROWS - 2; row > 0; row--){
    
    boolean isFull = true;
    for(int col = 1; col < NUM_COLS - 1; col++){
      if(grid[col][row] == EMPTY){
        isFull = false;
      }
    }
    
    if(isFull){
      score += 100;
      moveAllRowsDown(row);
      
      clearLine.play();
      clearLine.rewind();
      
      // Start from the bottom again
      row = NUM_ROWS - 1;
    }
  }
}

/*
 */
public void moveAllRowsDown(int row){
  // TODO: add bounds check
  for(int r = row; r > 1; r--){
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
      currShapeRow -= 1;
      addPieceToBoard(currentShape);
      foundCollision = true;
    }
  }
}

public int getRandomInt(int minVal, int maxVal) {
  return (int)random(minVal, maxVal + 1);
}

/**
 */
public void draw(){
  
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
   
  translate(0, BOX_SIZE * 3);
  
  drawBoard();
  
  findGhostPiecePosition();
  drawGhostPiece();

  drawCurrShape();  
  drawNextShape();
  
  drawBorders();
  
  // Draw debugging stuff on top of everything else
  pushMatrix();
  translate(200, 40);
  pushStyle();
  stroke(255);
  debug.draw();
  popStyle();
  popMatrix();
  
  debug.clear();
}

/**
 */
public void drawNextShape(){
  pushStyle();
  Shape nextShape = (Shape)nextPieceQueue.peekFront();
  fill(getColorFromID(nextShape.getColor()));
  stroke(255);
  strokeWeight(1);
  drawShape(nextShape, 20, 0);
  popStyle();
}

/* A ghost piece shows where the piece the user
 * is currently holding will end up.
 */
public void drawGhostPiece(){
  if(allowDrawingGhost == false){
    return;
  }
  
  pushStyle();
  color col = getColorFromID(currentShape.getColor());
  
  float opacity = (ghostShapeRow - currShapeRow) / (float)NUM_ROWS * 32;
  fill(col, opacity);
  stroke(col, opacity * 4); 
  drawShape(currentShape, ghostShapeCol, ghostShapeRow);
  popStyle();
}

public void drawCurrShape(){
  pushStyle();
  color _col = getColorFromID(currentShape.getColor());
  fill(_col);
  stroke(255);
  strokeWeight(1);
  drawShape(currentShape, currShapeCol, currShapeRow);
  popStyle();
}

/*
 */
public color getColorFromID(int col){
  if(col == RED)    { return color(#FF0000); }
  if(col == ORANGE) { return color(#FFA500); }
  if(col == MAGENTA){ return color(#FF00FF); }
  if(col == BLUE)   { return color(#0000FF); }
  if(col == GREEN)  { return color(#00FF00); }
  if(col == OLIVE)  { return color(#808000); }
  if(col == CYAN)   { return color(#00FFFF); }
  else              { return color(#FFFFFF); }
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
        currShapeCol -= amountToShiftLeft;
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
  
  if(keyCode == KEY_UP && upKeyState == false){
    requestRotatePiece();
    upKeyState = true;
  }
  
  Keyboard.setKeyDown(keyCode, true);
}

public void keyReleased(){
  
  if(keyCode == KEY_UP){
    upKeyState = false;
  }
  
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
  
  for(int row = 0; row < NUM_ROWS; row++){
    rect(0, row * BOX_SIZE, BOX_SIZE, BOX_SIZE);
  }

  for(int row = 0; row < NUM_ROWS; row++){
    rect((NUM_COLS-1) * BOX_SIZE, row * BOX_SIZE, BOX_SIZE, BOX_SIZE);
  }
  popStyle();
}

public void drawBox(int col, int row, int _color){
  if(_color != EMPTY){
    pushStyle();
    fill(getColorFromID(_color));
    rect(col * BOX_SIZE, row * BOX_SIZE, BOX_SIZE, BOX_SIZE);
    popStyle();
  }
}


public void showGamePaused(){
  pushStyle();
  fill(128, 0, 0);
  noStroke();
  rect(0, BOX_SIZE * 3, width - 200, height);
  PFont font = createFont("verdana", 50);
  textFont(font);
  textAlign(CENTER, CENTER);
  fill(0, 0, 128);
  text("Game Paused", width/2, height/2);
  popStyle();
}

/*
 * Overlay a semi-transparent layer on top of the board to hint
 * the game is no longer playable.
 */
public void showGameOver(){
  pushStyle();
  fill(128, 128);
  noStroke();
  rect(0, 0, width, height);
  PFont font = createFont("verdana", 50);
  textFont(font);
  textAlign(CENTER, CENTER);
  fill(128, 0, 0);
  text("Game Over", width/2, height/2);
  popStyle();
  didDrawGameOver = true;
}
