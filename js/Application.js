// prototype: Application //////////////////////////////////////////////////////

var Application = function () {
	console.log('%c////////////////////////////////////////////////////////////////////////////////', 'background: #3465a4;');
	console.log('Application instance created');

	this.config = new Config(this);
	this.loadingScreen = new LoadingScreen(this);
	this.resourceLoader = new ResourceLoader(this);
	this.canvasList = new CanvasList(this);
	this.controls = new Controls(this);
	this.map = new Map(this, this.config.map.name, this.config.map.variant);
	this.player = new Player(this, this.config.player.name, this.config.player.variant);
	this.hud = new Hud(this);
};

Application.prototype.init = function (arg) {
	// alias for nested functions
	var app = this;

	switch (arg) {
	case 'start':
	case 'init':
	case 'load-resources':
		// load resources
		this.loadingScreen.rotateIcon();
		this.resourceLoader.load('image', 'image', 'loading', 'failed');
		this.resourceLoader.load('json', 'map', this.map.name);
		this.resourceLoader.load('json', 'player', this.player.name);
		this.resourceLoader.load('image', 'map', this.map.fullName);
		this.resourceLoader.load('image', 'player', this.player.fullName);
		//this.resourceLoader.load('debug', 'debug', 'debug');
		this.resourceLoader.waitForAllFiles('init-load-resources-ok', 'init-load-resources-error');
		break;

	case 'setup-environment':
		// canvas
		console.log('Application: setting up the canvasList');
		this.canvasList.addCanvas('map', $('#map')[0]);
		this.canvasList.addContext('map', $('#map')[0].getContext('2d'));
		this.canvasList.addCanvas('entity_under', $('#entity_under')[0]);
		this.canvasList.addContext('entity_under', $('#entity_under')[0].getContext('2d'));
		this.canvasList.addCanvas('player', $('#player')[0]);
		this.canvasList.addContext('player', $('#player')[0].getContext('2d'));
		this.canvasList.addCanvas('entity_over', $('#entity_over')[0]);
		this.canvasList.addContext('entity_over', $('#entity_over')[0].getContext('2d'));
		this.canvasList.addCanvas('hud', $('#hud')[0]);
		this.canvasList.addContext('hud', $('#hud')[0].getContext('2d'));
		this.canvasList.resizeAll();

		// map
		console.log('Application: setting up the map');
		this.map.load(
			this.resourceLoader.resource['json/map/' + this.map.name],
			this.resourceLoader.resource['image/map/' + this.map.fullName]
		);

		// player
		console.log('Application: setting up the player');
		this.player.load(
			this.resourceLoader.resource['json/player/' + this.player.name],
			this.resourceLoader.resource['image/player/' + this.player.fullName]
		);

		// hud
		console.log('Application: setting up the hud');
		this.hud.load();

	case 'load-entities':
		// load entities
		this.map.loadEntities();
		break;

	case 'setup-entities':
		this.map.setupEntities();

	case 'setup-window':
		//controls
		$(document).keydown(function (e) {
			app.controls.toggleKeyDown(e, true);
		});

		$(document).keyup(function (e) {
			app.controls.toggleKeyDown(e, false);
		});
		
		$(window).resize(function () {
			app.canvasList.resizeAll();
			app.map.draw();
			app.player.react(0, true);
			//app.hud.draw(); // TODO
		});

	case 'draw':
		this.map.draw();
		//this.hud.draw(); // TODO

		var drawingLoop_interval = setInterval(function () { // TODO
			// adjust speed to fps, so the player will always move the same speed
			var fps = app.hud.fpsCounter.getValue();
			var speed = app.player.speed / fps;
			if (app.controls.keysDown.slow)
				speed = speed / 2;

			// clear player
			app.player.clear();
			
			// clear entities
			for (var i in app.map.entities) {
				app.map.entities[i].clear();
			}

			// player react
			app.player.react(speed);

			// draw player
			app.player.draw();
			
			// draw entities
			for (var i in app.map.entities) {
				app.map.entities[i].draw();
			}

			// reset HUD styles
			app.hud.resetTextStyle();

			// draw debug HUD
			app.canvasList.context['hud'].clearRect(0, 0, 320, 40);
			app.canvasList.context['hud'].fillStyle = 'rgba(0, 127, 127, .98)';
			app.canvasList.context['hud'].fillRect(0, 0, 240, 20);
			app.canvasList.context['hud'].fillStyle = '#fff';
			app.canvasList.context['hud'].fillText(fps.toFixed(2) + ' fps, screen: ' + app.canvasList.canvas['player'].width + 'x' + app.canvasList.canvas['player'].height + '', 6, 2);

			//clearInterval(drawingLoop_interval);
		}, 16);	// locked on max 62.5 fps = 1000/16




	case 'done':
		this.loadingScreen.fadeOut();
	}
};

Application.prototype.callback = function (arg) {
	switch (arg) {
	case 'init-load-resources-ok':
		this.init('setup-environment');
		break;
	case 'init-load-resources-error':
		this.loadingScreen.showError('Error – can\'t load all resources.');
		break;
	case 'init-load-entities-ok':
		this.init('setup-entities');
		break;
	case 'init-load-entities-error':
		this.loadingScreen.showError('Error – can\'t load all resources.');
		break;
	}
};
