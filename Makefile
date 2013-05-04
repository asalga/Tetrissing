# Tetrissing make file
# Andor Salga
# Needed to write makefile since Processing used an old version
# of Pjs that wasn't working.

release: minify

minify:
	cat Tetrissing.pde Debugger.pde JShape.pde LShape.pde Queue.pde Shape.pde Ticker.pde IShape.pde Keyboard.pde OShape.pde SShape.pde TShape.pde ZShape.pde minimInterface.js > Tetrissing-min.js
	rm -fr tools-bin
	mkdir tools-bin/
	cc -o tools-bin/minifier tools/jsmin.c
	#./tools-bin/minifier < Tetrissing.js > Tetrissing-min.js
	#rm Tetrissing.js
	rm -fr tools-bin

