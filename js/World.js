//-- Create World
function World(){
    this.radius = world.radius;
    this.radiusSquared = this.radius * this.radius
    //-- Planet
    var planet  = new Planet( this.radius );
    this.planet = new THREE.Object3D();
    this.planet.add( planet.mesh );

    //-- The various things in our world
    this.worldObjects = {
        //-- generally visible; on the surface or close to the surface of the world
        visible : [ 'mountains', 'clouds', 'trees' ],
        //-- hidden from view; inside the rendered globe or above, outside of threshold, OR otherwise not required
        hidden:  [ 'boids' ], // a single merged boids mesh holds geometry for all boids in the system
    }

    this.constructWorldObjects( this.worldObjects, planet );
    this.addAllObjectsToScene();
}

World.prototype.constructWorldObjects = function( worldObjects, planet ){
    for ( type in worldObjects ){
        var worldObjectsByType = worldObjects[ type ];
        // var opt = null;

        for( var i = 0; i < worldObjectsByType.length; i++ ){
            var worldObject = worldObjectsByType[ i ];

            //-- World Objects plural, instance reference should be singular, capitalized
            var instanceType = worldObject.charAt( worldObject.length - 1 ) == 's' ? worldObject.slice( 0, -1 ) : worldObject;
            instanceType     = instanceType.charAt( 0 ).toUpperCase() + instanceType.slice( 1 );

            //-- each world object is a THREE object
            this[  worldObject ] = new THREE.Object3D();

            //-- each THREE object has a collection of generated instances for later positional and characteristic manipulation
            this[ worldObject ].collection = [];

            sceneryConstructor( instanceType, this[ worldObject ], this.radius, saturation[ worldObject ], planet, type );
        }
    }
}

World.prototype.addAllObjectsToScene = function(){
    this.selfPivot = new THREE.Object3D();
    for( i in this ){
        //-- If a THREE object, add it to the scene, don't add sel
        if( this[ i ] instanceof Object && this[ i ].type === 'Object3D' && i != 'selfPivot' || this.worldObjects.visible.indexOf( i ) >= 0 ){
            // scene.add( this[ i ] );

            this.selfPivot.add( this[ i ] );
        }
    }

    scene.add( this.selfPivot );
}
