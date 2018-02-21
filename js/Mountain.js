function Mountain( position, worldRadius, parent ){

    var material = new THREE.MeshPhongMaterial({
        flatShading: true,
        shininess: 0,
        color: '#50504D'
    });
    var totalGeometry = new THREE.Geometry();
    //-- instantiate base class properties and methods
    WorldObject.call( this );

    for ( var i = 0, len = UTILS.getRandom( 10 ); i < len; i++ ){

        var geometry = new THREE.IcosahedronGeometry( UTILS.getRandom( 5, 100 / i ), 1 );

        //-- the world ain't round, so the geometry needs some irregularity to it
        geometry.vertices.forEach( function( v ){
            v.multiplyScalar( 1.2 * Math.pow( Math.random(), 0.3 ) );
        });

        //--create single peak as part of surrounding mountain
        var chunk           = new THREE.Mesh(geometry, material);
        chunk.castShadow    = true;
        chunk.receiveShadow = true;
        chunk.position.set( UTILS.getRandom( 30, 'negatives' ), UTILS.getRandom( 30, 'negatives' ), worldRadius - UTILS.getRandom( 5, 10 ) );

        var temp = new THREE.Vector3().copy( chunk.position ).normalize();
        chunk.scale.multiplyScalar( 1 - Math.abs( temp.x + temp.y ) * Math.abs( temp.x + temp.y ) ); // smaller as we get further from position
        chunk.updateMatrixWorld(); // so the merged geo places vertices into their transformed positions
        totalGeometry.merge( chunk.geometry, chunk.matrixWorld ); // merge smaller chunks of mountain into one total mesh
    }
    var totalMesh = new THREE.Mesh( totalGeometry, material );

    this.selfPivot.add( totalMesh );
    //--Add self pivot to a start position
    this.assignToParent( position, parent, 'selfPivot', 'randomize' );
}

//-- Inherit WorlObject base class;
Mountain.prototype = Object.create( WorldObject.prototype );
Mountain.prototype.constructor = Mountain;
