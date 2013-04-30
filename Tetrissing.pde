IShape currentShape;
int currShapeCol;
int currShapeRow;

boolean upKeyState = false;

//
int ghostShapeCol;
int ghostShapeRow;
boolean drawGhostPiece;

boolean playerLost = false;

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

int NUM_ROWS = 20;
int NUM_COLS = 20;

int BOX_SIZE = 16;

final int BOARD_W_IN_PX = NUM_COLS * BOX_SIZE;
final int BOARD_H_IN_PX = NUM_ROWS * BOX_SIZE;

int[][] grid = new int[NUM_COLS][NUM_ROWS];

final int EMPTY  = 0;
final int WHITE  = 1;
final int RED    = 2;
final int BLUE   = 3;
final int GREEN  = 4;
final int MAX_COLORS = 4;

float sideSpeed = 3f;
float dropSpeed = 0.5f;


float timeCounter = 0;

Debugger debug;
Ticker dropTicker;
Ticker leftMoveTicker;
Ticker rightMoveTicker;

boolean needsMoveLeft = false;

/*
 */
public void drawShape(IShape shape, int colPos, int rowPos){
  int[][] arr = shape.getArr();
  int shapeSize = shape.getSize();
    
  for(int c = 0; c < shapeSize; c++){
    for(int r = 0; r < shapeSize; r++){
      if(arr[c][r] != 0){
        rect((c * BOX_SIZE) + (colPos * BOX_SIZE), (r * BOX_SIZE) + (rowPos * BOX_SIZE), BOX_SIZE, BOX_SIZE);
      }
    }
  }
}

public IShape getRandomShape(){
  int randInt = getRandomInt(0, 6);
  
  if(randInt == 0) return new TeeShape();
  if(randInt == 1) return new ZeeShape();
  if(randInt == 2) return new BoxShape();
  if(randInt == 3) return new ElShape();
  if(randInt == 4) return new ElShape2();
  if(randInt == 5) return new LineShape();
  else             return new EsShape();
}

public void setup(){
  size(BOARD_W_IN_PX, BOARD_H_IN_PX);
  debug = new Debugger();
  
  dropTicker = new Ticker();
  leftMoveTicker = new Ticker();
  rightMoveTicker = new Ticker();
  
  Keyboard.lockKeys(new int[]{KEY_P});
  
  numLines = 0;
  drawGhostPiece = true;
   
  for(int c = 0; c < NUM_COLS; c++){
    for(int r = 0; r < NUM_ROWS; r++){
      grid[c][r] = EMPTY;
    }
  }
   
  currentShape = getRandomShape();
  currShapeRow = 0;
  currShapeCol = 4;
 
  createBorders();
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
  ghostShapeCol = currShapeCol;
  ghostShapeRow = currShapeRow;
  
  while(checkShapeCollision(currentShape, ghostShapeCol, ghostShapeRow) == 0){
    ghostShapeRow++;
  }
  
  // After we find a collision, we need to go up one row
  // because that's where the piece would fall.
  ghostShapeRow--;
}

/*
 * 0 - no collision
 * 1 - collision on left side of piece
 * 2 - collision on right side of piece
 * 3 - collision on both sides of piece
 */
public int checkShapeCollision(IShape shape, int shapeCol, int shapeRow){
  int[][] arr = shape.getArr();
  int shapeSize = shape.getSize();
  
  // Iterate over the shape
  for(int c = 0; c < shapeSize; c++){
    for(int r = 0; r < shapeSize; r++){
      
      if(shapeCol + c < 0){
        continue;
      }

      if(shapeRow + r >= NUM_ROWS){
        continue;
      }
      
      if(grid[shapeCol + c][shapeRow + r] != EMPTY && arr[c][r] != EMPTY){
        return 1;
      }
    }
  }
  
  return 0;
}

/**
*/
public void moveShapeLeft(){
  currShapeCol--;
  
  if(checkShapeCollision(currentShape, currShapeCol, currShapeRow) != 0){
    currShapeCol++;
    findGhostPiecePosition();
  }
}

void moveShapeRight(){
  currShapeCol++;
  
  if(checkShapeCollision(currentShape, currShapeCol, currShapeRow) != 0){
    currShapeCol--;
    findGhostPiecePosition();
  }
}
    
/*
 */
public void update(){
  dropSpeed =  Keyboard.isKeyDown(KEY_DOWN)  ? 0.001f : 0.5f;
  sideSpeed =  Keyboard.isKeyDown(KEY_LEFT) ||  Keyboard.isKeyDown(KEY_RIGHT) ? 0.08f : 0f;
  
  dropTicker.tick();
  
  if(dropTicker.getTotalTime() >= dropSpeed){
    dropTicker.reset();
    
    if(currentShape != null){
      timeCounter = 0;
      currShapeRow++;
      
      if(checkShapeCollision(currentShape, currShapeCol, currShapeRow) != 0){
        currShapeRow--;
        addShapeToGrid(currentShape);
      }
    }
  }
  
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
      println(leftMoveTicker.getTotalTime());
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
  
  debug.addString("      FPS:" + (int)frameRate);
  debug.addString("      Lines:" + numLines);
}

/*
* 
*/
public void addShapeToGrid(IShape shape){
  int[][] arr = shape.getArr();
  int shapeSize = shape.getSize();
  int col = shape.getColor();
  
  for(int c = 0; c < shapeSize; c++){
    for(int r = 0; r < shapeSize; r++){
      if(arr[c][r] != EMPTY){
        grid[currShapeCol + c][currShapeRow + r] = col;
      }
    }
  }
  
  removeFilledLines();
  
  currentShape = getRandomShape();
  currShapeRow = 0;
  currShapeCol = 14;
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
      println("found full: " + row);
      numLines++;
      moveAllRowsDown(row);
      
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

public void dropShape(){
  boolean foundCollision = false;
  
  while(foundCollision == false){ 
    currShapeRow++;
    if(checkShapeCollision(currentShape, currShapeCol, currShapeRow) != 0){
      currShapeRow -= 1;
      addShapeToGrid(currentShape);
      foundCollision = true;
    }
  }
}

public int getRandomInt(int minVal, int maxVal) {
  return (int)random(minVal, maxVal + 1);
}

public void draw(){
  if(Keyboard.isKeyDown(KEY_P) ){
    return;
  }
  
  update();
  
  background(0);
  //drawBackground();
  drawGrid();
  
  findGhostPiecePosition();
  drawGhostPiece();

  drawCurrShape();
    
  pushStyle();
  stroke(255);
  debug.draw();
  popStyle();
  
  postRender();
}

/* For cheaters
 */
public void drawGhostPiece(){
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
  stroke(0);
  drawShape(currentShape, currShapeCol, currShapeRow);
  popStyle();
}


/*
 */
public color getColorFromID(int _color){
  
  if(_color == RED)   return color(255, 0,   0);
  if(_color == GREEN) return color(0,   255, 0);
  if(_color == BLUE)  return color(0,   0,   255);
  if(_color == WHITE) return color(255, 255, 255);
  else                return color(128);
}

public void rotateShape(){
  currentShape.rotate();
  
  if(checkShapeCollision(currentShape, currShapeCol, currShapeRow) != 0){
    println("collision on rotate");
    currentShape.unRotate();
  }
}
    
public void keyPressed(){
  
  if(keyCode == KEY_UP && upKeyState == false){
    rotateShape();
    upKeyState = true;
  }
  
  Keyboard.setKeyDown(keyCode, true);
}

public void keyReleased(){
  
  if(keyCode == KEY_UP){
    upKeyState = false;
  }
  
  if(keyCode == KEY_SPACE){
    dropShape();
  }
  
  Keyboard.setKeyDown(keyCode, false);
}

public void postRender(){
  debug.clear();
}

public void drawGrid(){
  for(int cols = 0; cols < NUM_COLS; cols++){
    for(int rows = 0; rows < NUM_ROWS; rows++){
      drawBox(cols, rows, grid[cols][rows]);
    }
  }
}

public void drawBox(int col, int row, int _color){
  if(_color != EMPTY){
    pushStyle();
    fill(getColorFromID(_color));
    rect(col * BOX_SIZE, row * BOX_SIZE, BOX_SIZE, BOX_SIZE);
    popStyle();
  }
}

public void drawBackground(){
  pushStyle();
  noFill();
  strokeWeight(1);
  stroke(255, 32);
  
  // Draw a translucent grid
  for(int cols = 0; cols < NUM_COLS; cols++){
    for(int rows = 0; rows < NUM_ROWS; rows++){
      rect(cols * BOX_SIZE, rows * BOX_SIZE, BOX_SIZE, BOX_SIZE);
    }
  }
  popStyle();
}
