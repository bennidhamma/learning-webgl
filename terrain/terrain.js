// roughness should be between 0 and 1.
function makeTerrain (size, height, roughness)
{
	if (!isPowerOfTwo(size-1))
		throw "size - 1 is not a power of two!";

	//initialize a 2D array of correct size.
	var grid = new Grid(size, size, 0);
	
	if (height)
		midpointDisplace (grid, height, roughness, 0, 0, size - 1, size - 1);

	return grid;
}

function midpointDisplace(g, h, r, x0, y0, x1, y1)
{
	var px = Math.floor((x0 + x1) / 2);
	var py = Math.floor((y0 + y1) / 2);

	//do center of square
	var pv = (g.get(x0, y0) + g.get(x0, y1) + g.get(x1, y0) + g.get(x1, y1)) / 4;
	pv += Math.round(Math.random () * h - h / 2);
	g.set(px, py, pv);

	//now do 4 midpoints of square
	
	//top
	g.set(px, y0, getMidpoint(g.get(x0,y0), g.get(x1,y0), h));
	//bottom
	g.set(px, y1, getMidpoint(g.get(x0,y1), g.get(x1,y1), h));
	//left
	g.set(x0, py, getMidpoint(g.get(x0,y0), g.get(x0,y1), h));
	//right
	g.set(x1, py, getMidpoint(g.get(x1,y0), g.get(x1,y1), h));

	if (px <= x0 || py <= y0)
		return;

	//recurse on 4 sub squares

	//top-left
	midpointDisplace(g, h / 2, r, x0, y0, px, py);

	//top-right
	midpointDisplace(g, h / 2, r, px, y0, px, py);

	//bottom-left
	midpointDisplace(g, h / 2, r, x0, py, px, y1);

	//bottom-right
	midpointDisplace(g, h / 2, r, px, py, x1, y1);
}

function getMidpoint(a, b, h)
{
	return Math.round((a + b) / 2 + Math.random() * h - h / 2);
}

function isPowerOfTwo (x)
{
	  return ((x != 0) && !(x & (x - 1)));
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

function setupScene () {

	/*
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
	return;
	*/

	var size = 65;
	var roughness = 0.7;
	var height = 30;
	var terrain = makeTerrain (size, height, roughness);

	for (var x = 0; x < size; x++)
		for (var y = 0; y < size; y++)
			setupCube (x, y, terrain.get (x, y));

}

function setupCube (x, y, z) {
	console.log( 'creating cube', x, y, z);
	var cube = makeCube ();
	cube.updateMatrix = function () {
		mat4.translate (mvMatrix, mvMatrix, [x, -z, y]);
	};
	scene.push (cube);
}
