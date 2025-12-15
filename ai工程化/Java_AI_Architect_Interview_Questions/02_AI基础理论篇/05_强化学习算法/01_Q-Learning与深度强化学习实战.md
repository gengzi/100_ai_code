# Q-Learning与深度强化学习实战

## 🎯 面试题目

### 题目1：Q-Learning算法实现与应用 ⭐⭐⭐⭐
**问题**：实现Q-Learning算法解决经典的OpenAI Gym环境（如CartPole或GridWorld），并用Java完整实现状态-动作价值函数的更新机制。

**答案要点**：
1. Q-Learning的核心原理和数学基础
2. ε-greedy策略的实现
3. 经验回放和目标网络的重要性

**核心原理**：
Q-Learning通过贝尔曼方程更新Q值：
```
Q(s,a) = Q(s,a) + α [r + γ max Q(s',a') - Q(s,a)]
```

**核心代码示例**：

```java
import java.util.*;
import java.util.concurrent.ThreadLocalRandom;

/**
 * Q-Learning算法实现
 */
public class QLearningAlgorithm {

    // Q值表
    private double[][] qTable;
    private final int stateSpace;
    private final int actionSpace;
    private final double learningRate;
    private final double discountFactor;
    private final double epsilon;
    private final double epsilonDecay;
    private final double minEpsilon;

    // 训练统计
    private int episode;
    private double totalReward;
    private List<Double> rewardHistory;

    public QLearningAlgorithm(int stateSpace, int actionSpace,
                            double learningRate, double discountFactor,
                            double epsilon, double epsilonDecay) {
        this.stateSpace = stateSpace;
        this.actionSpace = actionSpace;
        this.learningRate = learningRate;
        this.discountFactor = discountFactor;
        this.epsilon = epsilon;
        this.epsilonDecay = epsilonDecay;
        this.minEpsilon = 0.01;

        this.qTable = new double[stateSpace][actionSpace];
        this.rewardHistory = new ArrayList<>();

        // 初始化Q表为0
        for (int i = 0; i < stateSpace; i++) {
            Arrays.fill(qTable[i], 0.0);
        }
    }

    // ε-greedy策略选择动作
    public int selectAction(int state) {
        if (ThreadLocalRandom.current().nextDouble() < epsilon) {
            // 探索：随机选择动作
            return ThreadLocalRandom.current().nextInt(actionSpace);
        } else {
            // 利用：选择Q值最大的动作
            return greedyAction(state);
        }
    }

    // 贪心策略选择动作
    private int greedyAction(int state) {
        int bestAction = 0;
        double bestValue = qTable[state][0];

        for (int action = 1; action < actionSpace; action++) {
            if (qTable[state][action] > bestValue) {
                bestValue = qTable[state][action];
                bestAction = action;
            }
        }

        return bestAction;
    }

    // Q值更新
    public void updateQValue(int state, int action, double reward, int nextState, boolean done) {
        // 获取下一个状态的最大Q值
        double maxNextQValue = done ? 0 : getMaxQValue(nextState);

        // 计算TD误差
        double tdTarget = reward + discountFactor * maxNextQValue;
        double tdError = tdTarget - qTable[state][action];

        // 更新Q值
        qTable[state][action] += learningRate * tdError;
    }

    // 获取状态的最大Q值
    private double getMaxQValue(int state) {
        double maxValue = qTable[state][0];
        for (int action = 1; action < actionSpace; action++) {
            if (qTable[state][action] > maxValue) {
                maxValue = qTable[state][action];
            }
        }
        return maxValue;
    }

    // 衰减ε值
    public void decayEpsilon() {
        epsilon = Math.max(minEpsilon, epsilon * epsilonDecay);
    }

    // 训练一个回合
    public void trainEpisode(Environment env) {
        int state = env.reset();
        double episodeReward = 0;
        int step = 0;
        boolean done = false;
        int maxSteps = 1000; // 防止无限循环

        while (!done && step < maxSteps) {
            // 选择动作
            int action = selectAction(state);

            // 执行动作
            Environment.StepResult stepResult = env.step(action);
            int nextState = stepResult.nextState;
            double reward = stepResult.reward;
            done = stepResult.done;

            // 更新Q值
            updateQValue(state, action, reward, nextState, done);

            // 更新状态
            state = nextState;
            episodeReward += reward;
            step++;
        }

        // 衰减ε
        decayEpsilon();

        // 记录统计信息
        episode++;
        totalReward += episodeReward;
        rewardHistory.add(episodeReward);

        System.out.printf("Episode %d, Steps: %d, Reward: %.2f, Epsilon: %.3f%n",
                         episode, step, episodeReward, epsilon);
    }

    // 批量训练
    public void train(Environment env, int numEpisodes) {
        System.out.println("开始Q-Learning训练...");
        System.out.printf("状态空间大小: %d, 动作空间大小: %d%n", stateSpace, actionSpace);
        System.out.printf("学习率: %.3f, 折扣因子: %.3f, 初始ε: %.3f%n",
                         learningRate, discountFactor, epsilon);

        long startTime = System.currentTimeMillis();

        for (int episode = 0; episode < numEpisodes; episode++) {
            trainEpisode(env);

            // 每100个回合输出统计信息
            if ((episode + 1) % 100 == 0) {
                double avgReward = rewardHistory.subList(Math.max(0, episode - 99), episode + 1)
                    .stream().mapToDouble(Double::doubleValue).average().orElse(0);
                System.out.printf("=== Episodes %d-%d, Avg Reward: %.2f ===%n",
                                 episode - 99, episode, avgReward);
            }
        }

        long endTime = System.currentTimeMillis();
        System.out.printf("训练完成！总耗时: %.2f秒%n", (endTime - startTime) / 1000.0);
        System.out.printf("平均每回合奖励: %.2f%n", totalReward / numEpisodes);
    }

    // 测试训练结果
    public void test(Environment env, int numTestEpisodes) {
        System.out.println("\n开始测试训练结果...");
        double totalTestReward = 0;
        int successfulEpisodes = 0;

        for (int episode = 0; episode < numTestEpisodes; episode++) {
            int state = env.reset();
            double episodeReward = 0;
            int step = 0;
            boolean done = false;

            while (!done && step < 1000) {
                int action = greedyAction(state); // 测试时不探索
                Environment.StepResult stepResult = env.step(action);

                state = stepResult.nextState;
                episodeReward += stepResult.reward;
                done = stepResult.done;
                step++;
            }

            totalTestReward += episodeReward;
            if (episodeReward > 0) {
                successfulEpisodes++;
            }
        }

        System.out.printf("测试结果 - 平均奖励: %.2f, 成功率: %.1f%%%n",
                         totalTestReward / numTestEpisodes,
                         (successfulEpisodes * 100.0) / numTestEpisodes);
    }

    // 获取Q值表
    public double[][] getQTable() {
        return qTable.clone();
    }

    // 可视化Q值表
    public void visualizeQTable() {
        System.out.println("\nQ值表可视化:");
        System.out.println("状态\\动作", Arrays.stream(qTable[0]).mapToDouble(d -> d).toArray());

        for (int state = 0; state < Math.min(stateSpace, 10); state++) {
            System.out.printf("State %2d: ", state);
            for (int action = 0; action < actionSpace; action++) {
                System.out.printf("%8.3f", qTable[state][action]);
            }
            System.out.println();
        }
    }

    // 获取训练统计
    public TrainingStats getStats() {
        return new TrainingStats(episode, totalReward / episode, epsilon, rewardHistory);
    }

    // 训练统计信息类
    public static class TrainingStats {
        public final int totalEpisodes;
        public final double averageReward;
        public final double finalEpsilon;
        public final List<Double> rewardHistory;

        public TrainingStats(int totalEpisodes, double averageReward,
                           double finalEpsilon, List<Double> rewardHistory) {
            this.totalEpisodes = totalEpisodes;
            this.averageReward = averageReward;
            this.finalEpsilon = finalEpsilon;
            this.rewardHistory = new ArrayList<>(rewardHistory);
        }
    }
}

// 环境接口
interface Environment {
    int reset();
    StepResult step(int action);
    int getStateSpace();
    int getActionSpace();

    class StepResult {
        public final int nextState;
        public final double reward;
        public final boolean done;

        public StepResult(int nextState, double reward, boolean done) {
            this.nextState = nextState;
            this.reward = reward;
            this.done = done;
        }
    }
}

// GridWorld环境实现
class GridWorld implements Environment {
    private final int width;
    private final int height;
    private int agentX, agentY;
    private int goalX, goalY;
    private final double[][] rewards;
    private final boolean[][] obstacles;
    private Random random = new Random();

    public GridWorld(int width, int height) {
        this.width = width;
        this.height = height;
        this.rewards = new double[width][height];
        this.obstacles = new boolean[width][height];

        initializeGrid();
    }

    private void initializeGrid() {
        // 初始化奖励（大部分为-1）
        for (int x = 0; x < width; x++) {
            for (int y = 0; y < height; y++) {
                rewards[x][y] = -0.1;
                obstacles[x][y] = false;
            }
        }

        // 设置目标位置（右上角）
        goalX = width - 1;
        goalY = height - 1;
        rewards[goalX][goalY] = 10.0; // 目标奖励

        // 随机设置障碍物
        int numObstacles = (width * height) / 10;
        for (int i = 0; i < numObstacles; i++) {
            int x = random.nextInt(width);
            int y = random.nextInt(height);

            // 避免在起点和目标位置设置障碍物
            if ((x != 0 || y != 0) && (x != goalX || y != goalY)) {
                obstacles[x][y] = true;
                rewards[x][y] = -1.0; // 撞墙惩罚
            }
        }
    }

    @Override
    public int reset() {
        agentX = 0;
        agentY = 0;
        return getState();
    }

    @Override
    public StepResult step(int action) {
        int newX = agentX;
        int newY = agentY;

        // 执行动作: 0=上, 1=右, 2=下, 3=左
        switch (action) {
            case 0: newY = Math.max(0, agentY - 1); break;
            case 1: newX = Math.min(width - 1, agentX + 1); break;
            case 2: newY = Math.min(height - 1, agentY + 1); break;
            case 3: newX = Math.max(0, agentX - 1); break;
        }

        // 检查是否撞到障碍物
        if (obstacles[newX][newY]) {
            newX = agentX; // 保持在原位置
            newY = agentY;
        }

        agentX = newX;
        agentY = newY;

        double reward = rewards[agentX][agentY];
        boolean done = (agentX == goalX && agentY == goalY);

        return new StepResult(getState(), reward, done);
    }

    private int getState() {
        return agentY * width + agentX;
    }

    @Override
    public int getStateSpace() {
        return width * height;
    }

    @Override
    public int getActionSpace() {
        return 4; // 上下左右
    }

    public void visualize(int[] path) {
        System.out.println("\nGridWorld可视化:");
        System.out.print("  ");
        for (int x = 0; x < width; x++) {
            System.out.printf("%2d", x);
        }
        System.out.println();

        for (int y = 0; y < height; y++) {
            System.out.printf("%2d", y);
            for (int x = 0; x < width; x++) {
                if (x == goalX && y == goalY) {
                    System.out.print(" G");
                } else if (obstacles[x][y]) {
                    System.out.print(" X");
                } else if (x == agentX && y == agentY) {
                    System.out.print(" A");
                } else {
                    System.out.print(" .");
                }
            }
            System.out.println();
        }
    }
}
```

### 题目2：深度Q网络（DQN）实现 ⭐⭐⭐⭐⭐
**问题**：实现深度Q网络（Deep Q-Network），包括经验回放、目标网络、Double DQN等关键技术。

**答案要点**：
1. 神经网络作为函数逼近器
2. 经验回放机制解决样本相关性
3. 目标网络稳定训练过程

**核心代码示例**：

```java
import java.util.*;
import java.util.concurrent.ThreadLocalRandom;

/**
 * 深度Q网络（DQN）实现
 */
public class DeepQNetwork {

    // 经验回放缓冲区
    public static class ExperienceReplay {
        private final List<Experience> buffer;
        private final int capacity;
        private int position = 0;
        private final Random random = new Random();

        public ExperienceReplay(int capacity) {
            this.capacity = capacity;
            this.buffer = new ArrayList<>(capacity);
        }

        // 存储经验
        public void add(Experience experience) {
            if (buffer.size() < capacity) {
                buffer.add(experience);
            } else {
                buffer.set(position, experience);
                position = (position + 1) % capacity;
            }
        }

        // 采样批次经验
        public List<Experience> sample(int batchSize) {
            List<Experience> batch = new ArrayList<>();
            for (int i = 0; i < batchSize; i++) {
                int index = random.nextInt(buffer.size());
                batch.add(buffer.get(index));
            }
            return batch;
        }

        public int size() {
            return buffer.size();
        }
    }

    // 经验数据结构
    public static class Experience {
        public final double[] state;
        public final int action;
        public final double reward;
        public final double[] nextState;
        public final boolean done;

        public Experience(double[] state, int action, double reward,
                         double[] nextState, boolean done) {
            this.state = state.clone();
            this.action = action;
            this.reward = reward;
            this.nextState = nextState.clone();
            this.done = done;
        }
    }

    // 简单的神经网络实现
    public static class NeuralNetwork {
        private final int[] layers;
        private double[][][] weights;
        private double[][] biases;
        private final double learningRate;

        public NeuralNetwork(int[] layers, double learningRate) {
            this.layers = layers.clone();
            this.learningRate = learningRate;
            initializeWeights();
        }

        private void initializeWeights() {
            weights = new double[layers.length - 1][][];
            biases = new double[layers.length - 1][];

            for (int i = 0; i < layers.length - 1; i++) {
                int inputSize = layers[i];
                int outputSize = layers[i + 1];

                weights[i] = new double[outputSize][inputSize];
                biases[i] = new double[outputSize];

                // Xavier初始化
                double scale = Math.sqrt(2.0 / inputSize);
                for (int j = 0; j < outputSize; j++) {
                    for (int k = 0; k < inputSize; k++) {
                        weights[i][j][k] = (Math.random() - 0.5) * 2 * scale;
                    }
                    biases[i][j] = 0;
                }
            }
        }

        // 前向传播
        public double[] forward(double[] input) {
            double[] current = input.clone();

            for (int layer = 0; layer < layers.length - 1; layer++) {
                current = layerForward(current, layer);
            }

            return current;
        }

        private double[] layerForward(double[] input, int layerIndex) {
            double[] output = new double[layers[layerIndex + 1]];

            for (int i = 0; i < output.length; i++) {
                double sum = biases[layerIndex][i];
                for (int j = 0; j < input.length; j++) {
                    sum += weights[layerIndex][i][j] * input[j];
                }

                // 最后一层使用线性激活，其他层使用ReLU
                if (layerIndex == layers.length - 2) {
                    output[i] = sum; // 线性激活
                } else {
                    output[i] = Math.max(0, sum); // ReLU
                }
            }

            return output;
        }

        // 计算Q值
        public double[] predictQValues(double[] state) {
            return forward(state);
        }

        // 训练步骤（简化版，实际需要完整的反向传播）
        public void trainStep(List<Experience> batch, NeuralNetwork targetNetwork,
                            double gamma, double learningRate) {
            for (Experience experience : batch) {
                double[] currentQ = forward(experience.state);

                // 计算目标Q值
                double target;
                if (experience.done) {
                    target = experience.reward;
                } else {
                    double[] nextQ = targetNetwork.forward(experience.nextState);
                    double maxNextQ = Arrays.stream(nextQ).max().orElse(0);
                    target = experience.reward + gamma * maxNextQ;
                }

                // 简单的权重更新（实际需要梯度计算）
                double error = target - currentQ[experience.action];
                updateWeights(experience.state, experience.action, error, learningRate);
            }
        }

        private void updateWeights(double[] state, int action, double error, double lr) {
            // 简化的权重更新规则
            for (int layer = 0; layer < weights.length; layer++) {
                for (int i = 0; i < weights[layer].length; i++) {
                    for (int j = 0; j < weights[layer][i].length; j++) {
                        if (layer == weights.length - 1 && i == action) {
                            // 输出层对应动作的权重更新
                            weights[layer][i][j] += lr * error * state[j];
                        }
                    }
                }
            }
        }

        // 软更新目标网络
        public void softUpdate(NeuralNetwork targetNetwork, double tau) {
            for (int layer = 0; layer < weights.length; layer++) {
                for (int i = 0; i < weights[layer].length; i++) {
                    for (int j = 0; j < weights[layer][i].length; j++) {
                        targetNetwork.weights[layer][i][j] =
                            tau * weights[layer][i][j] +
                            (1 - tau) * targetNetwork.weights[layer][i][j];
                    }
                }
            }
        }

        // 复制网络权重
        public void copyWeightsTo(NeuralNetwork targetNetwork) {
            for (int layer = 0; layer < weights.length; layer++) {
                for (int i = 0; i < weights[layer].length; i++) {
                    System.arraycopy(weights[layer][i], 0,
                                   targetNetwork.weights[layer][i], 0,
                                   weights[layer][i].length);
                    System.arraycopy(biases[layer], 0,
                                   targetNetwork.biases[layer], 0,
                                   biases[layer].length);
                }
            }
        }
    }

    // DQN Agent
    public static class DQNAgent {
        private final NeuralNetwork qNetwork;
        private final NeuralNetwork targetNetwork;
        private final ExperienceReplay replayBuffer;
        private final int stateSize;
        private final int actionSize;
        private final double gamma;
        private final double epsilon;
        private final double epsilonDecay;
        private final double minEpsilon;
        private final int targetUpdateFreq;
        private int updateCounter = 0;

        private double currentEpsilon;

        public DQNAgent(int stateSize, int actionSize, int hiddenSize,
                       double learningRate, double gamma, double epsilon,
                       double epsilonDecay, int bufferSize, int targetUpdateFreq) {
            this.stateSize = stateSize;
            this.actionSize = actionSize;
            this.gamma = gamma;
            this.epsilon = epsilon;
            this.epsilonDecay = epsilonDecay;
            this.minEpsilon = 0.01;
            this.targetUpdateFreq = targetUpdateFreq;
            this.currentEpsilon = epsilon;

            // 创建网络
            int[] architecture = {stateSize, hiddenSize, hiddenSize, actionSize};
            this.qNetwork = new NeuralNetwork(architecture, learningRate);
            this.targetNetwork = new NeuralNetwork(architecture, learningRate);

            // 初始化目标网络
            qNetwork.copyWeightsTo(targetNetwork);

            // 创建经验回放缓冲区
            this.replayBuffer = new ExperienceReplay(bufferSize);
        }

        // ε-greedy策略选择动作
        public int selectAction(double[] state, boolean training) {
            if (training && ThreadLocalRandom.current().nextDouble() < currentEpsilon) {
                // 探索
                return ThreadLocalRandom.current().nextInt(actionSize);
            } else {
                // 利用
                double[] qValues = qNetwork.predictQValues(state);
                int bestAction = 0;
                double bestValue = qValues[0];

                for (int i = 1; i < qValues.length; i++) {
                    if (qValues[i] > bestValue) {
                        bestValue = qValues[i];
                        bestAction = i;
                    }
                }

                return bestAction;
            }
        }

        // 存储经验
        public void remember(double[] state, int action, double reward,
                           double[] nextState, boolean done) {
            Experience experience = new Experience(state, action, reward, nextState, done);
            replayBuffer.add(experience);
        }

        // 训练
        public void train(int batchSize) {
            if (replayBuffer.size() < batchSize) {
                return;
            }

            List<Experience> batch = replayBuffer.sample(batchSize);
            qNetwork.trainStep(batch, targetNetwork, gamma, 0.001);

            // 更新目标网络
            updateCounter++;
            if (updateCounter % targetUpdateFreq == 0) {
                qNetwork.copyWeightsTo(targetNetwork);
                // 或者使用软更新
                // qNetwork.softUpdate(targetNetwork, 0.005);
            }
        }

        // 衰减ε
        public void decayEpsilon() {
            currentEpsilon = Math.max(minEpsilon, currentEpsilon * epsilonDecay);
        }

        public double getCurrentEpsilon() {
            return currentEpsilon;
        }
    }

    // 连续环境包装器
    public static class ContinuousEnvironment {
        private final Environment env;
        private final int stateSize;

        public ContinuousEnvironment(Environment env) {
            this.env = env;
            this.stateSize = env.getStateSpace();
        }

        public double[] reset() {
            int state = env.reset();
            return oneHotEncode(state);
        }

        public Environment.StepResult step(int action) {
            return env.step(action);
        }

        private double[] oneHotEncode(int state) {
            double[] encoded = new double[stateSize];
            encoded[state] = 1.0;
            return encoded;
        }

        public int getStateSize() {
            return stateSize;
        }

        public int getActionSize() {
            return env.getActionSpace();
        }
    }

    // 测试DQN
    public static void main(String[] args) {
        // 创建环境
        GridWorld env = new GridWorld(5, 5);
        ContinuousEnvironment continuousEnv = new ContinuousEnvironment(env);

        // 创建DQN Agent
        DQNAgent agent = new DQNAgent(
            continuousEnv.getStateSize(),  // state size
            continuousEnv.getActionSize(), // action size
            64,                           // hidden layer size
            0.001,                        // learning rate
            0.95,                         // gamma
            1.0,                          // epsilon
            0.995,                        // epsilon decay
            10000,                        // buffer size
            100                           // target update frequency
        );

        // 训练参数
        int numEpisodes = 1000;
        int batchSize = 32;
        int maxStepsPerEpisode = 200;

        System.out.println("开始DQN训练...");
        long startTime = System.currentTimeMillis();

        for (int episode = 0; episode < numEpisodes; episode++) {
            double[] state = continuousEnv.reset();
            double episodeReward = 0;
            int step = 0;
            boolean done = false;

            while (!done && step < maxStepsPerEpisode) {
                int action = agent.selectAction(state, true);
                Environment.StepResult stepResult = continuousEnv.step(action);

                double[] nextState = oneHotEncode(stepResult.nextState, continuousEnv.getStateSize());
                double reward = stepResult.reward;
                done = stepResult.done;

                agent.remember(state, action, reward, nextState, done);
                agent.train(batchSize);

                state = nextState;
                episodeReward += reward;
                step++;
            }

            agent.decayEpsilon();

            if ((episode + 1) % 100 == 0) {
                System.out.printf("Episode %d, Reward: %.2f, Epsilon: %.3f%n",
                                 episode + 1, episodeReward, agent.getCurrentEpsilon());
            }
        }

        long endTime = System.currentTimeMillis();
        System.out.printf("训练完成！总耗时: %.2f秒%n", (endTime - startTime) / 1000.0);

        // 测试训练结果
        System.out.println("\n开始测试...");
        double totalTestReward = 0;
        int numTestEpisodes = 10;

        for (int episode = 0; episode < numTestEpisodes; episode++) {
            double[] state = continuousEnv.reset();
            double episodeReward = 0;
            int step = 0;
            boolean done = false;

            while (!done && step < maxStepsPerEpisode) {
                int action = agent.selectAction(state, false); // 测试时不探索
                Environment.StepResult stepResult = continuousEnv.step(action);

                state = oneHotEncode(stepResult.nextState, continuousEnv.getStateSize());
                episodeReward += stepResult.reward;
                done = stepResult.done;
                step++;
            }

            totalTestReward += episodeReward;
            System.out.printf("Test Episode %d: Reward = %.2f, Steps = %d%n",
                             episode + 1, episodeReward, step);
        }

        System.out.printf("平均测试奖励: %.2f%n", totalTestReward / numTestEpisodes);
    }

    private static double[] oneHotEncode(int state, int size) {
        double[] encoded = new double[size];
        encoded[state] = 1.0;
        return encoded;
    }
}
```

### 题目3：策略梯度方法（REINFORCE）⭐⭐⭐⭐
**问题**：实现REINFORCE策略梯度算法，解决连续动作空间的控制问题。

**答案要点**：
1. 策略梯度的理论基础
2. 基线（baseline）的重要性
3. 策略网络的设计和训练

**核心代码示例**：

```java
import java.util.*;

/**
 * REINFORCE策略梯度算法实现
 */
public class ReinforceAlgorithm {

    // 策略网络
    public static class PolicyNetwork {
        private final int stateSize;
        private final int actionSize;
        private final int hiddenSize;

        // 网络参数
        private double[][] weights1; // [hiddenSize, stateSize]
        private double[] biases1;    // [hiddenSize]
        private double[][] weights2; // [actionSize, hiddenSize]
        private double[] biases2;    // [actionSize]

        private final double learningRate;

        public PolicyNetwork(int stateSize, int actionSize, int hiddenSize, double learningRate) {
            this.stateSize = stateSize;
            this.actionSize = actionSize;
            this.hiddenSize = hiddenSize;
            this.learningRate = learningRate;

            initializeParameters();
        }

        private void initializeParameters() {
            Random random = new Random();

            // 第一层参数
            weights1 = new double[hiddenSize][stateSize];
            biases1 = new double[hiddenSize];
            double scale1 = Math.sqrt(2.0 / stateSize);

            for (int i = 0; i < hiddenSize; i++) {
                for (int j = 0; j < stateSize; j++) {
                    weights1[i][j] = (random.nextGaussian()) * scale1;
                }
                biases1[i] = 0;
            }

            // 第二层参数
            weights2 = new double[actionSize][hiddenSize];
            biases2 = new double[actionSize];
            double scale2 = Math.sqrt(2.0 / hiddenSize);

            for (int i = 0; i < actionSize; i++) {
                for (int j = 0; j < hiddenSize; j++) {
                    weights2[i][j] = (random.nextGaussian()) * scale2;
                }
                biases2[i] = 0;
            }
        }

        // 前向传播 - 返回动作概率分布
        public double[] forward(double[] state) {
            double[] hidden = new double[hiddenSize];
            double[] output = new double[actionSize];

            // 第一层：线性变换 + ReLU激活
            for (int i = 0; i < hiddenSize; i++) {
                double sum = biases1[i];
                for (int j = 0; j < stateSize; j++) {
                    sum += weights1[i][j] * state[j];
                }
                hidden[i] = Math.max(0, sum); // ReLU
            }

            // 第二层：线性变换 + Softmax激活
            double[] logits = new double[actionSize];
            for (int i = 0; i < actionSize; i++) {
                double sum = biases2[i];
                for (int j = 0; j < hiddenSize; j++) {
                    sum += weights2[i][j] * hidden[j];
                }
                logits[i] = sum;
            }

            // Softmax
            return softmax(logits);
        }

        private double[] softmax(double[] logits) {
            double[] exp = new double[logits.length];
            double maxLogit = Arrays.stream(logits).max().orElse(0);

            for (int i = 0; i < logits.length; i++) {
                exp[i] = Math.exp(logits[i] - maxLogit);
            }

            double sum = Arrays.stream(exp).sum();
            double[] probs = new double[logits.length];

            for (int i = 0; i < logits.length; i++) {
                probs[i] = exp[i] / sum;
            }

            return probs;
        }

        // 采样动作
        public int sampleAction(double[] state) {
            double[] probs = forward(state);
            return sampleFromDistribution(probs);
        }

        private int sampleFromDistribution(double[] probs) {
            double randomValue = Math.random();
            double cumulativeProb = 0;

            for (int i = 0; i < probs.length; i++) {
                cumulativeProb += probs[i];
                if (randomValue <= cumulativeProb) {
                    return i;
                }
            }

            return probs.length - 1; // 备用返回
        }

        // 获取动作的对数概率
        public double getLogProbability(double[] state, int action) {
            double[] probs = forward(state);
            return Math.log(probs[action] + 1e-8); // 避免log(0)
        }

        // 策略梯度更新
        public void update(List<double[]> states, List<Integer> actions,
                          List<Double> rewards, double gamma) {
            // 计算折扣回报
            List<Double> discountedReturns = computeDiscountedReturns(rewards, gamma);

            // 标准化回报（作为基线）
            double meanReturn = discountedReturns.stream().mapToDouble(Double::doubleValue).average().orElse(0);
            double stdReturn = Math.sqrt(discountedReturns.stream()
                .mapToDouble(r -> Math.pow(r - meanReturn, 2))
                .average().orElse(1));

            // 更新每个时间步的策略
            for (int t = 0; t < states.size(); t++) {
                double[] state = states.get(t);
                int action = actions.get(t);
                double advantage = (discountedReturns.get(t) - meanReturn) / (stdReturn + 1e-8);

                // 策略梯度更新
                policyGradientStep(state, action, advantage);
            }
        }

        private List<Double> computeDiscountedReturns(List<Double> rewards, double gamma) {
            List<Double> returns = new ArrayList<>(rewards.size());
            double cumulativeReturn = 0;

            // 从后向前计算
            for (int i = rewards.size() - 1; i >= 0; i--) {
                cumulativeReturn = rewards.get(i) + gamma * cumulativeReturn;
                returns.add(0, cumulativeReturn);
            }

            return returns;
        }

        private void policyGradientStep(double[] state, int action, double advantage) {
            // 计算梯度并更新参数
            double[] hidden = new double[hiddenSize];

            // 前向传播，保存中间结果
            for (int i = 0; i < hiddenSize; i++) {
                double sum = biases1[i];
                for (int j = 0; j < stateSize; j++) {
                    sum += weights1[i][j] * state[j];
                }
                hidden[i] = Math.max(0, sum);
            }

            double[] logits = new double[actionSize];
            for (int i = 0; i < actionSize; i++) {
                double sum = biases2[i];
                for (int j = 0; j < hiddenSize; j++) {
                    sum += weights2[i][j] * hidden[j];
                }
                logits[i] = sum;
            }

            double[] probs = softmax(logits);

            // 计算梯度并更新第二层参数
            for (int i = 0; i < actionSize; i++) {
                double grad = (i == action ? 1 : 0) - probs[i]; // softmax梯度
                grad *= advantage;

                for (int j = 0; j < hiddenSize; j++) {
                    weights2[i][j] += learningRate * grad * hidden[j];
                }
                biases2[i] += learningRate * grad;
            }

            // 计算第一层梯度并更新参数
            double[] hiddenGradients = new double[hiddenSize];
            for (int j = 0; j < hiddenSize; j++) {
                double sum = 0;
                for (int i = 0; i < actionSize; i++) {
                    double grad = (i == action ? 1 : 0) - probs[i];
                    sum += grad * weights2[i][j];
                }
                sum *= advantage;

                // ReLU梯度
                hiddenGradients[j] = hidden[j] > 0 ? sum : 0;
            }

            // 更新第一层参数
            for (int i = 0; i < hiddenSize; i++) {
                for (int j = 0; j < stateSize; j++) {
                    weights1[i][j] += learningRate * hiddenGradients[i] * state[j];
                }
                biases1[i] += learningRate * hiddenGradients[i];
            }
        }
    }

    // REINFORCE Agent
    public static class ReinforceAgent {
        private final PolicyNetwork policyNetwork;
        private final double gamma;

        // 训练数据
        private final List<double[]> episodeStates;
        private final List<Integer> episodeActions;
        private final List<Double> episodeRewards;

        public ReinforceAgent(int stateSize, int actionSize, int hiddenSize,
                            double learningRate, double gamma) {
            this.policyNetwork = new PolicyNetwork(stateSize, actionSize, hiddenSize, learningRate);
            this.gamma = gamma;

            this.episodeStates = new ArrayList<>();
            this.episodeActions = new ArrayList<>();
            this.episodeRewards = new ArrayList<>();
        }

        public int selectAction(double[] state) {
            return policyNetwork.sampleAction(state);
        }

        public void storeTransition(double[] state, int action, double reward) {
            episodeStates.add(state.clone());
            episodeActions.add(action);
            episodeRewards.add(reward);
        }

        public void finishEpisode() {
            if (!episodeStates.isEmpty()) {
                policyNetwork.update(episodeStates, episodeActions, episodeRewards, gamma);
            }

            // 清空episode数据
            episodeStates.clear();
            episodeActions.clear();
            episodeRewards.clear();
        }
    }

    // 测试REINFORCE算法
    public static void main(String[] args) {
        // 创建环境
        GridWorld env = new GridWorld(4, 4);
        ContinuousEnvironment continuousEnv = new ContinuousEnvironment(env);

        // 创建REINFORCE Agent
        ReinforceAgent agent = new ReinforceAgent(
            continuousEnv.getStateSize(),
            continuousEnv.getActionSize(),
            64,    // hidden size
            0.01,  // learning rate
            0.99   // gamma
        );

        // 训练参数
        int numEpisodes = 2000;
        int maxStepsPerEpisode = 100;

        System.out.println("开始REINFORCE训练...");
        long startTime = System.currentTimeMillis();

        List<Double> rewardHistory = new ArrayList<>();

        for (int episode = 0; episode < numEpisodes; episode++) {
            double[] state = continuousEnv.reset();
            double episodeReward = 0;
            int step = 0;
            boolean done = false;

            while (!done && step < maxStepsPerEpisode) {
                int action = agent.selectAction(state);
                Environment.StepResult stepResult = continuousEnv.step(action);

                double[] nextState = oneHotEncode(stepResult.nextState, continuousEnv.getStateSize());
                double reward = stepResult.reward;
                done = stepResult.done;

                agent.storeTransition(state, action, reward);

                state = nextState;
                episodeReward += reward;
                step++;
            }

            agent.finishEpisode();
            rewardHistory.add(episodeReward);

            if ((episode + 1) % 100 == 0) {
                double avgReward = rewardHistory.subList(Math.max(0, episode - 99), episode + 1)
                    .stream().mapToDouble(Double::doubleValue).average().orElse(0);
                System.out.printf("Episode %d, Avg Reward (last 100): %.2f%n",
                                 episode + 1, avgReward);
            }
        }

        long endTime = System.currentTimeMillis();
        System.out.printf("训练完成！总耗时: %.2f秒%n", (endTime - startTime) / 1000.0);

        // 测试训练结果
        System.out.println("\n开始测试...");
        double totalTestReward = 0;
        int numTestEpisodes = 20;

        for (int episode = 0; episode < numTestEpisodes; episode++) {
            double[] state = continuousEnv.reset();
            double episodeReward = 0;
            int step = 0;
            boolean done = false;

            while (!done && step < maxStepsPerEpisode) {
                int action = agent.selectAction(state);
                Environment.StepResult stepResult = continuousEnv.step(action);

                state = oneHotEncode(stepResult.nextState, continuousEnv.getStateSize());
                episodeReward += stepResult.reward;
                done = stepResult.done;
                step++;
            }

            totalTestReward += episodeReward;
            System.out.printf("Test Episode %d: Reward = %.2f, Steps = %d%n",
                             episode + 1, episodeReward, step);
        }

        System.out.printf("平均测试奖励: %.2f%n", totalTestReward / numTestEpisodes);
    }

    private static double[] oneHotEncode(int state, int size) {
        double[] encoded = new double[size];
        encoded[state] = 1.0;
        return encoded;
    }

    // 重用之前定义的Environment接口和GridWorld类
    interface Environment {
        int reset();
        StepResult step(int action);
        int getStateSpace();
        int getActionSpace();

        class StepResult {
            public final int nextState;
            public final double reward;
            public final boolean done;

            public StepResult(int nextState, double reward, boolean done) {
                this.nextState = nextState;
                this.reward = reward;
                this.done = done;
            }
        }
    }

    static class GridWorld implements Environment {
        private final int width;
        private final int height;
        private int agentX, agentY;
        private int goalX, goalY;
        private final double[][] rewards;
        private final boolean[][] obstacles;
        private Random random = new Random();

        public GridWorld(int width, int height) {
            this.width = width;
            this.height = height;
            this.rewards = new double[width][height];
            this.obstacles = new boolean[width][height];
            initializeGrid();
        }

        private void initializeGrid() {
            for (int x = 0; x < width; x++) {
                for (int y = 0; y < height; y++) {
                    rewards[x][y] = -0.1;
                    obstacles[x][y] = false;
                }
            }

            goalX = width - 1;
            goalY = height - 1;
            rewards[goalX][goalY] = 10.0;

            int numObstacles = (width * height) / 8;
            for (int i = 0; i < numObstacles; i++) {
                int x = random.nextInt(width);
                int y = random.nextInt(height);
                if ((x != 0 || y != 0) && (x != goalX || y != goalY)) {
                    obstacles[x][y] = true;
                    rewards[x][y] = -1.0;
                }
            }
        }

        @Override
        public int reset() {
            agentX = 0;
            agentY = 0;
            return getState();
        }

        @Override
        public StepResult step(int action) {
            int newX = agentX;
            int newY = agentY;

            switch (action) {
                case 0: newY = Math.max(0, agentY - 1); break;
                case 1: newX = Math.min(width - 1, agentX + 1); break;
                case 2: newY = Math.min(height - 1, agentY + 1); break;
                case 3: newX = Math.max(0, agentX - 1); break;
            }

            if (!obstacles[newX][newY]) {
                agentX = newX;
                agentY = newY;
            }

            double reward = rewards[agentX][agentY];
            boolean done = (agentX == goalX && agentY == goalY);

            return new StepResult(getState(), reward, done);
        }

        private int getState() {
            return agentY * width + agentX;
        }

        @Override
        public int getStateSpace() {
            return width * height;
        }

        @Override
        public int getActionSpace() {
            return 4;
        }
    }

    static class ContinuousEnvironment {
        private final Environment env;
        private final int stateSize;

        public ContinuousEnvironment(Environment env) {
            this.env = env;
            this.stateSize = env.getStateSpace();
        }

        public double[] reset() {
            int state = env.reset();
            return oneHotEncode(state, stateSize);
        }

        public Environment.StepResult step(int action) {
            return env.step(action);
        }

        public int getStateSize() {
            return stateSize;
        }

        public int getActionSize() {
            return env.getActionSpace();
        }
    }
}
```

## 🎓 面试要点总结

### 关键概念
1. **强化学习基础**：MDP、状态、动作、奖励、策略
2. **价值函数**：Q值、V值、状态-动作价值函数
3. **策略方法**：ε-greedy、softmax、UCB
4. **算法对比**：Q-Learning vs DQN vs REINFORCE

### 技术深度
1. **数学基础**：贝尔曼方程、梯度下降、反向传播
2. **神经网络**：前向传播、激活函数、参数初始化
3. **优化技巧**：经验回放、目标网络、梯度裁剪
4. **稳定性**：学习率调度、探索策略、基线方法

### 实际应用场景
1. **游戏AI**：AlphaGo、Atari游戏、棋类游戏
2. **机器人控制**：导航、操作、运动控制
3. **资源调度**：负载均衡、资源配置、任务分配
4. **推荐系统**：个性化推荐、广告投放、内容优化

### 面试回答技巧
1. **算法理解**：深入理解各种强化学习算法的优缺点
2. **实践经验**：分享实际项目中的挑战和解决方案
3. **参数调优**：展示对超参数调优的理解和经验
4. **最新趋势**：了解Multi-Agent RL、Meta RL等前沿方向