function Tree( position, worldRadius, parent ){

    //-- tree trunk
    var height   = UTILS.getRandom( 50, 150 );
    var trunkGeo = new THREE.BoxGeometry( 5, 5, height / 2 );
    var trunkMat = new THREE.MeshPhongMaterial({
        flatShading: true,
        shininess: 0,
        color: '#5A3309'
    });
    this.trunk = new THREE.Mesh( trunkGeo, trunkMat );
    this.trunk.receiveShadow = true;
    this.trunk.castShadow    = true;

    //-- instantiate base class properties and methods
    WorldObject.call( this );

    //-- foliage
    var leafMat  = new THREE.MeshPhongMaterial({
        flatShading: true,
        shininess: 0,
        color: '#204D0B'
    });

    this.leaves = new THREE.Object3D();
    for ( var i = 0; i < 3 ; i++ ){
        var geo = {
            top            : 1,
            height         : 0.33 * height - i * 4,
            bottom         : 0.5 * 0.33 * height - i * 3,
            segments       : 5,
            heightSegments : 2
        }
        var leafGeo = new THREE.CylinderGeometry( geo.top, geo.bottom, geo.height, geo.segments, geo.heightSegments, false);

        leafGeo.applyMatrix( new THREE.Matrix4().makeTranslation( 0, length / 2, 0 ) );
        leafGeo.applyMatrix( new THREE.Matrix4().makeRotationX( Math.PI / 2 ) );

        var leaf = new THREE.Mesh( leafGeo, leafMat );
        leaf.receiveShadow = true;
        leaf.castShadow    = true;
        leaf.position.set( 0, 0, 0.24 * height + i * 10 );
        this.leaves.add( leaf );
    }

    //--make tree
    this.selfPivot.add( this.leaves, this.trunk );
    this.selfPivot.position.set( 0, 0, worldRadius );

    //--Add self pivot to a start position
    this.assignToParent( position, parent, 'selfPivot', 'randomize' );
}

//-- Inherit WorlObject base class;
Tree.prototype = Object.create( WorldObject.prototype );
Tree.prototype.constructor = Tree;
