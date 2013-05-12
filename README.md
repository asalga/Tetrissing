Tetrissing
==========

Tetris clone in Processing

Keys:
 - Arrow keys to transform piece
 - G,F,K,M - toggle some features
 - P for pause
 - Space to immediately drop piece

To Build:  
 $ make  
 $ python -m SimpleHTTPServer  
Then go to http://localhost:8080 

Known Issues:
 - Fix covering play area with red on pause and game over in Pjs
 - Small text is not being displayed in Pjs version
 - Add animation on line clear
 - Fix drawing drop streak
 - Fix audio for Firefox
 - Make Utils.js a static class
 - Fix spinning piece
 - make height of tetris 'window' smaller
 - Prevent pause after game over

Future stuff:
 - Add chain reaction feature
 - Add spin forever feature
