var gl;
var triangleVertexPositionBuffer;
var triangleColorBuffer;
var squareVertexPositionBuffer;
var squareColorBuffer;
var mvMatrix = mat4.create ();
var pMatrix = mat4.create ();
var shaderProgram;

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

function setMatrixUniforms () {
	gl.uniformMatrix4fv (shaderProgram.pMatrixUniform, false, pMatrix);
	gl.uniformMatrix4fv (shaderProgram.mvMatrixUniform, false, mvMatrix);
}

function initBuffers () {
	triangleVertexPositionBuffer = gl.createBuffer ();
	gl.bindBuffer (gl.ARRAY_BUFFER, triangleVertexPositionBuffer);
	var vertices = new Float32Array([
		0.0, 1.0, 0.0,
		-1.0, -1.0, 0.0,
		1.0, -1.0, 0.0
	]);
	gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
	triangleVertexPositionBuffer.itemSize = 3;
	triangleVertexPositionBuffer.numItems = 3;

	triangleColorBuffer = gl.createBuffer ();
	gl.bindBuffer (gl.ARRAY_BUFFER, triangleColorBuffer);
	var colors = new Float32Array([
		1.0, 0.0, 0.0, 1.0,
		0.0, 1.0, 0.0, 1.0,
		0.0, 0.0, 1.0, 1.0
	]);
	gl.bufferData (gl.ARRAY_BUFFER, colors, gl.STATIC_DRAW);
	triangleColorBuffer.itemSize = 4;
	triangleColorBuffer.numItems = 3;

	squareVertexPositionBuffer = gl.createBuffer ();
	gl.bindBuffer (gl.ARRAY_BUFFER, squareVertexPositionBuffer);
	vertices = new Float32Array([
		1.0, 1.0, 0.0,
		-1.0, 1.0, 0.0,
		1.0, -1.0, 0.0,
		-1.0, -1.0, 0.0
	]);
	gl.bufferData (gl.ARRAY_BUFFER, new Float32Array (vertices), gl.STATIC_DRAW);
	squareVertexPositionBuffer.itemSize = 3;
	squareVertexPositionBuffer.numItems = 4;

	squareColorBuffer = gl.createBuffer ();
	gl.bindBuffer (gl.ARRAY_BUFFER, squareColorBuffer);
	var aColors = [];
	for (var i = 0; i < 4; i++)
		aColors = aColors.concat([0.5, 0.5, 1.0, 1.0]);
	gl.bufferData (gl.ARRAY_BUFFER, new Float32Array(aColors), gl.STATIC_DRAW);
	squareColorBuffer.itemSize = 4;
	squareColorBuffer.numItems = 4;

}

function drawScene () {
	gl.viewport (0, 0, gl.viewportWidth, gl.viewportHeight);
	gl.clear (gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	
	mat4.perspective (45, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0, pMatrix);

	mat4.identity (mvMatrix);
	mat4.translate (mvMatrix, [-1.5, 0.0, -7.0]);
	mvPush ();
	mat4.rotate (mvMatrix, Math.PI*tick/100, [0,1,0]);

	gl.bindBuffer (gl.ARRAY_BUFFER, triangleVertexPositionBuffer);
	gl.vertexAttribPointer (shaderProgram.vertexPositionAttribute, 
		triangleVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
	gl.bindBuffer (gl.ARRAY_BUFFER, triangleColorBuffer);
	gl.vertexAttribPointer(shaderProgram.vertexColorAttribute,
		triangleColorBuffer.itemSize, gl.FLOAT, false, 0, 0);

	setMatrixUniforms ();
	gl.drawArrays (gl.TRIANGLES, 0, triangleVertexPositionBuffer.numItems);

	mvPop ();
	mat4.translate (mvMatrix, [3.0, 0.0, 0.0]);
	mat4.rotate (mvMatrix, Math.PI*tick/100, [1, 0, 0]);

	gl.bindBuffer (gl.ARRAY_BUFFER, squareVertexPositionBuffer);
	gl.vertexAttribPointer (shaderProgram.vertexPositionAttribute, 
		squareVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
	gl.bindBuffer (gl.ARRAY_BUFFER, squareColorBuffer);
	gl.vertexAttribPointer (shaderProgram.vertexColorAttribute,
		squareColorBuffer.itemSize, gl.FLOAT, false, 0, 0);
	setMatrixUniforms ();
	gl.drawArrays (gl.TRIANGLE_STRIP, 0, squareVertexPositionBuffer.numItems);
}

function webGLStart () {
	var canvas = document.getElementById ("lesson1");
	initGL (canvas);
	initShaders ();
	initBuffers ();

	gl.clearColor (0.0, 0.0, 0.0, 1.0);
	gl.enable(gl.DEPTH_TEST);

	render ();
}

var tick = 0;
function render () {
	tick++;
	drawScene ();
	window.requestAnimationFrame (render);
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

function geometry (points) {
	this.points = points;
	this.vertices = [];
	this.faces = {};

	this.pushFace = function (name, key) {
		this.faces[name] = [];
		for(var i = 0; i < key.length; i++) {
			var point = this.points[key[i]];
			this.vertices = this.vertices.concat (point);
			this.faces[name].push (point);
		}
	}
}

var colors = {
	"red"    : [1.0, 0.0, 0.0, 1.0],
	"blue"   : [0.0, 0.0, 1.0, 1.0],
	"green"  : [0.0, 1.0, 0.0, 1.0]
};

/* Cube vertex labels:
 *
 *       * E      * F
 *  * A      * B
 *
 *
 *
 *       * G      * H
 *  * C      * D
 */

function cubeGeometry () {
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

	cube.pushFace ('front', 'ABDC');
	cube.pushFace ('back', 'EFHG');
	cube.pushFace ('top', 'AEFB');
	cube.pushFace ('bottom', 'GHDC');
	cube.pushFace ('right', 'BFHD');
	cube.pushFace ('left', 'AEGC');

	return cube;
}

/* Pyramid vertex labels
 *
 *      * A
 *    
 *        * D
 *  * B      * C
 */

function pyramidGeometry () {
	var p = new geometry ({
		A : [ 0.0,  1.0,  0.0],
		B : [-1.0, -1.0,  1.0],
		C : [ 1.0, -1.0,  1.0],
		D : [ 0.0, -1.0, -1.0]
	});

	p.pushFace ('front', 'ABC');
	p.pushFace ('left', 'ABD');
	p.pushFace ('right', 'ADC');
	p.pushFace ('bottom', 'BDC');

	return p;
}
