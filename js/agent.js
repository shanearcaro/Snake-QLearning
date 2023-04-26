// TensorFlow.js
const tf = require('@tensorflow/tfjs');

const memory = []

// State space
const stateSpaceSize = 1000;
// Action output size (straight, left, right)
const actionSpaceSize = 3
// Action input size 
const actionInputSize = 11;
// Batch size
const BATCH_SIZE = 1000

// QNet
const qNetwork = tf.sequential({
    layers: [
        tf.layers.dense({units: actionInputSize, inputShape: [stateSpaceSize], activation: 'relu'}),
        tf.layers.dense({ units: actionSpaceSize, activation: 'linear' })
    ]
});

// // Optimizer and loss function
// const optimizer = tf.train.adam();
// const lossFunction = 'meanSquaredError';

// function remember(state, action, reward, newState, done) {
//     // Store the state of the game in memory
//     memory.push([state, action, reward, newState, done])
// }

// function train_short(state, action, reward, newState, done) {
//     // Train on a single state
//     train(state, action, reward, newState, done)
// }

// // Train the network on many previous runs
// function train_long() {
//     // Get the latest state memory
//     let recentMemory = memory.slice(-BATCH_SIZE)

//     // Train batch memory
//     train(
//         recentMemory.map(state => state[0]), 
//         recentMemory.map(action => action[1]), 
//         recentMemory.map(reward => reward[2]), 
//         recentMemory.map(newState => newState[3]), 
//         recentMemory.map(done => done[4])
//     )
// }

// // Train network
// function train(state, action, reward, newState, done) {
//     tf.tidy(() => {
//         // Compute the target Q-values for the given rewards and next states
//         const nextQValues = qNetwork.predict(newState);
//         const maxNextQValues = nextQValues.max(1).values.reshape([-1, 1]);
//         const targetQValues = reward.add(maxNextQValues.mul(0.99)); // discount factor of 0.99

//         // Compute the predicted Q-values for the given states and actions
//         const stateTensor = tf.tensor(state);
//         const actionTensor = tf.oneHot(tf.tensor1d(action, 'int32'), actionSpaceSize);
//         const predictedQValues = qNetwork.predict(stateTensor).mul(actionTensor).sum(1);

//         // Compute the loss between the predicted and target Q-values
//         const loss = tf.losses.computeWeightedLoss((targetQValues.sub(predictedQValues)).square(), tf.onesLike(actionTensor));

//         // Use the optimizer to minimize the loss
//         optimizer.minimize(() => loss);
//     });
// }

// async function trainQModel(env, numEpisodes, maxSteps, learningRate, discountFactor) {
//     const model = tf.sequential({
//       layers: [
//         tf.layers.dense({inputShape: [env.stateSize], units: 32, activation: 'relu'}),
//         tf.layers.dense({units: env.numActions})
//       ]
//     });
//     model.compile({loss: 'meanSquaredError', optimizer: tf.train.adam(learningRate)});
  
//     let state = env.reset();
//     let epsilon = 1.0;
//     const epsilonDecay = 0.999;
//     const epsilonMin = 0.1;
//     const batchSize = 32;
  
//     for (let episode = 1; episode <= numEpisodes; episode++) {
//       let totalReward = 0;
  
//       for (let step = 1; step <= maxSteps; step++) {
//         if (Math.random() < epsilon) {
//           // Select a random action with epsilon-greedy policy
//           var action = Math.floor(Math.random() * env.numActions);
//         } else {
//           // Select the action with the highest Q-value
//           var qValues = await model.predict(tf.tensor2d([state])).data();
//           var action = qValues.indexOf(Math.max(...qValues));
//         }
  
//         // Take the selected action and observe the new state and reward
//         let [newState, reward, done] = env.step(action);
  
//         // Store the experience in replay memory
//         replayMemory.push([state, action, reward, newState, done]);
//         if (replayMemory.length > replayMemorySize) {
//           replayMemory.shift();
//         }
  
//         // Sample a batch of experiences from replay memory
//         let minibatch = randomSample(replayMemory, batchSize);
//         let states = tf.tensor2d(minibatch.map((m) => m[0]));
//         let actions = tf.tensor1d(minibatch.map((m) => m[1]));
//         let rewards = tf.tensor1d(minibatch.map((m) => m[2]));
//         let newStates = tf.tensor2d(minibatch.map((m) => m[3]));
//         let dones = tf.tensor1d(minibatch.map((m) => m[4]));
  
//         // Calculate the target Q-values for the minibatch
//         let targetQValues = rewards.add(dones.mul(discountFactor).mul(model.predict(newStates).max(1)));
//         let qValues = model.predict(states);
//         let targetQValuesMasked = tf.mul(targetQValues.reshape([batchSize, 1]), tf.oneHot(actions, env.numActions));
//         let loss = qValues.sub(targetQValuesMasked).square().mean();
  
//         // Train the model on the minibatch
//         await model.fit(states, targetQValuesMasked, {epochs: 1});
  
//         // Update the current state and total reward
//         state = newState;
//         totalReward += reward;
  
//         if (done) {
//           break;
//         }
//       }
  
//       console.log(`Episode ${episode}: Total reward = ${totalReward}`);
  
//       // Decay the epsilon value
//       epsilon = Math.max(epsilonMin, epsilon * epsilonDecay);
//     }
  
//     return model;
//   }



class Agent {
    async train(env, model, optimizer, memory, gamma, maxSteps) {
        let state = env.reset();
        let totalSteps = 0;
        
        while (true) {
          let action, nextState, reward, done;
      
          // Choose action using epsilon-greedy policy
          if (Math.random() < EPSILON) {
            action = env.action_space.sample();
          } else {
            const logits = model.predict(tf.tensor(state, [1, ...state.shape]));
            action = tf.argMax(logits, axis=1).dataSync()[0];
            logits.dispose();
          }
      
          // Take a step in the environment
          [nextState, reward, done] = env.step(action);
          
          // Add experience to replay memory
          memory.add(state, action, reward, nextState, done);
      
          // Update the model
          const batch = memory.randomSample(BATCH_SIZE);
          const loss = update(model, optimizer, batch, gamma);
          
          // Update state and counters
          state = nextState;
          totalSteps += 1;
      
          // Check if the episode has ended
          if (done || totalSteps >= maxSteps) {
            state = env.reset();
            console.log(`Episode ended after ${totalSteps} steps`);
            totalSteps = 0;
          }
        }
    }

    randomSample(memory, batch_size) {
        const batch = [];
      
        while (batch.length < batch_size) {
          const idx = Math.floor(Math.random() * memory.length);
          batch.push(memory[idx]);
        }
      
        return batch;
    }
}
