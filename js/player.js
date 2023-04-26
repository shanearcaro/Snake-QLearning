class Player {
    // Player class to control the snake
    constructor(world) {
        // 'Actual' head position of snake
        this.pos = new THREE.Vector2(0, 0);
        this.vel = new THREE.Vector2(0, 0);
        this.acc = new THREE.Vector2(0, 0);

        this.tailGeometry = new THREE.BoxGeometry(1, 1, 1);
        this.tailMaterial = new THREE.MeshLambertMaterial({
            color: 0xffffff
        });

        this.snakeLen = 1;
        this.direction = "right"; // "up" "down" "left" "right"

        this.world = world

        // Create the head element and add to scene
        this.head = new THREE.Mesh(
            new THREE.BoxGeometry(1, 1, 1),
            new THREE.MeshLambertMaterial({
                color: 0x00ff00
            })
        );
        scene.add(this.head);

        // Create snake body and add head as initial element
        this.body = [this.head];
        this.pointLight = new THREE.PointLight(0x00ff00, 1, 20);
        scene.add(this.pointLight);
    }

    update() {
        // Update direction player is traveling
        if (this.direction == "up") this.pos.y++;
        if (this.direction == "down") this.pos.y--;
        if (this.direction == "left") this.pos.x--;
        if (this.direction == "right") this.pos.x++;

        // Get the targeted entity position
        let targetX = this.pos.x
        let targetY = this.pos.y

        // Get the current entity position before update
        let currentX = null
        let currentY = null

        // Update location of all entities
        for (let i = 0; i < this.body.length; i++) {
            let entity = this.body[i]

            // Record current entity location
            currentX = entity.position.x
            currentY = entity.position.y

            // Move entity to target location
            entity.position.x = targetX
            entity.position.y = targetY

            // Update target to recorded current position
            targetX = currentX
            targetY = currentY
        }

        // this.head.position.x = this.pos.x
        // this.head.position.y = this.pos.y
        this.pointLight.position.set(this.head.x, this.head.y, 3);
    }

    isEating(x, y) {
        // Determine if the head is colliding with the apple
        return this.head.position.x == x && this.head.position.y == y
    }

    isColliding() {
        // Get the head
        let head = this.head

        // Verify head position is not equal to any other entity position
        for (let i = 1; i < this.body.length; i++) {
            let entity = this.body[i];
            // Head and entity are colliding with each other
            if (head.position.x == entity.position.x && head.position.y == entity.position.y)
                return true
        }
        return false
    }

    isOutOfBounds() {
        // Get the head

        // Reset if head travels out of bounds
        if (this.pos.x > this.world.width / 2) return true;
        if (this.pos.x < -this.world.width / 2) return true;
        if (this.pos.y > this.world.height / 2) return true;
        if (this.pos.y < -this.world.height / 2) return true;

        return false

    }

    isEmptySpace(x, y) {
        // Determine if the position is taken or not
        this.body.forEach(element => {
            if (element.position.x == x && element.position.y == y)
                return false
        });
        return true
    }

    addEntity() {
        // Create a new entity
        let entity = new THREE.Mesh(this.tailGeometry, this.tailMaterial);

        // Set entity to random position, update will set in correct position
        entity.position.x = 100;
        entity.position.y = 100;

        entity.castShadow = true; //default is false
        entity.receiveShadow = true; //default

        // Add element to body and screen renderer
        this.body.push(entity);
        scene.add(this.body[this.body.length - 1]);
    }

    reset() {
        // Reset snake size and default direction
        this.snakeLen = 1;
        this.direction = "right"; // "up" "down" "left" "right"

        // Reset snake position to 0, 0 (center of the screen)
        this.pos.x = 0;
        this.pos.y = 0;

        // Remove elements from being rendered to sceen
        for (let i = 1; i < this.body.length; i++)
            scene.remove(this.body[i])

        // Reset body and add head as first element
        this.body = [];
        this.body.push(this.head)
    }
}