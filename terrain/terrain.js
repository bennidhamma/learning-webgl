// roughness should be between 0 and 1.
function makeTerrain (size, height, roughness)
{
	if (!isPowerOfTwo(size-1))
		throw "size - 1 is not a power of two!";

	//initialize a 2D array of correct size.
	var grid = new Grid(size, size, 0);
	
	if (height) {
		midpointDisplace (grid, height, roughness, 0, 0, size - 1, size - 1);
		var cube = extrude(grid);
		return cube;
	}

	return grid;
}

function midpointDisplace(g, h, r, x0, y0, x1, y1)
{
	//printToCanvas(g);

	var px = Math.floor((x0 + x1) / 2);
	var py = Math.floor((y0 + y1) / 2);

	//do center of square
	var pv = (g.get(x0, y0) + g.get(x0, y1) + g.get(x1, y0) + g.get(x1, y1)) / 4;
	pv += Math.round(Math.random () * h - h / 2);
	g.set(px, py, pv);

	//now do 4 midpoints of square
	
	//diamond width, heights.
	var dw = Math.round((x1 - x0)/2);
	var dh = Math.round((y1 - y0)/2);

	//top
	g.set(px, y0, getMidpoint(
		g.get(x0,y0), 
		g.get(x1,y0), 
		g.get(px, (y0 - dh + g.height) % g.height),
		g.get(px, (y0 + dh + g.height) % g.height),
		h));
	//bottom
	g.set(px, y1, getMidpoint(
		g.get(x0,y1), 
		g.get(x1,y1),
		g.get(px, (y1 - dh + g.height) % g.height),
		g.get(px, (y1 + dh + g.height) % g.height),
		h));
	//left
	g.set(x0, py, getMidpoint(
		g.get(x0,y0),
	   	g.get(x0,y1),
		g.get((x0 - dw + g.width) % g.width, py),
		g.get((x0 + dw + g.width) % g.width, py),
	   	h));
	//right
	g.set(x1, py, getMidpoint(
		g.get(x1,y0),
	   	g.get(x1,y1),
		g.get((x1 - dw + g.width) % g.width, py),
		g.get((x1 + dw + g.width) % g.width, py),
	   	h));

	if (px <= x0 || py <= y0)
		return;

	//recurse on 4 sub squares

	//top-left
	midpointDisplace(g, h / 2 * r, r, x0, y0, px, py);

	//top-right
	midpointDisplace(g, h / 2 * r, r, px, y0, x1, py);

	//bottom-left
	midpointDisplace(g, h / 2 * r, r, x0, py, px, y1);

	//bottom-right
	midpointDisplace(g, h / 2 * r, r, px, py, x1, y1);
}

function getMidpoint(a, b, c, d, h)
{
	return Math.round((a + b + c + d) / 4 + Math.random() * h - h / 2);
}

function isPowerOfTwo (x)
{
	  return ((x != 0) && !(x & (x - 1)));
}

function extrude (grid) {
	var cube = new Cube(grid.width, grid.height);

	for (var x = 0; x < grid.width; x++) {
		for (var y = 0; y < grid.height; y++) {
			var top = grid.get (x,y);
			//bottom is the minimum of self and four neighbors.
			var elems = [top];
			if (x > 0) //left
				elems.push ( grid.get (x-1,y));
			if (x < grid.width-1)//right
				elems.push ( grid.get (x+1,y));
			if (y > 0)
				elems.push( grid.get (x, y-1));
			if (y < grid.height-1)//bottom
				elems.push (grid.get (x, y+1));
			var bottom = Math.min.apply(Math, elems);
			cube.set (x, y, top, bottom);
		}
	}
	return cube;
}

function Grid(w, h, defaultValue) {
	this.width = w;
	this.height = h;

	var array = new Array(w * h);

	for(var i = 0; i < w * h; i++)
		array[i] = defaultValue || 0;

	this.get = function(x,y) {
		return array[y * w + x];
	}

	this.set = function(x,y,v) {
		array[y * w + x] = v;
	}
}

//cube can only be 1024 x 1024 x 1024.
function Cube(w, h) {
	this.width = w;
	this.height = h;
	this.cells = {};

	this.getTriple = function(triple) {
		var triple = setTriple (pos[0], pos[1], pos[2]);
		return cells[triple];
	}

//	this.getVec = function (x, y, z) {

	this.setVec = function(pos, v) {
		var triple = setTriple (pos[0], pos[1], pos[2]);
		this.cells[triple] = v;
	}

	this.setTriple = function(triple, v) {
		this.cells[triple] = v;
	}
}

function simpleScene () {
	
	var p = makePyramid ();
	var c = makeCube ();

	p.updateMatrix = function () {
		mat4.translate (mvMatrix, mvMatrix, [-1.5, 0.0, -7.0]);
		mat4.rotate (mvMatrix, mvMatrix, Math.PI*tick/200, [1,0,0]);
	}

	c.updateMatrix = function () {
		mat4.translate (mvMatrix, mvMatrix, [1.5, 0.0, -7.0]);
		mat4.rotate (mvMatrix, mvMatrix, Math.PI*tick/200, [1,1,1]);
	}
	
	scene.push(p);
	scene.push(c);
	

	/*
	var c1 = makeCube (colors.green);
	var c2 = makeCube (colors.red);
	*/

	var composite = new geometry ();

	for (var i = 0; i < 2; i++) {
		addSimpleCube (composite, i);
	}

	scene.push (composite);
	window.c = composite;

	return;
}

function addSimpleCube (composite, i) {
	var c = makeCube ();

	c.updateMatrix = function () {
	//	mat4.translate (mvMatrix, mvMatrix, [Math.sin(i/100)*100, Math.cos(i/100)*100, Math.sin(i/10)*10]);
		mat4.translate (mvMatrix, mvMatrix, [i, i, i]);
	};

	composite.addChild (c);
}

function setupScene () {
	if (query.scene == 'simple') {
		simpleScene ();
		return;
	}
	else if (query.scene == 'demoMesh') {
		demoSquareMesh ();
		return;
	}

	var size = parseInt(query.size) || 33;
	var roughness = 0.7;
	var height = parseInt(query.height) || 30;
	var terrain = makeTerrain (size, height, roughness);
	window.terrain = terrain;

	for (var x = 0; x < size; x++)
		for (var y = 0; y < size; y++)
			setupColumn (x, y, terrain.get (x, y));

	printToCanvas (terrain);
	scene.push (terrainCombine);

	camera.eye[1] -= 20;
}

var terrainCombine = new geometry ();

function setupColumn (x, y, col) {
	for (var z = col.bottom; z <= col.top; z++) {
		setupCube (x, y, z);
	}
}

function setupCube (x, y, z) {
	console.log( 'creating cube', x, y, z);
	var cube = makeCube ();
	cube.updateMatrix = function () {
		mat4.translate (mvMatrix, mvMatrix, [x, z, y]);
	};
	//scene.push (cube);
	terrainCombine.addChild (cube);
}

function color3i (r, g, b) {
	return '#' + r.toString(16) + g.toString(16) + b.toString(16);
}

function printToCanvas (g) {
	var blockSize = 5;
	//var c = $('<canvas width=' + g.width * blockSize + ' height=' + g.height * blockSize + '>');
	var c = $('#bitmap');
	c.attr({width:g.width*blockSize,height:g.height*blockSize});
	//var t = $('<table>');
	var ctx = c[0].getContext('2d');
	$('body').prepend(c);
	//$('body').prepend(t);
	var max = -Infinity;
	var min = Infinity;

	for (var x = 0; x < g.width; x++) {
		//var tr = $('<tr>');
		//t.append(tr);
		for (var y = 0; y < g.height; y++) {
			var z = g.get (x, y).top;
		//	 $('<td>').text(z).appendTo(tr);
			
			if (z > max) max = z;
			if (z < min) min = z;
		}
	}

	for (var x = 0; x < g.width; x++) {
		for (var y = 0; y < g.height; y++) {
			var z = g.get (x, y).top;
			var color = Math.round((z-min)/(max-min)* 255);
			ctx.fillStyle = color3i(color, color, color);
			ctx.fillRect(x * blockSize, y * blockSize, blockSize, blockSize);
		}
	}

}
