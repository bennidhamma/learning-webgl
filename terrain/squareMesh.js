function SquareMesh () {

	var basePoints = {
		A : [0.0, 0.0, 0.0],
		B : [1.0, 0.0, 0.0],
		C : [0.0, 1.0, 0.0],
		D : [1.0, 1.0, 0.0],
		E : [0.0, 0.0, 1.0],
		F : [1.0, 0.0, 1.0],
		G : [0.0, 1.0, 1.0],
		H : [1.0, 1.0, 1.0]
	};

	//convert base points to vec3s
	for (var k in basePoints) {
		basePoints[k] = vec3.clone(basePoints[k]);
	}

	var cube = new Cube ();
	var pointIndices = {};
	var pointCount = 0;
	var vertices = [];

	this.addCube = function (pos, type) {
		var triple = 0;
		//test to see if we need to create new points.
		for (var k in basePoints) {
			var v = vec3.add (vec3.create(), basePoints[k], pos);
			triple = setTriplev (v);
			if (pointIndices[triple] == null) {
				pointIndices[triple] = pointCount++;
				vertices.push([v[0], v[1], v[2]]);
			}
		}
		//now add the cube.
		triple = setTriplev(pos);
		cube.setTriple(triple, type); 
	};

	this.createGeometry = function () {
		mesh = new geometry (vertices);

		for (var triple in cube.cells) {
			// Need to test this cell against its neighbors 
			// to determine face visibility. 
			//
			// If a face is visible, add it to the geometry.

			for (var faceKey in faces) {
				var pos = getTriple(triple);
				var face = faces[faceKey];
				if (this.isFaceVisible (pos, faces[face])) {
					var faceInfo = this.prepareFace (pos, face, cube.cells[triple]);
					mesh.pushFace (faceInfo);
				}
			}
		}

		mesh.setTexture (terrainTexture);

		return mesh;
	};

	this.isFaceVisible = function (pos, face) {
		//TODO.
		return true;
	}

	this.prepareFace = function (pos, face, texture) {
		var texCoords = null;
		var vertexKey = null;
		var texIndex = 0;
		if (face == faces.FRONT) {
			vertexKey =  'ABCD';
			texIndex = texture[faceIndices.FRONT];
			texCoords = [0,0,1,0,1,1,0,1];
		}
		else if (face == faces.BACK) {
			vertexKey = 'EFGH';
			texIndex = texture[faceIndices.BACK];
			texCoords =	[1,0,1,1,0,1,0,0];
		}
		else if (face == faces.TOP) {
			vertexKey = 'AEBF'
			texIndex = texture[faceIndices.TOP];
			texCoords = [0,1,0,0,1,0,1,1];
		}
		else if (face == faces.BOTTOM) {
			vertexKey = 'GHCD'
			texIndex = texture[faceIndices.BOTTOM];
			texCoords = [1,1,0,1,0,0,1,0];
		}
		else if (face == faces.RIGHT) {
			vertexKey = 'BFDH'
			texIndex = texture[faceIndices.RIGHT];
			texCoords =	[1,0,1,1,0,1,0,0];
		}
		else if (face == faces.LEFT) {
			vertexKey = 'AECG'
			texIndex = texture[faceIndices.LEFT];
			texCoords =[0,0,1,0,1,1,0,1];
		}

		//prepare indices
		var indices = [];
		for (var i = 0; i < 4; i++) {
			var letter = vertexKey[i];
			var v = vec3.add(vec3.create(), pos, basePoints[letter]);
			var triple = setTriplev(v);
			indices.push (pointIndices[triple]);
		}

		//prepare texture.
		var s = texIndex % TEXTURE_WIDTH;
		var t = texIndex / TEXTURE_HEIGHT >> 0;
		for (var i = 0; i < 8; i+=2) {
			texCoords[i] = (s + texCoords[i]) / TEXTURE_WIDTH;
			texCoords[i+1] = (t + texCoords[i+1]) / TEXTURE_HEIGHT;
		}

		return {indices:indices, texCoords:texCoords};
	}
}

function getTriple (i) {
	return [
		i >> 20, //x
		i << 12 >>> 22, //y
		i << 22 >>> 22 //z
	];
}

function setTriple(x,y,z) {
	return (x << 20) + (y << 10) + z;
}

function setTriplev(v) {
	return (v[0] << 20) + (v[1] << 10) + v[2];
}

function tripleTests () {
	var sets = [
		[0, 0, 0],
		[1, 1, 0],
		[1, 2, 1],
		[1023, 1023, 1023]
	];

	for (var i = 0; i < sets.length; i++) {
		var ex = sets[i];
		var triple = setTriplev (ex);
		var ac = getTriple(triple);
		if (ex[0] != ac[0] || ex[1] != ac[1] || ex[2] != ac[2]) {
			console.error ("error with ", ex, ac);
		}
	}
}

var faces = {
	FRONT : 1,
	BACK : 2,
	TOP : 4,
	BOTTOM : 8,
	RIGHT : 16,
	LEFT : 32
};

var faceIndices = {
	FRONT : 0,
	BACK : 1,
	TOP : 2,
	BOTTOM : 3,
	RIGHT : 4,
	LEFT : 5
};

var terrainTexture;

function loadTextures (callback) {
	var texture = gl.createTexture ();
	terrainTexture = texture;
	var filename = 'terrain.png';
	var img = new Image ();
	img.onload = function () {
		gl.bindTexture(gl.TEXTURE_2D, texture);	
		gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
		callback ();
	};
	img.src = filename;
};

var TEXTURE_WIDTH = 16;
var TEXTURE_HEIGHT = 16;

// [FRONT, BACK, TOP, BOTTOM, RIGHT, LEFT]
var cubeTypes = {
	'grass' : 	[3, 3, 0, 3, 3, 2],
	'rock' :  	[1, 1, 1, 1, 1, 1]
};

function demoSquareMesh () {
	var mesh = new SquareMesh ();

	mesh.addCube (vec3.fromValues(0,0,0), cubeTypes.grass);
	mesh.addCube (vec3.fromValues(1,0,0), cubeTypes.grass);

	scene.push (mesh.createGeometry());
}
