# Tetrissing make file
# Andor Salga
# Needed to write makefile since Processing used an old version
# of Pjs that wasn't working.

release: minify

minify:
	cat Tetrissing.pde Debugger.pde JShape.pde LShape.pde Queue.pde Shape.pde Ticker.pde IShape.pde Keyboard.pde OShape.pde SShape.pde TShape.pde ZShape.pde > Tetrissing.js

