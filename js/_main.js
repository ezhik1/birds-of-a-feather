//-- Runs in Node, otherwise:
//-- If loading fonts or text locally, requires loading from file flag in chrome:
//-- open /Applications/Google\ Chrome.app --args --allow-file-access-from-files
var masterClock = {
    delta: 0,
    time: null
}

var _debug = false; // debug mode // not fully configured :(
var _fps   = true;  // frame rate stats
var _aabb  = false; // axis aligned bounding boxes // not used

var saturation = {       //-- Amount of the various bits in the scene
    boids :   2000,
    trees:     100,
    mountains: 100,
    clouds:    100
}

var lighting = {
    night : false
}

var world = {
    min : 200, //-- world size depends on amount of boids, clamps from 200 - 1000
    max : 1000,
    radius: 0
}
world.radius = Math.min( Math.max( world.min, saturation.boids * 0.8 ), world.max );

var intro = {
    worldOutofViewPosition: -world.radius * 10,
    duration: 5000
}

var followTarget = {
    object      : null,                // source position to follow
    position    : new THREE.Vector3(), // resulting position to follow, normalised and set to fixed height above the world
    hoverHeight : world.radius * 2.5,
    set : function(){
        findTopSideBoid();
    },
    next: function(){
        grabNextBoid();
    }
}

//-- Let there be photons
if( lighting.night ){
    lighting.sky = '#383E41';  //-- Night: 383E41
    lighting.fog = '#000000';
    lighting.sun = 0.5;
}else{
    lighting.sky = '#BCC2CE';  //-- Day:   CFE4EC
    lighting.fog = '#FFF0F3';
    lighting.sun = 0.7;
}

var UTILS = new UTILS();
var SoundStage = new SoundStage();

//-- define Boid mat/geo/color/etc. properties
var geo = {
    top       : 2,
    height    : 20,
    bottom    : 5,
    segments  : 5,
    hSegments : 2
}

var boidGeometry = new THREE.CylinderBufferGeometry( geo.top, geo.bottom, geo.height, geo.segments, geo.hSegments, false );
var boidMaterial = new THREE.MeshPhongMaterial({
    color: '#5079A2',
    opacity: 0,
    fog: false,
    shininess: 100,
    transparent: true,
    emissive: '#9B6FB8',
    emissiveIntensity: lighting.night ? 0.3 : 0.2,
    flatShading: THREE.FlatShading
});

//-- Used to generate boid meshes, position them in worldspace for simulation, and merge geometries to single mesh, but not rendered to reduce draw count
var boidMesh = new THREE.Mesh( boidGeometry, boidMaterial )


//-- One geometry and rendered mesh from one geometry containing all vertices of the flock of boids
var boidTotalGeometry = new THREE.BufferGeometry();
var boidsTotalMesh; // assigned in Flock when adding all boids.

//-- Main Scene
var scene    = new THREE.Scene();
var camera   = new THREE.PerspectiveCamera( 50, window.innerWidth / window.innerHeight, 1, world.radius * 6 );
var renderer = new THREE.WebGLRenderer( { antialias: true, alpha: true } );

camera.tempVector = new THREE.Vector3();

//-- fps counter
if( _fps ){
    document.title += ' | ' + saturation.boids + ' boids'
    var stats = new Stats();
    stats.showPanel( 0 ); // 0: fps, 1: ms, 2: mb, 3+: custom
    document.querySelector( '.stats' ).appendChild( stats.dom );
}

//-- debug scene helpers
if( _debug ){
    var axisHelper = new THREE.AxesHelper( 500 );
    scene.add( axisHelper );
    _aabb = true;
    camera.position.addScalar( world.radius * 1.7 );
}

var gui = new dat.GUI();

var consts = {
    simulationSpeed: 500,
    maxSpeed: 0.2,
    maxForce: 0.8,
    courseCorrect: 0.5,
    desiredSeparation: 56,
    desiredFlockRadius: 128,
    maxVision: 100,
    cohesion: 1.0,
    alignment: 1.0,
    separation: 1.5
}

gui.add(consts, 'simulationSpeed', 1, 1000);
gui.add(consts, 'maxSpeed', 0, 3);
gui.add(consts, 'maxForce', 0.01, 1);
gui.add(consts, 'courseCorrect', 0.01, 1);
gui.add(consts, 'desiredSeparation', 0, 128);
gui.add(consts, 'desiredFlockRadius', 0, 256);
gui.add(consts, 'maxVision', 10, 200);

var ambient = new THREE.AmbientLight( '#FFE4D8', 0.5 );
var sun     = new THREE.PointLight( '#FFFFFF', lighting.sun );
sun.position.set( 0, world.radius * 2, world.radius * 1.2 );
sun.castShadow = true;
sun.shadow.camera.left  = sun.shadow.camera.bottom = sun.shadow.camera.near = -world.radius;
sun.shadow.camera.right = sun.shadow.camera.top    = sun.shadow.camera.far  = world.radius;
scene.fog = new THREE.Fog( lighting.fog, world.radius * 1.2, world.radius * 3 );

//-- Configure Renderer. Set size, color, enable shadow map
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.setClearColor( lighting.sky, 1 );
renderer.sortObjects       = false;
renderer.shadowMap.enabled = true;
renderer.shadowMap.soft    = true;
renderer.shadowMap.type    = THREE.PCFSoftShadowMap;
document.querySelector( '.main-container' ).appendChild( renderer.domElement );

//-- Film Effects
var composer = new THREE.EffectComposer( renderer );
var renderPass = new THREE.RenderPass(scene, camera);
var filmPass = new THREE.FilmPass( 0.13, 0, 0, false ); // grain, scanlines, scanline count, grayscale
filmPass.renderToScreen = true;
composer.addPass( renderPass );
composer.addPass( filmPass );

//-- mouse controls
var controls = new THREE.OrbitControls( camera, document.querySelector( '.color-filter' ) ); //since it's an overlay, this div is the click target
controls.enableDamping = true;
controls.dampingFactor = 0.15;

function initialize(){

    //-- Down the rabbit hole
    masterClock.time = new THREE.Clock();
    masterClock.time.start();

    //-- Light the Scene
    scene.add( ambient );
    !lighting.night ? scene.add( sun ) : null;

    //-- Create the World and the various things that belong to it : mountains, clouds, trees, boids
    world = new World();
    flock = new Flock( world.boids.collection );

    //-- add the flock to to our world pivot
    world.selfPivot.add( boidsTotalMesh );
    world.selfPivot.position.y = intro.worldOutofViewPosition;

    //-- Find a Boid in positive cartesian space to follow,
    followTarget.set();

    camera.lengthSquared = followTarget.hoverHeight * followTarget.hoverHeight;

    //-- Introduce world to scene
    UTILS.easeValues({ from: 0 , to: 1, duration: 2000,
        execute: function( step ){
            if( step === 1 ){
                introduceWorld();
            }
        }
    });

    //-- Bring in Audio
    initSoundStage();

    //-- Event listeners
    setupEventListeners( render );

    //-- render loop
    function render( timeNow ) {

        if( timeNow ){
            masterClock.delta = masterClock.time.getDelta();

            if( _debug || _fps ){
                stats.begin();
            }

            //-- Run Flock simulation
            flock.run( masterClock.delta );

            //-- Run Windy Cloud simulation
            runClouds( masterClock , world.clouds.collection )

            //-- Follow one boid around the world. prone to gimbal lock.
            cameraFollow();

            renderer.clear();
            renderer.autoClear         = false;
            renderer.autoUpdateObjects = true;
            composer.render( masterClock.delta ) // scene, camera );

            //-- Update octree with new boid positions for lookup
            flock.octree.update();
            controls.update();
            if( _debug || _fps ){ stats.end(); }
        }

        if( masterClock.time.running ){
            requestAnimationFrame( render );
        }
    }
    render();
}

function setupEventListeners( render ){

    window.addEventListener( 'resize', UTILS.onWindowResize, false );

    window.onfocus = function() {
        SoundStage.resume();
    };
    window.onblur = function(){
        SoundStage.pauseAll();
    }
}

function initSoundStage(){
    SoundStage.loadAll( function(){
        SoundStage.compose({
            sounds : [
                {
                    sound: 'wind0',
                    volume: 0.8,
                    delay: 0
                },
                {
                    sound: 'wind1',
                    volume: 0.5,
                    delay: 2000
                },
                {
                    sound: 'flapping-long',
                    volume: 0.06,
                    delay: 0
                },
                {
                    sound: 'wind2',
                    volume: 0.2,
                    delay: 1000
                },
                {
                    sound: 'flapping-medium',
                    volume: 0.06,
                    delay: 0
                },
                {
                    sound: 'wind3',
                    volume: 0.2,
                    delay: 1000
                },
                {
                    sound: 'flapping-medium-1',
                    volume: 0.06,
                    delay: 1000
                }
            ]
        });
    });
}

function findTopSideBoid( ){
    for( var i = 0, len = flock.boids.length; i < len; i++ ){
        var boidPosition = flock.boids[ i ].worldPivot.position;

        //-- grab the first one that ventures out past the world radius
        if( boidPosition.lengthSq() >= world.radiusSquared ){
            cancelAnimationFrame( findTopSideBoid );
            followTarget.object = flock.boids[ i ].worldPivot.position;
            return
        }
    }
    // keep looking
    requestAnimationFrame( findTopSideBoid );
}

function introduceWorld(){

    //-- animate text intro in and out
    var fpsCounter = document.querySelector('.stats');
    var datGui = document.querySelector('.dg.main');
    var containerNode = document.querySelector('.main-container');
    var textNode = document.querySelector( '.intro-text' );
    var textNodeOffset = textNode.offsetTop + textNode.offsetHeight;
    var worldPosition = world.selfPivot.position.y;

    UTILS.easeValues([
        { from: 100, to: 0 , duration: intro.duration / 4 , type: 'inOutCubic',
            execute: function( step ){

                textNode.style.filter = 'blur(' + step + 'px)';
            }
        },
        { from: 0, to: 1 , duration: 1000,
            execute: function( step ){
                // idle a bit
            }
        },
        { from: 0, to: textNodeOffset, duration: intro.duration / 3 , type: 'inOutCubic',
            execute: function( step ){

                textNode.style.transform = 'translateY(-' + step + 'px)';
            }
        },
        { from: worldPosition , to: 0, duration: intro.duration, type: 'inOutCubic',
            execute: function( step ){

                //-- pan the world scene up to camera view
                world.selfPivot.position.y = step;
            }
        },
        { from: 0 , to: 1, duration: intro.duration / 3, type: 'outCubic',
            execute: function( step ){

                boidsTotalMesh.material.opacity = step;
            }
        },
        { from: 0 , to: 1, duration: intro.duration / 5, type: 'outCubic',
            execute: function( step ){

                fpsCounter.style.opacity = step;
                datGui.style.opacity = step;
            }
        }
    ]);
}

function runClouds( masterClock, clouds, type ){

    //-- Clouds run across world space
    var count;
    var phase;
    var cloud;
    var chunk;
    var scale;
    var elapsed = masterClock.time.elapsedTime;
    for ( var i = 0, len = clouds.length; i < len; i++ ){
        cloud = clouds[ i ];

        //-- Cloud Opacity Dynamic
        camera.tempVector.setFromMatrixPosition(cloud.selfPivot.matrixWorld)
        var distanceSquared = camera.tempVector.distanceToSquared( camera.position );
        var min = camera.lengthSquared / 3.2;
        var max = camera.lengthSquared * 2;

        var normalised = Math.max( 0.02, Math.min( 0.5, (distanceSquared - min ) / ( max - min ) ) );

        cloud.mesh.material.opacity = normalised ;

        //-- Geometry dynamic, to mimic wind changes, slight phase shift
        for ( var j = 0, jLen = cloud.mesh.geometry.vertices.length; j < jLen; j++ ){

            var chunk = cloud.mesh.geometry.vertices[ j ];
            var time = elapsed * 1000;
            phase = 1 + j ;

            var sineX = UTILS.sineWave( 0.03, 0.3, 1, time, phase );
            var sineY = UTILS.sineWave( 0.04, 0.2, 1, time, phase );
            var sineZ = UTILS.sineWave( 0.03, 0.1, 1, time, phase );
            chunk.x = chunk.initialX * sineX;
            chunk.y = chunk.initialY * sineY;
            chunk.z = chunk.initialZ * sineZ;
        };

        cloud.mesh.geometry.verticesNeedUpdate = true;

        //-- Cloud size change, slight phase shift
        scale = UTILS.sineWave( 0.05, 0.4, 0.95, time, i );

        cloud.mesh.scale.set( scale, scale, scale );

    };
    UTILS.rotateOnAxis( world.clouds, 'Y', elapsed * 0.02 );
}

function cameraFollow( target ){
    if( _debug || !followTarget.object ){ return }
    followTarget.position.set( followTarget.object.x, followTarget.object.y, followTarget.object.z ).normalize().multiplyScalar( followTarget.hoverHeight );
    camera.position.set( followTarget.position.x, followTarget.position.y, followTarget.position.z );
}

initialize();
