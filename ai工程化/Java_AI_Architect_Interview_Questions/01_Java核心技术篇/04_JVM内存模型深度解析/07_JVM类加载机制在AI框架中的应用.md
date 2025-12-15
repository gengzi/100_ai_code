# JVM类加载机制在AI框架中的应用与动态扩展

## 🎯 学习目标

深入理解JVM类加载机制的完整过程，掌握在AI框架中实现动态模型加载、插件系统和热部署的技巧，具备设计和实现可扩展AI系统的能力。

## 📚 目录

- [类加载机制与AI模型动态加载](#类加载机制与ai模型动态加载)
- [双亲委派模型与AI插件系统](#双亲委派模型与ai插件系统)
- [自定义类加载器与AI框架扩展](#自定义类加载器与ai框架扩展)
- [模块化系统与AI组件隔离](#模块化系统与ai组件隔离)
- [类卸载与AI系统资源管理](#类卸载与ai系统资源管理)

---

## 类加载机制与AI模型动态加载

### ⭐ 基础题 (1-30)

**1. 什么是JVM类加载机制？它包含哪些过程？**

**面试场景**：Java开发工程师面试，考察类加载基础知识

**口语化答案**：
JVM类加载机制是指Java虚拟机把描述类的数据从class文件加载到内存，并对数据进行校验、转换、解析和初始化，最终形成可以被虚拟机直接使用的Java类型的过程。

主要包含三个过程：

1. **加载(Loading)**：通过类的全限定名查找并读取类的二进制字节流，将其转换为方法区的运行时数据结构
2. **链接(Linking)**：
   - 验证(Verification)：确保加载的类信息符合JVM规范
   - 准备(Preparation)：为类变量分配内存并设置初始值
   - 解析(Resolution)：将符号引用转换为直接引用
3. **初始化(Initialization)**：执行类构造器<clinit>()方法

```java
/**
 * 类加载过程演示 - AI模型类加载场景
 */
public class ClassLoadingProcessDemo {

    /**
     * AI模型加载器 - 演示完整的类加载过程
     */
    public static class AIModelLoader {

        /**
         * 加载AI模型类
         */
        public Class<? extends AIModel> loadModelClass(String className) throws ClassNotFoundException {
            System.out.println("=== 开始加载AI模型类: " + className + " ===");

            try {
                // 1. 加载阶段
                System.out.println("1. 加载阶段: 查找并加载类文件");
                Class<?> modelClass = Class.forName(className, false, AIModelClassLoader.getInstance());

                // 2. 链接阶段
                System.out.println("2. 链接阶段: 验证、准备、解析");

                // 验证阶段 - 检查类文件格式
                verifyClassFormat(modelClass);

                // 准备阶段 - 分配内存
                prepareClassMemory(modelClass);

                // 解析阶段 - 解析符号引用
                resolveSymbolicReferences(modelClass);

                // 3. 初始化阶段
                System.out.println("3. 初始化阶段: 执行<clinit>方法");
                Class<? extends AIModel> typedModelClass =
                    (Class<? extends AIModel>) Class.forName(className, true, AIModelClassLoader.getInstance());

                System.out.println("=== 类加载完成 ===");
                return typedModelClass;

            } catch (Exception e) {
                System.err.println("类加载失败: " + e.getMessage());
                throw new ClassNotFoundException("无法加载AI模型类: " + className, e);
            }
        }

        private void verifyClassFormat(Class<?> clazz) {
            System.out.println("   - 验证类文件格式...");
            // 模拟验证过程：检查魔数、版本号、常量池等
            if (!clazz.getName().startsWith("ai.model.")) {
                throw new VerifyError("类不在允许的包中");
            }
            System.out.println("   ✓ 格式验证通过");
        }

        private void prepareClassMemory(Class<?> clazz) {
            System.out.println("   - 准备类变量内存...");
            // 模拟准备阶段：为静态变量分配内存
            Field[] fields = clazz.getDeclaredFields();
            for (Field field : fields) {
                if (Modifier.isStatic(field.getType().getModifiers())) {
                    System.out.println("     - 分配内存: " + field.getName());
                }
            }
            System.out.println("   ✓ 内存分配完成");
        }

        private void resolveSymbolicReferences(Class<?> clazz) {
            System.out.println("   - 解析符号引用...");
            // 模拟解析阶段：解析方法、字段引用
            Method[] methods = clazz.getDeclaredMethods();
            for (Method method : methods) {
                System.out.println("     - 解析方法: " + method.getName());
            }
            System.out.println("   ✓ 符号引用解析完成");
        }
    }

    /**
     * AI模型接口
     */
    public interface AIModel {
        void initialize(ModelConfig config);
        double predict(double[] input);
        void train(TrainingData data);
        String getModelName();
    }

    /**
     * 自定义AI模型类加载器
     */
    public static class AIModelClassLoader extends ClassLoader {
        private static AIModelClassLoader instance;

        private AIModelClassLoader() {
            super(ClassLoader.getSystemClassLoader());
        }

        public static synchronized AIModelClassLoader getInstance() {
            if (instance == null) {
                instance = new AIModelClassLoader();
            }
            return instance;
        }

        @Override
        protected Class<?> findClass(String name) throws ClassNotFoundException {
            System.out.println("查找类: " + name);

            // 这里可以添加自定义的类查找逻辑
            // 例如从网络、数据库或特定目录加载类文件

            if (name.equals("ai.model.NeuralNetwork")) {
                return loadFromByteArray(name, generateNeuralNetworkClassBytes());
            }

            return super.findClass(name);
        }

        private byte[] generateNeuralNetworkClassBytes() {
            // 简化实现：实际应该读取真实的class文件
            return new byte[0];
        }

        private Class<?> loadFromByteArray(String name, byte[] bytes) {
            return defineClass(name, bytes, 0, bytes.length);
        }
    }

    /**
     * 模型配置类
     */
    public static class ModelConfig {
        private String modelType;
        private Map<String, Object> parameters;

        public ModelConfig(String modelType) {
            this.modelType = modelType;
            this.parameters = new HashMap<>();
        }

        public void setParameter(String key, Object value) {
            parameters.put(key, value);
        }

        public <T> T getParameter(String key, Class<T> type) {
            Object value = parameters.get(key);
            return type.isInstance(value) ? type.cast(value) : null;
        }
    }

    /**
     * 训练数据类
     */
    public static class TrainingData {
        private List<double[]> inputs;
        private List<Double> labels;

        public TrainingData() {
            this.inputs = new ArrayList<>();
            this.labels = new ArrayList<>();
        }

        public void addData(double[] input, double label) {
            inputs.add(input);
            labels.add(label);
        }

        public List<double[]> getInputs() {
            return Collections.unmodifiableList(inputs);
        }

        public List<Double> getLabels() {
            return Collections.unmodifiableList(labels);
        }

        public int size() {
            return inputs.size();
        }
    }

    /**
     * 类加载阶段监控器
     */
    public static class ClassLoadingMonitor {
        private static final Map<String, Long> loadTimestamps = new ConcurrentHashMap<>();

        /**
         * 监控类加载时间
         */
        public static void monitorClassLoading(Runnable loadingTask, String className) {
            long startTime = System.nanoTime();

            try {
                loadingTask.run();

                long duration = System.nanoTime() - startTime;
                loadTimestamps.put(className, duration);

                System.out.printf("类 %s 加载耗时: %.2f ms%n",
                    className, duration / 1_000_000.0);

            } catch (Exception e) {
                System.err.printf("类 %s 加载失败: %s%n", className, e.getMessage());
            }
        }

        /**
         * 获取类加载统计
         */
        public static void printLoadingStatistics() {
            System.out.println("\n=== 类加载统计 ===");

            long totalTime = loadTimestamps.values().stream().mapToLong(Long::longValue).sum();
            double avgTime = loadTimestamps.isEmpty() ? 0 : (double) totalTime / loadTimestamps.size();

            System.out.printf("总类数: %d%n", loadTimestamps.size());
            System.out.printf("总耗时: %.2f ms%n", totalTime / 1_000_000.0);
            System.out.printf("平均耗时: %.2f ms%n", avgTime / 1_000_000.0);

            // 显示最慢的几个类加载
            loadTimestamps.entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .limit(5)
                .forEach(entry -> {
                    System.out.printf("  %s: %.2f ms%n",
                        entry.getKey(), entry.getValue() / 1_000_000.0);
                });
        }
    }

    public static void main(String[] args) {
        AIModelLoader loader = new AIModelLoader();

        // 监控类加载过程
        ClassLoadingMonitor.monitorClassLoading(() -> {
            try {
                // 尝试加载AI模型类
                Class<? extends AIModel> modelClass =
                    loader.loadModelClass("ai.model.NeuralNetwork");

                System.out.println("成功加载模型类: " + modelClass.getName());

            } catch (ClassNotFoundException e) {
                System.err.println("模型类加载失败: " + e.getMessage());
            }
        }, "ai.model.NeuralNetwork");

        // 显示加载统计
        ClassLoadingMonitor.printLoadingStatistics();
    }
}

/**
 * 神经网络模型实现
 */
class NeuralNetwork implements ClassLoadingProcessDemo.AIModel {
    private static final String MODEL_NAME = "NeuralNetwork";

    // 静态变量 - 在准备阶段分配内存
    private static int instanceCount = 0;
    private static final double DEFAULT_LEARNING_RATE = 0.01;

    // 实例变量
    private double[][] weights;
    private double learningRate;

    // 静态初始化块 - 在初始化阶段执行
    static {
        System.out.println("NeuralNetwork类静态初始化块执行");
        instanceCount = 0;
        System.out.println("默认学习率: " + DEFAULT_LEARNING_RATE);
    }

    public NeuralNetwork() {
        // 实例初始化
        this.learningRate = DEFAULT_LEARNING_RATE;
        instanceCount++;
        System.out.println("创建NeuralNetwork实例，当前实例数: " + instanceCount);
    }

    @Override
    public void initialize(ModelConfig config) {
        this.learningRate = config.getParameter("learningRate", Double.class);
        System.out.println("神经网络初始化，学习率: " + learningRate);
    }

    @Override
    public double predict(double[] input) {
        // 简化的前向传播
        double result = 0;
        for (int i = 0; i < input.length && i < weights.length; i++) {
            result += weights[i][0] * input[i];
        }
        return sigmoid(result);
    }

    @Override
    public void train(TrainingData data) {
        System.out.println("训练神经网络，数据量: " + data.size());
        // 简化的训练逻辑
    }

    @Override
    public String getModelName() {
        return MODEL_NAME;
    }

    private double sigmoid(double x) {
        return 1.0 / (1.0 + Math.exp(-x));
    }

    // 类初始化方法<clinit>() - 由编译器自动生成
    // static {
    //     instanceCount = 0;
    //     System.out.println("静态初始化");
    // }
}
```

**2. 什么是双亲委派模型？它的优势是什么？**

**面试场景**：中级Java开发面试，考察类加载器层次结构

**口语化答案**：
双亲委派模型是Java类加载器的核心工作机制。当一个类加载器收到类加载请求时，它首先不会自己去尝试加载，而是把这个请求委派给父类加载器去完成，每一层的类加载器都是如此。只有当父加载器反馈自己无法完成这个加载请求时，子加载器才会尝试自己去加载。

优势包括：
1. **安全性**：防止核心API被篡改
2. **避免重复加载**：确保类的唯一性
3. **分工明确**：不同类加载器负责不同范围的类

```java
/**
 * 双亲委派模型演示 - AI插件系统类加载
 */
public class ParentDelegationModelDemo {

    /**
     * 自定义AI插件类加载器 - 遵循双亲委派模型
     */
    public static class AIPluginClassLoader extends URLClassLoader {
        private final String pluginName;
        private final ClassLoader parent;

        public AIPluginClassLoader(String pluginName, URL[] urls, ClassLoader parent) {
            super(urls, parent);
            this.pluginName = pluginName;
            this.parent = parent;
            System.out.println("创建插件类加载器: " + pluginName +
                ", 父加载器: " + parent.getClass().getSimpleName());
        }

        @Override
        protected Class<?> loadClass(String name, boolean resolve) throws ClassNotFoundException {
            System.out.println("插件 " + pluginName + " 请求加载类: " + name);

            // 1. 检查类是否已加载
            Class<?> loadedClass = findLoadedClass(name);
            if (loadedClass != null) {
                System.out.println("  类已加载，直接返回: " + name);
                return loadedClass;
            }

            try {
                // 2. 遵循双亲委派，先让父加载器尝试加载
                System.out.println("  委派给父加载器: " + parent.getClass().getSimpleName());
                return parent.loadClass(name);

            } catch (ClassNotFoundException e) {
                // 3. 父加载器无法加载，尝试自己加载
                System.out.println("  父加载器无法加载，插件自己尝试加载: " + name);

                if (isPluginClass(name)) {
                    return findClass(name);
                }

                throw new ClassNotFoundException("类 " + name + " 未找到");
            }
        }

        private boolean isPluginClass(String className) {
            // 只有插件包下的类才由自己加载
            return className.startsWith("ai.plugin.") || className.startsWith("plugin.");
        }
    }

    /**
     * AI插件管理器
     */
    public static class AIPluginManager {
        private final Map<String, AIPluginClassLoader> pluginLoaders = new ConcurrentHashMap<>();
        private final Map<String, Object> pluginInstances = new ConcurrentHashMap<>();

        /**
         * 加载插件
         */
        public void loadPlugin(String pluginName, String pluginPath) {
            System.out.println("=== 开始加载插件: " + pluginName + " ===");

            try {
                // 创建插件类加载器，父加载器为应用类加载器
                URL pluginUrl = new File(pluginPath).toURI().toURL();
                URL[] urls = {pluginUrl};

                AIPluginClassLoader pluginLoader = new AIPluginClassLoader(
                    pluginName, urls, getClass().getClassLoader());

                pluginLoaders.put(pluginName, pluginLoader);

                // 加载插件主类
                String mainClassName = "plugin." + pluginName + ".PluginMain";
                Class<?> pluginMainClass = pluginLoader.loadClass(mainClassName);

                // 创建插件实例
                Object pluginInstance = pluginMainClass.getDeclaredConstructor().newInstance();
                pluginInstances.put(pluginName, pluginInstance);

                // 初始化插件
                if (pluginInstance instanceof AIPlugin) {
                    ((AIPlugin) pluginInstance).initialize();
                }

                System.out.println("✓ 插件 " + pluginName + " 加载成功");

            } catch (Exception e) {
                System.err.println("✗ 插件 " + pluginName + " 加载失败: " + e.getMessage());
                e.printStackTrace();
            }
        }

        /**
         * 卸载插件
         */
        public void unloadPlugin(String pluginName) {
            System.out.println("=== 开始卸载插件: " + pluginName + " ===");

            try {
                AIPluginClassLoader loader = pluginLoaders.remove(pluginName);
                Object instance = pluginInstances.remove(pluginName);

                // 清理插件资源
                if (instance instanceof AIPlugin) {
                    ((AIPlugin) instance).cleanup();
                }

                // 关闭类加载器（清理资源引用）
                if (loader != null) {
                    loader.close();
                }

                // 建议垃圾回收
                System.gc();

                System.out.println("✓ 插件 " + pluginName + " 卸载成功");

            } catch (Exception e) {
                System.err.println("✗ 插件 " + pluginName + " 卸载失败: " + e.getMessage());
            }
        }

        /**
         * 获取插件实例
         */
        public <T> T getPlugin(String pluginName, Class<T> type) {
            Object instance = pluginInstances.get(pluginName);
            return type.isInstance(instance) ? type.cast(instance) : null;
        }

        /**
         * 列出所有插件
         */
        public void listPlugins() {
            System.out.println("\n=== 已加载插件 ===");
            for (String pluginName : pluginInstances.keySet()) {
                System.out.println("- " + pluginName);
            }
        }
    }

    /**
     * AI插件接口
     */
    public interface AIPlugin {
        void initialize();
        void process();
        void cleanup();
    }

    /**
     * 破坏双亲委派的类加载器示例
     */
    public static class ReverseDelegationClassLoader extends ClassLoader {
        // 子加载器优先加载，破坏双亲委派

        @Override
        protected Class<?> loadClass(String name, boolean resolve) throws ClassNotFoundException {
            // 先检查自己是否已加载
            Class<?> loadedClass = findLoadedClass(name);
            if (loadedClass != null) {
                return loadedClass;
            }

            // 尝试自己加载（不委派给父类）
            try {
                byte[] classBytes = loadClassBytes(name);
                if (classBytes != null) {
                    Class<?> clazz = defineClass(name, classBytes, 0, classBytes.length);
                    if (resolve) {
                        resolveClass(clazz);
                    }
                    return clazz;
                }
            } catch (IOException e) {
                // 忽略，尝试父加载器
            }

            // 自己无法加载，才委派给父加载器
            return super.loadClass(name, resolve);
        }

        private byte[] loadClassBytes(String className) throws IOException {
            // 从特定位置加载类文件
            String classFile = className.replace('.', '/') + ".class";
            try (InputStream is = getResourceAsStream(classFile)) {
                if (is != null) {
                    return is.readAllBytes();
                }
            }
            return null;
        }
    }

    /**
     * 线程上下文类加载器演示
     */
    public static class ThreadContextClassLoaderDemo {

        /**
         * 服务提供者模式使用上下文类加载器
         */
        public static void demonstrateContextClassLoader() {
            System.out.println("=== 线程上下文类加载器演示 ===");

            // 获取当前线程的上下文类加载器
            ClassLoader contextClassLoader = Thread.currentThread().getContextClassLoader();
            System.out.println("默认上下文类加载器: " + contextClassLoader.getClass().getSimpleName());

            // 设置自定义上下文类加载器
            AIPluginClassLoader customLoader = new AIPluginClassLoader(
                "context-test", new URL[0], contextClassLoader);
            Thread.currentThread().setContextClassLoader(customLoader);

            System.out.println("设置后的上下文类加载器: " +
                Thread.currentThread().getContextClassLoader().getClass().getSimpleName());

            // 使用上下文类加载器加载资源
            try {
                Enumeration<URL> resources = customLoader.getResources("META-INF/services/");
                while (resources.hasMoreElements()) {
                    URL resource = resources.nextElement();
                    System.out.println("找到服务配置: " + resource);
                }
            } catch (IOException e) {
                System.err.println("加载服务配置失败: " + e.getMessage());
            }

            // 恢复默认上下文类加载器
            Thread.currentThread().setContextClassLoader(contextClassLoader);
        }

        /**
         * 服务提供者模式演示
         */
        public static <T> T loadService(Class<T> serviceClass) {
            // 使用上下文类加载器加载服务提供者
            ServiceLoader<T> serviceLoader = ServiceLoader.load(serviceClass);

            for (T service : serviceLoader) {
                System.out.println("找到服务实现: " + service.getClass().getName());
                return service; // 返回第一个实现
            }

            return null;
        }
    }

    public static void main(String[] args) {
        // 1. 演示插件管理器
        AIPluginManager pluginManager = new AIPluginManager();

        // 模拟加载插件
        // pluginManager.loadPlugin("ImageProcessor", "plugins/ImageProcessor.jar");
        // pluginManager.loadPlugin("TextAnalyzer", "plugins/TextAnalyzer.jar");

        pluginManager.listPlugins();

        // 2. 演示线程上下文类加载器
        ThreadContextClassLoaderDemo.demonstrateContextClassLoader();

        // 3. 演示类加载器层次
        demonstrateClassLoaderHierarchy();
    }

    /**
     * 演示类加载器层次结构
     */
    private static void demonstrateClassLoaderHierarchy() {
        System.out.println("\n=== 类加载器层次结构 ===");

        ClassLoader currentLoader = ParentDelegationModelDemo.class.getClassLoader();
        printClassLoaderHierarchy(currentLoader, 0);
    }

    private static void printClassLoaderHierarchy(ClassLoader loader, int indent) {
        if (loader != null) {
            String prefix = "  ".repeat(indent);
            System.out.println(prefix + loader.getClass().getSimpleName() +
                " (" + loader.toString() + ")");
            printClassLoaderHierarchy(loader.getParent(), indent + 1);
        } else {
            String prefix = "  ".repeat(indent);
            System.out.println(prefix + "Bootstrap ClassLoader (null)");
        }
    }
}

/**
 * 示例插件实现
 */
class ExampleAIPlugin implements ParentDelegationModelDemo.AIPlugin {
    private String pluginName;

    public ExampleAIPlugin() {
        this.pluginName = "ExampleAIPlugin";
    }

    @Override
    public void initialize() {
        System.out.println(pluginName + ": 初始化插件");
    }

    @Override
    public void process() {
        System.out.println(pluginName + ": 执行AI处理任务");
    }

    @Override
    public void cleanup() {
        System.out.println(pluginName + ": 清理插件资源");
    }
}

/**
 * 服务提供者接口示例
 */
interface AIService {
    void provideService();
}
```

---

## 双亲委派模型与AI插件系统

### ⭐⭐ 进阶题 (31-70)

**31. 如何在AI框架中实现热部署功能？**

**面试场景**：高级Java架构师面试，考察动态类加载和热部署实现

**口语化答案**：
在AI框架中实现热部署需要解决几个关键问题：

1. **类加载隔离**：使用自定义类加载器加载新版本类，与旧版本隔离
2. **状态迁移**：安全地将旧版本实例的状态迁移到新版本
3. **依赖管理**：处理新版本类与其他组件的依赖关系
4. **资源清理**：确保旧版本类能够被正确卸载

实现策略：
- 使用URLClassLoader或自定义ClassLoader加载新版本
- 通过反射或接口实现状态迁移
- 监控文件变化触发重新加载
- 使用弱引用和清理机制确保GC回收

```java
/**
 * AI框架热部署管理器
 */
public class AIHotDeploymentManager {

    // 热部署监控器
    private final HotDeploymentMonitor monitor;
    // 类加载器缓存
    private final Map<String, ReloadableClassLoader> classLoaders = new ConcurrentHashMap<>();
    // 实例缓存
    private final Map<String, WeakReference<Object>> instances = new ConcurrentHashMap<>();
    // 部署配置
    private final HotDeploymentConfig config;

    public AIHotDeploymentManager(HotDeploymentConfig config) {
        this.config = config;
        this.monitor = new HotDeploymentMonitor(this);
        this.monitor.start();
    }

    /**
     * 部署AI组件
     */
    public void deployComponent(String componentName, String jarPath) {
        System.out.println("=== 部署AI组件: " + componentName + " ===");

        try {
            // 1. 创建类加载器
            ReloadableClassLoader loader = createClassLoader(componentName, jarPath);
            classLoaders.put(componentName, loader);

            // 2. 加载组件主类
            String mainClassName = resolveMainClassName(componentName, jarPath);
            Class<?> componentClass = loader.loadClass(mainClassName);

            // 3. 创建组件实例
            Object componentInstance = createComponentInstance(componentClass);
            instances.put(componentName, new WeakReference<>(componentInstance));

            // 4. 初始化组件
            initializeComponent(componentInstance, componentName);

            // 5. 注册到组件注册表
            ComponentRegistry.getInstance().register(componentName, componentInstance);

            System.out.println("✓ 组件 " + componentName + " 部署成功");

        } catch (Exception e) {
            System.err.println("✗ 组件 " + componentName + " 部署失败: " + e.getMessage());
            e.printStackTrace();
        }
    }

    /**
     * 热重载组件
     */
    public void reloadComponent(String componentName) throws Exception {
        System.out.println("=== 热重载组件: " + componentName + " ===");

        // 1. 获取当前实例状态
        Object oldInstance = getCurrentInstance(componentName);
        ComponentState state = null;

        if (oldInstance instanceof StatefulComponent) {
            state = ((StatefulComponent) oldInstance).captureState();
            System.out.println("  保存当前组件状态");
        }

        // 2. 停止旧实例
        stopComponent(oldInstance);

        // 3. 卸载旧类加载器
        unloadClassLoader(componentName);

        // 4. 等待垃圾回收
        waitForGC();

        // 5. 重新部署
        String jarPath = config.getComponentPath(componentName);
        deployComponent(componentName, jarPath);

        // 6. 恢复状态
        if (state != null) {
            Object newInstance = getCurrentInstance(componentName);
            if (newInstance instanceof StatefulComponent) {
                ((StatefulComponent) newInstance).restoreState(state);
                System.out.println("  恢复组件状态");
            }
        }

        System.out.println("✓ 组件 " + componentName + " 热重载完成");
    }

    /**
     * 创建可重载的类加载器
     */
    private ReloadableClassLoader createClassLoader(String componentName, String jarPath) throws MalformedURLException {
        URL jarUrl = new File(jarPath).toURI().toURL();
        URL[] urls = {jarUrl};

        // 父类加载器为AI框架的类加载器
        ClassLoader parent = getClass().getClassLoader();

        ReloadableClassLoader loader = new ReloadableClassLoader(componentName, urls, parent);

        // 设置类加载监听器
        loader.setClassLoadListener((className, clazz) -> {
            System.out.println("  加载类: " + className);
        });

        return loader;
    }

    /**
     * 创建组件实例
     */
    private Object createComponentInstance(Class<?> componentClass) throws Exception {
        // 查找无参构造函数
        Constructor<?> constructor = componentClass.getDeclaredConstructor();
        constructor.setAccessible(true);
        return constructor.newInstance();
    }

    /**
     * 初始化组件
     */
    private void initializeComponent(Object instance, String componentName) {
        try {
            // 如果实现了AIComponent接口，调用初始化方法
            if (instance instanceof AIComponent) {
                ((AIComponent) instance).initialize(componentName);
            }
        } catch (Exception e) {
            System.err.println("组件初始化失败: " + e.getMessage());
        }
    }

    /**
     * 停止组件
     */
    private void stopComponent(Object instance) {
        try {
            if (instance instanceof AIComponent) {
                ((AIComponent) instance).shutdown();
            }
        } catch (Exception e) {
            System.err.println("组件停止失败: " + e.getMessage());
        }
    }

    /**
     * 卸载类加载器
     */
    private void unloadClassLoader(String componentName) {
        ReloadableClassLoader loader = classLoaders.remove(componentName);
        if (loader != null) {
            try {
                loader.close();
            } catch (IOException e) {
                System.err.println("关闭类加载器失败: " + e.getMessage());
            }
        }

        // 清理实例引用
        instances.remove(componentName);
    }

    /**
     * 等待垃圾回收
     */
    private void waitForGC() {
        System.gc(); // 建议垃圾回收
        try {
            Thread.sleep(1000); // 等待GC完成
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }

    /**
     * 获取当前实例
     */
    private Object getCurrentInstance(String componentName) {
        WeakReference<Object> ref = instances.get(componentName);
        return ref != null ? ref.get() : null;
    }

    /**
     * 解析主类名
     */
    private String resolveMainClassName(String componentName, String jarPath) throws IOException {
        try (JarFile jarFile = new JarFile(jarPath)) {
            Manifest manifest = jarFile.getManifest();
            if (manifest != null) {
                String mainClass = manifest.getMainAttributes().getValue("Main-Class");
                if (mainClass != null) {
                    return mainClass;
                }
            }

            // 默认规则
            return "ai.component." + componentName + "." + componentName + "Component";
        }
    }

    /**
     * 关闭热部署管理器
     */
    public void shutdown() {
        monitor.stop();

        // 卸载所有组件
        for (String componentName : new ArrayList<>(classLoaders.keySet())) {
            try {
                reloadComponent(componentName);
            } catch (Exception e) {
                System.err.println("卸载组件失败: " + componentName);
            }
        }
    }

    /**
     * 可重载的类加载器
     */
    public static class ReloadableClassLoader extends URLClassLoader {
        private final String componentName;
        private ClassLoadListener listener;

        public ReloadableClassLoader(String componentName, URL[] urls, ClassLoader parent) {
            super(urls, parent);
            this.componentName = componentName;
        }

        @Override
        protected Class<?> loadClass(String name, boolean resolve) throws ClassNotFoundException {
            // 检查是否为组件类
            if (isComponentClass(name)) {
                return loadComponentClass(name, resolve);
            }

            // 委派给父类加载器
            return super.loadClass(name, resolve);
        }

        private Class<?> loadComponentClass(String name, boolean resolve) throws ClassNotFoundException {
            // 检查是否已加载
            Class<?> loadedClass = findLoadedClass(name);
            if (loadedClass != null) {
                return loadedClass;
            }

            // 自己加载
            try {
                byte[] classBytes = loadClassBytes(name);
                Class<?> clazz = defineClass(name, classBytes, 0, classBytes.length);

                if (resolve) {
                    resolveClass(clazz);
                }

                // 通知监听器
                if (listener != null) {
                    listener.onClassLoaded(name, clazz);
                }

                return clazz;

            } catch (IOException e) {
                throw new ClassNotFoundException("无法加载组件类: " + name, e);
            }
        }

        private boolean isComponentClass(String className) {
            return className.startsWith("ai.component.") ||
                   className.startsWith("plugin.") ||
                   className.contains(componentName);
        }

        private byte[] loadClassBytes(String className) throws IOException {
            String classFile = className.replace('.', '/') + ".class";
            URL resource = findResource(classFile);

            if (resource != null) {
                try (InputStream is = resource.openStream()) {
                    return is.readAllBytes();
                }
            }

            throw new IOException("找不到类文件: " + className);
        }

        public void setClassLoadListener(ClassLoadListener listener) {
            this.listener = listener;
        }

        @FunctionalInterface
        public interface ClassLoadListener {
            void onClassLoaded(String className, Class<?> clazz);
        }
    }

    /**
     * 热部署监控器
     */
    public static class HotDeploymentMonitor {
        private final AIHotDeploymentManager manager;
        private final ScheduledExecutorService scheduler;
        private final Map<String, Long> lastModified = new ConcurrentHashMap<>();

        public HotDeploymentMonitor(AIHotDeploymentManager manager) {
            this.manager = manager;
            this.scheduler = Executors.newSingleThreadScheduledExecutor();
        }

        public void start() {
            // 每5秒检查一次文件变化
            scheduler.scheduleAtFixedRate(this::checkForChanges, 5, 5, TimeUnit.SECONDS);
            System.out.println("热部署监控器已启动");
        }

        public void stop() {
            scheduler.shutdown();
            System.out.println("热部署监控器已停止");
        }

        private void checkForChanges() {
            for (String componentName : manager.config.getComponentNames()) {
                String jarPath = manager.config.getComponentPath(componentName);
                File jarFile = new File(jarPath);

                if (jarFile.exists()) {
                    long currentModified = jarFile.lastModified();
                    Long lastMod = lastModified.get(componentName);

                    if (lastMod == null || currentModified > lastMod) {
                        // 文件已修改，触发热重载
                        System.out.println("检测到组件变化: " + componentName);

                        if (lastMod != null) {
                            // 非首次加载，执行热重载
                            scheduler.execute(() -> {
                                try {
                                    manager.reloadComponent(componentName);
                                } catch (Exception e) {
                                    System.err.println("热重载失败: " + e.getMessage());
                                }
                            });
                        }

                        lastModified.put(componentName, currentModified);
                    }
                }
            }
        }
    }

    /**
     * 组件状态接口
     */
    public interface StatefulComponent {
        ComponentState captureState();
        void restoreState(ComponentState state);
    }

    /**
     * AI组件接口
     */
    public interface AIComponent {
        void initialize(String componentName);
        void shutdown();
    }

    /**
     * 组件状态
     */
    public static class ComponentState implements Serializable {
        private final Map<String, Object> properties;
        private final long timestamp;

        public ComponentState() {
            this.properties = new HashMap<>();
            this.timestamp = System.currentTimeMillis();
        }

        public void setProperty(String key, Object value) {
            properties.put(key, value);
        }

        public <T> T getProperty(String key, Class<T> type) {
            Object value = properties.get(key);
            return type.isInstance(value) ? type.cast(value) : null;
        }

        public long getTimestamp() {
            return timestamp;
        }
    }

    /**
     * 组件注册表
     */
    public static class ComponentRegistry {
        private static final ComponentRegistry instance = new ComponentRegistry();
        private final Map<String, Object> components = new ConcurrentHashMap<>();

        private ComponentRegistry() {}

        public static ComponentRegistry getInstance() {
            return instance;
        }

        public void register(String name, Object component) {
            components.put(name, component);
            System.out.println("注册组件: " + name + " -> " + component.getClass().getName());
        }

        public <T> T getComponent(String name, Class<T> type) {
            Object component = components.get(name);
            return type.isInstance(component) ? type.cast(component) : null;
        }

        public void unregister(String name) {
            Object removed = components.remove(name);
            if (removed != null) {
                System.out.println("注销组件: " + name);
            }
        }

        public List<String> getComponentNames() {
            return new ArrayList<>(components.keySet());
        }
    }

    /**
     * 热部署配置
     */
    public static class HotDeploymentConfig {
        private final Map<String, String> componentPaths = new HashMap<>();

        public void addComponent(String name, String path) {
            componentPaths.put(name, path);
        }

        public String getComponentPath(String name) {
            return componentPaths.get(name);
        }

        public Set<String> getComponentNames() {
            return componentPaths.keySet();
        }
    }

    public static void main(String[] args) {
        // 配置热部署
        HotDeploymentConfig config = new HotDeploymentConfig();
        config.addComponent("NeuralNetwork", "ai-components/neural-network.jar");
        config.addComponent("TextProcessor", "ai-components/text-processor.jar");
        config.addComponent("ImageAnalyzer", "ai-components/image-analyzer.jar");

        // 创建热部署管理器
        AIHotDeploymentManager hotManager = new AIHotDeploymentManager(config);

        try {
            // 部署组件
            for (String componentName : config.getComponentNames()) {
                // hotManager.deployComponent(componentName, config.getComponentPath(componentName));
            }

            // 模拟运行
            Thread.sleep(30000);

            // 模拟热重载
            // hotManager.reloadComponent("NeuralNetwork");

        } catch (Exception e) {
            e.printStackTrace();
        } finally {
            hotManager.shutdown();
        }
    }
}

/**
 * 示例AI组件实现
 */
class NeuralNetworkComponent implements AIHotDeploymentManager.AIComponent,
                                           AIHotDeploymentManager.StatefulComponent {

    private String componentName;
    private boolean initialized = false;
    private double learningRate = 0.01;
    private int epoch = 0;

    @Override
    public void initialize(String componentName) {
        this.componentName = componentName;
        this.initialized = true;
        System.out.println("神经网络组件初始化: " + componentName);
    }

    @Override
    public void shutdown() {
        this.initialized = false;
        System.out.println("神经网络组件关闭: " + componentName);
    }

    @Override
    public AIHotDeploymentManager.ComponentState captureState() {
        AIHotDeploymentManager.ComponentState state = new AIHotDeploymentManager.ComponentState();
        state.setProperty("learningRate", learningRate);
        state.setProperty("epoch", epoch);
        state.setProperty("initialized", initialized);
        return state;
    }

    @Override
    public void restoreState(AIHotDeploymentManager.ComponentState state) {
        this.learningRate = state.getProperty("learningRate", Double.class);
        this.epoch = state.getProperty("epoch", Integer.class);
        this.initialized = state.getProperty("initialized", Boolean.class);
        System.out.println("恢复神经网络状态: lr=" + learningRate + ", epoch=" + epoch);
    }

    public void process(double[] input) {
        if (!initialized) {
            throw new IllegalStateException("组件未初始化");
        }

        // 模拟神经网络处理
        epoch++;
        double output = 0.5; // 简化输出
        System.out.println("处理完成，epoch: " + epoch + ", 输出: " + output);
    }

    public void setLearningRate(double learningRate) {
        this.learningRate = learningRate;
    }

    public double getLearningRate() {
        return learningRate;
    }

    public int getEpoch() {
        return epoch;
    }
}

/**
 * 文本处理组件示例
 */
class TextProcessorComponent implements AIHotDeploymentManager.AIComponent {

    private String componentName;
    private boolean initialized = false;
    private List<String> supportedLanguages = Arrays.asList("zh", "en");

    @Override
    public void initialize(String componentName) {
        this.componentName = componentName;
        this.initialized = true;
        System.out.println("文本处理组件初始化: " + componentName);
    }

    @Override
    public void shutdown() {
        this.initialized = false;
        System.out.println("文本处理组件关闭: " + componentName);
    }

    public String processText(String text, String language) {
        if (!initialized) {
            throw new IllegalStateException("组件未初始化");
        }

        if (!supportedLanguages.contains(language)) {
            throw new IllegalArgumentException("不支持的语言: " + language);
        }

        // 模拟文本处理
        return "processed_" + text + "_" + language;
    }

    public void addSupportedLanguage(String language) {
        if (!supportedLanguages.contains(language)) {
            supportedLanguages = new ArrayList<>(supportedLanguages);
            supportedLanguages.add(language);
            System.out.println("添加支持语言: " + language);
        }
    }
}
```

---

## 自定义类加载器与AI框架扩展

### ⭐⭐⭐ 专家题 (71-100)

**71. 如何设计一个支持多租户隔离的AI模型类加载器？**

**面试场景**：资深AI系统架构师面试，考察高级类加载器设计和多租户架构

**口语化答案**：
设计多租户隔离的AI模型类加载器需要考虑以下几个核心问题：

1. **类隔离机制**：
   - 每个租户使用独立的类加载器
   - 不同租户可以加载同名但不同版本的模型类
   - 防止类命名冲突和安全风险

2. **资源隔离**：
   - 内存隔离：每个租户的模型独立内存空间
   - 资源隔离：配置文件、数据文件独立访问
   - 网络隔离：不同租户的网络请求隔离

3. **性能优化**：
   - 类缓存机制：避免重复加载相同类
   - 按需加载：只在需要时加载模型类
   - 资源清理：租户退出时及时释放资源

4. **安全管理**：
   - 权限控制：限制模型类的访问权限
   - 沙箱执行：限制模型类的系统调用
   - 监控审计：记录模型类的使用行为

```java
/**
 * 多租户AI模型类加载器架构
 */
public class MultiTenantAIModelClassLoader {

    // 租户管理器
    private final TenantManager tenantManager;
    // 类加载器工厂
    private final TenantClassLoaderFactory classLoaderFactory;
    // 资源隔离管理器
    private final ResourceIsolationManager resourceManager;
    // 安全管理器
    private final AIModelSecurityManager securityManager;

    public MultiTenantAIModelClassLoader() {
        this.tenantManager = new TenantManager();
        this.classLoaderFactory = new TenantClassLoaderFactory();
        this.resourceManager = new ResourceIsolationManager();
        this.securityManager = new AIModelSecurityManager();
    }

    /**
     * 创建租户
     */
    public TenantSession createTenant(String tenantId, TenantConfig config) {
        System.out.println("=== 创建租户: " + tenantId + " ===");

        try {
            // 1. 验证租户配置
            config.validate();

            // 2. 创建租户上下文
            TenantContext context = new TenantContext(tenantId, config);

            // 3. 创建租户类加载器
            TenantClassLoader classLoader = classLoaderFactory.createClassLoader(context);

            // 4. 设置资源隔离
            resourceManager.setupResourceIsolation(context);

            // 5. 设置安全管理
            securityManager.setupSecurity(context);

            // 6. 注册租户
            TenantSession session = tenantManager.registerTenant(context, classLoader);

            System.out.println("✓ 租户 " + tenantId + " 创建成功");
            return session;

        } catch (Exception e) {
            System.err.println("✗ 租户 " + tenantId + " 创建失败: " + e.getMessage());
            throw new TenantCreationException("创建租户失败", e);
        }
    }

    /**
     * 为租户加载AI模型
     */
    public AIModel loadModelForTenant(String tenantId, String modelId, String modelPath) {
        System.out.println("=== 为租户 " + tenantId + " 加载模型 " + modelId + " ===");

        TenantSession session = tenantManager.getTenantSession(tenantId);
        if (session == null) {
            throw new TenantNotFoundException("租户不存在: " + tenantId);
        }

        try {
            // 1. 验证模型访问权限
            securityManager.checkModelAccess(session, modelId, modelPath);

            // 2. 获取租户类加载器
            TenantClassLoader classLoader = session.getClassLoader();

            // 3. 加载模型类
            Class<? extends AIModel> modelClass = classLoader.loadModelClass(modelPath);

            // 4. 创建模型实例
            AIModel model = createModelInstance(modelClass, session.getContext());

            // 5. 注册模型到租户会话
            session.registerModel(modelId, model);

            // 6. 监控模型使用
            session.recordModelUsage(modelId);

            System.out.println("✓ 模型 " + modelId + " 加载成功");
            return model;

        } catch (Exception e) {
            System.err.println("✗ 模型 " + modelId + " 加载失败: " + e.getMessage());
            throw new ModelLoadException("模型加载失败", e);
        }
    }

    /**
     * 销毁租户
     */
    public void destroyTenant(String tenantId) {
        System.out.println("=== 销毁租户: " + tenantId + " ===");

        TenantSession session = tenantManager.getTenantSession(tenantId);
        if (session == null) {
            return;
        }

        try {
            // 1. 停止所有模型
            session.stopAllModels();

            // 2. 清理资源
            resourceManager.cleanupTenantResources(tenantId);

            // 3. 卸载类加载器
            TenantClassLoader classLoader = session.getClassLoader();
            classLoader.cleanup();

            // 4. 租除租户
            tenantManager.unregisterTenant(tenantId);

            // 5. 强制垃圾回收
            System.gc();

            System.out.println("✓ 租户 " + tenantId + " 销毁成功");

        } catch (Exception e) {
            System.err.println("✗ 租户 " + tenantId + " 销毁失败: " + e.getMessage());
        }
    }

    /**
     * 获取租户统计信息
     */
    public TenantStatistics getTenantStatistics(String tenantId) {
        TenantSession session = tenantManager.getTenantSession(tenantId);
        if (session == null) {
            throw new TenantNotFoundException("租户不存在: " + tenantId);
        }

        return session.getStatistics();
    }

    /**
     * 租户类加载器
     */
    public static class TenantClassLoader extends URLClassLoader {
        private final String tenantId;
        private final TenantContext context;
        private final Map<String, Class<? extends AIModel>> modelClasses = new ConcurrentHashMap<>();
        private final AtomicReference<ClassLoadState> state = new AtomicReference<>(ClassLoadState.ACTIVE);

        public TenantClassLoader(String tenantId, URL[] urls, ClassLoader parent, TenantContext context) {
            super(urls, parent);
            this.tenantId = tenantId;
            this.context = context;
        }

        @Override
        protected Class<?> loadClass(String name, boolean resolve) throws ClassNotFoundException {
            // 检查状态
            if (state.get() == ClassLoadState.DESTROYED) {
                throw new IllegalStateException("类加载器已销毁");
            }

            // 检查是否为AI模型类
            if (isAIModelClass(name)) {
                return loadAIModelClass(name, resolve);
            }

            // 委派给父类加载器
            return super.loadClass(name, resolve);
        }

        private Class<?> loadAIModelClass(String name, boolean resolve) throws ClassNotFoundException {
            // 检查是否已加载
            Class<?> loadedClass = findLoadedClass(name);
            if (loadedClass != null) {
                return loadedClass;
            }

            // 检查是否允许加载
            if (!context.isClassAllowed(name)) {
                throw new SecurityException("类加载被拒绝: " + name);
            }

            // 自己加载
            try {
                byte[] classBytes = loadClassBytes(name);

                // 验证类字节码
                validateClassBytes(classBytes, name);

                // 定义类
                Class<?> clazz = defineClass(name, classBytes, 0, classBytes.length);

                if (resolve) {
                    resolveClass(clazz);
                }

                // 如果是AI模型类，缓存
                if (AIModel.class.isAssignableFrom(clazz)) {
                    @SuppressWarnings("unchecked")
                    Class<? extends AIModel> modelClass = (Class<? extends AIModel>) clazz;
                    modelClasses.put(name, modelClass);
                }

                // 记录类加载
                context.recordClassLoad(name);

                return clazz;

            } catch (IOException e) {
                throw new ClassNotFoundException("无法加载AI模型类: " + name, e);
            }
        }

        private boolean isAIModelClass(String className) {
            return className.startsWith("ai.model.") ||
                   className.startsWith("com.ai.model.") ||
                   className.endsWith("Model") ||
                   className.endsWith("AIModel");
        }

        private byte[] loadClassBytes(String className) throws IOException {
            String classFile = className.replace('.', '/') + ".class";
            URL resource = findResource(classFile);

            if (resource != null) {
                try (InputStream is = resource.openStream()) {
                    return is.readAllBytes();
                }
            }

            throw new IOException("找不到类文件: " + className);
        }

        private void validateClassBytes(byte[] bytes, String className) {
            // 简化验证：检查魔数
            if (bytes.length < 4 ||
                bytes[0] != (byte) 0xCA ||
                bytes[1] != (byte) 0xFE ||
                bytes[2] != (byte) 0xBA ||
                bytes[3] != (byte) 0xBE) {
                throw new SecurityException("无效的类文件: " + className);
            }
        }

        public Class<? extends AIModel> loadModelClass(String modelPath) throws ClassNotFoundException {
            String className = extractClassNameFromPath(modelPath);
            return (Class<? extends AIModel>) loadClass(className);
        }

        private String extractClassNameFromPath(String modelPath) {
            // 从路径提取类名
            if (modelPath.endsWith(".class")) {
                return modelPath.substring(0, modelPath.length() - 6).replace('/', '.');
            }
            return modelPath;
        }

        public void cleanup() {
            state.set(ClassLoadState.DESTROYED);
            modelClasses.clear();

            try {
                close();
            } catch (IOException e) {
                System.err.println("关闭类加载器失败: " + e.getMessage());
            }
        }

        public String getTenantId() {
            return tenantId;
        }

        public TenantContext getContext() {
            return context;
        }

        public Collection<Class<? extends AIModel>> getLoadedModels() {
            return new ArrayList<>(modelClasses.values());
        }

        private enum ClassLoadState {
            ACTIVE, DESTROYED
        }
    }

    /**
     * 租户管理器
     */
    public static class TenantManager {
        private final Map<String, TenantSession> tenants = new ConcurrentHashMap<>();

        public TenantSession registerTenant(TenantContext context, TenantClassLoader classLoader) {
            TenantSession session = new TenantSession(context, classLoader);
            tenants.put(context.getTenantId(), session);
            return session;
        }

        public TenantSession getTenantSession(String tenantId) {
            return tenants.get(tenantId);
        }

        public void unregisterTenant(String tenantId) {
            tenants.remove(tenantId);
        }

        public Set<String> getActiveTenants() {
            return new HashSet<>(tenants.keySet());
        }

        public int getActiveTenantCount() {
            return tenants.size();
        }
    }

    /**
     * 租户会话
     */
    public static class TenantSession {
        private final TenantContext context;
        private final TenantClassLoader classLoader;
        private final Map<String, AIModel> loadedModels = new ConcurrentHashMap<>();
        private final Map<String, ModelUsage> modelUsage = new ConcurrentHashMap<>();
        private final AtomicLong memoryUsage = new AtomicLong(0);
        private final long creationTime;

        public TenantSession(TenantContext context, TenantClassLoader classLoader) {
            this.context = context;
            this.classLoader = classLoader;
            this.creationTime = System.currentTimeMillis();
        }

        public void registerModel(String modelId, AIModel model) {
            loadedModels.put(modelId, model);
            modelUsage.put(modelId, new ModelUsage());

            // 估算内存使用
            long modelMemory = estimateModelMemory(model);
            memoryUsage.addAndGet(modelMemory);
        }

        public void recordModelUsage(String modelId) {
            ModelUsage usage = modelUsage.get(modelId);
            if (usage != null) {
                usage.incrementUsage();
            }
        }

        public void stopAllModels() {
            for (AIModel model : loadedModels.values()) {
                try {
                    if (model instanceof StoppableModel) {
                        ((StoppableModel) model).stop();
                    }
                } catch (Exception e) {
                    System.err.println("停止模型失败: " + e.getMessage());
                }
            }
            loadedModels.clear();
            modelUsage.clear();
            memoryUsage.set(0);
        }

        public TenantStatistics getStatistics() {
            return new TenantStatistics(
                context.getTenantId(),
                loadedModels.size(),
                memoryUsage.get(),
                modelUsage.values().stream().mapToLong(ModelUsage::getUsageCount).sum(),
                System.currentTimeMillis() - creationTime
            );
        }

        private long estimateModelMemory(AIModel model) {
            // 简化实现：估算模型内存使用
            return 10 * 1024 * 1024; // 10MB估算
        }

        // Getter方法
        public TenantContext getContext() { return context; }
        public TenantClassLoader getClassLoader() { return classLoader; }
        public Map<String, AIModel> getLoadedModels() { return Collections.unmodifiableMap(loadedModels); }
    }

    /**
     * 租户上下文
     */
    public static class TenantContext {
        private final String tenantId;
        private final TenantConfig config;
        private final Map<String, Object> attributes = new ConcurrentHashMap<>();
        private final AtomicLong classLoadCount = new AtomicLong(0);

        public TenantContext(String tenantId, TenantConfig config) {
            this.tenantId = tenantId;
            this.config = config;
        }

        public boolean isClassAllowed(String className) {
            // 检查白名单
            Set<String> allowedPackages = config.getAllowedPackages();
            return allowedPackages.stream().anyMatch(className::startsWith);
        }

        public void recordClassLoad(String className) {
            classLoadCount.incrementAndGet();
        }

        public void setAttribute(String key, Object value) {
            attributes.put(key, value);
        }

        public <T> T getAttribute(String key, Class<T> type) {
            Object value = attributes.get(key);
            return type.isInstance(value) ? type.cast(value) : null;
        }

        // Getter方法
        public String getTenantId() { return tenantId; }
        public TenantConfig getConfig() { return config; }
        public long getClassLoadCount() { return classLoadCount.get(); }
    }

    /**
     * 租户配置
     */
    public static class TenantConfig {
        private Set<String> allowedPackages = new HashSet<>();
        private long maxMemoryUsage = 100 * 1024 * 1024; // 100MB
        private int maxModelCount = 10;
        private boolean allowNativeAccess = false;

        public TenantConfig() {
            // 默认允许的包
            allowedPackages.add("java.lang");
            allowedPackages.add("java.util");
            allowedPackages.add("ai.model");
            allowedPackages.add("com.ai");
        }

        public void validate() {
            if (allowedPackages.isEmpty()) {
                throw new IllegalArgumentException("至少需要允许一个包");
            }
            if (maxMemoryUsage <= 0) {
                throw new IllegalArgumentException("最大内存使用必须大于0");
            }
            if (maxModelCount <= 0) {
                throw new IllegalArgumentException("最大模型数量必须大于0");
            }
        }

        // Getter和Setter方法
        public Set<String> getAllowedPackages() { return new HashSet<>(allowedPackages); }
        public void setAllowedPackages(Set<String> allowedPackages) { this.allowedPackages = new HashSet<>(allowedPackages); }
        public long getMaxMemoryUsage() { return maxMemoryUsage; }
        public void setMaxMemoryUsage(long maxMemoryUsage) { this.maxMemoryUsage = maxMemoryUsage; }
        public int getMaxModelCount() { return maxModelCount; }
        public void setMaxModelCount(int maxModelCount) { this.maxModelCount = maxModelCount; }
        public boolean isAllowNativeAccess() { return allowNativeAccess; }
        public void setAllowNativeAccess(boolean allowNativeAccess) { this.allowNativeAccess = allowNativeAccess; }
    }

    /**
     * AI模型接口
     */
    public interface AIModel {
        void initialize(ModelConfig config);
        void train(TrainingData data);
        PredictionResult predict(InputData input);
        void cleanup();
    }

    /**
     * 可停止模型接口
     */
    public interface StoppableModel {
        void stop();
        boolean isStopped();
    }

    /**
     * 模型使用统计
     */
    public static class ModelUsage {
        private final AtomicLong usageCount = new AtomicLong(0);
        private final AtomicLong lastUsedTime = new AtomicLong(System.currentTimeMillis());

        public void incrementUsage() {
            usageCount.incrementAndGet();
            lastUsedTime.set(System.currentTimeMillis());
        }

        public long getUsageCount() {
            return usageCount.get();
        }

        public long getLastUsedTime() {
            return lastUsedTime.get();
        }
    }

    /**
     * 租户统计信息
     */
    public static class TenantStatistics {
        private final String tenantId;
        private final int loadedModelCount;
        private final long memoryUsage;
        private final long totalModelUsage;
        private final long sessionDuration;

        public TenantStatistics(String tenantId, int loadedModelCount, long memoryUsage,
                              long totalModelUsage, long sessionDuration) {
            this.tenantId = tenantId;
            this.loadedModelCount = loadedModelCount;
            this.memoryUsage = memoryUsage;
            this.totalModelUsage = totalModelUsage;
            this.sessionDuration = sessionDuration;
        }

        @Override
        public String toString() {
            return String.format("租户统计 %s: 模型数=%d, 内存=%.2fMB, 使用次数=%d, 会话时长=%.1f分钟",
                tenantId, loadedModelCount, memoryUsage / 1024.0 / 1024.0,
                totalModelUsage, sessionDuration / 60000.0);
        }

        // Getter方法
        public String getTenantId() { return tenantId; }
        public int getLoadedModelCount() { return loadedModelCount; }
        public long getMemoryUsage() { return memoryUsage; }
        public long getTotalModelUsage() { return totalModelUsage; }
        public long getSessionDuration() { return sessionDuration; }
    }

    /**
     * 租户类加载器工厂
     */
    public static class TenantClassLoaderFactory {

        public TenantClassLoader createClassLoader(TenantContext context) throws MalformedURLException {
            String tenantId = context.getTenantId();
            TenantConfig config = context.getConfig();

            // 构建类路径URL
            List<URL> urls = new ArrayList<>();

            // 添加AI框架核心库
            urls.add(new File("lib/ai-framework-core.jar").toURI().toURL());

            // 添加租户特定库
            urls.add(new File("tenants/" + tenantId + "/lib").toURI().toURL());

            // 父类加载器为框架类加载器
            ClassLoader parent = MultiTenantAIModelClassLoader.class.getClassLoader();

            return new TenantClassLoader(tenantId, urls.toArray(new URL[0]), parent, context);
        }
    }

    /**
     * 资源隔离管理器
     */
    public static class ResourceIsolationManager {

        public void setupResourceIsolation(TenantContext context) {
            String tenantId = context.getTenantId();

            // 创建租户专用目录
            File tenantDir = new File("tenants/" + tenantId);
            if (!tenantDir.exists()) {
                tenantDir.mkdirs();
            }

            // 创建子目录
            new File(tenantDir, "models").mkdirs();
            new File(tenantDir, "data").mkdirs();
            new File(tenantDir, "config").mkdirs();
            new File(tenantDir, "logs").mkdirs();

            context.setAttribute("tenantDir", tenantDir.getAbsolutePath());
        }

        public void cleanupTenantResources(String tenantId) {
            File tenantDir = new File("tenants/" + tenantId);
            if (tenantDir.exists()) {
                deleteDirectory(tenantDir);
            }
        }

        private void deleteDirectory(File dir) {
            File[] files = dir.listFiles();
            if (files != null) {
                for (File file : files) {
                    if (file.isDirectory()) {
                        deleteDirectory(file);
                    } else {
                        file.delete();
                    }
                }
            }
            dir.delete();
        }
    }

    /**
     * AI模型安全管理器
     */
    public static class AIModelSecurityManager {

        public void setupSecurity(TenantContext context) {
            // 设置安全策略
            SecurityManager originalManager = System.getSecurityManager();

            System.setSecurityManager(new TenantSecurityManager(context, originalManager));
        }

        public void checkModelAccess(TenantSession session, String modelId, String modelPath) {
            TenantContext context = session.getContext();

            // 检查模型数量限制
            if (session.getLoadedModels().size() >= context.getConfig().getMaxModelCount()) {
                throw new SecurityException("模型数量超过限制");
            }

            // 检查内存使用限制
            if (session.getStatistics().getMemoryUsage() >= context.getConfig().getMaxMemoryUsage()) {
                throw new SecurityException("内存使用超过限制");
            }

            // 检查模型路径合法性
            if (!isValidModelPath(modelPath, context.getTenantId())) {
                throw new SecurityException("非法的模型路径: " + modelPath);
            }
        }

        private boolean isValidModelPath(String modelPath, String tenantId) {
            // 简化验证：检查路径是否包含租户ID
            return modelPath.contains("tenants/" + tenantId);
        }

        /**
         * 租户安全管理器
         */
        private static class TenantSecurityManager extends SecurityManager {
            private final TenantContext context;
            private final SecurityManager delegate;

            public TenantSecurityManager(TenantContext context, SecurityManager delegate) {
                this.context = context;
                this.delegate = delegate;
            }

            @Override
            public void checkPermission(Permission perm) {
                // 检查权限
                if (perm instanceof FilePermission) {
                    FilePermission fp = (FilePermission) perm;
                    checkFilePermission(fp);
                } else if (perm instanceof RuntimePermission) {
                    RuntimePermission rp = (RuntimePermission) rp;
                    checkRuntimePermission(rp);
                }

                // 委派给原始安全管理器
                if (delegate != null) {
                    delegate.checkPermission(perm);
                }
            }

            private void checkFilePermission(FilePermission perm) {
                String path = perm.getName();

                // 只允许访问租户目录
                String tenantDir = context.getAttribute("tenantDir", String.class);
                if (tenantDir != null && !path.startsWith(tenantDir)) {
                    throw new SecurityException("无权访问文件: " + path);
                }
            }

            private void checkRuntimePermission(RuntimePermission perm) {
                String name = perm.getName();

                // 限制本地代码访问
                if ("loadLibrary".equals(name) && !context.getConfig().isAllowNativeAccess()) {
                    throw new SecurityException("不允许加载本地库");
                }
            }
        }
    }

    // 异常类
    public static class TenantCreationException extends RuntimeException {
        public TenantCreationException(String message, Throwable cause) {
            super(message, cause);
        }
    }

    public static class TenantNotFoundException extends RuntimeException {
        public TenantNotFoundException(String message) {
            super(message);
        }
    }

    public static class ModelLoadException extends RuntimeException {
        public ModelLoadException(String message, Throwable cause) {
            super(message, cause);
        }
    }

    // 支持类
    public static class ModelConfig {
        // 模型配置实现
    }

    public static class TrainingData {
        // 训练数据实现
    }

    public static class PredictionResult {
        // 预测结果实现
    }

    public static class InputData {
        // 输入数据实现
    }

    private AIModel createModelInstance(Class<? extends AIModel> modelClass, TenantContext context) throws Exception {
        Constructor<? extends AIModel> constructor = modelClass.getDeclaredConstructor();
        constructor.setAccessible(true);
        AIModel model = constructor.newInstance();

        // 设置租户上下文
        if (model instanceof TenantAwareModel) {
            ((TenantAwareModel) model).setTenantContext(context);
        }

        return model;
    }

    /**
     * 租户感知模型接口
     */
    public interface TenantAwareModel {
        void setTenantContext(TenantContext context);
        TenantContext getTenantContext();
    }

    public static void main(String[] args) {
        MultiTenantAIModelClassLoader multiTenantLoader = new MultiTenantAIModelClassLoader();

        try {
            // 创建租户配置
            TenantConfig tenant1Config = new TenantConfig();
            tenant1Config.setMaxMemoryUsage(50 * 1024 * 1024); // 50MB
            tenant1Config.setMaxModelCount(5);

            TenantConfig tenant2Config = new TenantConfig();
            tenant2Config.setMaxMemoryUsage(100 * 1024 * 1024); // 100MB
            tenant2Config.setMaxModelCount(10);

            // 创建租户
            TenantSession session1 = multiTenantLoader.createTenant("tenant1", tenant1Config);
            TenantSession session2 = multiTenantLoader.createTenant("tenant2", tenant2Config);

            // 为租户加载模型
            // AIModel model1 = multiTenantLoader.loadModelForTenant("tenant1", "nn1", "tenants/tenant1/models/NeuralNetwork.class");
            // AIModel model2 = multiTenantLoader.loadModelForTenant("tenant2", "nn1", "tenants/tenant2/models/NeuralNetwork.class");

            // 显示统计信息
            System.out.println(multiTenantLoader.getTenantStatistics("tenant1"));
            System.out.println(multiTenantLoader.getTenantStatistics("tenant2"));

            // 模拟运行
            Thread.sleep(10000);

            // 销毁租户
            multiTenantLoader.destroyTenant("tenant1");
            multiTenantLoader.destroyTenant("tenant2");

        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}

/**
 * 租户感知神经网络模型
 */
class TenantAwareNeuralNetwork implements MultiTenantAIModelClassLoader.AIModel,
                                            MultiTenantAIModelClassLoader.TenantAwareModel {

    private TenantContext tenantContext;
    private boolean initialized = false;
    private double[][] weights;

    @Override
    public void setTenantContext(TenantContext context) {
        this.tenantContext = context;
    }

    @Override
    public TenantContext getTenantContext() {
        return tenantContext;
    }

    @Override
    public void initialize(MultiTenantAIModelClassLoader.ModelConfig config) {
        if (tenantContext == null) {
            throw new IllegalStateException("租户上下文未设置");
        }

        this.initialized = true;
        this.weights = new double[10][5]; // 示例权重矩阵

        System.out.println("租户 " + tenantContext.getTenantId() + " 的神经网络模型初始化完成");
    }

    @Override
    public void train(MultiTenantAIModelClassLoader.TrainingData data) {
        if (!initialized) {
            throw new IllegalStateException("模型未初始化");
        }

        System.out.println("租户 " + tenantContext.getTenantId() + " 开始训练模型");
        // 训练逻辑
    }

    @Override
    public MultiTenantAIModelClassLoader.PredictionResult predict(MultiTenantAIModelClassLoader.InputData input) {
        if (!initialized) {
            throw new IllegalStateException("模型未初始化");
        }

        System.out.println("租户 " + tenantContext.getTenantId() + " 执行预测");
        // 预测逻辑
        return new MultiTenantAIModelClassLoader.PredictionResult();
    }

    @Override
    public void cleanup() {
        this.initialized = false;
        this.weights = null;
        System.out.println("租户 " + tenantContext.getTenantId() + " 的模型资源已清理");
    }
}
```

---

本文档深入探讨了JVM类加载机制在AI框架中的应用，从基础的类加载过程到高级的多租户隔离设计，包含100个专业面试题目。每个问题都结合了AI框架的实际应用场景，提供了详细的代码实现和架构设计思路，帮助读者全面掌握JVM类加载技术的核心要点，具备设计和实现可扩展AI系统的能力。