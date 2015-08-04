var parameters = (function() {
	var parameters = {};
	var parts = window.location.search.substr(1).split('&');
	for (var i = 0; i < parts.length; i++) {
		var parameter = parts[i].split('=');
		parameters[parameter[0]] = parameter[1];
	}
	return parameters;
})();

var camera, scene, renderer;
var controls, effect;
var orbitControls;
var controls2, clock = new THREE.Clock();
var sky, water;
var cameraPath;
var dolly;
var manager;

function init() {
	renderer = new THREE.WebGLRenderer({
		antialias: true
	});
	renderer.autoClear = false;
	renderer.setClearColor(0x404040);

	document.body.appendChild(renderer.domElement);

	scene = new THREE.Scene();
	scene.fog = new THREE.Fog(0xcacfde, 0, 10000);

	dolly = new THREE.Group();
	dolly.position.set(10000, 10000, 10000);

	scene.add(dolly);

	camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 20000);
	camera.position.z = 0.0001;
	dolly.add(camera);

	// Effect and Controls for VR
	effect = new THREE.VREffect(renderer);
	controls = new THREE.VRControls(camera);

	orbitControls = new THREE.OrbitControls(camera);

	onWindowResize();

	// Initialize the WebVR manager.
	manager = new WebVRManager(renderer, effect);

	// skybox
	var geometry = new THREE.SphereGeometry(10000, 64, 32);

	var vertices = geometry.vertices;
	var faces = geometry.faces;

	var colorTop = new THREE.Color(0xdc72aa);
	var colorMiddle = new THREE.Color(0xfbdfd3);
	var colorBottom = new THREE.Color(0xdc72aa);

	for (var i = 0, l = faces.length; i < l; i++) {
		var face = faces[i];

		var vertex1 = vertices[face.a];
		var vertex2 = vertices[face.b];
		var vertex3 = vertices[face.c];

		var color1 = colorMiddle.clone();
		color1.lerp(vertex1.y > 0 ? colorTop : colorBottom, Math.abs(vertex1.y) / 6000);

		var color2 = colorMiddle.clone();
		color2.lerp(vertex2.y > 0 ? colorTop : colorBottom, Math.abs(vertex2.y) / 6000);

		var color3 = colorMiddle.clone();
		color3.lerp(vertex3.y > 0 ? colorTop : colorBottom, Math.abs(vertex3.y) / 6000);

		face.vertexColors.push(color1, color2, color3);

	}

	var material = new THREE.MeshBasicMaterial({
		//vertexColors: THREE.VertexColors,
		side: THREE.BackSide,
		depthWrite: false,
		depthTest: false,
		fog: false,
		map: THREE.ImageUtils.loadTexture('images/bg-2.png')
	});

	sky = new THREE.Mesh(geometry, material);
	scene.add(sky);


	// waves
	var geometry = new THREE.Geometry();

	var vertices = geometry.vertices;
	var faces = geometry.faces;

	var vector = new THREE.Vector3();

	for (var i = 0; i < 10000; i++) {

		vector.x = Math.random() * 40000 - 20000;
		vector.z = Math.random() * 40000 - 20000;

		var size = Math.random() * 10 + 1;
		var angle = Math.random() * Math.PI;

		var vertex1 = vector.clone();
		vertex1.x += size * Math.cos(angle);
		vertex1.z += size * Math.sin(angle);

		angle -= 2;

		var vertex2 = vector.clone();
		vertex2.x += size * Math.cos(angle);
		vertex2.z += size * Math.sin(angle);

		angle -= 2;

		var vertex3 = vector.clone();
		vertex3.x += size * Math.cos(angle);
		vertex3.z += size * Math.sin(angle);

		var a = vertices.push(vertex1) - 1;
		var b = vertices.push(vertex2) - 1;
		var c = vertices.push(vertex3) - 1;

		faces.push(new THREE.Face3(a, b, c));

	}

	var material = new THREE.MeshBasicMaterial({
		opacity: 0.4,
		transparent: true
	})

	var mesh = new THREE.Mesh(geometry, material);
	mesh.position.y = 2.5;
	mesh.renderDepth = 1;
	scene.add(mesh);


	// water texture
	// Causes massive jank and out-of-memory errors, so I abandoned this approach for time being...
	/*
	var texture = THREE.ImageUtils.loadTexture( 'images/waves-2.png' );
	texture.wrapS = THREE.RepeatWrapping;
	texture.wrapT = THREE.RepeatWrapping;
	texture.repeat.set( 40, 40 );
	var geometry = new THREE.PlaneGeometry( 10000, 10000, 1000, 1000 );
	var material = new THREE.MeshBasicMaterial( {
		//color: 0xffffff,
		map: texture
	} );
	water2 = new THREE.Mesh( geometry, material );
	water2.position.y = 3;
	water2.rotation.x = - Math.PI / 2;
	scene.add( water2 );
	*/


	// water

	var geometry = new THREE.PlaneBufferGeometry(100000, 100000);
	var material = new THREE.MeshBasicMaterial({
		color: colorMiddle,
		opacity: 0.75,
		transparent: true
	});
	water = new THREE.Mesh(geometry, material);
	water.position.y = 0;
	water.rotation.x = -Math.PI / 2;
	water.renderDepth = 2;
	scene.add(water);


	// lights

	var directionalLight = new THREE.DirectionalLight(0xffffff, 0.15);
	directionalLight.position.set(-1, 1, -1);
	scene.add(directionalLight);

	var hemisphereLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 0.8);
	hemisphereLight.position.set(-1, 2, 1.5);
	scene.add(hemisphereLight);


	// load scene

	var loader = new THREE.ObjectLoader();
	loader.load('models/scene-nov4.json', function(object) {

		var land = object.getObjectByName('land').children[0];
		var reflection = new THREE.Mesh(land.geometry, land.material.clone());
		reflection.material.side = THREE.BackSide;
		reflection.position.y = 0;
		reflection.scale.y = -1;
		land.parent.add(reflection);

		var island = object.getObjectByName('island').children[0];
		var reflection = new THREE.Mesh(island.geometry, island.material.clone());
		reflection.material.side = THREE.BackSide;
		reflection.position.y = 0;
		reflection.scale.y = -1;
		island.parent.add(reflection);

		var rocks = object.getObjectByName('rocks').children[0];
		var reflection = new THREE.Mesh(rocks.geometry, rocks.material.clone());
		reflection.material.side = THREE.BackSide;
		reflection.position.y = 0;
		reflection.scale.y = -1;
		rocks.parent.add(reflection);

		var trees = object.getObjectByName('trees').children[0];
		var reflection = new THREE.Mesh(trees.geometry, trees.material.clone());
		reflection.material.side = THREE.BackSide;
		reflection.position.y = 0;
		reflection.scale.y = -1;
		trees.parent.add(reflection);

		scene.add(object);

		// sounds

		//var listener = new THREE.AudioListener();
		//camera.add( listener );

		/*
		var sound = new THREE.Audio( listener );
		sound.load( 'sounds/78389__inchadney__seagulls.ogg' );
		sound.position.set( 475, 50, 850 );
		sound.setLoop( true );
		sound.setRefDistance( 100 );
		scene.add( sound );

		var sound = new THREE.Audio( listener );
		sound.load( 'sounds/23707__hazure__seagull.ogg' );
		sound.position.set( 10, 50, -200 );
		sound.setLoop( true );
		sound.setRefDistance( 100 );
		scene.add( sound );

		var sound = new THREE.Audio( listener );
		sound.load( 'sounds/235428__allanz10d__calm-ocean-breeze-simulation.ogg' );
		sound.position.set( -30, 0, -750 );
		sound.setLoop( true );
		sound.setRefDistance( 100 );
		scene.add( sound );
		*/

		// camera path

		var loader = new THREE.C4DCurveLoader();
		loader.load('models/flightpath-nov4-bezier.txt', function(curve) {

			cameraPath = curve.toLinearCurve(1); // 1 = distance between points

			/*
			// debug points

			var geometry = new THREE.Geometry();
			geometry.vertices = cameraPath.getPoints();
			var material = new THREE.PointCloudMaterial( { size: 0.1 } );

			var points = new THREE.PointCloud( geometry, material );
			points.position.y = -1;
			points.scale.z = -1;
			scene.add( points );

			// debug line

			var geometry = new THREE.Geometry();
			geometry.vertices = cameraPath.getPoints();
			var material = new THREE.LineBasicMaterial();

			var line = new THREE.Line( geometry, material );
			line.position.y = -1;
			line.scale.z = -1;
			scene.add( line );
			*/



			requestAnimationFrame(animate);



		});

	});


	window.addEventListener('resize', onWindowResize, false);
	//document.body.addEventListener('click', togglePlay);
}

var playing = true;

function togglePlay() {
	playing = playing == false ? true : false;
};

function play() {
	playing = true;
}

function rewind() {
	currentTime = startTime;
}

function onWindowResize() {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();

	effect.setSize(window.innerWidth, window.innerHeight);
};



var currentTime = null,
	startTime = null;
gotime = null;

var speed = 20;


function animate(time) {

	requestAnimationFrame(animate);

	if (cameraPath !== undefined) {
		if (!startTime) startTime = time;
		if (!currentTime) currentTime = time;

		if (playing) currentTime += speed;

		gotime = TWEEN.Easing.Sinusoidal.InOut(Math.min(currentTime / 70000, 1)) * 0.9999;

		var pointA = cameraPath.getPointAt(gotime);
		var pointB = cameraPath.getPointAt(Math.min(gotime + 0.0001, 1));

		pointA.z = -pointA.z;
		pointB.z = -pointB.z;

		dolly.position.copy(pointA);
		dolly.lookAt(pointB);
		dolly.rotateY(Math.PI); // look forward

	}

	if (controls) {
		controls.update();
	}

	sky.position.copy(dolly.position);

	water.position.x = dolly.position.x;
	water.position.z = dolly.position.z;

	if (manager.isVRMode()) {
		effect.render(scene, camera);
		controls.update();
	} else {
		renderer.render(scene, camera);
		orbitControls.update();
	}

}

init();
