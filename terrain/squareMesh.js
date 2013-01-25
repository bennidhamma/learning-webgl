function SquareMesh () {
	var mesh = new geometry ();

	this.addCube = function (pos, type) {

	};

	this.getVertices = function () {

	}
}

var terrainTexture;

function loadTextures () {
	var texture = gl.createTexture ();
	var filename = 'terrain.png';
	var img = new Image ();
	img.onload = function () {
		gl.bindTexture(gl.TEXTURE_2D, texture);	
		gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
		terrainTexture = texture;
	};
	img.src = filename;
};

var cubeTypes = {
	'grass' : {
		top : 0,
		sides : 3,
		bottom : 2
	},
	'rock' : {
		top : 1,
		sides : 1,
		bottom : 1
	}
};

function demoSquareMesh () {
	var mesh = new SquareMesh ();

	mesh.addCube (vec3.fromValues(0,0,0), cubeTypes.grass);
	mesh.addCube (vec3.fromValues(1,0,0), cubeType.grass);
}
