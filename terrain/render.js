var gl;
var mvMatrix = mat4.create ();
var pMatrix = mat4.create ();
var shaderProgram;
var scene = [];
var paused = false;
var canvas;
var query = {};

var camera = {
	RIGHT : vec3.fromValues (1, 0, 0),
	FORWARD : vec3.fromValues (0, 0, -1),
	forward : vec3.fromValues (0, 0, -1),
	right : vec3.fromValues (1, 0, 0),
	eye : vec3.fromValues (0, 0, -10),
	pitch : 0,
	yaw : 0
};

function initGL (_canvas) {
	try {
		mat4.identity(mvMatrix);
		canvas = _canvas;
		gl = canvas.getContext("experimental-webgl");
		gl.viewportWidth = canvas.width = document.width;
		gl.viewportHeight = canvas.height = document.height;

		$(document).keyup(function (e) {
			if (e.keyCode == 32) {
				if (paused) {
					paused = false;
					render ();
				}
				else
					paused = true;
			}
		});
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
	
	mat4.perspective (pMatrix, Math.PI / 4, gl.viewportWidth / gl.viewportHeight, 0.1, 1000.0);

	mat4.identity(mvMatrix);
	
	mat4.rotateX(mvMatrix, mvMatrix, camera.pitch);
	mat4.rotateY(mvMatrix, mvMatrix, camera.yaw);

	//now move model view matrix to camera pos.
	mat4.translate(mvMatrix,mvMatrix,camera.eye);

	for (var i = 0; i < scene.length; i++) {
		scene[i].draw ();
	}
}

function getUpVector () {
	var mat = mat4.create();
	mat4.identity(mat);
	
	mat4.rotateX(mat, mat, camera.pitch);
	mat4.rotateY(mat, mat, camera.yaw);

	var v = vec3.fromValues(0,1,0);
	return vec3.transformMat4(v, v, mat);
}

function getForwardVector () {
	var mat = mat4.create();
	mat4.identity(mat);
	
	mat4.rotateX(mat, mat, camera.pitch);
	mat4.rotateY(mat, mat, camera.yaw);

	var v = vec3.fromValues(0,0,-1);
	return vec3.scale(v, vec3.transformMat4(v, v, mat), -1);
}

function getRightVector () {
	var mat = mat4.create();
	mat4.identity(mat);
	
	mat4.rotateX(mat, mat, camera.pitch);
	mat4.rotateY(mat, mat, camera.yaw);

	var v = vec3.fromValues(1,0,0);
	return vec3.scale(v, vec3.transformMat4(v, v, mat), 1);
}

var tick = 0;
function render () {
	tick++;
	handleEvents ();
	updateScene ();
	drawScene ();
	if (!paused)
		window.requestAnimationFrame (render);
}

var events = {
	mouse : {x:null, y:null},
	keyboard : []
};

var lastEvents = null;

function setupEvents () {
	$(canvas)
	.keydown (function (e) {
		events.keyboard[e.which] = true;
	})
	.keyup (function (e) {
		events.keyboard[e.which] = false;
	})
	.mousemove (function (e) {
		events.mouse.which = e.which;
		events.mouse.x = e.clientX;
		events.mouse.y = e.clientY;
	});
}

var mx = null, my = null;
var speed = 0;
function handleEvents () {
	if (lastEvents != null && lastEvents.mouse.which == 0 && events.mouse.which == 1)
	{
		mx = events.mouse.x;
		my = events.mouse.y;
	}
	else if (lastEvents != null && events.mouse.which == 1)
	{
		if (events.mouse.x != mx) {
			camera.yaw -= (mx - events.mouse.x) / 100;
			mx = events.mouse.x;
		}
		if (events.mouse.y != my) {
			camera.pitch -= (my - events.mouse.y) / 100;
			my = events.mouse.y;
		}
	}

	var amount = 1/3;
	var strafe = 0;
	if (events.keyboard[KeyEvent.DOM_VK_DOWN] ||
		events.keyboard[KeyEvent.DOM_VK_S])
		speed = amount;
	else if (events.keyboard[KeyEvent.DOM_VK_UP] ||
		events.keyboard[KeyEvent.DOM_VK_W])
		speed = -amount;
	else
		speed = 0;

	
	if (events.keyboard[KeyEvent.DOM_VK_A])
		vec3.add (camera.eye, camera.eye, vec3.scale(vec3.create(), getRightVector(), amount));
	if (events.keyboard[KeyEvent.DOM_VK_D])
		vec3.add (camera.eye, camera.eye, vec3.scale(vec3.create(), getRightVector(), -amount));

	lastEvents = {};
	$.extend (true, lastEvents, events);

	if (speed != 0)
	{
		camera.eye[0] += Math.sin(camera.yaw) * speed;
		camera.eye[2] -= Math.cos(camera.yaw) * speed;
		camera.eye[1] -= Math.sin(camera.pitch) * speed;
	}
}

function webGLStart () {
	var c = document.getElementById ("viewer");
	parseQuery ();
	initGL (c);
	initShaders ();

	setupScene ();

	initBuffers ();

	gl.clearColor (0.0, 0.0, 0.0, 1.0);
	gl.enable(gl.DEPTH_TEST);

	setupEvents ();
	render ();
}

function parseQuery () {
	try {
		var q = document.location.search.substr(1).split('&');
		for (var i = 0; i < q.length; i++) {
			var tuple = q[i].split('=');
			query[tuple[0]] = tuple[1] || true;
		}
	}
	catch (e) {}
};

var matrixStack = [];

function mvPush () {
	var copy = mat4.clone (mvMatrix);
	matrixStack.push(copy);
}

function mvPop () {
	if (matrixStack.length == 0)
		throw "Invalid pop matrix";
	mvMatrix = matrixStack.pop();
}

var FACE = 0;
var VERTEX = 1;

function geometry (colorBy, points) {
	this.points = points;
	this.pointIndices = {};
	this.vertexColors = {};
	this.faces = {};
	this.colorBy = colorBy; //vertex | face

	//set up point indices, useful if we are sharing
	//vertices
	var pointIndex = 0;
	for (var k in this.points)
		this.pointIndices[k] = pointIndex++;

	this.pushFace = function (name, key, color) {
		if (this.colorBy == FACE) {
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
	};

	this.getVertices = function () {
		var vertices = [];
		if (this.colorBy == VERTEX) {
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

		if (this.children) {
			console.log ('getting child vertices');
			var time = performance.now();
			var cvs = [];
			var vertexCount = 0;
			for (var i = 0; i < this.children.length; i++) {
				mvPush(mvMatrix);
				this.children[i].updateMatrix ();
				var cv = this.children[i].getVertices ();
				for (var j = 0; j < cv.length; j+=3) {
					var v = vec3.fromValues(cv[j], cv[j+1], cv[j+2]);
					vec3.transformMat4(v, v, mvMatrix);
					cv[j] = v[0];
					cv[j+1] = v[1];
					cv[j+2] = v[2];
				}
				mvPop(mvMatrix);
				this.children[i].vertexStart = vertexCount;
				cvs.push(cv);
				vertexCount += cv.length / 3;
				//vertices = vertices.concat(cv);
			}
			vertices = vertices.concat.apply(vertices, cvs);
			console.log ("getvertices: ", performance.now()-time);
		}

		return vertices;
	};

	this.getColors = function () {
		var colors = [];
		if (this.colorBy == VERTEX) {
			for(var k in this.points) {
				colors = colors.concat (this.vertexColors[k]);
			}
		}
		else {
			for (var fKey in this.faces) {
				var face = this.faces[fKey];
				for (var i = 0; i < face.vertices.length; i++) {
					for (var j = 0; j < face.color.length; j++) {
						colors.push(face.color[j]);
					}
					//colors = colors.concat (face.color);
				}
			}
		}

		if (this.children) {
			console.log('getting child colors');
			var time = performance.now();
			var cs = [];
			for (var i = 0; i < this.children.length; i++) {
				cs.push(this.children[i].getColors ());
			}
			colors = colors.concat.apply(colors, cs);
			console.log ("getcolors: ", performance.now()-time);
		}
		return colors;
	};

	this.getElementIndices = function () {
		var indices = [];
		if (this.colorBy == VERTEX) {
			for (var f in this.faces) {
				var currFace = this.faces[f];
				for (var k in this.faces[f]) {
					indices.push (this.pointIndices[currFace[k]]);
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

		if (this.children) {
			var cis = [];
			for (var i = 0; i < this.children.length; i++) {
				var childIndices = this.children[i].getElementIndices ();
				for (var j = 0; j < childIndices.length; j++) {
					childIndices[j] += this.children[i].vertexStart;
				}
				cis.push (childIndices);
			}
			indices = indices.concat.apply(indices, cis);
		}

		return indices;
	};

	this.initBuffers = function () {
		this.positionBuffer = gl.createBuffer ();
		gl.bindBuffer (gl.ARRAY_BUFFER, this.positionBuffer);
		gl.bufferData (gl.ARRAY_BUFFER, new Float32Array(this.getVertices ()), gl.STATIC_DRAW);

		this.colorBuffer = gl.createBuffer ();
		gl.bindBuffer (gl.ARRAY_BUFFER, this.colorBuffer);
		gl.bufferData (gl.ARRAY_BUFFER, new Float32Array(this.getColors ()), gl.STATIC_DRAW);

		this.indexBuffer = gl.createBuffer ();
		var ei = new Uint16Array(this.getElementIndices ());
		this.indexLength = ei.length;
		gl.bindBuffer (gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
		gl.bufferData (gl.ELEMENT_ARRAY_BUFFER, ei, gl.STATIC_DRAW);
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
		mvPush();
		this.updateMatrix ();
		setMatrixUniforms ();
		mvPop();
		gl.drawElements (gl.TRIANGLES, this.indexLength, gl.UNSIGNED_SHORT, 0);
	};

	this.update = function () {};

	this.updateMatrix = function () {};

	this.addChild = function (child) {
		if (!this.children)
			this.children = [];
		this.children.push (child);
	};
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

function makeCube (color) {
	var cube = new geometry (color ? VERTEX : FACE,{
		A : [0.0, 0.0, 0.0],
		B : [1.0, 0.0, 0.0],
		C : [0.0, 1.0, 0.0],
		D : [1.0, 1.0, 0.0],
		E : [0.0, 0.0, 1.0],
		F : [1.0, 0.0, 1.0],
		G : [0.0, 1.0, 1.0],
		H : [1.0, 1.0, 1.0]
	});

	if (color) {
		cube.setVertexColors({
			A : color,
			B : color,
			C : color,
			D : color,
			E : color,
			F : color,
			G : color,
			H : color
		});
	}

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
	var p = new geometry (VERTEX, {
		A : [ 1.0,  0.0,  -1/Math.SQRT2],
		B : [-1.0,  0.0,  -1/Math.SQRT2],
		C : [ 0.0,  1.0,  1/Math.SQRT2],
		D : [ 0.0, -1.0,  1/Math.SQRT2]
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
