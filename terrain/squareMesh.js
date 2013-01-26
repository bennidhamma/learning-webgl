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
		//test to see if we need to create new points.
		for (var k in basePoints) {
			var vertex = vec3.add (vec3.create(), basePoints[k], pos);
			var triple = setTriplev (vertex);
			if (pointIndices[triple] == null) {
				pointIndices[triple] = pointCount++;
				vertices.push(vertex);
			}
		}
		//now add the cube.
		cube.setTriple(triple, type); 
	};

	this.createGeometry = function () {
		mesh = new geometry ();

		for (var triple in cube.cells) {
			// Need to test this cell against its neighbors 
			// to determine face visibility. 
			//
			// If a face is visible, add it to the geometry.

			for (var face in faces) {
				var pos = getTriple(triple);
				if (this.isFaceVisible (pos, faces[face]) {
					var faceInfo = this.prepareFace (pos, face, texture);
					mesh.pushFace (faceInfo);
				}
			}
		}
	};

	this.isFaceVisible = function (pos, face) {
		//TODO.
		return true;
	}

	this.addFace = function (pos, face, texture) {
		var texCoords = null;
		var vertexKey = null;
		if (face == faces.FRONT) {
			vertexKey =  'ABCD'
			texCoords = [0,0,1,0,1,1,0,1];
		}
		else if (face == faces.BACK) {
			vertexKey = 'EFGH'
			texCoords =	[1,0,1,1,0,1,0,0];
		}
		else if (face == faces.TOP) {
			vertexKey = 'AEBF'
			texCoords = [0,1,0,0,1,0,1,1];
		}
		else if (face == faces.BOTTOM) {
			vertexKey = 'GHCD'
			texCoords = [1,1,0,1,0,0,1,0];
		}
		else if (face == faces.RIGHT) {
			vertexKey = 'BFDH'
			texCoords =	[1,0,1,1,0,1,0,0];
		}
		else if (face == faces.LEFT) {
			vertexKey = 'AECG'
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

		return {indices:indices, texCoords:texCoords};
	}
}

function getTriple (i) {
	return [
		i >> 20, //x
		i << 12 >> 22, //y
		i << 21 >> 21 //z
	];
}

function setTriple(x,y,z) {
	return (x << 20) + (y << 10) + z;
}

function setTriplev(v) {
	return (v[0] << 20) + (v[1] << 10) + v[2];
}

var faces = {
	FRONT : 1,
	BACK : 2,
	TOP : 4,
	BOTTOM : 8,
	RIGHT : 16,
	LEFT : 32
};


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
