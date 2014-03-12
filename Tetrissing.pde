/*
 @pjs globalKeyEvents="true";preload="data/images/score_display.png,data/images/level_display.png,data/images/score.png,data/images/level.png,data/images/bk.png,data/fonts/null_terminator_2x.png,data/fonts/null_terminator.png,data/images/red.png,data/images/blue.png,data/images/babyblue.png,data/images/green.png, data/images/orange.png, data/images/pink.png";
 */ 
import ddf.minim.*;

final boolean DEBUG = false;

//
// alsdjflajsdlfkjla
final int T_SHAPE = 0;
final int L_SHAPE = 1;
final int J_SHAPE = 2;
final int I_SHAPE = 3;
final int O_SHAPE = 4;
final int Z_SHAPE = 5;
final int S_SHAPE = 6;

final int BORDER   = -1;
final int EMPTY    = 0;
final int RED      = 1;
final int ORANGE   = 2;
final int PINK     = 3;
final int BLUE     = 4;
final int GREEN    = 5;
final int PURPLE   = 6;
final int BABYBLUE = 7;

final int ROTATE_RIGHT = 0;
final int ROTATE_LEFT  = 1;

PImage levelLabel;
PImage levelDisplay;
PImage scoreLabel;
PImage scoreDisplay;

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

ClearLineAnimator clearLineAnimator;

boolean isPaused = false;

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
final int NUM_ROWS = 25;  // 20 rows + 1 floor + 4 extra
final int CUT_OFF_INDEX = 2;

// This is referenced often, so calculate it here, but don't include the floor.
final int LAST_ROW_INDEX = NUM_ROWS - 2;

final int BLOCK_SIZE = 16;

// Where the Tetris board starts. Keep in mind we don't show the borders
// or the extra rows at the top.
final int BOARD_START_X = 10;
final int BOARD_START_Y = 23 - (BLOCK_SIZE * 3) + 1;
//(BLOCK_SIZE  * 4) - 4;

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

TextBoxView levelTextBox;
TextBoxView textBox;
TextBoxView instructionsTextBox;

/*
 */
public void setup(){
  size(284, 380);
  
  images[RED] = loadImage("data/images/red.png");
  images[ORANGE] = loadImage("data/images/orange.png");
  images[BLUE] = loadImage("data/images/blue.png");
  images[PINK] = loadImage("data/images/pink.png");
  images[GREEN] = loadImage("data/images/green.png");
  images[PURPLE] = loadImage("data/images/purple.png");
  images[BABYBLUE] = loadImage("data/images/babyblue.png");
  
  backgroundImg = loadImage("data/images/bk.png");
  
  levelTextBox = new TextBoxView();
  levelTextBox.setFont("data/fonts/null_terminator_2x.png");
  
  textBox = new TextBoxView();
  textBox.setFont("data/fonts/null_terminator_2x.png");
  
  //instructionsTextBox = new TextBoxView();
  //instructionsTextBox.setFont("data/fonts/null_terminator.png");
  //instructionsTextBox.setPosition();
  
  // Large font used for level, score, "Game Over" and "Paused"
  // Small font is used for some instructions
  largeFont = new SpriteFont("data/fonts/null_terminator_2x.png", 14, 14, 2);
  smallFont = new SpriteFont("data/fonts/null_terminator.png", 7, 7, 1);
  
  levelLabel = loadImage("data/images/level.png");
  levelDisplay = loadImage("data/images/level_display.png");
  scoreLabel = loadImage("data/images/score.png");
  scoreDisplay = loadImage("data/images/score_display.png");
  
  
  debug = new Debugger();
  soundManager = new SoundManager(this);
  soundManager.init();
  
  // Timers
  dropTicker = new Ticker();
  leftMoveTicker = new Ticker();
  rightMoveTicker = new Ticker();

  restartGame();
  
  // P = pause
  // G = ghost
  // F = fade
  // K = kickback
  // M = mute
  Keyboard.lockKeys(new int[]{KEY_G, KEY_F, KEY_K, KEY_M, KEY_ESC});
  
  // Assume the user wants kickback
  Keyboard.setKeyDown(KEY_K, true);
  Keyboard.setVirtualKeyDown(KEY_ESC, true);
  //Keyboard.setKeyDown(KEY_M, true);
}

/*
 */
public void drawShape(Shape shape, int colPos, int rowPos){
  int[][] arr = shape.getArr();
  int shapeSize = shape.getSize();
  PImage blockImage = getImageFromID(shape.getColor());
  
  // This is a workaround for a bug in Processing.js. When calling this method with tint(),
  // the first block rendered will never be displayed. So force that first unrendered block
  // to be rendered outside the drawing area to allow all subsequent blocks to be properly rendered.
  image(blockImage, -100, -100);
  
  for(int c = 0; c < shapeSize; c++){
    for(int r = 0; r < shapeSize; r++){
      
      // Transposing here!
      if(arr[r][c] != 0){
        image(blockImage, (c * BLOCK_SIZE) + (colPos * BLOCK_SIZE), (r * BLOCK_SIZE) + (rowPos * BLOCK_SIZE));
      }
    }
  }
}

/*
 */
public Shape getRandomPiece(){
  int randInt = Utils.getRandomInt(0, 6);
  
  shapeStats[randInt]++;
  
  if(randInt == T_SHAPE) return new TShape();
  if(randInt == L_SHAPE) return new LShape();
  if(randInt == Z_SHAPE) return new ZShape();
  if(randInt == O_SHAPE) return new OShape();
  if(randInt == J_SHAPE) return new JShape();
  if(randInt == I_SHAPE) return new IShape();
  else                   return new SShape();
}

/*
 * TODO: properly center piece
 */
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
 * Adding extra columns and a floor directly in the grid
 * allows for easier checking against going out of playing area.
 */
public void createBorders(){
  for(int col = 0; col < NUM_COLS; col++){
    grid[col][NUM_ROWS - 1] = BORDER;
  }
  
  for(int row = 0; row < NUM_ROWS; row++){
    grid[0][row] = BORDER;
  }

  for(int row = 0; row < NUM_ROWS; row++){
    grid[NUM_COLS-1][row] = BORDER;
  }
}

/* Start from the position of the current shape and 
 * keep going down until we find a collision.
 */
public void findGhostPiecePosition(){
  
  if(allowDrawingGhost == false){
    return;
  }
  
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
public void drawDebugGrid(){
  pushStyle();
  noFill();
  strokeWeight(1);
  stroke(255, 16);
  
  // Draw a translucent grid
  for(int cols = 0; cols < NUM_COLS; cols++){
    for(int rows = CUT_OFF_INDEX; rows < NUM_ROWS; rows++){
      rect(cols * BLOCK_SIZE, rows * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
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
  
  //dropSpeed =  Keyboard.isKeyDown(KEY_DOWN)  ? 0.001f : 0.5f;
  sideSpeed =  Keyboard.isKeyDown(KEY_LEFT) ||  Keyboard.isKeyDown(KEY_RIGHT) ? 0.08f : 0f;
  
  // Features
  //allowFadeEffect   = Keyboard.isKeyDown(KEY_F);
  //allowKickBack     = Keyboard.isKeyDown(KEY_K);
  //allowDrawingGhost = Keyboard.isKeyDown(KEY_G);
    
  dropTicker.tick();
  
  if(clearLineAnimator != null){
    clearLineAnimator.update();
    
    if(clearLineAnimator.DoesAffectBoard() == false){
      removeFilledLines();
    }
    
    if(clearLineAnimator.isAlive() == false){
      clearLineAnimator = null;
       removeFilledLines();
    }
  }
  
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
  
  ArrayList rowIndicesToClear = getRowIndicesToClear(); 
  
  if(rowIndicesToClear.size() > 0){
    soundManager.playSoundByLinesCleared(rowIndicesToClear.size());
    
    increaseScoreByLinesCleared(rowIndicesToClear.size());
    
    //
    if(level < MAX_LEVELS - 1 && scoreForThisLevel >= scoreReqForNextLevel[level]){
      scoreForThisLevel = 0;
      //level++;
    }
    clearLineAnimator = new ClearLineAnimator();
    clearLineAnimator.setRowIndicesToClear(rowIndicesToClear);
  }
  else{
    soundManager.playDropPieceSound();
  }
  
  createPiece();
}

/*
 */
public void increaseScoreByLinesCleared(int linesCleared){
  switch(linesCleared){
    case 1: scoreForThisLevel += 100;score += 100;break;
    case 2: scoreForThisLevel += 250;score += 250;break;
    case 3: scoreForThisLevel += 450;score += 450;break;
    case 4: scoreForThisLevel += 800;score += 800;break;
    default: break;
  }
}

/**
 */
public ArrayList getRowIndicesToClear(){
  ArrayList indicesToClear = new ArrayList();
  
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
      indicesToClear.add(row);
    }
    
  }
  
  return indicesToClear;
}

/**
 * returns a value from 0 - 4
 */
/*public int getNumLinesToClear(){
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
      // return early if we found 4?
    }
  }
  
  return numLinesToClear;
}*/

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
    restartGame();
    //showGameOver();
    return;
  }
  
  isPaused = Keyboard.isKeyDown(KEY_ESC);
  
  if(isPaused){
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
  

  
  pushMatrix();
  translate(BOARD_START_X, BOARD_START_Y);
  drawBoard();
  
  drawGhostPiece();

  drawShape(currentShape, currShapeCol, currShapeRow);  
  popMatrix();
  
  image(backgroundImg, 0, 0);
  
  if(clearLineAnimator != null){
    clearLineAnimator.draw();
  }
  
  drawNextShape();

  drawScoreAndLevel();

  debug.clear();
}

/**
 */
public void drawScoreAndLevel(){
  
  return;

  image(levelLabel, 22, 40);
  image(levelDisplay, 90 + 32, 40);
  levelTextBox.setText(Utils.prependStringWithString(str(level+1), "0", 2));
  levelTextBox.setPosition(50 + 16, 24);
  levelTextBox.render();
  
  image(scoreLabel, 22, 70);
  
  image(scoreDisplay, 90 + 32, 70);
  textBox.setText(Utils.prependStringWithString(str(score), "0", 7));
  textBox.setPosition(50 + 16, 39);
  textBox.render();
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
  pushMatrix();
  drawText(smallFont, "NEXT:", 200, height/2 - 70);

  translate(-100, height/2 - 50);
  Shape nextShape = (Shape)nextPieceQueue.peekFront();
  drawShape(nextShape, 20, 0);
  popMatrix();
}

/* A ghost piece shows where the piece the user
 * is currently holding will end up.
 */
public void drawGhostPiece(){
  if(allowDrawingGhost == false){
    return;
  }
  
  findGhostPiecePosition();
    
  pushStyle();
  tint(255, 64);
  drawShape(currentShape, ghostShapeCol, ghostShapeRow);
  popStyle();
}

public PImage getImageFromID(int col){
  return images[col];
}

/*
 * Rotating the shape may fail if rotating the shape results in
 * a collision with another piece on the board.
 */
public void requestRotatePiece(int rotateDir){
  
  // We try to rotate the shape, if it fails, we undo the rotation later on.
  if(rotateDir == ROTATE_RIGHT){
    currentShape.rotateRight();
  }
  else{
    currentShape.rotateLeft();
  }
  
  //
  //
  //
  int pos = currShapeCol;  
  int size = currentShape.getSize();
  int emptyRightSpaces = currentShape.getEmptySpacesOnRight();
  int emptyLeftSpaces = currentShape.getEmptySpacesOnLeft();
  
  int amountToShiftLeft = pos + size - emptyRightSpaces - (NUM_COLS-1);
  int amountToShiftRight = 1 - (pos - emptyLeftSpaces);
  
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
    
    if(rotateDir == ROTATE_RIGHT){
      currentShape.rotateLeft();
    }else{
      currentShape.rotateRight();
    }
    
  }
}

/*
 */
public void keyPressed(){
  // This seems to be the proper way to prevent P5 from closing on ESC
  if(key == KEY_ESC){
    key = 0;
  }
  
  if(hasLostGame && keyCode != KEY_R){
    return;
  }
  
  // if paused, the user is trying to unpause
  if(isPaused && keyCode == KEY_ESC){
    isPaused = false;
  }
  
  // If we are in a paused state, ignore any keypresses
  if(isPaused){
    return;
  }
  
  if(keyCode == KEY_SPACE){
    //dropPiece();
  }
  
  if(keyCode == KEY_UP){
    requestRotatePiece(ROTATE_RIGHT);
  }
  
  if(keyCode == KEY_E){
    requestRotatePiece(ROTATE_LEFT);
  }
  
  if(keyCode == KEY_R){
    requestRotatePiece(ROTATE_RIGHT);
  }
  
  Keyboard.setKeyDown(keyCode, true);
}

public void keyReleased(){
  // This seems to be the proper way to prevent P5 from closing on ESC
  if(key == KEY_ESC){
    key = 0;
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

/*
 *
 */
public void drawBox(int col, int row, int _color){
  if(_color != EMPTY){
    image(getImageFromID(_color), col * BLOCK_SIZE, row * BLOCK_SIZE);
  }
}

/*
 */
public void showGamePaused(){
  background(0);
  
  pushMatrix();
  translate(BOARD_START_X, BOARD_START_Y);
  drawBoard();
  drawShape(currentShape, currShapeCol, currShapeRow);
  drawGhostPiece(); 
  popMatrix();
  
  // Draw this after the current piece because if the piece just started
  // at the top, the top part of the piece needs to be clipped by the 'window'
  image(backgroundImg, 0, 0);
  
  drawNextShape();
  
  pushMatrix();
  translate(23, BOARD_START_Y + 48);
  noStroke();
  fill(0, 200);
  rect(0, 0, (NUM_COLS - 2) * BLOCK_SIZE + 4, (NUM_ROWS - 4) * BLOCK_SIZE);
  popMatrix();
  
  drawText(largeFont, "PAUSED", 60, height/2 - 50);
  drawText(smallFont, "Hit Esc to resume", 30, height/2 + 30 - 50);
  
  drawScoreAndLevel();
  drawInstructions();
}

/**
 * Displayed when game is paused
 * TODO: display on game start
 */
public void drawInstructions(){
  return;
  
  int yPos = 260;
  int buffer = 10;
  
  String[] instructions = {
    "Space - Hard drop",
    "Down  - Soft drop",
    "E - Rotate Left",
    "R - Rotate Right",
    "",
    
    "Toggle features",
    "---------------",
    "G - Ghost piece",
    "F - Fade effect",
    "M - Mute Audio",
    "K - Set Kickback",
    "Esc - Pause"
  };
  
  for(int i = 0; i < instructions.length; i++){
    drawText(smallFont, instructions[i], 25, yPos);
    yPos += buffer;
  }
}

/*
 * Overlay a semi-transparent layer on top of the board to hint
 * the game is no longer playable.
 */
public void showGameOver(){
  pushStyle();
  fill(0, 0, 0, 128);
  noStroke();
  rect(0, 0, width, height);
  popStyle();
  
  image(backgroundImg, 0, 0);
  drawText(largeFont, "GAME OVER", 30, 100);
  
  drawScoreAndLevel();
  
  drawText(smallFont, "Hit R to restart", 30, 130);
  
  didDrawGameOver = true;
}
