function sceneryConstructor( type, parent, worldRadius, saturation, planet, opt ) {

    for( var i = 0; i < saturation; i++ ){
        var object;
        var point;
        var position;

        if( planet ){
            point    = UTILS.getRandom( planet.vertices.length - 1 );
            position = planet.vertices[ point ].floor();
        }else{
            position = opt;
        }

        if( type === 'Boid' ){
            position = position.clone();
        }

        object = new this[ type ]( position, worldRadius, parent, opt );
        parent.collection.push( object );
        parent.add( object.stick );
    }
}
