function Planet( worldRadius ){

    var geometry = new THREE.IcosahedronGeometry( worldRadius, 2 );
    var material = new THREE.MeshPhongMaterial({
        flatShading: true,
        // wireframe: true,
        shininess: 0,
        transparent: false,
        opacity: 1,
        color: '#584835',
        // blending: THREE.AdditiveBlending
    });
    geometry.vertices.forEach(function(v){
        v.multiplyScalar( Math.pow( Math.random(), 0.02 ) );
    })
    this.vertices = geometry.vertices;
    this.mesh     = new THREE.Mesh( geometry, material );
    this.mesh.receiveShadow = true;
}
