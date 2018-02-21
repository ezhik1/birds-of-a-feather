module.exports = function ( app, path, http, https ) {
	app.get("/", function ( req, res ) {
		res.sendFile('index.html', { root: path.join(__dirname, '../') });
	});

	app.get("/sandbox", function ( req, res ) {
		res.sendFile('sandbox.html', { root: path.join(__dirname, '../') });
	});

    app.get("/sounds/:sound", function( req, res ) {
        var sound = '/sounds/' + req.params.sound
        res.sendFile(sound, { root: path.join(__dirname, '../') });
    });
};
