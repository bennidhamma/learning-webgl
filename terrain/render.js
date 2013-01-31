var gl;
var mvMatrix = mat4.create ();
var pMatrix = mat4.create ();
var shaderProgram;
var scene = [];
var sceneInfo = {
	ambient: vec3.fromValues(0.2, 0.2, 0.2),
	directional: {
		direction: vec3.fromValues(-1, -0.5, -1),
		color: vec3.fromValues (0.8, 0.8, 0.8)
	}
}

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

		//normalize and scale light
		var dv = vec3.create ();
		vec3.normalize (dv, sceneInfo.directional.direction);
		vec3.scale (dv, dv, -1);
		sceneInfo.directional.direction = dv;
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

	shaderProgram.vertexTextureAttribute = gl.getAttribLocation (shaderProgram,
		"aTextureCoord");
	gl.enableVertexAttribArray (shaderProgram.vertexTextureAttribute);

	shaderProgram.vertexNormalAttribute = gl.getAttribLocation (shaderProgram,
		"aVertexNormal");
	gl.enableVertexAttribArray (shaderProgram.vertexNormalAttribute);

	shaderProgram.pMatrixUniform = gl.getUniformLocation (shaderProgram, "uPMatrix");
	shaderProgram.nMatrixUniform = gl.getUniformLocation (shaderProgram, "uNMatrix");
	shaderProgram.mvMatrixUniform = gl.getUniformLocation (shaderProgram, "uMVMatrix");
	shaderProgram.samplerUniform = gl.getUniformLocation(shaderProgram, "uSampler");

	shaderProgram.ambientColorUniform = gl.getUniformLocation(shaderProgram, "uAmbientColor");
	shaderProgram.directionalColorUniform = gl.getUniformLocation(shaderProgram, "uDirectionalColor");
	shaderProgram.lightingDirectionUniform = gl.getUniformLocation(shaderProgram, "uLightingDirection");
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
	
	setupLightingUniforms ();

	mat4.rotateX(mvMatrix, mvMatrix, camera.pitch);
	mat4.rotateY(mvMatrix, mvMatrix, camera.yaw);

	//now move model view matrix to camera pos.
	mat4.translate(mvMatrix,mvMatrix,camera.eye);


	for (var i = 0; i < scene.length; i++) {
		scene[i].draw ();
	}
}

function setupLightingUniforms () {
	gl.uniform3fv (shaderProgram.ambientColorUniform, sceneInfo.ambient);
	gl.uniform3fv (shaderProgram.directionalColorUniform, sceneInfo.directional.color);
	gl.uniform3fv (shaderProgram.lightingDirectionUniform, sceneInfo.directional.direction);
}

function getUpVector () {
	var mat = mat4.create();
	mat4.identity(mat);
	
	mat4.rotateX(mat, mat, -camera.pitch);
	mat4.rotateY(mat, mat, -camera.yaw);

	var v = vec3.fromValues(0,-1,0);
	return vec3.transformMat4(v, v, mat);
}

function getForwardVector () {
	var mat = mat4.create();
	mat4.identity(mat);
	
	mat4.rotateX(mat, mat, -camera.pitch);
	mat4.rotateY(mat, mat, -camera.yaw);

	var v = vec3.fromValues(0,0,-1);
	return vec3.scale(v, vec3.transformMat4(v, v, mat), -1);
}

function getRightVector () {
	var mat = mat4.create();
	mat4.identity(mat);
	
	mat4.rotateX(mat, mat, -camera.pitch);
	mat4.rotateY(mat, mat, -camera.yaw);

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
	if (events.keyboard[KeyEvent.DOM_VK_Q])
		vec3.add (camera.eye, camera.eye, vec3.scale(vec3.create(), getUpVector(), amount));
	if (events.keyboard[KeyEvent.DOM_VK_Z])
		vec3.add (camera.eye, camera.eye, vec3.scale(vec3.create(), getUpVector(), -amount));

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

	loadTextures (render);
	setupScene ();

	initBuffers ();

	gl.clearColor (0.384, 0.596, 0.839, 1.0);
	gl.enable(gl.DEPTH_TEST);

	setupEvents ();
	
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

var MAX_CONCAT_COUNT = 65000;
function geometry () {
	this.faces = [];
	this.faceCount = 0;

	this.pushFace = function (faceInfo) {
		this.faces.push(faceInfo);
		this.faceCount++;
	};

	this.getVertices = function () {
		var out = [];
		var vs = [];
		//treat faces as triangle strips.
		for (var f = 0; f < this.faceCount; f++) {
			if (vs.length > MAX_CONCAT_COUNT) {
				out = out.concat.apply (out, vs);
				vs = [];
			}
			vs.push(this.faces[f].vertices);
		};
		return out.concat.apply(out, vs);
	};

	this.getElementIndices = function () {
		var indices = [];
		var totalCount = 0;
		//treat faces as triangle strips.
		for (var f = 0; f < this.faceCount; f++) {
			var length = this.faces[f].vertices.length / 3;
			var vc = totalCount;
			for (var i = 2; i < length; i++)
			{
				indices.push (vc + i - 2);
				indices.push (vc + i - 1);
				indices.push (vc + i);
			}
			totalCount += length;
		}
		return indices;
	};

	this.setTexture = function (texture) {
		this.texture = texture;
	};

	this.getTextureCoords = function () {
		var coords = [];
		var coordSets = [];
		for (var f = 0; f < this.faceCount; f++) {
			if (coordSets.length > MAX_CONCAT_COUNT) {
				coords = coords.concat.apply (coords, coordSets);
				coordSets = [];
			}
			coordSets.push (this.faces[f].texCoords);
		}
		return coords.concat.apply (coords, coordSets);
	};

	this.getNormals = function () {
		var normals = [];
		var normalSets = [];
		for (var f = 0; f < this.faceCount; f++) {
			if (normalSets.length > MAX_CONCAT_COUNT) {
				normals = normals.concat.apply (normals, normalSets);
				normalSets = [];
			}
			normalSets.push (this.faces[f].normals);
		}
		return normals.concat.apply (normals, normalSets);
	};

	this.initBuffers = function () {
		this.positionBuffer = gl.createBuffer ();
		gl.bindBuffer (gl.ARRAY_BUFFER, this.positionBuffer);
		gl.bufferData (gl.ARRAY_BUFFER, new Float32Array(this.getVertices ()), gl.STATIC_DRAW);

		this.textureBuffer = gl.createBuffer ();
		gl.bindBuffer (gl.ARRAY_BUFFER, this.textureBuffer);
		gl.bufferData (gl.ARRAY_BUFFER, new Float32Array(this.getTextureCoords ()), gl.STATIC_DRAW);

		this.normalBuffer = gl.createBuffer ();
		gl.bindBuffer (gl.ARRAY_BUFFER, this.normalBuffer);
		gl.bufferData (gl.ARRAY_BUFFER, new Float32Array(this.getNormals ()), gl.STATIC_DRAW);

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

		//texture
		gl.bindBuffer (gl.ARRAY_BUFFER, this.textureBuffer);
		gl.vertexAttribPointer (shaderProgram.vertexTextureAttribute, 2, gl.FLOAT, false, 0, 0);
		gl.activeTexture (gl.TEXTURE0);
		gl.bindTexture (gl.TEXTURE_2D, this.texture);
		gl.uniform1i (shaderProgram.samplerUniform, 0);

		//normals & lighting
		gl.bindBuffer (gl.ARRAY_BUFFER, this.normalBuffer);
		gl.vertexAttribPointer (shaderProgram.vertexNormalAttribute, 3, gl.FLOAT, false, 0, 0);

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

function makeCube (options) {
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

	cube.pushFace ('front',  'ABCD', [0,0,1,0,1,1,0,1]);
	cube.pushFace ('back',   'EFGH', [1,0,1,1,0,1,0,0]);
	cube.pushFace ('top',    'AEBF', [0,1,0,0,1,0,1,1]);
	cube.pushFace ('bottom', 'GHCD', [1,1,0,1,0,0,1,0]);
	cube.pushFace ('right',  'BFDH', [1,0,1,1,0,1,0,0]);
	cube.pushFace ('left',   'AECG', [0,0,1,0,1,1,0,1]);

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
