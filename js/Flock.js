function Flock( boids ){
    this.boids = [];
    this.octree = new THREE.Octree({
        // when undeferred = true, objects are inserted immediately
        // instead of being deferred until next octree.update() call
        // this may decrease performance as it forces a matrix update
        undeferred: false,
        // set the max depth of tree
        depthMax: Infinity,
        // max number of objects before nodes split or merge
        objectsThreshold: 8,
        // percent between 0 and 1 that nodes will overlap each other
        // helps insert objects that lie over more than one node
        overlapPct: 0.02,
        // pass the scene to visualize the octree
        scene: _debug ? scene : null
    // }
    });
    this.tempVector = new THREE.Vector3();
    this.addBoids( boids );

}

Flock.prototype.run = function( step ){
    //-- pass all boids in the system to every boid and feel the sweet warmth of Ω(n)²
    for ( var i = 0, boidLen = this.boids.length; i < boidLen; i++ ) {
        var boid = this.boids[ i ];
        boid.run( this.boids, step );
        this.render( boid, step, i );
    }
}


Flock.prototype.render = function( boid, step, i ){

    // -- compute boid's position in worldspace and return the world pivot THREE object, grab the mesh from the nested object
    var renderedMesh = boid.updatePosition( step ).children[ 0 ].children[ 0 ];

    // -- matrix transform of each boid
    var matrix = renderedMesh.matrixWorld;

    // -- rendered verts
    var computedVerts       = renderedMesh.geometry.getAttribute('position');
    var computedVertsLength = computedVerts.array.length; // number of position attributes

    // -- single boids Mesh, upon which we will apply individual boid transforms
    var meshVerts      = boidsTotalMesh.geometry.getAttribute('position');
    var meshVertLength = meshVerts.array.length; // total number of positions for all boids

    // -- keep track of current stride
    var count = 0;

    //-- walk over multiples of computed positions in the buffer geo of each boid; offset by (i) for each boid
    for( var j = i * ( computedVertsLength / 3 ) , len = j + ( computedVertsLength / 3 ) ; j < len ; j++ ){

        //-- grab position attributes for current boid (i)
        var vert = computedVerts.array

        //-- set xyz components for the current stride in computed position array to a temp Vec3
        this.tempVector.set(
            vert[ count * 3 + 0 ],
            vert[ count * 3 + 1 ],
            vert[ count * 3 + 2 ],
        );
        count++;

        //-- apply the worldspace matrix transform for the current boid
        this.tempVector.applyMatrix4( matrix );

        //-- set position attribute for the current boid under the single buffergeometry at the current stride (j) that renders all boids to screen
        meshVerts.setXYZ( j, this.tempVector.x, this.tempVector.y, this.tempVector.z );
    }
    //-- set update flag to the single buffergeometry
    boidTotalGeometry.attributes.position.needsUpdate = true;
}

Flock.prototype.addBoids = function( boids ){

    var bufferGeos = [];

    for( var i = 0; i < boids.length; i++ ){
        this.boids.push( boids[ i ] );
        boids[ i ].body.internal = boids[ i ];
        bufferGeos.push( this.boids[ i ].body.geometry );
        this.addToOctree( boids[ i ].body );
    }
    //-- merge all buffer geometries, preserving uv, normal, position attributes with proper indexing and offsets.

    boidTotalGeometry = mergeBufferGeometries( bufferGeos );
    boidsTotalMesh    = new THREE.Mesh( boidTotalGeometry, boidMaterial );
    boidsTotalMesh.castShadow = true;

}

Flock.prototype.addToOctree = function( boid ){
    this.octree.add( boid );
}
