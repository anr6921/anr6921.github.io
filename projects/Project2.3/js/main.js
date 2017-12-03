"use strict";

// create new object literal
var app = app || {};

app.main = {
    //  properties
    WIDTH: 640,
    HEIGHT: 480,
    canvas: undefined,
    ctx: undefined,
    lastTime: 0, // used by calculateDeltaTime() 
    debug: true,
    paused: false,
    animationID: 0,
    gameState: undefined,
    totalScore : 0,
    //audio properties
    bgAudio: undefined,
    currentEffect: 0,
    currentDirection: 1,
    //effectSounds: [],
    //sound module
    sound: undefined, //required-loaded by main.js
    //player state
    playerState: undefined,
    collectables:[], //array of collectables
    yellow:[], // array of yellow snow

    // Collectable objects
    COLLECTABLE: Object.seal({
        TOTAL: 20,
        WIDTH:20,
        HEIGHT:20,
        MAX_SPEED:50,
    }),
    
    // Collectable states
    COLLECTABLE_STATE: Object.freeze({
       NORMAL:1,
        EATEN:2
    }),
    
    // Yellow objects
    YELLOW: Object.seal({
        TOTAL: 5,
        WIDTH:20,
        HEIGHT:20,
        MAX_SPEED:50,
    }),
    
    // Yellow states
    YELLOW_STATE: Object.freeze({
       NORMAL:1,
        EATEN:2
    }),
    
    // Player Object
    PLAYER: Object.seal({
        HEALTH: 3,
        WIDTH: 125,
        HEIGHT: 175,
        X: 0,
        Y: 480 -150, //window height - player height
    }),

    // Player State used to determine animation and drop collection
    PLAYER_STATE: Object.freeze({
        IDLE_RIGHT: 0,
        IDLE_LEFT: 1,
        WALK_RIGHT: 2,
        WALK_LEFT: 3,
        NOM: 4
    }),

    // game states
    GAME_STATE: Object.freeze({ //fake enumeration
        BEGIN: 0,
        DEFAULT: 1,
        EXPLODING: 2,
        CONTROLS: 3,
        END: 5
    }),
    
    // draw background
    drawBackground: function (ctx) {

        var background = new Image();
        background.src = 'media/background.png';
        background.onload = function () {
            ctx.drawImage(background, 0, 0, 800, 480);
            //console.log('in draw background');
        }
                var foreground = new Image();
        foreground.src = 'media/dirt.png';
        foreground.onload = function () {
            ctx.drawImage(foreground, 0, 40, 650, 500);
            //console.log('in draw background');
        }
    },

    // draw player
    drawPlayer: function (ctx, px, py, pw, ph) {

        var spriteWidth = 75 * 4;
        var spriteHeight = 200;

        var rows = 2;
        var cols = 4;

        var trackRight = 0;
        var trackLeft = 1;

        var width = spriteWidth / cols;
        var height = spriteHeight / rows;

        var curFrame = 1;
        var frameCount = 4;

        var x = 0;
        var y = 200;

        var srcX;
        var srcY;

        var left = false;
        var right = true;

        var speed = 1;

        var canvas = document.querySelector('canvas');
        var ctx = canvas.getContext('2d');

        var nom = false; // is the player holding up arrow? Defaults to false.

        var frameLength; // time spent on each frame
        
        var curFrame;


        var character = new Image();
        character.src = "media/dewey_idle_full.png";

        // player states determine what is being drawn
        // right arrow pressed (default)
        if (this.playerState == this.PLAYER_STATE.WALK_RIGHT) {
            left = false;
            right = true;
        }
        // left arrow pressed
        if (this.playerState == this.PLAYER_STATE.WALK_LEFT) {
            left = true;
            right = false;
        }
        // up arrow pressed
        if (this.playerState == this.PLAYER_STATE.NOM) {
            character.src = "media/dewey_mouth.png";
            nom = true;
            y = 100;
            rows = 1;
            cols = 1;
            spriteWidth = 75;
            spriteHeight = 100;
        } else {
            nom = false;

        }

        function updateFrame() {
            curFrame = ++curFrame % frameCount;
            srcX = curFrame * width;
            //ctx.clearRect(px, py, pw, ph);
            if (right) {
                srcY = trackRight * height;
            }
            if (left) {
                srcY = trackLeft * height;
            }
        }

        function drawFrame() {
            if (!nom) {
                updateFrame();
                //ctx.clearRect(px, py, pw, ph);
                ctx.drawImage(character, srcX, srcY, width, height, px, py, pw, ph);
            } else {
                //ctx.clearRect(px, py, pw, ph);
                ctx.drawImage(character, px, py, pw, ph);
            }
        }
        //setInterval(drawFrame, 100);
        drawFrame();

    },

    // sound effects
    playEffect: function () {
        var effectSound = document.createElement('audio');
        effectSound.volume = 0.3;
        effectSound.src = "media/" + this.effectSounds[this.currentEffect];
        effectSound.play();
        this.currentEffect += this.currentDirection;
        if (this.currentEffect == this.effectSounds.length || this.currentEffect == -1) {
            this.currentDirection *= -1;
            this.currentEffect += this.currentDirection;
        }
    },

    //toggle debug
    toggleDebug: function () {
        if (this.debug) {
            this.debug = false;
        } else {
            this.debug = true;
        }
    },

    // pause
    drawPauseScreen: function (ctx) {
        var background = new Image();
        background.src = 'media/pause.png';
        background.onload = function () {
            ctx.drawImage(background, 0, 0, 650, 480);
        }
    },

    //pause game
    pauseGame: function () {
        this.paused = true;

        //stop the animation loop
        cancelAnimationFrame(this.animationID);
        //stop audio
        this.stopBGAudio();
        //call update() once so that our paused screen gets drawn
        this.update();
    },

    resumeGame: function () {
        // stop animation loop just in case its running
        cancelAnimationFrame(this.animationID);
        this.paused = false;
        // play audio
        this.sound.playBGAudio();
        //restart the loop 
        this.update();
    },

    //  when mouse is clicked
    doMousedown: function (e) {
        //play audio
        this.bgAudio.play();

        // just to make sure we never get stuck in a paused state
        if (this.paused) {
            this.paused = false;
            this.update();
            return;
        };
       
        if (this.gameState == this.GAME_STATE.EXPLODING) return;

        if (this.gameState == this.GAME_STATE.BEGIN) {
            this.gameState = this.GAME_STATE.CONTROLS;
            this.reset();
            return;
        }
        
        if (this.gameState == this.GAME_STATE.CONTROLS) {
            this.gameState = this.GAME_STATE.EXPLODING;
            this.reset();
            return;
        }

        if (this.gameState == this.GAME_STATE.END) {
            this.gameState = this.GAME_STATE.BEGIN;
            this.PLAYER.HEALTH=3;
            this.reset();
            return;
        }

        //mouse doMousedown
        var mouse = getMouse(e);
    },
    


    // init method
    init: function () {
        //console.log("app.main.init() called");
        // initialize properties
        this.canvas = document.querySelector('canvas');
        this.canvas.width = this.WIDTH;
        this.canvas.height = this.HEIGHT;
        this.ctx = this.canvas.getContext('2d');

        // audio properties
        this.bgAudio = document.querySelector("#bgAudio");
        this.bgAudio.volume = 0.25;

        //initialize gamestate in init
        this.gameState = this.GAME_STATE.BEGIN;
        this.collectables = this.makeCollectable(this.COLLECTABLE.TOTAL);
        this.yellow = this.makeYellow(this.YELLOW.TOTAL);

        //initialize player state
        this.playerState = this.PLAYER_STATE.IDLE_RIGHT;

        //console.log(this.PLAYER);

        //hookupevents
        this.canvas.onmousedown = this.doMousedown.bind(this);

        // load level
        this.reset();

        // start the game loop
        this.update();
    },

    // reset on game over
    reset: function () {
        this.roundScore = 0;
    },

    // helper function to stop background audio
    stopBGAudio: function () {
        this.sound.stopBGAudio();
    },

    update: function () {
        // schedule a call to update()
        this.animationID = requestAnimationFrame(this.update.bind(this));

        if(this.PLAYER.HEALTH<=0){
            this.gameState=this.GAME_STATE.END;
        }
        // Paused, bail out of loop
        if (this.paused) {
            this.drawPauseScreen(this.ctx);
            return;
        }
        var keys = [];

        document.body.addEventListener("keydown", function (e) {
            keys[e.keyCode] = true;
        });

        document.body.addEventListener("keyup", function (e) {
            keys[e.keyCode] = false;
        });

        //move player
        if (myKeys.keydown[myKeys.KEYBOARD.KEY_UP] || myKeys.keydown[myKeys.KEYBOARD.KEY_W]) {
            this.playerState = this.PLAYER_STATE.NOM;
        }
        if (myKeys.keydown[myKeys.KEYBOARD.KEY_RIGHT] || myKeys.keydown[myKeys.KEYBOARD.KEY_D]) {
            // right arrow
            this.PLAYER.X += 3;
            this.playerState = this.PLAYER_STATE.WALK_RIGHT;
        }
        if (myKeys.keydown[myKeys.KEYBOARD.KEY_LEFT] || myKeys.keydown[myKeys.KEYBOARD.KEY_A]) {
            // left arrow
            this.PLAYER.X -= 3;
            this.playerState = this.PLAYER_STATE.WALK_LEFT;
        }

        // horizontal wrap
        if (this.PLAYER.X >= this.WIDTH) {
            this.PLAYER.X = -60;
        } else if (this.PLAYER.X < -60) {
            this.PLAYER.X = this.WIDTH;
        }


        // calc time
        var dt = this.calculateDeltaTime();
        
        //move collectables
        if(this.gameState == this.GAME_STATE.EXPLODING){
            this.moveCollectables(dt);
        }


        //draw background
        this.drawBackground(this.ctx);
        
        // draw collectables
        this.drawCollectables(this.ctx);

        //draw player
        if(this.gameState == this.GAME_STATE.EXPLODING){
            this.drawPlayer(this.ctx, this.PLAYER.X, this.PLAYER.Y, this.PLAYER.WIDTH, this.PLAYER.HEIGHT);
        }
        

        // draw HUD
        this.ctx.globalAlpha = 1.0;
        this.drawHUD(this.ctx);

    },
    
    // add draw collectables and yellow snow method
	drawCollectables: function(ctx){
        if(this.gameState == this.GAME_STATE.EXPLODING){
            // loop through collectables
            for(var i=0; i<this.collectables.length; i++){
                var c = this.collectables[i];
                if(c.y<this.HEIGHT-50){
                    c.draw(ctx);
                }
            }

            // loop through yellow snow
            for(var i=0; i<this.yellow.length; i++){
                var x = this.yellow[i];
                if(x.y<this.HEIGHT-50){
                    x.draw(ctx);
                }
                //shake if eat yellow snow
                if(x.state == this.YELLOW_STATE.EATEN){
                    /*
                    this.preShake();
                    this.preShake();
                    this.preshake();
                    this.postShake();*/
                    this.ctx.save();
                    // Create gradient
                    var grd = ctx.createRadialGradient(75,50,5,90,60,100);
                    grd.addColorStop(0,"transparent");
                    grd.addColorStop(1,"red");

                    // Fill with gradient
                    ctx.fillStyle = grd;
                    ctx.fillRect(0,20,this.WIDTH,this.HEIGHT);
                    this.ctx.restore();
                }
            }
        }

	},

    fillText: function (ctx, string, x, y, css, color) {
        ctx.save();
        // https://developer.mozilla.org/en-US/docs/Web/CSS/font
        ctx.font = css;
        ctx.fillStyle = color;
        ctx.fillText(string, x, y);
        ctx.restore();
    },

    calculateDeltaTime: function () {
        var now, fps;
        now = performance.now();
        fps = 1000 / (now - this.lastTime);
        fps = clamp(fps, 12, 60);
        this.lastTime = now;
        return 1 / fps;
    },

     // shake screen when eat yellow snow
    preShake: function(){
        this.ctx.save();
        var dx = Math.random()*10;
        var dy = Math.random()*10;
        this.ctx.translate(dx,dy);
        //this.ctx.restore();
    },
    
    postShake: function(){
        this.ctx.restore();
    },
    
    //drawHUD
    drawHUD: function (ctx) {
        //ctx.save(); // NEW

        // BEGIN
        if (this.gameState == this.GAME_STATE.BEGIN) {
            var background = new Image();
            background.src = 'media/title.png';
            background.onload = function () {
                ctx.drawImage(background, 0, 0, 650, 480);
            }

        } 
        // CONTROLS
        if (this.gameState == this.GAME_STATE.CONTROLS) {
            var background = new Image();
            background.src = 'media/controls.png';
            background.onload = function () {
                ctx.drawImage(background, 0, 0, 650, 480);
            }

        } 
        // END
        if (this.gameState == this.GAME_STATE.END) {
            var background = new Image();
            background.src = 'media/gameOver.png';
            background.onload = function () {
                ctx.drawImage(background, 0, 0, 650, 480);
            }
            ctx.save();
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            this.fillText(this.ctx, "Your final score was " + this.totalScore, this.WIDTH / 2, this.HEIGHT / 2 + 35, "20pt arial", "#ddd");
            this.fillText(this.ctx, "Click to play again!", this.WIDTH / 2, this.HEIGHT / 2, "20pt arial", "#ddd");

        }
        // MAIN GAME STATE
        if(this.gameState==this.GAME_STATE.EXPLODING){
            // gradient
            var gradient= this.ctx.createLinearGradient(0,0,0,40);
            gradient.addColorStop(0,"#2c7b95");
            gradient.addColorStop(1,"transparent");
            this.ctx.fillStyle=gradient;
            //draw score bar 
            //this.ctx.fillStyle = "#2c7b95";
            this.ctx.fillRect(0,0,this.WIDTH, 30);
            // draw score
            this.fillText(this.ctx, "Score: " + this.totalScore, this.WIDTH - 120, 20, "14pt courier", "white");
            //this.fillText(this.ctx, "Health: " + this.PLAYER.HEALTH, 0, 20, "14pt courier", "white");
            for(var i = 0; i < this.PLAYER.HEALTH; i++){
                this.fillText(this.ctx, "❤", 10+i*20, 20, "14pt courier", "#c87ab2");
            }
        }

        ctx.restore(); 
    },

    // move collectables/snow method
	moveCollectables: function(dt){
		 for(var i=0; i<this.collectables.length; i++){
			 var c = this.collectables[i];	
             this.checkForCollisions();
			 // move collectables	
             if(c.state == this.COLLECTABLE_STATE.EATEN || c.y>this.HEIGHT){
                 c.y = 0;
                 c.state = this.COLLECTABLE_STATE.NORMAL;
             }
			 c.move(dt);
             
		}
        // for loop through yellow snow
        for(var i=0; i<this.yellow.length; i++){
            var x = this.yellow[i];
            
            this.checkForCollisions();
            if(x.state == this.COLLECTABLE_STATE.EATEN || x.y>this.HEIGHT){
                 x.y = 0;
                 x.state = this.COLLECTABLE_STATE.NORMAL;
             }
			 x.move(dt);
        }
	},

	// helper method make collectables
	makeCollectable: function(num){
		var array=[];
        var snowflake = new Image();
        snowflake.src = 'media/snowflake.png';
        
		// move collectables
		var collectableMove = function(dt){
			this.y += this.ySpeed * this.speed * dt;
		};
        //draw collectables
		var collectableDraw = function(ctx){
            ctx.drawImage(snowflake, this.x, this.y, 30, 30);
		}
		
		//debugger;
		for(var i=0; i<num; i++){
			// make a new object literal
			var c = {};
            
            // getRandom from utilities.js
			c.x = getRandom(10, 600);
			c.y = -30;

			// getRandomUnitVector() from utilities.js
			var randomVector = getRandomUnitVector();

			//c.xSpeed = randomVector.x;
			c.ySpeed = Math.abs(randomVector.y);

			// make more properties
			c.speed = this.COLLECTABLE.MAX_SPEED;
			c.state = this.COLLECTABLE_STATE.NORMAL;

			// add before sealing object
			c.move = collectableMove;
			c.draw = collectableDraw;

			//no more properties can be added
			Object.seal(c);
			array.push(c);
		}
		return array;
	},
    
    // helper method make yellow snow
	makeYellow: function(num){
		var array=[];
        var snowflake = new Image();
        snowflake.src = 'media/yellowSnowflake.png';
		// move yellow snow
		var yellowMove = function(dt){
			this.y += this.ySpeed * this.speed * dt;
		};

		// draw yellow snow
		var yellowDraw = function(ctx){
			ctx.drawImage(snowflake, this.x, this.y, 30, 30);
		}
		
		for(var i=0; i<num; i++){
			// make a new object literal
			var x = {};
            
			// getRandom() from utilities.js
			x.x = getRandom(10, 600);
			x.y = -30;

			// getRandomUnitVector() is from utilities.js
			var randomVector = getRandomUnitVector();

            // create random speed
			x.ySpeed = Math.abs(randomVector.y);

			// make more properties
			x.speed = this.YELLOW.MAX_SPEED;
			x.fillStyle = 'yellow';
			x.state = this.YELLOW_STATE.NORMAL;

			// add before sealing object
			x.move = yellowMove;
			x.draw = yellowDraw;

			//no more properties can be added
			Object.seal(x);
			array.push(x);
		}
		return array;
	},
    

    checkForCollisions: function(){
    
			if(this.gameState == this.GAME_STATE.EXPLODING){
				// check if player is in nom state
                if(this.playerState==this.PLAYER_STATE.NOM){
                    // loop through collectables
                    for(var i=0;i<this.collectables.length; i++){
                        var c = this.collectables[i];  
                        // if collectable is not already eaten...
                        if(c.state == this.COLLECTABLE_STATE.NORMAL){
                            // is it in x range?
                            if(c.x < this.PLAYER.X+this.PLAYER.WIDTH &&
                              c.x+20>this.PLAYER.X &&
                              c.y < this.PLAYER.Y+this.PLAYER.HEIGHT-50 &&
                              c.y + 20 > this.PLAYER.Y+50){
                                c.state = this.COLLECTABLE_STATE.EATEN;
                                this.totalScore++;
                            }
                        }
				    } // end for
                    // loop through yellow snow
                    for(var i = 0; i<this.yellow.length; i++){
                        var x = this.yellow[i];
                        if(x.state == this.YELLOW_STATE.NORMAL){
                            // is it in x range?
                            if(x.x < this.PLAYER.X+this.PLAYER.WIDTH &&
                              x.x+20>this.PLAYER.X &&
                              x.y < this.PLAYER.Y+this.PLAYER.HEIGHT-50 &&
                              x.y+20 > this.PLAYER.Y+50){
                        
                                x.state = this.YELLOW_STATE.EATEN;
                                this.PLAYER.HEALTH--;
                            }
                        }   
                    } // end for
			}
        }
    }
};
