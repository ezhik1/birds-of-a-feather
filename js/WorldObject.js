function WorldObject(){
    this.worldPivot = new THREE.Object3D();
    this.selfPivot  = new THREE.Object3D();
    this.stick      = new THREE.Object3D();
}

WorldObject.prototype.assignToParent = function( position, parent, opt, opt2 ){
    this.point = position;

    if( opt2 && opt2 === 'randomize' ){
        //-- position is planet vertex aligned, so shuffle it a bit
        var place = new THREE.Vector3();
        place.copy( position );
        place.x += UTILS.getRandom( world.radius * 0.3, 'negatives' );
        place.y += UTILS.getRandom( world.radius * 0.3, 'negatives' );
        this.stick.lookAt( place );

    }else{
        this.stick.lookAt( this.point );
    }

    if( opt && opt === 'selfPivot' ){
        this.stick.add( this.selfPivot );
    }else{
       this.stick.add( this.worldPivot );
    }
    parent.add( this.stick );
}

