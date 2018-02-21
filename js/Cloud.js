function Cloud( position, worldRadius, parent, type ){

    //-- instantiate base class properties and methods
    WorldObject.call( this );

    this.selfPivot.chunks = [];
    this.chunkGeos        = [];
    var material = new THREE.MeshPhongMaterial({
        flatShading: true,
        // wireframe: true,
        shininess: 10,
        color: '#FFFFFF',
        depthWrite : false,
        transparent: true,
        opacity: 0.05
    });
    //-- one geo for all chunks of cloud
    var mergedGeo = new THREE.BoxGeometry();

    var currentChunk; // from which we grab a position to add a new chunk

    //-- Scalars
    var amount  =  Math.floor( worldRadius * 0.003 );  // Chunks per Cloud
    var min     = 5;  // Min Size of Chunk
    var max     = worldRadius * 0.06; // Max Size of Chunk
    var maxPerChunk = 3 // max of (n) per previous chunk before attaching to the next chunk
    var cloudRadius = worldRadius * 0.4 ;

    //-- Vectors
    var lastPosition = new THREE.Vector3(); // to which a new chunk is tied

    for( var i = 1, len = amount; i <= len; i++ ){

        var localRadius = Math.max( min, Math.min( max, ( max / i) ) ); // smaller as we go out from origin

        var chunkGeo = new THREE.IcosahedronGeometry( localRadius, 1 );

        chunkGeo.vertices.forEach( function( v ){
            v.multiplyScalar( 3 * Math.pow( Math.random(), 0.1 ) ); // a bit of noise to distort icosahedron
        })

       var chunk = new THREE.Mesh(chunkGeo, material);

        chunk.position.set( lastPosition.x, lastPosition.y, lastPosition.z );
        chunk.position.x *= ( UTILS.getRandom(1.01, 'negatives') ); // little bit of lateral distortion
        chunk.position.y *= ( UTILS.getRandom(1.01, 'negatives') );
        chunk.rotation.x = Math.PI / UTILS.getRandom( 10 );
        chunk.updateMatrixWorld(); // update position matrix for proper merge

        if( i <= 1){
            currentChunk = chunk.clone(); // grab the first chunk
        }

        if( i % maxPerChunk  === 0 ){
           currentChunk = chunk.clone();
        }

        var randomVert = currentChunk.geometry.vertices[ UTILS.getRandom( currentChunk.geometry.vertices.length - 1 ) ].clone();
        lastPosition.set( randomVert.x, randomVert.y, randomVert.z ).addScalar( cloudRadius / 6 );
        lastPosition.applyMatrix4( currentChunk.matrixWorld )
        mergedGeo.merge( currentChunk.geometry, chunk.matrixWorld );

    }
    //-- keep initial values to apply undulation between these values when running simulation
    for( var i = 0, len = mergedGeo.vertices.length; i < len; i++ ){
        var chunk = mergedGeo.vertices[ i ];
        chunk.initialX = chunk.x;
        chunk.initialY = chunk.y;
        chunk.initialZ = chunk.z;
    }

    this.mesh = new THREE.Mesh( mergedGeo, material );
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
    this.selfPivot.add( this.mesh );
    this.worldPivot.add( this.selfPivot );
    this.worldPivot.position.z = Math.max( worldRadius + 200, Math.min( worldRadius + 1000, UTILS.getRandom( worldRadius + 1000) ) );

    //--Add world pivot to a start position
    this.assignToParent( position, parent );
}

//-- Inherit WorlObject base class;
Cloud.prototype = Object.create( WorldObject.prototype );
Cloud.prototype.constructor = Cloud;
