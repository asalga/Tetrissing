/*
 @pjs globalKeyEvents="true";preload="data/images/score_display.png,data/images/level_display.png,data/images/score.png,data/images/level.png,data/images/bk.png,data/fonts/null_terminator_2x.png,data/fonts/null_terminator.png,data/images/red.png,data/images/blue.png,data/images/babyblue.png,data/images/green.png, data/images/orange.png, data/images/pink.png";
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
final int BOARD_START_Y = (BLOCK_SIZE  * 4) - 4;

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
  size(284, 464);
  
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
  
  dropSpeed =  Keyboard.isKeyDown(KEY_DOWN)  ? 0.001f : 0.5f;
  sideSpeed =  Keyboard.isKeyDown(KEY_LEFT) ||  Keyboard.isKeyDown(KEY_RIGHT) ? 0.08f : 0f;
  
  // Features
  allowFadeEffect   = Keyboard.isKeyDown(KEY_F);
  allowKickBack     = Keyboard.isKeyDown(KEY_K);
  allowDrawingGhost = Keyboard.isKeyDown(KEY_G);
    
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
      level++;
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
    showGameOver();
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
  translate( BOARD_START_X, BOARD_START_Y);
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
  translate(-100, 200);
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
    dropPiece();
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
  translate(23, 108);
  noStroke();
  fill(0, 200);
  rect(0, 0, (NUM_COLS - 2) * BLOCK_SIZE + 4, (NUM_ROWS - 4) * BLOCK_SIZE);
  popMatrix();
  
  drawText(largeFont, "PAUSED", 60, 200);
  drawText(smallFont, "Hit Esc to resume", 30, 230);
  
  drawScoreAndLevel();
  drawInstructions();
}

/**
 * Displayed when game is paused
 * TODO: display on game start
 */
public void drawInstructions(){
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
  drawText(largeFont, "GAME OVER", 30, 200);
  
  drawScoreAndLevel();
  
  drawText(smallFont, "Hit R to restart", 30, 230);
  
  didDrawGameOver = true;
}

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
        rect(0, ((Integer)rowIndicesToClear.get(i)) * BLOCK_SIZE, (NUM_COLS-2) * BLOCK_SIZE, BLOCK_SIZE);
      }
      
      popMatrix();
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
  
  public void rotateLeft(){
    state--;
    if(state < 0){
      state = numStates - 1;
    }
    changeShape();
  }

  public void rotateRight(){
    state++;
    if(state >= numStates){
      state = 0;
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
  public static void lockKeys(int[] keys){
    for(int k : keys){
      if(isValidKey(k)){
        lockableKeys[k] = true;
      }
    }
  }
  
  /*
   * TODO: if the key was locked and is down, then we unlock it, it needs to 'pop' back up.
   */
  public static void unlockKeys(int[] keys){
    for(int k : keys){
      if(isValidKey(k)){
        lockableKeys[k] = false;
      }
    }
  }
  
  /* This is for the case when we want to start off the game
   * assuming a key is already down.
   */
  public static void setVirtualKeyDown(int key, boolean state){
    setKeyDown(key, true);
    setKeyDown(key, false);
  }
  
  /**
   */
  private static boolean isValidKey(int key){
    return (key > -1 && key < NUM_KEYS);
  }
  
  /*
   * Set the state of a key to either down (true) or up (false)
   */
  public static void setKeyDown(int key, boolean state){
    
    if(isValidKey(key)){
      
      // If the key is lockable, as soon as we tell the class the key is down, we lock it.
      if( lockableKeys[key] ){
          // First time pressed
          if(state == true && lockedKeyPresses[key] == 0){
            lockedKeyPresses[key]++;
            keys[key] = true;
          }
          // First time released
          else if(state == false && lockedKeyPresses[key] == 1){
            lockedKeyPresses[key]++;
          }
          // Second time pressed
          else if(state == true && lockedKeyPresses[key] == 2){
             lockedKeyPresses[key]++;
          }
          // Second time released
          else if (state == false && lockedKeyPresses[key] == 3){
            lockedKeyPresses[key] = 0;
            keys[key] = false;
          }
      }
      else{
        keys[key] = state;
      }
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
// typing Keyboard.KEY_* in the main Tetrissing.pde file
final int KEY_BACKSPACE = 8;
final int KEY_TAB       = 9;
final int KEY_ENTER     = 10;

final int KEY_SHIFT     = 16;
final int KEY_CTRL      = 17;
final int KEY_ALT       = 18;

final int KEY_CAPS      = 20;
final int KEY_ESC = 27;

final int KEY_SPACE  = 32;
final int KEY_PGUP   = 33;
final int KEY_PGDN   = 34;
final int KEY_END    = 35;
final int KEY_HOME   = 36;

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

// Function keys
final int KEY_F1  = 112;
final int KEY_F2  = 113;
final int KEY_F3  = 114;
final int KEY_F4  = 115;
final int KEY_F5  = 116;
final int KEY_F6  = 117;
final int KEY_F7  = 118;
final int KEY_F8  = 119;
final int KEY_F9  = 120;
final int KEY_F10 = 121;
final int KEY_F12 = 122;

//final int KEY_INSERT = 155;
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
      //chars[currChar] = truncateImage( chars[currChar] );
    }
  }
  
  //public static void create(String imageFilename, int charWidth, int charHeight, int borderSize){ 
  //PImage fontSheet = loadImage(imageFilename);
  public PImage getChar(char ch){
    int asciiCode = Utils.charCodeAt(ch);
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

  var muted;  

  var BASE_PATH = "data/audio/";

  var paths = [BASE_PATH + "dropPiece.ogg", BASE_PATH + "clearLine.ogg"];
  var sounds = [];

  var DROP = 0;
  var LINES = 1;

  /*
   */
  this.init = function(){
    var i;

    for(i = 0; i < paths.length; i++){
      sounds[i] = document.createElement('audio');
      sounds[i].setAttribute('src', paths[i]);
      sounds[i].preload = 'auto';
      sounds[i].load();
      sounds[i].volume = 0;
      sounds[i].setAttribute('autoplay', 'autoplay');
    }
  };

  /*
   *
   */
  this.setMute = function(mute){
    muted = mute;
  };

  /*
   */
  this.playSound = function(soundID){
    if(muted){
      return;
    }

    sounds[soundID].volume = 1.0;

    // Safari does not want to play sounds...??
    try{
      sounds[soundID].volume = 1.0;
      sounds[soundID].play();
      sounds[soundID].currentTime = 0;
    }catch(e){
      console.log("Could not play audio file.");
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

  this.playSoundByLinesCleared = function(numLines){
    this.playSound(LINES);
  };
}

/*
 * JS Utilities interface
 */
var Utils = {

  /*   
   */
  charCodeAt: function(ch){
    return ch.charCodeAt(0);
  },

  /*
   * 
   */
  getRandomInt: function(minVal, maxVal){
    var scale = Math.random();
    return minVal + Math.floor(scale * (maxVal - minVal + 1));
  },

  /*
  */
  prependStringWithString: function(baseString, prefix, newStrLength){
    var zerosToAdd, i;

    if(newStrLength <= baseString.length()){
      return baseString;
    }
    
    zerosToAdd = newStrLength - baseString.length();
    
    for(i = 0; i < zerosToAdd; i++){
      baseString = prefix + baseString;
    }
    
    return baseString;
  }

}
