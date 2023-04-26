class Game {
    constructor() {
        this.raycaster;
        this.mouse;

        this.NUM_ACTIONS = 3

        this.world = {
            width: 60,
            height: 60
        }

        this.shipSprite;

        /**
        * backgroundPlane for mouse raycaster to hit
        */
        this.backgroundPlane = new THREE.Mesh(
            new THREE.PlaneGeometry(this.world.width, this.world.height, 1, 1),
            new THREE.MeshPhongMaterial({
                color: 0x111111
                // wireframe: true
            })
        );
        this.backgroundPlane.position.z = -1;
        this.backgroundPlane.receiveShadow = true;
        scene.add(this.backgroundPlane);
        /**
        * directionalLight 
        */
        this.directionalLight = new THREE.PointLight(0xffffff, 1, 500, 0.01);
        this.directionalLight.castShadow = true; // default false
        this.directionalLight.position.x = 0
        this.directionalLight.position.z = 15

        //Set up shadow properties for the light
        this.directionalLight.shadow.mapSize.width = 5120; // default 512
        this.directionalLight.shadow.mapSize.height = 5120; // default 512
        this.directionalLight.shadow.camera.near = 0; // default
        this.directionalLight.shadow.camera.far = 1000
        // default
        scene.add(this.directionalLight);

        /**
        * player
        */
        this.player = new Player(this.world);

        /**
        * Time Keeper
        */
        this.clock = new THREE.Clock(true);
        /**
        * Food
        */
        this.apple = new THREE.Mesh(
            new THREE.BoxGeometry(1, 1, 1),
            new THREE.MeshLambertMaterial({
                color: 0xff0000
            })
        );
        scene.add(this.apple);
        this.apple.castShadow = true;

        this.appleLight = new THREE.PointLight(0xff0000, 1, 20);
        scene.add(this.appleLight);

        this.deltaTime;
        this.then = 0;
        this.frameCount = 0;
    }

    setup() {
        this.spawnApple();
    }
    
    spawnApple() {
        // Spawn the apple in a random location on the board
        this.apple.position.x = Math.round(Math.random() * this.world.width - this.world.width / 2);
        this.apple.position.y = Math.round(Math.random() * this.world.height - this.world.height / 2);
    
        this.appleLight.position.set(this.apple.position.x, this.apple.position.y, 3);
    }
    
    gameLoop(targetFps) {
        let previousTimestamp = null;
        let lag = 0;
      
        const loop = (currentTimestamp) => {
          if (!previousTimestamp) {
            previousTimestamp = currentTimestamp;
          }
      
          const elapsedMs = currentTimestamp - previousTimestamp;
          previousTimestamp = currentTimestamp;
          lag += elapsedMs;
      
          while (lag >= 1000 / targetFps) {
            this.update()
            lag -= 1000 / targetFps;
          }
      
          // Render the scene
          this.render()
    
          // Request the next frame
          requestAnimationFrame(loop);
        }
        
        requestAnimationFrame(loop);
    }
    
    update(action) {
        let reward = 0
        let done = false
        // Update user input information
        // controller.update(this.backgroundPlane);

        // If the player turned right, update direction appropriately
        if (action == 1) {
            switch (this.player.direction) {
                case "up":
                    this.player.direction = "right";
                    break;
                case "left":
                    this.player.direction = "up";
                    break;
                case "down":
                    this.player.direction = "left";
                    break;
                case "right":
                    this.player.direction = "down";
                    break;
            }
        }
        // If the player turned left, update direction appropriately
        if (action == 2) {
            switch (this.player.direction) {
                case "up":
                    this.player.direction = "left";
                    break;
                case "left":
                    this.player.direction = "down";
                    break;
                case "down":
                    this.player.direction = "right";
                    break;
                case "right":
                    this.player.direction = "up";
                    break;
            }
        }
        
        if (this.clock.getElapsedTime() > 0.09) {
            this.player.update();
            // If player collides with apple
            if (this.player.isEating(this.apple.position.x, this.apple.position.y)) {
                this.player.addEntity()
                this.spawnApple()
                reward += 10
            }

            // If player collides with body or is out of bounds
            if (this.player.isColliding() || this.player.isOutOfBounds()) {
                this.reset()
                done = true
                reward -= 10
            }
                
            this.clock.start();
            console.log("State:", this.getState())
        }
        return [reward, this.getState(), done]
    }

    getState() {
        // State is 11 variables long broken up into 3 separate parts

        // PART 1 DIRECTIONS [NORTH, WEST, SOUTH, EAST]
        // PART 2 DANGER [Danger Straight, Danger Right, Danger Left] 
        // PART 3 FOOD [NORTH, WEST, SOUTH, EAST]
        let x = this.player.head.position.x
        let y = this.player.head.position.y

        let north = (x, y - 1)
        let west = (x - 1, y)
        let south = (x, y + 1)
        let east = (x + 1, y)

        let directions = [
            this.player.direction == "up" | 0,
            this.player.direction == "right" | 0,
            this.player.direction == "down" | 0,
            this.player.direction == "left" | 0
        ]

        let dangers = [
            (directions[0] && this.player.isColliding(east[0], east[1]) || directions[2] && this.player.isColliding(west[0], west[1]) || directions[1] && this.player.isColliding(north[0], north[1]) || directions[3] && this.player.isColliding(south[0], south[1])) | 0,
            (directions[2] && this.player.isColliding(east[0], east[1]) || directions[0] && this.player.isColliding(west[0], west[1]) || directions[3] && this.player.isColliding(north[0], north[1]) || directions[1] && this.player.isColliding(south[0], south[1])) | 0,
            (directions[3] && this.player.isColliding(east[0], east[1]) || directions[1] && this.player.isColliding(west[0], west[1]) || directions[0] && this.player.isColliding(north[0], north[1]) || directions[2] && this.player.isColliding(south[0], south[1])) | 0
        ]

        let positions = [
            this.apple.position.y < this.player.head.position.y | 0,
            this.apple.position.x < this.player.head.position.x | 0,
            this.apple.position.y > this.player.head.position.y | 0,
            this.apple.position.x > this.player.head.position.x | 0
        ]

        // All state variables
        return [...directions, ...dangers, ...positions]
    }

    reset() {
        this.player.reset();
        this.spawnApple();
    }
    
    // Render the game to the screen
    render() {
        renderer.render(scene, camera);
    }
}

// // Game controller for user input
// let controller = new Controller();
// controller.setup();

// // Game
// let game = new Game()
// game.setup();
// game.gameLoop(10);

// //// onkeydown onkeyup function ////
// onkeydown = onkeyup = function (e) {
//     // @ts-ignore
//     e = e || event; // to deal with IE
//     controller.keyCodes[e.keyCode] = e.type == 'keydown';
//     controller.update(game.backgroundPlane);
// }

// document.addEventListener("touchstart", touchstart, false);

// function touchstart(event) {
//     console.log("touchstart   event : ", event);
// }

// function onMouseMove(event) {
//     // calculate mouse position in normalized device coordinates
//     // (-1 to +1) for both components
//     controller.htmlmouse.setX((event.clientX / window.innerWidth) * 2 - 1);
//     controller.htmlmouse.setY(-(event.clientY / window.innerHeight) * 2 + 1);
// }