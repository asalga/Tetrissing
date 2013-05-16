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
    sounds[soundID].play();
    sounds[soundID].currentTime = 0;
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

