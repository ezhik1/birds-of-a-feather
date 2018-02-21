function UTILS(){

    //-- Clever maths for converting rotation on two axes to Euler angles
    //-- Used by rotateOnAxis();
    this.quaternion = new THREE.Quaternion();
    this.axisX      = new THREE.Vector3( 1, 0, 0 );
    this.axisY      = new THREE.Vector3( 0, 1, 0 );
    this.axisZ      = new THREE.Vector3( 0, 0, 1 );
}

UTILS.prototype.onMouseMove = function( event ){
    mousePosition.x =  ( ( event.clientX  / window.innerWidth) * 4 ) - 2;
    mousePosition.y =  2 - ( ( event.clientY / window.innerHeight) * 2 );

    var sign = Math.abs( mousePosition.x ) / mousePosition.x;

    if( mousePosition.x > 1 || mousePosition.x < -1 ){
        mousePosition.x = sign * 1;
    }
    if( mousePosition.y > 1  ){
        mousePosition.y = 1;
    }
}

UTILS.prototype.easeValues = function( params ){
    // params -- single object or array of objects
    // {
    //   type:     easingFunctionType          [ STRING ],
    //   from:     beginning value             [ NUMBER ],
    //   to:       ending value                [ NUMBER ],
    //   duration: time                        [ MILLISECONDS ],
    //   execute:  props to be changed         [ FUNCTION ]
    // }
    params = params.constructor === Object ? [ params ] : params;

    // t: current time, b: begInnIng value, c: delta, d: duration
    var ease = {
        inQuad: function ( t, b, c, d ) {
            return c*(t/=d)*t + b;
        },
        outQuad: function ( t, b, c, d ) {
            return -c *(t/=d)*(t-2) + b;
        },
        inOutQuad: function ( t, b, c, d ) {
            if ((t/=d/2) < 1) return c/2*t*t + b;
            return -c/2 * ((--t)*(t-2) - 1) + b;
        },
        inCubic: function ( t, b, c, d ) {
            return c*(t/=d)*t*t + b;
        },
        outCubic: function ( t, b, c, d ) {
            return c*((t=t/d-1)*t*t + 1) + b;
        },
        inOutCubic: function ( t, b, c, d ) {
            if ((t/=d/2) < 1) return c/2*t*t*t + b;
            return c/2*((t-=2)*t*t + 2) + b;
        },
        inQuart: function ( t, b, c, d ) {
            return c*(t/=d)*t*t*t + b;
        }
    }
    var lastTime = Date.now();
    var delta    = 0;
    var elapsed  = 0;

    main();

    function main(){


        var param = params[ 0 ];

        if( !param ){ return }
        param.type = param.type ? param.type : 'inOutCubic';

        if( elapsed < param.duration ){
            var now = Date.now();
            delta = now - lastTime;
            lastTime = now;
            elapsed += delta;
            param.execute( ease[ param.type ]( elapsed, param.from, param.to - param.from, param.duration ) );
            requestAnimationFrame( main );
        }else{
            //-- guarantee final state
            param.execute( param.to );
            elapsed = 0;
            delta = 0;
            lastTime = Date.now();
            params.shift();
            main();
        }
    }
}

//-- Window Resize Event, update camera and renderer in THREE context
UTILS.prototype.onWindowResize = function(){
    renderer.setSize( window.innerWidth, window.innerHeight );
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    if( composer ){
        composer.setSize( window.innerWidth, window.innerHeight );
    }
}

//-- Returns a random whole number between 1 and some number (whole or float), with a negatives option; e.g. return -10 to 10
UTILS.prototype.getRandom = function( number, opt ){
    var sign = 1;
    if( opt == 'negatives' ){
        sign = Math.random() < 0.5 ? -1 : 1;
    }
    if ( typeof opt == 'number' ){
        return sign * Math.floor( ( Math.random() * ( opt - number ) + number ) );
    }else{
        return sign * Math.floor( ( Math.random() * number ) + 1 );
    }
}

//-- Sine function with tweaks on every part of the waveform
UTILS.prototype.sineWave = function( amplitude, frequency, shift, timeDelta, phase ){
    phase = phase ? phase : 1;
    var x = Math.PI * timeDelta / 1000;
    var y = amplitude * ( Math.sin( ( x * frequency ) + phase ) ) + shift;
    return y;
}

//-- Quaternion rotation about some axis, avoiding gimbal lock
UTILS.prototype.rotateOnAxis = function( object, orientation, angle ) {
    object.quaternion.setFromAxisAngle( this [ 'axis' + orientation ], angle );
}
