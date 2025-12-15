# CNN架构与图像识别实战

## 🎯 面试题目

### 题目1：CNN基础架构设计与Java实现 ⭐⭐⭐⭐
**问题**：请设计一个完整的CNN架构，用于手写数字识别（MNIST数据集），并用Java实现卷积层、池化层和全连接层的核心算法。

**答案要点**：
1. CNN的基本组件：卷积层、激活函数、池化层、全连接层
2. 前向传播和反向传播算法
3. 参数初始化和优化策略

**核心原理**：
CNN通过局部感受野、权重共享和下采样来有效提取图像特征。卷积操作可以表示为：
```
output(i,j) = ΣΣ input(i+m,j+n) * kernel(m,n) + bias
```

**核心代码示例**：

```java
import java.util.Arrays;

/**
 * CNN核心组件实现
 */
public class CNNCore {

    // 卷积层实现
    public static class ConvLayer {
        private double[][][] kernels; // [kernelCount][kernelHeight][kernelWidth]
        private double[] biases;
        private int kernelSize;
        private int kernelCount;

        public ConvLayer(int kernelCount, int kernelSize) {
            this.kernelCount = kernelCount;
            this.kernelSize = kernelSize;
            this.kernels = new double[kernelCount][kernelSize][kernelSize];
            this.biases = new double[kernelCount];
            initializeKernels();
        }

        // Xavier初始化
        private void initializeKernels() {
            double scale = Math.sqrt(2.0 / (kernelSize * kernelSize));
            for (int k = 0; k < kernelCount; k++) {
                for (int i = 0; i < kernelSize; i++) {
                    for (int j = 0; j < kernelSize; j++) {
                        kernels[k][i][j] = (Math.random() - 0.5) * 2 * scale;
                    }
                }
                biases[k] = 0;
            }
        }

        // 卷积操作
        public double[][][] forward(double[][][] input) {
            int inputDepth = input.length;
            int inputHeight = input[0].length;
            int inputWidth = input[0][0].length;
            int outputHeight = inputHeight - kernelSize + 1;
            int outputWidth = inputWidth - kernelSize + 1;

            double[][][] output = new double[kernelCount][outputHeight][outputWidth];

            for (int k = 0; k < kernelCount; k++) {
                for (int i = 0; i < outputHeight; i++) {
                    for (int j = 0; j < outputWidth; j++) {
                        double sum = biases[k];

                        // 多通道卷积
                        for (int d = 0; d < inputDepth; d++) {
                            for (int m = 0; m < kernelSize; m++) {
                                for (int n = 0; n < kernelSize; n++) {
                                    sum += input[d][i + m][j + n] * kernels[k][m][n];
                                }
                            }
                        }

                        output[k][i][j] = sum;
                    }
                }
            }

            return output;
        }

        // ReLU激活函数
        public double[][][] relu(double[][][] input) {
            double[][][] output = new double[input.length][input[0].length][input[0][0].length];

            for (int k = 0; k < input.length; k++) {
                for (int i = 0; i < input[k].length; i++) {
                    for (int j = 0; j < input[k][i].length; j++) {
                        output[k][i][j] = Math.max(0, input[k][i][j]);
                    }
                }
            }

            return output;
        }
    }

    // 最大池化层
    public static class MaxPoolLayer {
        private int poolSize;
        private int stride;

        public MaxPoolLayer(int poolSize, int stride) {
            this.poolSize = poolSize;
            this.stride = stride;
        }

        public double[][][] forward(double[][][] input) {
            int depth = input.length;
            int inputHeight = input[0].length;
            int inputWidth = input[0][0].length;
            int outputHeight = (inputHeight - poolSize) / stride + 1;
            int outputWidth = (inputWidth - poolSize) / stride + 1;

            double[][][] output = new double[depth][outputHeight][outputWidth];

            for (int d = 0; d < depth; d++) {
                for (int i = 0; i < outputHeight; i++) {
                    for (int j = 0; j < outputWidth; j++) {
                        double max = Double.NEGATIVE_INFINITY;

                        for (int m = 0; m < poolSize; m++) {
                            for (int n = 0; n < poolSize; n++) {
                                int row = i * stride + m;
                                int col = j * stride + n;
                                max = Math.max(max, input[d][row][col]);
                            }
                        }

                        output[d][i][j] = max;
                    }
                }
            }

            return output;
        }
    }

    // 全连接层
    public static class FullyConnectedLayer {
        private double[][] weights;
        private double[] biases;
        private int inputSize;
        private int outputSize;

        public FullyConnectedLayer(int inputSize, int outputSize) {
            this.inputSize = inputSize;
            this.outputSize = outputSize;
            this.weights = new double[outputSize][inputSize];
            this.biases = new double[outputSize];
            initializeWeights();
        }

        private void initializeWeights() {
            double scale = Math.sqrt(2.0 / inputSize);
            for (int i = 0; i < outputSize; i++) {
                for (int j = 0; j < inputSize; j++) {
                    weights[i][j] = (Math.random() - 0.5) * 2 * scale;
                }
                biases[i] = 0;
            }
        }

        public double[] forward(double[] input) {
            double[] output = new double[outputSize];

            for (int i = 0; i < outputSize; i++) {
                double sum = biases[i];
                for (int j = 0; j < inputSize; j++) {
                    sum += input[j] * weights[i][j];
                }
                output[i] = sum;
            }

            return output;
        }

        // Softmax激活函数
        public double[] softmax(double[] input) {
            double[] exp = new double[input.length];
            double sum = 0;

            // 数值稳定性：减去最大值
            double max = Arrays.stream(input).max().orElse(0);
            for (int i = 0; i < input.length; i++) {
                exp[i] = Math.exp(input[i] - max);
                sum += exp[i];
            }

            double[] output = new double[input.length];
            for (int i = 0; i < input.length; i++) {
                output[i] = exp[i] / sum;
            }

            return output;
        }
    }

    // 简单的CNN网络
    public static class SimpleCNN {
        private ConvLayer conv1;
        private MaxPoolLayer pool1;
        private ConvLayer conv2;
        private MaxPoolLayer pool2;
        private FullyConnectedLayer fc1;
        private FullyConnectedLayer fc2;

        public SimpleCNN() {
            // 输入: 1x28x28 (MNIST)
            conv1 = new ConvLayer(32, 3); // 输出: 32x26x26
            pool1 = new MaxPoolLayer(2, 2); // 输出: 32x13x13
            conv2 = new ConvLayer(64, 3); // 输出: 64x11x11
            pool2 = new MaxPoolLayer(2, 2); // 输出: 64x5x5
            fc1 = new FullyConnectedLayer(64 * 5 * 5, 128);
            fc2 = new FullyConnectedLayer(128, 10); // 10个类别
        }

        public double[] predict(double[][][] input) {
            // 前向传播
            double[][][] conv1_out = conv1.forward(input);
            double[][][] relu1_out = conv1.relu(conv1_out);
            double[][][] pool1_out = pool1.forward(relu1_out);

            double[][][] conv2_out = conv2.forward(pool1_out);
            double[][][] relu2_out = conv2.relu(conv2_out);
            double[][][] pool2_out = pool2.forward(relu2_out);

            // 展平
            double[] flattened = flatten(pool2_out);

            double[] fc1_out = fc1.forward(flattened);
            double[] relu3_out = relu(fc1_out);

            double[] fc2_out = fc2.forward(relu3_out);
            double[] softmax_out = fc2.softmax(fc2_out);

            return softmax_out;
        }

        private double[] relu(double[] input) {
            double[] output = new double[input.length];
            for (int i = 0; i < input.length; i++) {
                output[i] = Math.max(0, input[i]);
            }
            return output;
        }

        private double[] flatten(double[][][] input) {
            int size = input.length * input[0].length * input[0][0].length;
            double[] output = new double[size];
            int index = 0;

            for (int d = 0; d < input.length; d++) {
                for (int i = 0; i < input[d].length; i++) {
                    for (int j = 0; j < input[d][i].length; j++) {
                        output[index++] = input[d][i][j];
                    }
                }
            }

            return output;
        }
    }

    // 测试示例
    public static void main(String[] args) {
        SimpleCNN cnn = new SimpleCNN();

        // 创建一个模拟的MNIST输入 (1x28x28)
        double[][][] input = new double[1][28][28];
        for (int i = 0; i < 28; i++) {
            for (int j = 0; j < 28; j++) {
                input[0][i][j] = Math.random();
            }
        }

        // 预测
        double[] output = cnn.predict(input);

        System.out.println("预测结果:");
        for (int i = 0; i < output.length; i++) {
            System.out.printf("类别 %d: %.4f%n", i, output[i]);
        }

        // 找到最大概率的类别
        int predictedClass = 0;
        double maxProb = output[0];
        for (int i = 1; i < output.length; i++) {
            if (output[i] > maxProb) {
                maxProb = output[i];
                predictedClass = i;
            }
        }

        System.out.printf("预测类别: %d, 置信度: %.4f%n", predictedClass, maxProb);
    }
}
```

### 题目2：高级CNN架构设计 ⭐⭐⭐⭐⭐
**问题**：设计并实现ResNet残差连接机制，解决深度网络中的梯度消失问题。

**答案要点**：
1. 残差块的设计原理
2. 跳跃连接的实现
3. 批量归一化的重要性

**核心代码示例**：

```java
import java.util.Arrays;

/**
 * ResNet残差块实现
 */
public class ResNetBlock {

    // 批量归一化层
    public static class BatchNorm {
        private double[] gamma;
        private double[] beta;
        private double[] runningMean;
        private double[] runningVar;
        private double epsilon = 1e-8;
        private double momentum = 0.9;

        public BatchNorm(int size) {
            this.gamma = new double[size];
            this.beta = new double[size];
            this.runningMean = new double[size];
            this.runningVar = new double[size];

            // 初始化
            Arrays.fill(gamma, 1.0);
            Arrays.fill(beta, 0.0);
        }

        public double[] forward(double[] input, boolean training) {
            double[] output = new double[input.length];

            if (training) {
                // 计算均值
                double mean = Arrays.stream(input).average().orElse(0);

                // 计算方差
                double var = Arrays.stream(input)
                    .map(x -> Math.pow(x - mean, 2))
                    .average()
                    .orElse(0);

                // 更新运行均值和方差
                for (int i = 0; i < runningMean.length; i++) {
                    runningMean[i] = momentum * runningMean[i] + (1 - momentum) * mean;
                    runningVar[i] = momentum * runningVar[i] + (1 - momentum) * var;
                }

                // 归一化
                for (int i = 0; i < input.length; i++) {
                    double normalized = (input[i] - mean) / Math.sqrt(var + epsilon);
                    output[i] = gamma[i] * normalized + beta[i];
                }
            } else {
                // 使用运行均值和方差
                for (int i = 0; i < input.length; i++) {
                    double normalized = (input[i] - runningMean[i]) /
                                      Math.sqrt(runningVar[i] + epsilon);
                    output[i] = gamma[i] * normalized + beta[i];
                }
            }

            return output;
        }
    }

    // 残差块
    public static class ResidualBlock {
        private ConvLayer conv1;
        private ConvLayer conv2;
        private BatchNorm bn1;
        private BatchNorm bn2;

        public ResidualBlock(int channels, int kernelSize) {
            this.conv1 = new ConvLayer(channels, kernelSize);
            this.conv2 = new ConvLayer(channels, kernelSize);
            this.bn1 = new BatchNorm(channels);
            this.bn2 = new BatchNorm(channels);
        }

        public double[][][] forward(double[][][] input) {
            // 保存原始输入用于跳跃连接
            double[][][] identity = input.clone();

            // 第一个卷积层
            double[][][] conv1_out = conv1.forward(input);
            double[][][] bn1_out = applyBatchNorm(conv1_out, bn1);
            double[][][] relu1_out = relu(bn1_out);

            // 第二个卷积层
            double[][][] conv2_out = conv2.forward(relu1_out);
            double[][][] bn2_out = applyBatchNorm(conv2_out, bn2);

            // 跳跃连接
            double[][][] output = addSkipConnection(bn2_out, identity);

            // 最后的ReLU
            return relu(output);
        }

        private double[][][] applyBatchNorm(double[][][] input, BatchNorm bn) {
            double[][][] output = new double[input.length][input[0].length][input[0][0].length];

            for (int d = 0; d < input.length; d++) {
                // 将每个通道的数据展平为一维数组进行批量归一化
                double[] flatChannel = flattenChannel(input, d);
                double[] normalized = bn.forward(flatChannel, true);

                // 重新构建为原始形状
                output[d] = reshapeTo2D(normalized, input[0].length, input[0][0].length);
            }

            return output;
        }

        private double[] flattenChannel(double[][][] input, int channel) {
            double[] flat = new double[input[0].length * input[0][0].length];
            int index = 0;
            for (int i = 0; i < input[channel].length; i++) {
                for (int j = 0; j < input[channel][i].length; j++) {
                    flat[index++] = input[channel][i][j];
                }
            }
            return flat;
        }

        private double[][] reshapeTo2D(double[] flat, int height, int width) {
            double[][] matrix = new double[height][width];
            int index = 0;
            for (int i = 0; i < height; i++) {
                for (int j = 0; j < width; j++) {
                    matrix[i][j] = flat[index++];
                }
            }
            return matrix;
        }

        private double[][][] addSkipConnection(double[][][] featureMap, double[][][] identity) {
            double[][][] output = new double[featureMap.length][featureMap[0].length][featureMap[0][0].length];

            for (int d = 0; d < featureMap.length; d++) {
                for (int i = 0; i < featureMap[d].length; i++) {
                    for (int j = 0; j < featureMap[d][i].length; j++) {
                        output[d][i][j] = featureMap[d][i][j] + identity[d][i][j];
                    }
                }
            }

            return output;
        }

        private double[][][] relu(double[][][] input) {
            double[][][] output = new double[input.length][input[0].length][input[0][0].length];

            for (int d = 0; d < input.length; d++) {
                for (int i = 0; i < input[d].length; i++) {
                    for (int j = 0; j < input[d][i].length; j++) {
                        output[d][i][j] = Math.max(0, input[d][i][j]);
                    }
                }
            }

            return output;
        }
    }

    // 重用之前的ConvLayer
    public static class ConvLayer {
        private double[][][] kernels;
        private double[] biases;
        private int kernelSize;
        private int kernelCount;

        public ConvLayer(int kernelCount, int kernelSize) {
            this.kernelCount = kernelCount;
            this.kernelSize = kernelSize;
            this.kernels = new double[kernelCount][kernelSize][kernelSize];
            this.biases = new double[kernelCount];
            initializeKernels();
        }

        private void initializeKernels() {
            double scale = Math.sqrt(2.0 / (kernelSize * kernelSize));
            for (int k = 0; k < kernelCount; k++) {
                for (int i = 0; i < kernelSize; i++) {
                    for (int j = 0; j < kernelSize; j++) {
                        kernels[k][i][j] = (Math.random() - 0.5) * 2 * scale;
                    }
                }
                biases[k] = 0;
            }
        }

        public double[][][] forward(double[][][] input) {
            int inputDepth = input.length;
            int inputHeight = input[0].length;
            int inputWidth = input[0][0].length;
            int outputHeight = inputHeight - kernelSize + 1;
            int outputWidth = inputWidth - kernelSize + 1;

            double[][][] output = new double[kernelCount][outputHeight][outputWidth];

            for (int k = 0; k < kernelCount; k++) {
                for (int i = 0; i < outputHeight; i++) {
                    for (int j = 0; j < outputWidth; j++) {
                        double sum = biases[k];

                        for (int d = 0; d < inputDepth; d++) {
                            for (int m = 0; m < kernelSize; m++) {
                                for (int n = 0; n < kernelSize; n++) {
                                    sum += input[d][i + m][j + n] * kernels[k][m][n];
                                }
                            }
                        }

                        output[k][i][j] = sum;
                    }
                }
            }

            return output;
        }
    }
}
```

### 题目3：图像预处理与数据增强 ⭐⭐⭐
**问题**：实现图像预处理管道，包括归一化、裁剪、旋转、翻转等数据增强技术。

**答案要点**：
1. 图像预处理的重要性和常用技术
2. 数据增强的策略和实现
3. 性能优化的考虑

**核心代码示例**：

```java
import java.awt.*;
import java.awt.image.BufferedImage;
import java.awt.geom.AffineTransform;
import java.util.Random;

/**
 * 图像预处理与数据增强
 */
public class ImageAugmentation {

    private Random random = new Random();

    // 图像预处理类
    public static class ImageProcessor {

        // 图像归一化
        public double[][][] normalize(BufferedImage image, double mean, double std) {
            int width = image.getWidth();
            int height = image.getHeight();
            double[][][] normalized = new double[3][height][width];

            for (int y = 0; y < height; y++) {
                for (int x = 0; x < width; x++) {
                    Color color = new Color(image.getRGB(x, y));

                    // RGB通道归一化
                    normalized[0][y][x] = (color.getRed() / 255.0 - mean) / std;
                    normalized[1][y][x] = (color.getGreen() / 255.0 - mean) / std;
                    normalized[2][y][x] = (color.getBlue() / 255.0 - mean) / std;
                }
            }

            return normalized;
        }

        // 图像尺寸调整
        public BufferedImage resize(BufferedImage image, int targetWidth, int targetHeight) {
            BufferedImage resized = new BufferedImage(targetWidth, targetHeight, BufferedImage.TYPE_INT_RGB);
            Graphics2D g2d = resized.createGraphics();

            // 使用高质量插值
            g2d.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
            g2d.drawImage(image, 0, 0, targetWidth, targetHeight, null);
            g2d.dispose();

            return resized;
        }

        // 中心裁剪
        public BufferedImage centerCrop(BufferedImage image, int cropWidth, int cropHeight) {
            int width = image.getWidth();
            int height = image.getHeight();
            int x = (width - cropWidth) / 2;
            int y = (height - cropHeight) / 2;

            return image.getSubimage(x, y, cropWidth, cropHeight);
        }

        // 随机裁剪
        public BufferedImage randomCrop(BufferedImage image, int cropWidth, int cropHeight) {
            int width = image.getWidth();
            int height = image.getHeight();

            if (cropWidth >= width && cropHeight >= height) {
                return image;
            }

            int x = random.nextInt(Math.max(1, width - cropWidth + 1));
            int y = random.nextInt(Math.max(1, height - cropHeight + 1));

            return image.getSubimage(x, y, cropWidth, cropHeight);
        }
    }

    // 数据增强类
    public static class DataAugmentation {

        // 随机水平翻转
        public BufferedImage horizontalFlip(BufferedImage image) {
            int width = image.getWidth();
            int height = image.getHeight();
            BufferedImage flipped = new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB);

            for (int y = 0; y < height; y++) {
                for (int x = 0; x < width; x++) {
                    int rgb = image.getRGB(x, y);
                    flipped.setRGB(width - 1 - x, y, rgb);
                }
            }

            return flipped;
        }

        // 随机旋转
        public BufferedImage rotate(BufferedImage image, double angle) {
            double radians = Math.toRadians(angle);
            int width = image.getWidth();
            int height = image.getHeight();

            // 计算旋转后的图像大小
            double sin = Math.abs(Math.sin(radians));
            double cos = Math.abs(Math.cos(radians));
            int newWidth = (int) (width * cos + height * sin);
            int newHeight = (int) (width * sin + height * cos);

            BufferedImage rotated = new BufferedImage(newWidth, newHeight, BufferedImage.TYPE_INT_RGB);
            Graphics2D g2d = rotated.createGraphics();

            // 设置旋转中心
            AffineTransform transform = new AffineTransform();
            transform.translate((newWidth - width) / 2.0, (newHeight - height) / 2.0);
            transform.rotate(radians, width / 2.0, height / 2.0);

            g2d.setTransform(transform);
            g2d.drawImage(image, 0, 0, null);
            g2d.dispose();

            return rotated;
        }

        // 随机旋转（-30度到30度）
        public BufferedImage randomRotate(BufferedImage image) {
            double angle = (random.nextDouble() - 0.5) * 60; // -30到30度
            return rotate(image, angle);
        }

        // 亮度调整
        public BufferedImage adjustBrightness(BufferedImage image, double factor) {
            int width = image.getWidth();
            int height = image.getHeight();
            BufferedImage adjusted = new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB);

            for (int y = 0; y < height; y++) {
                for (int x = 0; x < width; x++) {
                    Color color = new Color(image.getRGB(x, y));

                    int red = Math.min(255, Math.max(0, (int) (color.getRed() * factor)));
                    int green = Math.min(255, Math.max(0, (int) (color.getGreen() * factor)));
                    int blue = Math.min(255, Math.max(0, (int) (color.getBlue() * factor)));

                    adjusted.setRGB(x, y, new Color(red, green, blue).getRGB());
                }
            }

            return adjusted;
        }

        // 随机亮度调整
        public BufferedImage randomBrightness(BufferedImage image) {
            double factor = 0.7 + random.nextDouble() * 0.6; // 0.7到1.3
            return adjustBrightness(image, factor);
        }

        // 对比度调整
        public BufferedImage adjustContrast(BufferedImage image, double factor) {
            int width = image.getWidth();
            int height = image.getHeight();
            BufferedImage adjusted = new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB);

            // 计算平均亮度
            long totalBrightness = 0;
            for (int y = 0; y < height; y++) {
                for (int x = 0; x < width; x++) {
                    Color color = new Color(image.getRGB(x, y));
                    totalBrightness += color.getRed() + color.getGreen() + color.getBlue();
                }
            }
            double avgBrightness = totalBrightness / (3.0 * width * height);

            for (int y = 0; y < height; y++) {
                for (int x = 0; x < width; x++) {
                    Color color = new Color(image.getRGB(x, y));

                    int red = Math.min(255, Math.max(0,
                        (int) ((color.getRed() - avgBrightness) * factor + avgBrightness)));
                    int green = Math.min(255, Math.max(0,
                        (int) ((color.getGreen() - avgBrightness) * factor + avgBrightness)));
                    int blue = Math.min(255, Math.max(0,
                        (int) ((color.getBlue() - avgBrightness) * factor + avgBrightness)));

                    adjusted.setRGB(x, y, new Color(red, green, blue).getRGB());
                }
            }

            return adjusted;
        }

        // 随机对比度调整
        public BufferedImage randomContrast(BufferedImage image) {
            double factor = 0.7 + random.nextDouble() * 0.6; // 0.7到1.3
            return adjustContrast(image, factor);
        }

        // 高斯噪声
        public BufferedImage addGaussianNoise(BufferedImage image, double std) {
            int width = image.getWidth();
            int height = image.getHeight();
            BufferedImage noisy = new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB);

            for (int y = 0; y < height; y++) {
                for (int x = 0; x < width; x++) {
                    Color color = new Color(image.getRGB(x, y));

                    // 生成高斯噪声
                    double noiseR = random.nextGaussian() * std;
                    double noiseG = random.nextGaussian() * std;
                    double noiseB = random.nextGaussian() * std;

                    int red = Math.min(255, Math.max(0,
                        (int) (color.getRed() + noiseR * 255)));
                    int green = Math.min(255, Math.max(0,
                        (int) (color.getGreen() + noiseG * 255)));
                    int blue = Math.min(255, Math.max(0,
                        (int) (color.getBlue() + noiseB * 255)));

                    noisy.setRGB(x, y, new Color(red, green, blue).getRGB());
                }
            }

            return noisy;
        }
    }

    // 完整的数据增强管道
    public static class AugmentationPipeline {
        private ImageProcessor processor;
        private DataAugmentation augmentation;
        private Random random = new Random();

        public AugmentationPipeline() {
            this.processor = new ImageProcessor();
            this.augmentation = new DataAugmentation();
        }

        // 应用随机数据增强
        public BufferedImage augment(BufferedImage image,
                                   boolean enableFlip, boolean enableRotate,
                                   boolean enableBrightness, boolean enableContrast,
                                   boolean enableNoise) {

            BufferedImage result = image;

            // 随机水平翻转 (50%概率)
            if (enableFlip && random.nextBoolean()) {
                result = augmentation.horizontalFlip(result);
            }

            // 随机旋转 (70%概率)
            if (enableRotate && random.nextDouble() < 0.7) {
                result = augmentation.randomRotate(result);
                // 重新调整到原始大小（可选）
                result = processor.resize(result, image.getWidth(), image.getHeight());
            }

            // 随机亮度调整 (50%概率)
            if (enableBrightness && random.nextBoolean()) {
                result = augmentation.randomBrightness(result);
            }

            // 随机对比度调整 (50%概率)
            if (enableContrast && random.nextBoolean()) {
                result = augmentation.randomContrast(result);
            }

            // 添加噪声 (30%概率)
            if (enableNoise && random.nextDouble() < 0.3) {
                result = augmentation.addGaussianNoise(result, 0.05);
            }

            return result;
        }

        // 批量数据增强
        public BufferedImage[] batchAugment(BufferedImage image, int batchSize) {
            BufferedImage[] augmented = new BufferedImage[batchSize];

            for (int i = 0; i < batchSize; i++) {
                augmented[i] = augment(image, true, true, true, true, true);
            }

            return augmented;
        }
    }

    // 测试示例
    public static void main(String[] args) {
        // 这里应该加载实际图像，为了演示使用空白图像
        BufferedImage image = new BufferedImage(224, 224, BufferedImage.TYPE_INT_RGB);

        AugmentationPipeline pipeline = new AugmentationPipeline();

        // 数据预处理
        ImageProcessor processor = new ImageProcessor();
        BufferedImage resized = processor.resize(image, 224, 224);
        BufferedImage cropped = processor.centerCrop(resized, 224, 224);

        // 归一化
        double[][][] normalized = processor.normalize(cropped, 0.5, 0.5);

        // 数据增强
        BufferedImage augmented = pipeline.augment(cropped, true, true, true, true, true);

        // 批量增强
        BufferedImage[] batchAugmented = pipeline.batchAugment(cropped, 8);

        System.out.println("图像预处理和数据增强完成！");
        System.out.println("原始图像尺寸: " + image.getWidth() + "x" + image.getHeight());
        System.out.println("归一化后数据维度: [" + normalized.length + ", " +
                         normalized[0].length + ", " + normalized[0][0].length + "]");
        System.out.println("批量增强生成了 " + batchAugmented.length + " 个增强样本");
    }
}
```

## 🎓 面试要点总结

### 关键概念
1. **CNN核心组件**：卷积层、池化层、全连接层、激活函数
2. **高级架构**：ResNet、Inception、DenseNet等
3. **数据预处理**：归一化、数据增强、图像变换
4. **优化技巧**：批量归一化、跳跃连接、残差学习

### 技术深度
1. **数学理解**：卷积运算、反向传播、梯度计算
2. **架构设计**：深度、宽度、感受野、参数效率
3. **性能优化**：内存管理、计算效率、并行化
4. **实践应用**：过拟合防止、数据增强、迁移学习

### 实际应用场景
1. **图像分类**：MNIST、CIFAR、ImageNet等
2. **目标检测**：YOLO、Faster R-CNN、SSD等
3. **图像分割**：U-Net、Mask R-CNN、DeepLab等
4. **实际项目**：人脸识别、医学影像、自动驾驶等

### 面试回答技巧
1. **从基础到高级**：先讲清楚基本概念，再深入技术细节
2. **代码实现**：能够手写关键算法，理解底层原理
3. **实践经验**：结合实际项目经验，说明遇到的问题和解决方案
4. **技术趋势**：了解最新的CNN架构和优化技术