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

  this.playSoundByLinesCleared = function(numLines){
    this.playSound(LINES);
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
