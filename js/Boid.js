function Boid( position, worldRadius ){

    //-- States
    this.outOfBounds = false;

    //-- Scalars
    this.worldRadius        = worldRadius;
    this.worldRadiusSquared = this.worldRadius * this.worldRadius;
    this.floor     = this.worldRadiusSquared * 1.5; // SQUARED max height of boid
    this.ceiling   = this.worldRadiusSquared * 2.0; // SQUARED min height of boid
    this.optimalHeight = ( ( Math.sqrt(this.ceiling) + Math.sqrt(this.floor) ) / 2 );

    //-- Vectors

    //--- recycled for alignment : cohesion : separation calculations
    this.tempVector  = new THREE.Vector3();
    this.tempVector0 = new THREE.Vector3();
    this.tempVector1 = new THREE.Vector3();
    this.tempVector2 = new THREE.Vector3();
    this.tempVector3 = new THREE.Vector3();
    this.tempVector4 = new THREE.Vector3();
    this.tempVector5 = new THREE.Vector3();

    //--- boid vectors used to derive world position
    this.acceleration = new THREE.Vector3();
    this.desired      = new THREE.Vector3();
    this.steer        = new THREE.Vector3();
    this.sepSteer     = new THREE.Vector3();
    this.courseCorrect= new THREE.Vector3();
    this.velocity     = position.clone().normalize();//.multiplyScalar(consts.maxSpeed);

    this.position   = position;
    this.position.x += 30 * Math.random();
    this.position.y += 30 * Math.random();

    //-- instantiate base class properties and methods
    WorldObject.call( this );

    //-- THREE mesh
    this.body = boidMesh.clone();
    this.body.position.y = -15;
    this.body.rotation.x = Math.PI;

    //-- define positioning relative to world space, parent/child relattion
    // this.selfPivot = null; // no need for it
    this.selfPivot.add(this.body)
    this.worldPivot.add( this.selfPivot );

}

//-- Inherit WorlObject base class;
Boid.prototype = Object.create( WorldObject.prototype );
Boid.prototype.constructor = Boid.bind( this );

Boid.prototype.run = function( boids, step ){
    this.flock( boids );
    this.updateKinematics( step );
}

Boid.prototype.applyForce = function( force ){
    this.acceleration.add( force );
}

Boid.prototype.flock = function( boids ){

    //-- flock simulation thanks to Reynold's Algorithm https://www.red3d.com/cwr/boids/
    //-- and nature of code on the subject http://natureofcode.com/book/chapter-6-autonomous-agents/

    var separate = this.separate( boids );   //-- Boid Separation from other boids
    var align    = this.align( boids );      //-- Boid Alignment with other boids ( pointing in the general direction of the group )
    var cohesion = this.cohesion( boids );   //-- Boid Cohesion with other boids within its local sphere

//     //-- Arbitrary effect of the various forces in Reynolds simulation
    separate.multiplyScalar( consts.separation );// 1.5 );
    align.multiplyScalar( consts.alignment ); //1.0 );
    cohesion.multiplyScalar( consts.cohesion );//1.0 );

    //-- Add the force vectors to acceleration
    this.applyForce( separate );
    this.applyForce( align );
    this.applyForce( cohesion );
}

Boid.prototype.updateKinematics = function( step ){

    // this.tempVector5.set( this.velocity.x, this.velocity.y, this.velocity.z );
    // this.tempVector5.set( 0,0,0);

    this.courseCorrection( 100, 200 );

    //-- bind boid to world floor/ceil, with a random new position derived from its position when it steps out of bounds
    //-- a scalar is passed to courseCorrection as a seed (n) where the corrected course position is the normalised last position at optimal height multiplied a random -(n) to (n)
    //-- since correction is stronger than the clamped flocking strength of maxForce, course correction must be greater



    //-- unclamped velocity a function of frame rate
    this.velocity.add( this.acceleration.clampLength( 0, consts.maxForce ) ).clampLength( 0, consts.maxSpeed );

    this.position.add( this.velocity.multiplyScalar( step * consts.simulationSpeed ) );

    //-- align boid's local vector to point in direction of its calculated state velocity
    this.worldPivot.quaternion.setFromUnitVectors( this.body.position.normalize(), this.velocity.normalize() );

    //-- reset acceleration to 0 with each frame
    this.acceleration.set( 0, 0, 0 );


}

Boid.prototype.updatePosition = function( interpolate ){
    this.worldPivot.position.set( this.position.x, this.position.y, this.position.z );
    this.worldPivot.updateMatrixWorld();
    return this.worldPivot;
}


Boid.prototype.courseCorrection = function( spreadFrom, spreadTo ){
    var distanceFromPlanet = this.position.distanceToSquared( world.planet.position );

    //-- Boid has reached beyond its bounds in world space
    if( distanceFromPlanet > this.ceiling || distanceFromPlanet < this.floor  ){

        // boid hasn't already been assign a course correction
        if( !this.outOfBounds ){

            // seek a random point from current position clamped normalised to optimal height
            this.tempVector.set(
                this.position.x + spreadFrom + UTILS.getRandom( spreadTo, 'negatives' ) ,
                this.position.y + spreadFrom + UTILS.getRandom( spreadTo, 'negatives' ) ,
                this.position.z + spreadFrom + UTILS.getRandom( spreadTo, 'negatives' ) )
            .normalize().multiplyScalar( this.optimalHeight );
            this.outOfBounds = true;
        }

        this.acceleration.add( this.seek( this.tempVector ).clampLength( 0, consts.courseCorrect ) );
    }

    //-- Boid is within its bounds, add acceleration if it's available

    this.outOfBounds = false;
    // return this.acceleration;
}
Boid.prototype.seek = function( target ){
    this.desired.subVectors( target, this.position ).normalize().multiplyScalar( consts.maxSpeed );
    return this.steer.subVectors( this.desired, this.velocity );
}

//-- Separation : Method checks for nearby boids and steers away
Boid.prototype.separate = function( boids ) {

    //-- Scalars
    var count    = 0;
    var desiredSeparation = consts.desiredSeparation * consts.desiredSeparation;

    //-- Vectors
    var position    = this.position;
    var sepSteer    = this.sepSteer.set(0,0,0);
    var tempVector1 = this.tempVector1;

    var subset = flock.octree.search( position, consts.maxVision );

    // For every boid in the system, check if it's too close
    for ( var i = 0, len = subset.length; i < len; i++ ) {
        var target   = subset[ i ].object.internal.position;
        var distance = target.distanceToSquared( position );

        //-- If the distance is greater than 0 and less than an arbitrary amount (0 when you are yourself)
        if ( ( distance > 0 ) && ( distance < desiredSeparation ) ) {

            var actualDistance = target.distanceTo( position );

            //-- Get vector pointing away from neighbor //-- strength of separation a function of distance
            sepSteer.add( tempVector1.subVectors( position, target ).normalize().divideScalar( actualDistance ) );

            //-- count how many in local desired separation
            count++;
        }
    }
    //-- get average of separtion steer vector
    if ( count > 0 ) {
        sepSteer.divideScalar( count );
    }

    // As long as the vector is greater than 0
    if ( sepSteer.lengthSq() > 0 ) {
        //-- Reynolds Algorithm: this.sepSteering = Desired - Velocity
        sepSteer.normalize().multiplyScalar( consts.maxSpeed ).sub( this.velocity ).clampLength( 0, consts.maxForce + consts.courseCorrect );
    }
    return sepSteer;
}

//-- Alignment : For every nearby boid in the system, calculate the average velocity
Boid.prototype.align = function(boids) {

    //-- Scalars
    var count     = 0;
    var position  = this.position;
    var maxVision = consts.maxVision;
    var maxSpeed  = consts.maxSpeed;
    var desiredFlockRadius = consts.desiredFlockRadius * consts.desiredFlockRadius;
    //-- Vectors
    var sum    = this.tempVector3.set(0,0,0);
    var result = this.tempVector0;

    var subset = flock.octree.search( position, maxVision );

    for (var i = 0, len = subset.length; i < len; i++) {
        var target   = subset[ i ].object.internal;
        var distance = target.position.distanceToSquared( position );

        if( ( distance > 0 ) && ( distance < desiredFlockRadius ) ) {
            sum.add( target.velocity );
            count++;
        }
    }
    if( count > 0 ) {
        this.tempVector3.divideScalar( count ).normalize().multiplyScalar( maxSpeed );
        return this.tempVector0.subVectors( this.tempVector3, this.velocity ).clampLength( 0, consts.maxForce + consts.courseCorrect );
    }else{
        return this.tempVector4.set( 0, 0, 0 );
    }
}

//-- Cohesion : For the average location (i.e. center) of all nearby boids, calculate steering vector towards that location
Boid.prototype.cohesion = function( boids ) {

    //-- clear vector to accumulate all locations, the sum of which will become the target vector

    //-- Scalars
    var count = 0;
    var desiredFlockRadius = consts.desiredFlockRadius;
    var maxVision = consts.maxVision;

    //-- Vectors
    var sum      = this.tempVector2.set( 0, 0, 0 );
    var position = this.position;

    var subset = flock.octree.search( position, maxVision );

    for ( var i = 0, len = subset.length; i < len; i++ ) {
        var target   = subset[ i ].object.internal.position;
        var distance = target.distanceToSquared( position );

        if( ( distance > 0 ) && ( distance < desiredFlockRadius ) ) {
            //-- Add position vector
            sum.add( target );
            count++;
        }
    }
    if ( count > 0 ) {
        sum.divideScalar( count );
        //-- Steer towards the summed vector
        return this.seek( sum );
    } else {
        return this.tempVector2;
    }
}
