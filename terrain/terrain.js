// roughness should be between 0 and 1.
function makeTerrain (size, height, roughness, x, y)
{
	if (!isPowerOfTwo(size-1))
		throw "size - 1 is not a power of two!";

	//initialize a 2D array of correct size.
	var grid = new Grid(size, size, 0);

	// If terrain already exists to any side, let's match the edges.
	matchEdges (grid, x, y);
	
	if (height) {
		midpointDisplace (grid, height, roughness, 0, 0, size - 1, size - 1);
		var cube = extrude(grid);
		return cube;
	}

	return grid;
}

function matchEdges (g, x, y, d) {
	var diff = Math.round(Math.random());
	var ng = getTerrain (x, y - 1);
	if (ng) {
		ng = ng.grid;
		for (var i = 0; i < g.width; i++) {
			g.set (i, 0, ng.get(i, g.height - 1) + diff);
		}
	}
	var sg = getTerrain (x, y + 1);
	if (sg) {
		sg = sg.grid;
		for (var i = 0; i < g.width; i++) {
			g.set (i, g.height - 1, sg.get(i, 0) + diff);
		}
	}
	var wg = getTerrain (x - 1, y);
	if (wg) {
		wg = wg.grid;
		for (var i = 0; i < g.height; i++) {
			g.set (0, i, wg.get(g.width - 1, i) + diff);
		}
	}
	var eg = getTerrain (x + 1, y);
	if (eg) {
		eg = eg.grid;
		for (var i = 0; i < g.height; i++) {
			g.set (g.width - 1, i, eg.get(0, i) + diff);
		}
	}
}

function midpointDisplace(g, h, r, x0, y0, x1, y1)
{
	//printToCanvas(g);

	var px = Math.floor((x0 + x1) / 2);
	var py = Math.floor((y0 + y1) / 2);

	//do center of square
	if (g.get (px, py) == 0) {
		var pv = (g.get(x0, y0) + g.get(x0, y1) + g.get(x1, y0) + g.get(x1, y1)) / 4;
		pv = Math.round(pv + Math.random () * h);
		g.set(px, py, pv);
	}

	//now do 4 midpoints of square
	
	//diamond width, heights.
	var dw = Math.round((x1 - x0)/2);
	var dh = Math.round((y1 - y0)/2);

	//top
	if (g.get (px, y0) == 0) {
		g.set(px, y0, getMidpoint(
			g.get(x0,y0), 
			g.get(x1,y0), 
			g.get(px, (y0 - dh + g.height) % g.height),
			g.get(px, (y0 + dh + g.height) % g.height),
			h));
	}
	//bottom
	if (g.get (px, y1) == 0) {
		g.set(px, y1, getMidpoint(
			g.get(x0,y1), 
			g.get(x1,y1),
			g.get(px, (y1 - dh + g.height) % g.height),
			g.get(px, (y1 + dh + g.height) % g.height),
			h));
	}
	//left
	if (g.get (x0, py) == 0) {
		g.set(x0, py, getMidpoint(
			g.get(x0,y0),
			g.get(x0,y1),
			g.get((x0 - dw + g.width) % g.width, py),
			g.get((x0 + dw + g.width) % g.width, py),
			h));
	}
	//right
	if (g.get (x1, py) == 0) {
		g.set(x1, py, getMidpoint(
			g.get(x1,y0),
			g.get(x1,y1),
			g.get((x1 - dw + g.width) % g.width, py),
			g.get((x1 + dw + g.width) % g.width, py),
			h));
	}

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
	return Math.round((a + b + c + d) / 4 + Math.random() * h);
}

function isPowerOfTwo (x)
{
	  return ((x != 0) && !(x & (x - 1)));
}

function extrude (grid) {
	var cube = new SquareMesh ();
	cube.grid = grid;
	
	// Normalize range to ensure that the minimum is 0.
	var min = Infinity;
	for (var x = 0; x < grid.width; x++) {
		for (var y = 0; y < grid.height; y++) {
			var z = grid.get (x,y);
			if (z < min) min = z;
		}
	}

	var adj = 0 - min;
	// Adjust 2D grid coords as well as 3D extruded cube coords.
	/*
	for (var x = 0; x < grid.width; x++) {
		for (var y = 0; y < grid.height; y++) {
			var z = grid.get (x,y);
			grid.set (x, y, z + adj);
		}
	}
	*/

	for (var x = 0; x < grid.width; x++) {
		for (var y = 0; y < grid.height; y++) {
			var top = grid.get (x,y);

			cube.addCube (vec3.fromValues(x,top,y), cubeTypes.grass);

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

			//fill in dirt.
			for (var z = bottom; z < top; z++) {
				cube.addCube (vec3.fromValues(x,z,y), cubeTypes.dirt);
			}
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

function getTerrain (x, y) {
	var coordKey = setDouble (x, y);
	return window.terrain[coordKey];
}

function setTerrain (x, y, t) {
	var coordKey = setDouble (x, y);
	window.terrain[coordKey] = t;
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

	sceneInfo.size = tileSize = size;
	var tileCount = parseInt(query.tileCount) || 4;

	var roughness = 0.7;

	var height = parseInt(query.height) || 30;

	window.terrain = {};

	for (var x = 0; x < tileCount; x++) {
		for (var y = 0; y < tileCount; y++) {
			var terrain = makeTerrain (size, height, roughness, x, y);
			setTerrain (x, y, terrain);
			/*
			if (query.print) printToCanvas (terrain.grid);
			else $('#bitmap').hide();
			*/
			var tile = terrain.createGeometry ();
			tile.x = x * size;
			tile.z = y * size;
			positionTile (tile);
			scene.push (tile);
		}
	}

	camera.eye[1] -= 30;
}

function positionTile (tile) {
	tile.updateMatrix = function () {
		mat4.translate (mvMatrix, mvMatrix, [tile.x, 0.0, tile.z]);
	}
};

function color3i (r, g, b) {
	return '#' + r.toString(16) + g.toString(16) + b.toString(16);
}

function printToCanvas (g) {
	var blockSize = 5;
	//var c = $('<canvas width=' + g.width * blockSize + ' height=' + g.height * blockSize + '>');
	var c = $('#bitmap');
	c.attr({width:g.width*blockSize,height:g.height*blockSize});
	var t = $('<table>');
	var ctx = c[0].getContext('2d');
	$('body').prepend(c);
	$('body').prepend(t);
	var max = -Infinity;
	var min = Infinity;

	for (var x = 0; x < g.width; x++) {
		var tr = $('<tr>');
		t.append(tr);
		for (var y = 0; y < g.height; y++) {
			var z = g.get (x, y);
			 $('<td>').text(z).appendTo(tr);
			
			if (z > max) max = z;
			if (z < min) min = z;
		}
	}

	for (var x = 0; x < g.width; x++) {
		for (var y = 0; y < g.height; y++) {
			var z = g.get (x, y);
			var color = Math.round((z-min)/(max-min)* 255);
			ctx.fillStyle = color3i(color, color, color);
			ctx.fillRect(x * blockSize, y * blockSize, blockSize, blockSize);
		}
	}

}
