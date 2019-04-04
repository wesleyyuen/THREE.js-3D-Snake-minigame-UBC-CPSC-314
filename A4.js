/*
 * UBC CPSC 314, Vjan2019
 * Assignment 4 Template
 */

// CHECK WEBGL VERSION
if ( WEBGL.isWebGL2Available() === false ) {
  document.body.appendChild( WEBGL.getWebGL2ErrorMessage() );
}

// Setup renderer
var container = document.createElement( 'div' );
document.body.appendChild( container );

var canvas = document.createElement("canvas");
var context = canvas.getContext( 'webgl2' );
var renderer = new THREE.WebGLRenderer({ canvas: canvas, context: context });
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setClearColor(0X808080); // background colour
container.appendChild( renderer.domElement );

// Adapt backbuffer to window size
function resize() {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
}

// Hook up to event listener
window.addEventListener('resize', resize);
window.addEventListener('vrdisplaypresentchange', resize, true);

// Disable scrollbar function
window.onscroll = function() {
  window.scrollTo(0, 0);
}

// Add scene
var depthScene = new THREE.Scene(); // shadow map
var finalScene = new THREE.Scene(); // final map

var lightDirection = new THREE.Vector3(0.49, 0.79, 0.49);
/*
var directionlight = new THREE.DirectionalLight(0xFFFFFF, 1.0);
directionlight.position.set(5, 8, 5);
directionlight.castShadow = true;
finalScene.add(directionlight);

// point light
var pointlight = new THREE.PointLight(0xFFFFFF, 5, 18);
pointlight.position.set(-10, 10, -10);
pointlight.castShadow = true;
pointlight.shadow.camera.near = 0.1;
pointlight.shadow.camera.far = 25;
finalScene.add(pointlight);
*/
// Spotlight
var spotlight = new THREE.SpotLight(0xFFFFFF);
spotlight.intensity = 2;
spotlight.distance = 200;
spotlight.angle = 1;
spotlight.penumbra = 0.3;
spotlight.position.set(10, 20, 10);
spotlight.castShadow = true;
finalScene.add(spotlight);


// Main camera
var camera = new THREE.PerspectiveCamera(30, 1, 0.1, 1000); // view angle, aspect ratio, near, far
camera.position.set(0,10,-20);
camera.lookAt(finalScene.position);
finalScene.add(camera);


// COMMENT BELOW FOR VR CAMERA
// ------------------------------

// Giving camera some controls
cameraControl = new THREE.OrbitControls(camera);
cameraControl.damping = 0.2;
cameraControl.autoRotate = false;
// ------------------------------
// COMMENT ABOVE FOR VR CAMERA


// UNCOMMENT BELOW FOR VR CAMERA
// ------------------------------
// Apply VR headset positional data to camera.
// var controls = new THREE.VRControls(camera);
// controls.standing = true;

// // Apply VR stereo rendering to renderer.
// var effect = new THREE.VREffect(renderer);
// effect.setSize(window.innerWidth, window.innerHeight);

// var display;

// // Create a VR manager helper to enter and exit VR mode.
// var params = {
//   hideButton: false, // Default: false.
//   isUndistorted: false // Default: false.
// };
// var manager = new WebVRManager(renderer, effect, params);
// ------------------------------
// UNCOMMENT ABOVE FOR VR CAMERA


// XYZ axis helper
var worldFrame = new THREE.AxesHelper(2);
finalScene.add(worldFrame);

// load texture
// anisotropy allows the texture to be viewed decently at skewed angles
var colorMap = new THREE.TextureLoader().load('images/color.jpg');
colorMap.minFilter = THREE.LinearFilter;
colorMap.anisotropy = renderer.capabilities.getMaxAnisotropy();
var normalMap = new THREE.TextureLoader().load('images/normal.png');
normalMap.minFilter = THREE.LinearFilter;
normalMap.anisotropy = renderer.capabilities.getMaxAnisotropy();
var aoMap = new THREE.TextureLoader().load('images/ambient_occlusion.png');
aoMap.minFilter = THREE.LinearFilter;
aoMap.anisotropy = renderer.capabilities.getMaxAnisotropy();

// TODO: load texture for environment mapping

// Uniforms
var cameraPositionUniform = {type: "v3", value: camera.position};
var lightColorUniform = {type: "c", value: new THREE.Vector3(1.0, 1.0, 1.0)};
var ambientColorUniform = {type: "c", value: new THREE.Vector3(1.0, 1.0, 1.0)};
var lightDirectionUniform = {type: "v3", value: lightDirection};
var kAmbientUniform = {type: "f", value: 0.1};
var kDiffuseUniform = {type: "f", value: 0.8};
var kSpecularUniform = {type: "f", value: 0.4};
var shininessUniform = {type: "f", value: 50.0};
var armadilloPosition = { type: 'v3', value: new THREE.Vector3(0.0, 0.0, 0.0) };
var worldMatrix = { type: 'm4', value: camera.matrixWorldInverse };

var collectibleExists = { type: 'bool', value: false };
var lightPosition = { type: 'v3', value: new THREE.Vector3(5.0, 8.0, 5.0) };
var coinPosition = { type: 'v3', value: new THREE.Vector3(0.0, 0.0, 0.0) };
var coins = [];
var score = { type: 'i', value: 0 };
var highScore = { type: 'i', value: 0 };
var angle = { type: 'f', value: 0.0 };
var fallBool = { type: 'bool', value: false };
var is_paused = false;

// Music
var is_playing = false;
var backgroundMusic = new Audio('Nujabes-Horizon.mp3');
backgroundMusic.volume = 0.25;
backgroundMusic.loop = true;
backgroundMusic.play();
var ringAudio = new Audio('SonicRing.mp3');
ringAudio.volume = 0.25;
var deadAudio = new Audio('WilhelmScream.mp3');
deadAudio.volume = 0.4;
var gameOverAudio = new Audio('GameOver.mp3');
gameOverAudio.volume = 0.4;


// Materials
var depthFloorMaterial = new THREE.ShaderMaterial({});

var depthArmadilloMaterial = new THREE.ShaderMaterial({
  uniforms: {
    armadilloPosition: armadilloPosition
  }
});

// Skybox texture
// TODO: set up the texture for skybox
var skyboxCubemap = new THREE.CubeTextureLoader().setPath('images/')
.load(['posx.png', 'negx.png',
       'posz.png', 'negz.png',
       'posy.png', 'negy.png']);
skyboxCubemap.format = THREE.RGBFormat;

var skyboxTexture = { type: 't', value: skyboxCubemap };

// TODO: set up the material for skybox
var skyboxMaterial = new THREE.ShaderMaterial({
    uniforms: {
        skyboxTexture: skyboxTexture
    },
    side: THREE.DoubleSide
});

var armadilloMaterial = new THREE.ShaderMaterial({
  uniforms: {
    lightColor: lightColorUniform,
    ambientColor: ambientColorUniform,
    lightDirection: lightDirectionUniform,
    kAmbient: kAmbientUniform,
    kDiffuse: kDiffuseUniform,
    kSpecular: kSpecularUniform,
    shininess: shininessUniform,
    armadilloPosition: armadilloPosition
  }
});


// TODO: set up the material for environment mapping
var envmapMaterial = new THREE.ShaderMaterial({
    uniforms: {
        worldMatrix: worldMatrix,
        skyboxTexture: skyboxTexture,
    }
});

var coinMaterial = new THREE.ShaderMaterial({
    uniforms: {
        worldMatrix: worldMatrix,
        skyboxTexture: skyboxTexture,
        lightPosition: lightPosition,
        coinPosition: coinPosition,
        angle: angle
    }
});

// Load shaders
var shaderFiles = [
  'glsl/depth.vs.glsl',
  'glsl/depth.fs.glsl',

  'glsl/bphong.vs.glsl',
  'glsl/bphong.fs.glsl',

  'glsl/skybox.vs.glsl',
  'glsl/skybox.fs.glsl',

  'glsl/envmap.vs.glsl',
  'glsl/envmap.fs.glsl',

  'glsl/coin.vs.glsl',
  'glsl/coin.fs.glsl'
];

new THREE.SourceLoader().load(shaderFiles, function(shaders) {
  depthFloorMaterial.vertexShader = shaders['glsl/depth.vs.glsl'];
  depthFloorMaterial.fragmentShader = shaders['glsl/depth.fs.glsl'];

  depthArmadilloMaterial.vertexShader = shaders['glsl/bphong.vs.glsl'];
  depthArmadilloMaterial.fragmentShader = shaders['glsl/depth.fs.glsl'];

  armadilloMaterial.vertexShader = shaders['glsl/bphong.vs.glsl'];
  armadilloMaterial.fragmentShader = shaders['glsl/bphong.fs.glsl'];

  skyboxMaterial.vertexShader = shaders['glsl/skybox.vs.glsl'];
  skyboxMaterial.fragmentShader = shaders['glsl/skybox.fs.glsl'];

  envmapMaterial.vertexShader = shaders['glsl/envmap.vs.glsl'];
  envmapMaterial.fragmentShader = shaders['glsl/envmap.fs.glsl'];

  coinMaterial.vertexShader = shaders['glsl/coin.vs.glsl']
  coinMaterial.fragmentShader = shaders['glsl/coin.fs.glsl']
});



// var ctx = renderer.context;
// stops shader warnings, seen in some browsers
// ctx.getShaderInfoLog = function () { return '' };

// Adding objects
// LOAD OBJ ROUTINE
// mode is the scene where the model will be inserted
function loadOBJ(scene, file, material, scale, xOff, yOff, zOff, xRot, yRot, zRot) {
  var onProgress = function(query) {
    if (query.lengthComputable) {
      var percentComplete = query.loaded / query.total * 100;
      console.log(Math.round(percentComplete, 2) + '% downloaded');
    }
  };

  var onError = function() {
    console.log('Failed to load ' + file);
  };

  var loader = new THREE.OBJLoader();
  loader.load(file, function(object) {
    object.traverse(function(child) {
      if (child instanceof THREE.Mesh) {
        child.material = material;
      }
    });

    object.position.set(xOff, yOff, zOff);
    object.rotation.x = xRot;
    object.rotation.y = yRot;
    object.rotation.z = zRot;
    object.scale.set(scale, scale, scale);
    scene.add(object);
  }, onProgress, onError);
}

var grid = new THREE.GridHelper(40, 40, 0xffffff, 0xffffff);
finalScene.add(grid);
var floorGeometry = new THREE.PlaneGeometry(40, 40);
var floorMaterial = new THREE.MeshPhongMaterial({ color: 0x000000, side: THREE.DoubleSide, opacity: 0.2 });
var floor = new THREE.Mesh(floorGeometry, floorMaterial);
floor.rotation.x = Math.PI / 2;
floor.position.y -= 0.01;
floor.receiveShadow = true;
finalScene.add(floor);

var THREE_D_MODE = false;
var clock = new THREE.Clock();
var snake = [];
var keyQueue = [];
var mov = 5;
var delta = 1 / mov;
var tetha = 0.0, edgeSize = 35, padding = 0.1;
var cube = new THREE.BoxGeometry(1, 1, 1);
var cubeSize = edgeSize + (edgeSize - 1) * 0.15;
var halfCubeSize = cubeSize / 2;
var direction = new THREE.Vector3(1, 0, 0);
var gameOver = false;
var collided = false;
var dirInt = 0;

var HeadMaterial = new THREE.MeshPhongMaterial({ color: 0x388e3c });

// GameOver Text
var gameOverText = document.createElement('div');
gameOverText.style.position = 'absolute';
gameOverText.style.fontFamily = 'impact';
gameOverText.style.fontSize = 250;
gameOverText.style.top = 125 + 'px';
gameOverText.style.left = 250 + 'px';

function setup() {
    snake.push(new Cube(new THREE.Vector3((1 + padding) - halfCubeSize + 0.5, 0.5 + padding / 2, 0.5 + padding / 2), HeadMaterial, finalScene));
    clock.startTime = 0;
}

function Cube(vec, material, scene, geometry, renderWireframe) {
    this.geometry = typeof geometry === 'undefined' ? cube : geometry;
    this.mesh = new THREE.Mesh(this.geometry, material);
    if (typeof renderWireframe === 'undefined' || !renderWireframe) {
        this.mesh.position.set(vec.x, vec.y, vec.z);
        this.mesh.castShadow = true;
        this.mesh.scale.set(0.9, 0.9, 0.9);
        scene.add(this.mesh);
    }
    else {
        var edges = new THREE.EdgesGeometry(this.mesh.geometry);
        scene.add(new THREE.LineSegments(edges, material));
    }
    this.setPosition = function (vec) {
        this.mesh.position.set(vec.x, vec.y, vec.z);
    };
}


function updateSnake() {
    if (is_paused) return;
    tetha += clock.getDelta();
    delta = 1 / mov;
    if (tetha > delta) {
        var head = snake[snake.length - 1];
        var tail = snake.shift();

        head.mesh.material = envmapMaterial;
        tail.mesh.material = HeadMaterial;
        if (!is_paused) {
            direction = (keyQueue.length > 0) ? keyQueue.pop() : direction;
            var newPos = new THREE.Vector3(head.mesh.position.x + direction.x + Math.sign(direction.x) * padding,
                                           head.mesh.position.y + direction.y + Math.sign(direction.y) * padding,
                                           head.mesh.position.z + direction.z + Math.sign(direction.z) * padding);
            tail.setPosition(newPos);
            snake.push(tail);
            head = tail;
        }
        //collide with self
        for (var i = snake.length - 2; i > -1; i--) {
            if (head.mesh.position.distanceTo(snake[i].mesh.position) < 1) {
                gameOver = true;
                break;
            }
        }
        //restart
        if (gameOver) {
            gameOverAudio.play();
            document.body.appendChild(gameOverText);
            gameOverText.innerHTML = "GAME OVER";
            setTimeout(function () {
                document.body.removeChild(gameOverText);
                restart();
            }, 1500);
        }
        //coins
        if (head.mesh.position.distanceTo(coinPosition.value) < 1) {
            collided = true;
            snake.unshift(new Cube(new THREE.Vector3(snake[0].mesh.position.x, snake[0].mesh.position.y, snake[0].mesh.position.z), envmapMaterial, finalScene));
            mov++;
        }
        //bounds 
        if (head.mesh.position.x < -halfCubeSize)
            head.mesh.position.x = halfCubeSize - 0.5;
        else if (head.mesh.position.x > halfCubeSize)
            head.mesh.position.x = -halfCubeSize + 0.5;
        else if (head.mesh.position.y < 0)
            head.mesh.position.y = halfCubeSize - 0.5;
        else if (head.mesh.position.y > halfCubeSize)
            head.mesh.position.y = 0.5;
        else if (head.mesh.position.z < -halfCubeSize)
            head.mesh.position.z = halfCubeSize - 0.5;
        else if (head.mesh.position.z > halfCubeSize)
            head.mesh.position.z = -halfCubeSize + 0.5;
        tetha = 0;
    }
}

function restart() {
    while (snake.length) finalScene.remove(snake.pop().mesh);
    setup();
    mov = 5;
    gameOver = false;
    direction = new THREE.Vector3(1, 0, 0);
    score.value = 0;
}

var skybox = new THREE.Mesh(new THREE.BoxGeometry( 1000, 1000, 1000 ), skyboxMaterial);
finalScene.add(skybox);

// Coin
var coinGeometry = new THREE.TorusGeometry(4, 0.8, 9, 30, 6.3);

// Score Text
var scoreText = document.createElement('div');
scoreText.style.position = 'absolute';
scoreText.style.fontFamily = 'impact';
scoreText.style.fontSize = 30;
scoreText.style.top = 10 + 'px';
scoreText.style.left = 10 + 'px';
document.body.appendChild(scoreText);

// paused text
var pausedText = document.createElement('div');
pausedText.style.position = 'absolute';
pausedText.style.fontFamily = 'impact';
pausedText.style.fontSize = 250;
pausedText.style.top = 125 + 'px';
pausedText.style.left = 250 + 'px';
document.body.appendChild(pausedText);

// grids
var edges = new THREE.EdgesGeometry(new THREE.BoxBufferGeometry(cubeSize, cubeSize, cubeSize));
var line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0xffffff }));
line.position.y = 20;

// Input
var keyboard = new THREEx.KeyboardState();

function checkKeyboard() {
    if (keyboard.pressed("escape")) {
        if (is_paused == false)
            is_paused = true;
        else is_paused = false;
    }
    if (keyboard.pressed("2") && THREE_D_MODE) {
        finalScene.remove(coins.pop());
        var coin = new THREE.Mesh(coinGeometry, coinMaterial);
        coinPosition.value.x = Math.random() * (20 + 20) - 20;
        coinPosition.value.y = 0.5;
        coinPosition.value.z = Math.random() * (20 + 20) - 20;
        coin.position.set(coinPosition.value.x, coinPosition.value.y, coinPosition.value.z);
        coin.scale.set(0.1, 0.1, 0.1);
        coin.castShadow = true;
        finalScene.add(coin);
        coins.push(coin);
        // grid
        finalScene.remove(line);
        for (var i = 0; i < snake.length; i++) {
            snake[i].mesh.position.y = 0.5;
        }
        THREE_D_MODE = false;
    }
    if (keyboard.pressed("3") && !THREE_D_MODE) {
        finalScene.remove(coins.pop());
        var coin = new THREE.Mesh(coinGeometry, coinMaterial);
        coinPosition.value.x = Math.random() * (20 + 20) - 20;
        coinPosition.value.y = Math.abs(Math.random() * (20 + 20) - 20);
        coinPosition.value.z = Math.random() * (20 + 20) - 20;
        coin.position.set(coinPosition.value.x, coinPosition.value.y, coinPosition.value.z);
        coin.scale.set(0.1, 0.1, 0.1);
        coin.castShadow = true;
        finalScene.add(coin);
        coins.push(coin);
        // grid 
        finalScene.add(line);
        THREE_D_MODE = true;
    }
    if (keyboard.pressed("W") && dirInt != 2) {
        keyQueue.push(new THREE.Vector3(0.0, 0.0, 1.0));
        dirInt = 1;
    }
    else if (keyboard.pressed("S") && dirInt != 1) {
        keyQueue.push(new THREE.Vector3(0.0, 0.0, -1.0));
        dirInt = 2;
    }
    else if (keyboard.pressed("A") && dirInt != 4) {
        keyQueue.push(new THREE.Vector3(1.0, 0.0, 0.0));
        dirInt = 3;
    }
    else if (keyboard.pressed("D") && dirInt != 3) {
        keyQueue.push(new THREE.Vector3(-1.0, 0.0, 0.0));
        dirInt = 4;
    }
    else if (keyboard.pressed("Q") && dirInt != 6 && THREE_D_MODE) {
        keyQueue.push(new THREE.Vector3(0.0, 1.0, 0.0));
        dirInt = 5;
    }
    else if (keyboard.pressed("E") && dirInt != 5 && THREE_D_MODE) {
        keyQueue.push(new THREE.Vector3(0.0, -1.0, 0.0));
        dirInt = 6
    }
    else {
        switch (dirInt) {
            case 1: keyQueue.push(new THREE.Vector3(0.0, 0.0, 1.0)); break;
            case 2: keyQueue.push(new THREE.Vector3(0.0, 0.0, -1.0)); break;
            case 3: keyQueue.push(new THREE.Vector3(1.0, 0.0, 0.0)); break;
            case 4: keyQueue.push(new THREE.Vector3(-1.0, 0.0, 0.0)); break;
            case 5: keyQueue.push(new THREE.Vector3(0.0, 1.0, 0.0)); break;
            case 6: keyQueue.push(new THREE.Vector3(0.0, -1.0, 0.0)); break;
        }
    }
    if (keyboard.pressed("R")) restart();
    if (keyboard.pressed("C")) {
        mov++;
        collided = true;
        snake.unshift(new Cube(new THREE.Vector3(snake[0].mesh.position.x, snake[0].mesh.position.y, snake[0].mesh.position.z), envmapMaterial, finalScene));
    }

    // coin
    if (!collectibleExists.value) {
        var coin = new THREE.Mesh(coinGeometry, coinMaterial);
        coinPosition.value.x = Math.random() * (20 + 20) - 20;
        if (!THREE_D_MODE) coinPosition.value.y = 0.5;
        else coinPosition.value.y = Math.abs(Math.random() * (20 + 20) - 20);
        coinPosition.value.z = Math.random() * (20 + 20) - 20;
        coin.position.set(coinPosition.value.x, coinPosition.value.y, coinPosition.value.z);
        coin.scale.set(0.1, 0.1, 0.1);
        coin.castShadow = true;
        finalScene.add(coin);
        coins.push(coin);
        collectibleExists.value = true;
    }

    if (collectibleExists.value) {
        angle.value += Math.PI / 100;
        if (collided) {
            finalScene.remove(coins.pop());
            collided = false;
            collectibleExists.value = false;
            ringAudio.play();
            score.value++;
            if (highScore.value < score.value)
                highScore.value = score.value;
        }
    }
    pausedText.innerHTML = "PAUSED";
    if (is_paused) pausedText.style.opacity = 1.0;
    else pausedText.style.opacity = 0.0;

    
    if (THREE_D_MODE) scoreText.innerHTML = "Score: " + score.value + "<br /> High Score: " + highScore.value + "<br /> 3D Mode!" + "<br /> PRESS Q/E to Move UP/DOWN" + "<br /> PRESS ESC to pause" + "<br /> PRESS C to Cheat :)";
    else scoreText.innerHTML = "Score: " + score.value + "<br /> High Score: " + highScore.value + "<br /> 2D Mode!" + "<br /> PRESS WASD to move" + "<br /> PRESS ESC to pause" + "<br /> PRESS C to Cheat :)";


  // music
  if (keyboard.pressed("P")) {
      if (is_playing) {
          is_playing = false;
          backgroundMusic.pause();
      }
      else {
          is_playing = true;
          backgroundMusic.play();
      }
  }
  if (keyboard.pressed("pageup")) {
      if (backgroundMusic.volume <= 0.9)
          backgroundMusic.volume += 0.1;
  }
  if (keyboard.pressed("pagedown")) {
      if (backgroundMusic.volume >= 0.1)
          backgroundMusic.volume -= 0.1;
  }
}

function updateMaterials() {
  cameraPositionUniform.value = camera.position;
  depthFloorMaterial.needsUpdate = true;
  depthArmadilloMaterial.needsUpdate = true;
  armadilloMaterial.needsUpdate = true;
  skyboxMaterial.needsUpdate = true;
  envmapMaterial.needsUpdate = true;
  coinMaterial.needsUpdate = true;
}



// Update routine
function update() {
  checkKeyboard();
  updateMaterials();
  updateSnake();

  requestAnimationFrame(update);
  // render finalScene to the canvas
  renderer.render(finalScene, camera);

  // UNCOMMENT to see the shadowmap values
  // renderer.render(depthScene, shadowMap_Camera);

  // UNCOMMENT BELOW FOR VR CAMERA
  // ------------------------------
  // Update VR headset position and apply to camera.
  // controls.update();
  // ------------------------------
  // UNCOMMENT ABOVE FOR VR CAMERA
}
document.onload = setup();
resize();
update();
