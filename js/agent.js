// Create the optimizer
const optimizer = tf.train.adam();

// Create the model
const model = tf.sequential({
  layers: [
    tf.layers.dense({ inputShape: [11], units: 256, activation: 'relu' }),
    tf.layers.dense({ units: 3, activation: 'softmax' })
  ]
});

const memory = []

class Agent {
    constructor(game, gamma) {
      this.game = game;
      this.model = model;
      this.optimizer = optimizer;
      this.memory = memory;
      this.gamma = gamma;
      this.maxSteps = 100;
      this.epsilon = 0.6; // Exploration rate
      this.epsilonDecay = 0.995; // Decay rate for exploration rate
      this.epsilonMin = 0.01; // Minimum exploration rate
      this.batchSize = 32; // Batch size for training the model
    }
  
    async train() {
        let episode = 0;
        let totalSteps = 0;
        let totalRewards = 0;
        let maxReward = 0;
        let maxSteps = this.game.player.snakeLen * 100;
      
        while (totalSteps < this.maxSteps) {
            episode++;
      
            // Reset the game
            this.game.reset();
            let state = this.game.getState();
            let done = false;
            let episodeReward = 0;

            console.log("=====BEGIN EPISODE=====")
            console.log("EPISODE:", episode)
            console.log("STATE:", state)
            console.log("DONE:", done)
            console.log("EPISODE REWARD:", episodeReward)
      
            // Game loop
            while (!done && totalSteps < maxSteps) {
                // Choose an action
                let action;
                if (Math.random() < this.epsilon) {
                    console.log("Taking random action...")
                    action = Math.floor(Math.random() * this.game.NUM_ACTIONS);
                } 
                else {
                    console.log("Taking predicted action...")
                    let qValues = this.model.predict(tf.tensor(state).expandDims());
                    action = tf.argMax(qValues, 1).dataSync()[0];
                }
                console.log("ACTION:", action)
      
                // Take the action and observe the new state and reward
                let [reward, nextState, done] = this.game.update(action);
                console.log("ACTION FEEDBACK:")
                console.log("\tREWARD:", reward)
                console.log("\tNEXT:", nextState)
                console.log("\tDONE:", done)

                episodeReward += reward;
                totalRewards += reward;
                totalSteps++;
        
                console.log("REMEMBERING ACTION STATE")
                // Add the experience to the replay memory
                this.memory.push([state, action, reward, nextState, done]);
        
                // Slice batches of experiences from the memory and use them to train the model
                while (this.memory.length >= this.batchSize) {
                    let batch = this.memory.slice(0, this.batchSize);
                    let [states, actions, rewards, nextStates, dones] = batch[0].map((_, i) => batch.map(l => l[i]));
        
                    let qValuesNext = this.model.predict(tf.tensor(nextStates));
                    let maxQValuesNext = qValuesNext.max(1).reshape([this.batchSize, 1]);
                    let qTargets = tf.tidy(() => {
                        let maxQValuesNext = qValuesNext.max(1).reshape([-1, 1]);
                        maxQValuesNext = tf.keep(maxQValuesNext); // keep the intermediate tensor
                        return tf.tensor(rewards).add(tf.scalar(this.gamma).mul(tf.scalar(1 - dones)).mul(maxQValuesNext));
                    });
        
                    let qValues = this.model.predict(tf.tensor(states));

                    console.log("BATCH:", batch)
                    console.log("Q VALUES NEXT:", qValuesNext)
                    console.log("MAX Q VALUES NEXT:", maxQValuesNext)
                    console.log("Q TARGETS:", qTargets)
                    let loss = tf.losses.meanSquaredError(qTargets, qValues);
                    this.optimizer.minimize(() => {
                        return loss;
                    });
        
                    // Remove the experiences from the memory
                    this.memory = this.memory.slice(this.batchSize);
            
                    await tf.nextFrame(); // Wait for the next animation frame
                }
        
                // Update the current state
                state = nextState;
        
                // Decay the exploration rate
                this.epsilon = Math.max(this.epsilonMin, this.epsilon * this.epsilonDecay);
        
                // Render the scene
                this.game.render();
        
                await tf.nextFrame(); // Wait for the next animation frame
            }
      
            // Record the episode statistics
            if (episodeReward > maxReward) {
                maxReward = episodeReward;
            }
            console.log(`Episode ${episode}: reward = ${episodeReward}, epsilon = ${this.epsilon.toFixed(2)}`);
        
            // Save the model weights every 10 episodes
            maxSteps = this.game.player.snakeLen * 100;
        }
    }
}

// // // Game controller for user input
// let controller = new Controller();
// controller.setup();

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

// Game
let game = new Game()
game.setup();

let agent = new Agent(game, 0.90)
agent.train()
