var gl;
var mvMatrix = mat4.create ();
var pMatrix = mat4.create ();
var shaderProgram;
var scene = [];

function initGL (canvas) {
	try {
		gl = canvas.getContext("experimental-webgl");
		gl.viewportWidth = canvas.width;
		gl.viewportHeight = canvas.height;
	}
	catch (e) {
		if (!gl) 
			alert ("could not initialize webgl.");
	}
}

function getShader (gl, id) {
	var shaderScript = document.getElementById(id);
	if (!shaderScript) {
		return null;
	}

	var str = "";
	var k = shaderScript.firstChild;
	while (k) {
		if (k.nodeType == 3) {
			str += k.textContent;
		}
		k = k.nextSibling;
	}

	var shader = gl.createShader (gl[shaderScript.type]);
	
	gl.shaderSource (shader, str);
	gl.compileShader (shader);

	if (!gl.getShaderParameter (shader, gl.COMPILE_STATUS)) {
		alert (gl.getShaderInfoLog(shader));
		return null;
	}

	return shader;
}

function initShaders () {
	var fragmentShader = getShader (gl, "shader-fs");
	var vertexShader = getShader (gl, "shader-vs");

	shaderProgram = gl.createProgram ();
	gl.attachShader (shaderProgram, vertexShader);
	gl.attachShader (shaderProgram, fragmentShader);
	gl.linkProgram (shaderProgram);

	if (!gl.getProgramParameter (shaderProgram, gl.LINK_STATUS)) {
		alert ("could not intialize shaders.");
	}

	gl.useProgram (shaderProgram);

	shaderProgram.vertexPositionAttribute = gl.getAttribLocation (shaderProgram,
		"aVertexPosition");
	gl.enableVertexAttribArray (shaderProgram.vertexPositionAttribute);

	shaderProgram.vertexColorAttribute = gl.getAttribLocation (shaderProgram,
		"aVertexColor");
	gl.enableVertexAttribArray (shaderProgram.vertexColorAttribute);

	shaderProgram.pMatrixUniform = gl.getUniformLocation (shaderProgram, "uPMatrix");
	shaderProgram.mvMatrixUniform = gl.getUniformLocation (shaderProgram, "uMVMatrix");
}

function setMatrixUniforms (mvMatrix) {
	gl.uniformMatrix4fv (shaderProgram.pMatrixUniform, false, pMatrix);
	gl.uniformMatrix4fv (shaderProgram.mvMatrixUniform, false, mvMatrix);
}

function initBuffers () {
	for (var i = 0; i < scene.length; i++)
		scene[i].initBuffers ();
}

function updateScene () {
	for (var i = 0; i < scene.length; i++)
		scene[i].update ();
}

function drawScene () {
	gl.viewport (0, 0, gl.viewportWidth, gl.viewportHeight);
	gl.clear (gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	
	mat4.perspective (45, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0, pMatrix);

	for (var i = 0; i < scene.length; i++) {
		scene[i].draw ();
	}
}

var tick = 0;
function render () {
	tick++;
	updateScene ();
	drawScene ();
	window.requestAnimationFrame (render);
}

function webGLStart () {
	var canvas = document.getElementById ("lesson1");
	initGL (canvas);
	initShaders ();

	setupScene ();

	initBuffers ();

	gl.clearColor (0.0, 0.0, 0.0, 1.0);
	gl.enable(gl.DEPTH_TEST);

	render ();
}

function setupScene () {
	var p = makePyramid ();
	var c = makeCube ();

	p.update = function () {
		mat4.identity (this.mvMatrix);
		mat4.translate (this.mvMatrix, [-1.5, 0.0, -7.0]);
		mat4.rotate (this.mvMatrix, Math.PI*tick/100, [0,1,0]);
	}

	c.update = function () {
		mat4.identity (this.mvMatrix);
		mat4.translate (this.mvMatrix, [1.5, 0.0, -7.0]);
		mat4.rotate (this.mvMatrix, Math.PI*tick/100, [1,1,1]);
	}
	
	scene.push(p);
	scene.push(c);
}

var matrixStack = [];

function mvPush () {
	var copy = mat4.create ();
	mat4.set (mvMatrix, copy);
	matrixStack.push(copy);
}

function mvPop () {
	if (matrixStack.length == 0)
		throw "Invalid pop matrix";
	mvMatrix = matrixStack.pop();
}

function geometry (colorBy, points) {
	this.points = points;
	this.pointIndices = {};
	this.vertexColors = {};
	this.faces = {};
	this.colorBy = colorBy; //vertex | face
	this.mvMatrix = mat4.create ();

	//set up point indcices, useful if we are sharing
	//vertices
	var pointIndex = 0;
	for (var k in this.points)
		this.pointIndices[k] = pointIndex++;

	this.pushFace = function (name, key, color) {
		if (this.colorBy == "face") {
			this.faces[name] = {
				vertices: [],
				color: color
			};
			for(var i = 0; i < key.length; i++) {
				var point = this.points[key[i]];
				this.faces[name].vertices.push (point);
			}
		}
		else
			this.faces[name] = key;
	};

	this.setVertexColors = function (colors) {
		this.vertexColors = colors;
		this.colorBy = "vertex";
	};

	this.getVertices = function () {
		var vertices = [];
		if (this.colorBy == "vertex") {
			//concat each point from this.points
			for (var k in this.points) {
				vertices = vertices.concat(this.points[k]);
			}
		}
		else {
			//for each face, concat each vertex
			for (var fKey in this.faces) {
				var face = this.faces[fKey];
				for (var i = 0; i < face.vertices.length; i++) {
					vertices = vertices.concat (face.vertices[i]);
				}
			}
		}
		return new Float32Array(vertices);
	};

	this.getColors = function () {
		var colors = [];
		if (this.colorBy == "vertex") {
			for(var k in this.points) {
				colors = colors.concat (this.vertexColors[k]);
			}
		}
		else {
			for (var fKey in this.faces) {
				var face = this.faces[fKey];
				for (var i = 0; i < face.vertices.length; i++) {
					colors = colors.concat (face.color);
				}
			}
		}
		return new Float32Array(vertices);
	};

	this.getElementIndices = function () {
		var indices = [];
		if (this.colorBy == "vertex") {
			for (var f in this.faces) {
				for (var k in this.faces[f]) {
					indices.push (this.pointIndices[this.faces[f]]);
				}
			}
		}
		else {
			//treat faces as triangle strips.
			var vc = 0;
			for (var f in this.faces) {
				var vertices = this.faces[f].vertices;
				var first = vc;
				var second = vc+1;
				for (var i = 2; i < vertices.length; i++)
				{
					indices.push (vc + i - 2);
					indices.push (vc + i - 1);
					indices.push (vc + i);
				}
				vc += vertices.length;
			}
		}

		return new Uint16Array (indices);
	};

	this.initBuffers = function () {
		this.positionBuffer = gl.createBuffer ();
		gl.bindBuffer (gl.ARRAY_BUFFER, this.positionBuffer);
		gl.bufferData (gl.ARRAY_BUFFER, this.getVertices (), gl.STATIC_DRAW);

		this.colorBuffer = gl.createBuffer ();
		gl.bindBuffer (gl.ARRAY_BUFFER, this.colorBuffer);
		gl.bufferData (gl.ARRAY_BUFFER, this.getColors (), gl.STATIC_DRAW);

		this.indexBuffer = gl.createBuffer ();
		gl.bindBuffer (gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
		gl.bufferData (gl.ELEMENT_ARRAY_BUFFER, this.getElementIndices (), gl.STATIC_DRAW);
	};

	this.draw = function () {
		//position
		gl.bindBuffer (gl.ARRAY_BUFFER, this.positionBuffer);
		gl.vertexAttribPointer (shaderProgram.vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);

		//color
		gl.bindBuffer (gl.ARRAY_BUFFER, this.colorBuffer);
		gl.vertexAttribPointer (shaderProgram.vertexColorAttribute, 4, gl.FLOAT, false, 0, 0);

		//elements
		gl.bindBuffer (gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
		setMatrixUniforms (this.mvMatrix);
		gl.drawElements (gl.TRIANGLES, this.indexBuffer.length, gl.UNSIGNED_SHORT, 0);
	};

	this.update = function () {};

}

var colors = {
	"red"    : [1.0, 0.0, 0.0, 1.0],
	"blue"   : [0.0, 0.0, 1.0, 1.0],
	"green"  : [0.0, 1.0, 0.0, 1.0],
	"yellow" : [1.0, 1.0, 0.0, 1.0],
	"orange" : [1.0, 0.5, 0.0, 1.0],
	"purple" : [1.0, 0.0, 1.0, 1.0]
};

/* Cube vertex labels:
 *
 *       * E      * F
 *  * A      * B
 *
 *
 *       * G      * H
 *  * C      * D
 */

function makeCube () {
	var cube = new geometry ({
		A : [0.0, 0.0, 0.0],
		B : [1.0, 0.0, 0.0],
		C : [0.0, 1.0, 0.0],
		D : [1.0, 1.0, 0.0],
		E : [0.0, 0.0, 1.0],
		F : [1.0, 0.0, 1.0],
		G : [0.0, 1.0, 1.0],
		H : [1.0, 1.0, 1.0]
	});

	cube.pushFace ('front', 'ABCD', colors.red);
	cube.pushFace ('back', 'EFGH', colors.green);
	cube.pushFace ('top', 'AEBF', colors.blue);
	cube.pushFace ('bottom', 'GHCD', colors.yellow);
	cube.pushFace ('right', 'BFDH', colors.orange);
	cube.pushFace ('left', 'AECG', colors.purple);

	return cube;
}

/* Pyramid vertex labels
 *
 *      * A
 *    
 *        * D
 *  * B      * C
 */

function makePyramid () {
	var p = new geometry ({
		A : [ 0.0,  1.0,  0.0],
		B : [-1.0, -1.0,  1.0],
		C : [ 1.0, -1.0,  1.0],
		D : [ 0.0, -1.0, -1.0]
	});

	p.setVertexColors({
		A : colors.red,
		B : colors.green,
		C : colors.blue,
		D : colors.yellow
	});

	p.pushFace ('front', 'ABC');
	p.pushFace ('left', 'ABD');
	p.pushFace ('right', 'ADC');
	p.pushFace ('bottom', 'BDC');

	return p;
}
