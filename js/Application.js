// prototype: Application //////////////////////////////////////////////////////

var Application = function () {
	console.log('%c////////////////////////////////////////////////////////////////////////////////', 'background: #3465a4;');
	console.log('Application instance created');

	// status
	this.lastPressedKey = 0;
	this.mode = 'game';
	this.modePrev = 'game';

	// modules
	this.config = new Config(this);
	this.loadingScreen = new LoadingScreen(this);
	this.resourceLoader = new ResourceLoader(this);
	this.canvasList = new CanvasList(this);
	this.animationList = new AnimationList(this);
	this.fontList = new FontList(this);
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
		this.resourceLoader.load('json', 'font', 'basic');
		this.resourceLoader.load('image', 'map', this.map.fullName);
		this.resourceLoader.load('image', 'player', this.player.fullName);
		this.resourceLoader.load('image', 'font', 'basic');
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
		this.fontList.load();

	case 'load-entities':
		// load entities
		this.map.loadEntities();
		break;

	case 'setup-entities':
		this.map.setupEntities();

	case 'animations':
		this.animationList.load();

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
			app.hud.resize();
		});

	case 'draw':
		this.map.draw();
		this.hud.draw();

		var drawingLoop_interval = setInterval(function () { // TODO
			var fps = app.hud.fpsCounter.getValue();

			// global keys

			// debug mode
			if (app.controls.keysDown.debug || app.controls.keysDown.debug_alt) {
				app.controls.keysDown.debug     = false;
				app.controls.keysDown.debug_alt = false;

				// toggle debug mode
				app.config.debug.enabled = !app.config.debug.enabled;

				// clear all and redraw
				for (var i in app.canvasList.context)
					app.canvasList.context[i].clearRect(
						0,
						0,
						app.canvasList.canvas[i].width,
						app.canvasList.canvas[i].height
					);
				app.map.draw();
				app.hud.draw();
				app.player.draw();
				for (var i in app.map.entities)
					app.map.entities[i].draw();
			}

			// pause menu
			if (app.controls.keysDown.pause || app.controls.keysDown.pause_alt) {
				app.controls.keysDown.pause     = false;
				app.controls.keysDown.pause_alt = false;
				if (app.mode == 'pause') {
					app.mode = app.modePrev;
				} else {
					app.modePrev = app.mode;
					app.mode = 'pause';
				}

				app.hud.clear();
				app.hud.draw();
			}

			// the actual drawing

			if (app.mode == 'pause') {
				// TODO
			} else if (app.mode == 'game') {
				// adjust speed to fps, so the player will always move the same speed
				var speed = app.player.speed / fps;
				if (app.controls.keysDown.slow)
					speed = speed / 2;

				// clear
				app.player.clear();
				for (var i in app.map.entities)
					app.map.entities[i].clear();

				// exec entities queue
				for (var i in app.map.entities)
					app.map.entities[i].execQueue();
	// TODO bugfix: when animation changes collisions while player is not moving,
	// then player can appear inside the collision, and then teleport though it
	// when walking inside
				// player react
				app.player.react(speed);

				// draw
				app.player.draw();
				for (var i in app.map.entities)
					app.map.entities[i].draw();
			}

			if (app.config.debug.enabled)
				app.hud.drawDebugInfo(fps);

			//clearInterval(drawingLoop_interval);
		}, (1000 / this.config.fpsCap));

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
