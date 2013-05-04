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

