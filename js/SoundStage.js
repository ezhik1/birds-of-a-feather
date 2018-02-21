function SoundStage(){
    this.dir    = 'sounds';
    this.files  = [ 'wind0', 'wind1', 'wind2', 'wind3', 'flapping-medium', 'flapping-medium-1', 'flapping-long' ];
    this.sounds = [];
    this.allLoaded = false;
    this.loaded    = 0;
    this.sheet;

    this.playSounds = this.playSounds.bind( this );

    this.addSounds( this.files );
}

SoundStage.prototype.configureSoundType = function( src ){

    //-- Howl library sound instance
    var sound = new Howl({
        src: '../' + this.dir + '/' + src + '.mp3'
    });

    //-- setup a throttled volume fade method depending on sound progress; bind sound context
    sound.fadeOnProgress = this.fadeOnProgress.bind( sound );

    this.sounds.push( { name : src, howlSound: sound } );

    //-- setup listenter
    sound.on('play', function(){
        this.fadeOnProgress();
    });
}

SoundStage.prototype.fadeOnProgress = function(  ){

    this.progress ? this.progress : 0;
    var sound = this;
    var current = sound.seek();
    var progress = current / sound._duration;

    //-- throttle method calls to tenths of sound progress
    if( sound.progress < 0.1 ){
        sound.progress += progress;
        requestAnimationFrame( sound.fadeOnProgress );
        return
    }

    sound.progress = 0;
    var keyframe = 0.8 // point at which to fade sound

    if( progress >= keyframe ){
        var max = 1; // sound duration
        var min = keyframe;

        //-- normalise from sound init volume to 0
        var normalised = Math.max( 0, Math.min( sound.initVolume, ( progress - min ) / ( max - min ) ) );
        sound.volume( sound._volume - normalised);
    }

    //-- Reset volume to its composed initial value
    if( progress >= 1 ){
        sound.volume( sound.initVolume );
        cancelAnimationFrame( sound.fadeOnProgress );
        return
     }
    requestAnimationFrame( sound.fadeOnProgress ) ;
}

SoundStage.prototype.addSounds = function (){
    for ( var i = 0, len = this.files.length; i < len; i++ ) {
        this.configureSoundType( this.files[ i ] );
    }
}

SoundStage.prototype.loadAll = function( callback ){

    for ( var i = 0, len = this.sounds.length; i < len; i++ ) {
        this.sounds[ i ].howlSound.once('load', function(){
            this.loaded++;

            //-- all sounds loaded, return onComplete callback
            if( this.loaded === this.sounds.length - 1 ){
                this.allLoaded = true;
                callback();
            }
        }.bind( this ));
    }
}

SoundStage.prototype.compose = function( sheet ){
    //-- sheet
    // {
    //   current: 0, [ INTEGER ]      |-| current sound
    //   last   : 0, [ MILLISECONDS ] |-| last check
    //   sounds : [] [ ARRAY ]        |-| [{ sound: 'sound0', loop: true || false, delay: 0 }]
    //   elsapsed: 0 [ MILLISECONDS ] |-| running time of sound execution in sounds array
    // }

    if( !this.allLoaded ){ return }

    sheet.current = sheet.current ? sheet.current : 0;
    sheet.elapsed =  Date.now();
    sheet.sounds  = sheet.sounds ? sheet.sounds : [];
    this.sheet    = sheet;
    this.playSounds();
}

SoundStage.prototype.playSounds = function(){

    var currentSound = this.sheet.sounds[ this.sheet.current ];
    var now =  Date.now();

    var elapsed = now - this.sheet.elapsed;

    if( elapsed < currentSound.delay ){
        requestAnimationFrame( this.playSounds )
        return
    }

    var index = this.sounds.map( function( x ){ return x.name }).indexOf( currentSound.sound );

    this.sounds[ index ].howlSound._loop = currentSound.loop || true;
    this.sounds[ index ].howlSound._volume = currentSound.volume || 1;
    this.sounds[ index ].howlSound.initVolume = currentSound.volume || 1;

    this.sounds[ index ].howlSound.play();
    this.sheet.current++;
    this.sheet.elapsed += elapsed ;

    if( this.sheet.current === this.sheet.sounds.length ){
        cancelAnimationFrame( this.playSounds )
        return
    }else{
        requestAnimationFrame( this.playSounds );
    }
}

SoundStage.prototype.pauseAll = function(){
    for ( var i = 0, len = this.sounds.length; i < len; i++ ){
        this.sounds[ i ].howlSound.pause();
    }
}

SoundStage.prototype.resume = function(){
    //--resume only the sounds called by the sheet
    for ( var i = 0, len = this.sheet.sounds.length; i < len; i++ ){
        var index = this.sounds.map( function( x ){ return x.name }).indexOf( this.sheet.sounds[ i ].sound );
        if( index > -1 ){
            this.sounds[ index ].howlSound.play();
        }
    }
}
