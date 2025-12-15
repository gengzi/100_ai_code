# Java注解处理器在AI代码生成中的应用 (100题)

## ⭐ 基础题 (1-30)

### 问题1: 基于注解处理器的神经网络层代码生成

**面试题**: 如何设计注解处理器来自动生成神经网络层的样板代码？

**口语化答案**:
"注解处理器是编译时代码生成的强大工具，特别适合AI框架的样板代码生成：

```java
// 自定义注解定义
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.SOURCE)
public @interface NeuralLayer {
    String name() default "";
    LayerType type() default LayerType.DENSE;
    int units() default 128;
    String activation() default "relu";
    double dropout() default 0.0;
    String inputShape() default "";
}

// 神经网络层的枚举类型
public enum LayerType {
    DENSE, CONV2D, LSTM, GRU, DROPOUT, BATCH_NORMALIZATION
}

// 注解处理器实现
@SupportedAnnotationTypes("com.ai.annotations.NeuralLayer")
@SupportedSourceVersion(SourceVersion.RELEASE_17)
public class NeuralLayerProcessor extends AbstractProcessor {

    private Elements elementUtils;
    private Types typeUtils;
    private Filer filer;
    private Messager messager;

    @Override
    public synchronized void init(ProcessingEnvironment processingEnv) {
        super.init(processingEnv);
        elementUtils = processingEnv.getElementUtils();
        typeUtils = processingEnv.getTypeUtils();
        filer = processingEnv.getFiler();
        messager = processingEnv.getMessager();
    }

    @Override
    public boolean process(Set<? extends TypeElement> annotations, RoundEnvironment roundEnv) {
        // 查找所有带有@NeuralLayer注解的类型
        for (TypeElement annotation : annotations) {
            Set<? extends Element> annotatedElements = roundEnv.getElementsAnnotatedWith(annotation);

            for (Element element : annotatedElements) {
                if (element.getKind() == ElementKind.CLASS) {
                    TypeElement classElement = (TypeElement) element;
                    NeuralLayer neuralLayerAnnotation = classElement.getAnnotation(NeuralLayer.class);

                    // 生成神经网络层实现类
                    generateNeuralLayerClass(classElement, neuralLayerAnnotation);
                }
            }
        }
        return true;
    }

    // 生成神经网络层实现类
    private void generateNeuralLayerClass(TypeElement classElement, NeuralLayer annotation) {
        try {
            String packageName = elementUtils.getPackageOf(classElement).getQualifiedName().toString();
            String className = classElement.getSimpleName().toString() + "Generated";
            String layerName = annotation.name().isEmpty() ? classElement.getSimpleName().toString() : annotation.name();

            // 生成类内容
            String classContent = generateLayerClassContent(
                packageName, className, layerName, annotation);

            // 写入生成的文件
            JavaFileObject builderFile = filer.createSourceFile(
                packageName + "." + className);

            try (PrintWriter out = new PrintWriter(builderFile.openWriter())) {
                out.write(classContent);
            }

        } catch (IOException e) {
            messager.printMessage(Diagnostic.Kind.ERROR,
                "Failed to generate neural layer: " + e.getMessage(), classElement);
        }
    }

    // 生成层类内容
    private String generateLayerClassContent(String packageName, String className,
                                           String layerName, NeuralLayer annotation) {
        StringBuilder builder = new StringBuilder();

        // 包声明
        builder.append("package ").append(packageName).append(";\n\n");

        // 导入语句
        builder.append("import com.ai.core.*;\n");
        builder.append("import java.util.*;\n\n");

        // 类声明
        builder.append("public class ").append(className).append(" extends AbstractNeuralLayer {\n\n");

        // 字段声明
        builder.append("    private final String name = \"").append(layerName).append("\";\n");
        builder.append("    private final LayerType type = LayerType.").append(annotation.type()).append(";\n");
        builder.append("    private final int units = ").append(annotation.units()).append(";\n");
        builder.append("    private final String activation = \"").append(annotation.activation()).append("\";\n");
        builder.append("    private final double dropout = ").append(annotation.dropout()).append(";\n");

        if (!annotation.inputShape().isEmpty()) {
            builder.append("    private final String inputShape = \"").append(annotation.inputShape()).append("\";\n");
        }

        builder.append("\n");

        // 构造函数
        builder.append("    public ").append(className).append("() {\n");
        builder.append("        super();\n");
        builder.append("    }\n\n");

        // getter方法
        builder.append("    @Override\n");
        builder.append("    public String getName() {\n");
        builder.append("        return name;\n");
        builder.append("    }\n\n");

        builder.append("    @Override\n");
        builder.append("    public LayerType getType() {\n");
        builder.append("        return type;\n");
        builder.append("    }\n\n");

        builder.append("    @Override\n");
        builder.append("    public int getUnits() {\n");
        builder.append("        return units;\n");
        builder.append("    }\n\n");

        builder.append("    @Override\n");
        builder.append("    public String getActivation() {\n");
        builder.append("        return activation;\n");
        builder.append("    }\n\n");

        builder.append("    @Override\n");
        builder.append("    public double getDropout() {\n");
        builder.append("        return dropout;\n");
        builder.append("    }\n\n");

        // 根据层类型生成特定的方法
        generateLayerSpecificMethods(builder, annotation.type());

        // 结束类
        builder.append("}\n");

        return builder.toString();
    }

    // 生成层特定方法
    private void generateLayerSpecificMethods(StringBuilder builder, LayerType layerType) {
        switch (layerType) {
            case DENSE:
                generateDenseLayerMethods(builder);
                break;
            case CONV2D:
                generateConv2DLayerMethods(builder);
                break;
            case LSTM:
                generateLSTMLayerMethods(builder);
                break;
            case DROPOUT:
                generateDropoutLayerMethods(builder);
                break;
            case BATCH_NORMALIZATION:
                generateBatchNormLayerMethods(builder);
                break;
        }
    }

    // 生成Dense层方法
    private void generateDenseLayerMethods(StringBuilder builder) {
        builder.append("    @Override\n");
        builder.append("    public Tensor forward(Tensor input) {\n");
        builder.append("        // Dense层前向传播实现\n");
        builder.append("        return super.denseForward(input, units, activation);\n");
        builder.append("    }\n\n");

        builder.append("    @Override\n");
        builder.append("    public void initializeWeights(int inputSize) {\n");
        builder.append("        weights = initializeDenseWeights(inputSize, units);\n");
        builder.append("        bias = new Tensor(units);\n");
        builder.append("    }\n\n");
    }

    // 生成Conv2D层方法
    private void generateConv2DLayerMethods(StringBuilder builder) {
        builder.append("    @Override\n");
        builder.append("    public Tensor forward(Tensor input) {\n");
        builder.append("        // Conv2D层前向传播实现\n");
        builder.append("        return super.conv2DForward(input, kernelSize, filters, stride, padding);\n");
        builder.append("    }\n\n");

        builder.append("    @Override\n");
        builder.append("    public void initializeWeights(int[] inputShape) {\n");
        builder.append("        weights = initializeConv2DWeights(inputShape, kernelSize, filters);\n");
        builder.append("        bias = new Tensor(filters);\n");
        builder.append("    }\n\n");
    }
}
```

### 问题2: AI模型配置类的自动代码生成

**面试题**: 如何使用注解处理器根据配置类自动生成模型构建器代码？

**口语化答案**:
"注解处理器可以根据配置类自动生成类型安全的模型构建器：

```java
// 模型配置注解
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.SOURCE)
public @interface AIModel {
    String name();
    String version() default "1.0";
    String description() default "";
}

// 参数配置注解
@Target(ElementType.FIELD)
@Retention(RetentionPolicy.SOURCE)
public @interface ModelParam {
    String name() default "";
    String description() default "";
    String defaultValue() default "";
    boolean required() default true;
    double min() default Double.MIN_VALUE;
    double max() default Double.MAX_VALUE;
    String validation() default "";
}

// 模型构建器处理器
@SupportedAnnotationTypes({
    "com.ai.annotations.AIModel",
    "com.ai.annotations.ModelParam"
})
@SupportedSourceVersion(SourceVersion.RELEASE_17)
public class ModelBuilderProcessor extends AbstractProcessor {

    private Elements elementUtils;
    private Types typeUtils;
    private Filer filer;
    private Messager messager;

    @Override
    public synchronized void init(ProcessingEnvironment processingEnv) {
        super.init(processingEnv);
        elementUtils = processingEnv.getElementUtils();
        typeUtils = processingEnv.getTypeUtils();
        filer = processingEnv.getFiler();
        messager = processingEnv.getMessager();
    }

    @Override
    public boolean process(Set<? extends TypeElement> annotations, RoundEnvironment roundEnv) {
        // 查找所有带有@AIModel注解的类型
        Set<? extends Element> modelClasses = roundEnv.getElementsAnnotatedWith(
            elementUtils.getTypeElement("com.ai.annotations.AIModel"));

        for (Element element : modelClasses) {
            if (element.getKind() == ElementKind.CLASS) {
                TypeElement classElement = (TypeElement) element;
                AIModel modelAnnotation = classElement.getAnnotation(AIModel.class);

                // 生成模型构建器
                generateModelBuilder(classElement, modelAnnotation);
            }
        }
        return true;
    }

    // 生成模型构建器
    private void generateModelBuilder(TypeElement configClass, AIModel annotation) {
        try {
            String packageName = elementUtils.getPackageOf(configClass).getQualifiedName().toString();
            String configClassName = configClass.getSimpleName().toString();
            String builderClassName = configClassName + "Builder";
            String modelInterfaceName = annotation.name() + "Model";

            // 生成构建器类内容
            String builderContent = generateBuilderContent(
                packageName, configClassName, builderClassName,
                modelInterfaceName, annotation, configClass);

            // 生成模型接口
            String modelInterfaceContent = generateModelInterfaceContent(
                packageName, modelInterfaceName, annotation, configClass);

            // 写入构建器文件
            JavaFileObject builderFile = filer.createSourceFile(
                packageName + "." + builderClassName);

            try (PrintWriter out = new PrintWriter(builderFile.openWriter())) {
                out.write(builderContent);
            }

            // 写入模型接口文件
            JavaFileObject interfaceFile = filer.createSourceFile(
                packageName + "." + modelInterfaceName);

            try (PrintWriter out = new PrintWriter(interfaceFile.openWriter())) {
                out.write(modelInterfaceContent);
            }

        } catch (IOException e) {
            messager.printMessage(Diagnostic.Kind.ERROR,
                "Failed to generate model builder: " + e.getMessage(), configClass);
        }
    }

    // 生成构建器内容
    private String generateBuilderContent(String packageName, String configClassName,
                                        String builderClassName, String modelInterfaceName,
                                        AIModel annotation, TypeElement configClass) {
        StringBuilder builder = new StringBuilder();

        // 包声明
        builder.append("package ").append(packageName).append(";\n\n");

        // 导入语句
        builder.append("import java.util.*;\n");
        builder.append("import java.util.function.Consumer;\n\n");

        // 类声明
        builder.append("public class ").append(builderClassName).append(" {\n\n");

        // 字段声明（基于配置类的字段）
        generateBuilderFields(builder, configClass);

        // 私有构造函数
        builder.append("    private ").append(builderClassName).append("() {}\n\n");

        // 静态工厂方法
        builder.append("    public static ").append(builderClassName).append(" create() {\n");
        builder.append("        return new ").append(builderClassName).append("();\n");
        builder.append("    }\n\n");

        // 设置方法（基于配置字段）
        generateBuilderSetters(builder, configClass);

        // 构建方法
        builder.append("    public ").append(modelInterfaceName).append(" build() {\n");
        builder.append("        validateConfiguration();\n");
        builder.append("        return new ").append(modelInterfaceName).append("Impl(this);\n");
        builder.append("    }\n\n");

        // 验证方法
        builder.append("    private void validateConfiguration() {\n");
        generateValidationCode(builder, configClass);
        builder.append("    }\n\n");

        // Builder实现类
        generateBuilderImplementationClass(builder, packageName, configClassName, modelInterfaceName);

        // 结束类
        builder.append("}\n\n");

        return builder.toString();
    }

    // 生成构建器字段
    private void generateBuilderFields(StringBuilder builder, TypeElement configClass) {
        List<? extends Element> enclosedElements = configClass.getEnclosedElements();

        for (Element element : enclosedElements) {
            if (element.getKind() == ElementKind.FIELD) {
                VariableElement field = (VariableElement) element;
                ModelParam paramAnnotation = field.getAnnotation(ModelParam.class);

                if (paramAnnotation != null) {
                    String fieldName = field.getSimpleName().toString();
                    String fieldType = field.asType().toString();
                    String defaultValue = paramAnnotation.defaultValue();

                    builder.append("    private ").append(fieldType).append(" ").append(fieldName);

                    if (!defaultValue.isEmpty()) {
                        builder.append(" = ").append(getJavaLiteral(defaultValue, fieldType));
                    }

                    builder.append(";\n");
                }
            }
        }
    }

    // 生成设置方法
    private void generateBuilderSetters(StringBuilder builder, TypeElement configClass) {
        List<? extends Element> enclosedElements = configClass.getEnclosedElements();

        for (Element element : enclosedElements) {
            if (element.getKind() == ElementKind.FIELD) {
                VariableElement field = (VariableElement) element;
                ModelParam paramAnnotation = field.getAnnotation(ModelParam.class);

                if (paramAnnotation != null) {
                    String fieldName = field.getSimpleName().toString();
                    String fieldType = field.asType().toString();
                    String methodName = "set" + capitalize(fieldName);

                    // 生成链式调用方法
                    builder.append("    public ").append(builderClassName).append(" ")
                          .append(methodName).append("(").append(fieldType).append(" ")
                          .append(fieldName).append(") {\n");

                    // 添加验证逻辑
                    if (paramAnnotation.min() != Double.MIN_VALUE || paramAnnotation.max() != Double.MAX_VALUE) {
                        builder.append("        if (").append(fieldName).append(" < ")
                              .append(paramAnnotation.min()).append(" || ")
                              .append(fieldName).append(" > ")
                              .append(paramAnnotation.max()).append(") {\n");
                        builder.append("            throw new IllegalArgumentException(\n");
                        builder.append("                \"").append(fieldName).append(" must be between ")
                              .append(paramAnnotation.min()).append(" and ")
                              .append(paramAnnotation.max()).append("\");\n");
                        builder.append("        }\n");
                    }

                    // 自定义验证
                    if (!paramAnnotation.validation().isEmpty()) {
                        builder.append("        if (!").append(paramAnnotation.validation())
                              .append(".validate(").append(fieldName).append(")) {\n");
                        builder.append("            throw new IllegalArgumentException(\n");
                        builder.append("                \"Invalid value for ").append(fieldName).append("\");\n");
                        builder.append("        }\n");
                    }

                    builder.append("        this.").append(fieldName).append(" = ").append(fieldName).append(";\n");
                    builder.append("        return this;\n");
                    builder.append("    }\n\n");
                }
            }
        }
    }

    // 生成验证代码
    private void generateValidationCode(StringBuilder builder, TypeElement configClass) {
        List<? extends Element> enclosedElements = configClass.getEnclosedElements();

        for (Element element : enclosedElements) {
            if (element.getKind() == ElementKind.FIELD) {
                VariableElement field = (VariableElement) element;
                ModelParam paramAnnotation = field.getAnnotation(ModelParam.class);

                if (paramAnnotation != null && paramAnnotation.required()) {
                    String fieldName = field.getSimpleName().toString();
                    builder.append("        if (").append(fieldName).append(" == null) {\n");
                    builder.append("            throw new IllegalStateException(\n");
                    builder.append("                \"Required parameter '").append(fieldName)
                          .append("' is not set\");\n");
                    builder.append("        }\n");
                }
            }
        }
    }

    // 生成Builder实现类
    private void generateBuilderImplementationClass(StringBuilder builder, String packageName,
                                                  String configClassName, String modelInterfaceName) {
        builder.append("    // 内部实现类\n");
        builder.append("    private static class ").append(modelInterfaceName).append("Impl ")
              .append("implements ").append(modelInterfaceName).append(" {\n\n");

        // 字段
        List<? extends Element> enclosedElements = elementUtils.getTypeElement(
            packageName + "." + configClassName).getEnclosedElements();

        for (Element element : enclosedElements) {
            if (element.getKind() == ElementKind.FIELD) {
                VariableElement field = (VariableElement) element;
                ModelParam paramAnnotation = field.getAnnotation(ModelParam.class);

                if (paramAnnotation != null) {
                    String fieldName = field.getSimpleName().toString();
                    String fieldType = field.asType().toString();
                    builder.append("        private final ").append(fieldType).append(" ")
                          .append(fieldName).append(";\n");
                }
            }
        }

        builder.append("\n");

        // 构造函数
        builder.append("        public ").append(modelInterfaceName).append("Impl(")
              .append(configClassName).append("Builder builder) {\n");

        for (Element element : enclosedElements) {
            if (element.getKind() == ElementKind.FIELD) {
                VariableElement field = (VariableElement) element;
                ModelParam paramAnnotation = field.getAnnotation(ModelParam.class);

                if (paramAnnotation != null) {
                    String fieldName = field.getSimpleName().toString();
                    builder.append("            this.").append(fieldName).append(" = builder.")
                          .append(fieldName).append(";\n");
                }
            }
        }

        builder.append("        }\n\n");

        // Getter方法
        for (Element element : enclosedElements) {
            if (element.getKind() == ElementKind.FIELD) {
                VariableElement field = (VariableElement) element;
                ModelParam paramAnnotation = field.getAnnotation(ModelParam.class);

                if (paramAnnotation != null) {
                    String fieldName = field.getSimpleName().toString();
                    String fieldType = field.asType().toString();
                    String methodName = "get" + capitalize(fieldName);

                    builder.append("        @Override\n");
                    builder.append("        public ").append(fieldType).append(" ")
                          .append(methodName).append("() {\n");
                    builder.append("            return ").append(fieldName).append(";\n");
                    builder.append("        }\n\n");
                }
            }
        }

        builder.append("    }\n");
    }

    // 生成模型接口内容
    private String generateModelInterfaceContent(String packageName, String modelInterfaceName,
                                                AIModel annotation, TypeElement configClass) {
        StringBuilder builder = new StringBuilder();

        // 包声明
        builder.append("package ").append(packageName).append(";\n\n");

        // 接口声明
        builder.append("public interface ").append(modelInterfaceName).append(" {\n\n");

        // 添加模型信息方法
        builder.append("    String getName();\n");
        builder.append("    String getVersion();\n");
        builder.append("    String getDescription();\n\n");

        // 添加参数getter方法
        List<? extends Element> enclosedElements = configClass.getEnclosedElements();

        for (Element element : enclosedElements) {
            if (element.getKind() == ElementKind.FIELD) {
                VariableElement field = (VariableElement) element;
                ModelParam paramAnnotation = field.getAnnotation(ModelParam.class);

                if (paramAnnotation != null) {
                    String fieldName = field.getSimpleName().toString();
                    String fieldType = field.asType().toString();
                    String methodName = "get" + capitalize(fieldName);

                    builder.append("    ").append(fieldType).append(" ").append(methodName).append("();\n");

                    // 添加文档注释
                    if (!paramAnnotation.description().isEmpty()) {
                        builder.append("    /**\n");
                        builder.append("     * ").append(paramAnnotation.description()).append("\n");
                        builder.append("     */\n");
                    }
                }
            }
        }

        builder.append("\n");

        // 添加模型执行方法
        builder.append("    Object execute(Object input);\n");
        builder.append("    void train(Object dataset);\n");
        builder.append("    Object predict(Object input);\n\n");

        // 结束接口
        builder.append("}\n");

        return builder.toString();
    }

    // 工具方法：获取Java字面量
    private String getJavaLiteral(String value, String type) {
        if (type.equals("String")) {
            return "\"" + value + "\"";
        } else if (type.equals("int") || type.equals("Integer")) {
            return value;
        } else if (type.equals("double") || type.equals("Double")) {
            return value + "d";
        } else if (type.equals("boolean") || type.equals("Boolean")) {
            return value;
        } else {
            return value;
        }
    }

    // 工具方法：首字母大写
    private String capitalize(String str) {
        return str.substring(0, 1).toUpperCase() + str.substring(1);
    }
}
```

### 问题3-30: [包含27个基础问题，涵盖：]
- 注解处理器基本概念
- Element和TypeElement使用
- 编译时处理流程
- 代码生成技术
- Filer API使用
- Messager API使用
- 注解处理器注册
- 处理轮次管理
- 类型系统操作
- 注解信息提取
- 错误处理和报告
- 代码模板生成
- 文件写入操作
- 依赖管理
- 增量处理支持

## ⭐⭐ 进阶题 (31-70)

### 问题31: 基于注解处理器的机器学习流水线代码生成

**面试题**: 如何设计注解处理器来生成完整的机器学习流水线代码？

**口语化答案**:
"可以设计一个强大的注解处理器来自动生成端到端的ML流水线：

```java
// 流水线配置注解
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.SOURCE)
public @interface MLPipeline {
    String name();
    String description() default "";
    PipelineType type() default PipelineType.CLASSIFICATION;
    String[] inputFeatures() default {};
    String outputFeature() default "label";
    int batchSize() default 32;
    int epochs() default 100;
}

// 流水线阶段注解
@Target(ElementType.FIELD)
@Retention(RetentionPolicy.SOURCE)
public @interface PipelineStage {
    StageType type();
    String name() default "";
    int order() default 0;
    String[] parameters() default {};
}

// 流水线阶段类型
public enum StageType {
    DATA_LOADING, DATA_PREPROCESSING, FEATURE_ENGINEERING, MODEL_TRAINING,
    MODEL_EVALUATION, MODEL_DEPLOYMENT
}

// 流水线类型
public enum PipelineType {
    CLASSIFICATION, REGRESSION, CLUSTERING, TIME_SERIES, NLP, COMPUTER_VISION
}

// MLPipeline注解处理器
@SupportedAnnotationTypes({
    "com.ai.annotations.MLPipeline",
    "com.ai.annotations.PipelineStage"
})
@SupportedSourceVersion(SourceVersion.RELEASE_17)
public class MLPipelineProcessor extends AbstractProcessor {

    private Elements elementUtils;
    private Types typeUtils;
    private Filer filer;
    private Messager messager;
    private TypeMirror stringType;

    @Override
    public synchronized void init(ProcessingEnvironment processingEnv) {
        super.init(processingEnv);
        elementUtils = processingEnv.getElementUtils();
        typeUtils = processingEnv.getTypeUtils();
        filer = processingEnv.getFiler();
        messager = processingEnv.getMessager();
        stringType = elementUtils.getTypeElement("java.lang.String").asType();
    }

    @Override
    public boolean process(Set<? extends TypeElement> annotations, RoundEnvironment roundEnv) {
        // 查找所有带有@MLPipeline注解的类型
        Set<? extends Element> pipelineClasses = roundEnv.getElementsAnnotatedWith(
            elementUtils.getTypeElement("com.ai.annotations.MLPipeline"));

        for (Element element : pipelineClasses) {
            if (element.getKind() == ElementKind.CLASS) {
                TypeElement classElement = (TypeElement) element;
                MLPipeline pipelineAnnotation = classElement.getAnnotation(MLPipeline.class);

                // 分析流水线阶段
                List<PipelineStageInfo> stages = analyzePipelineStages(classElement);

                // 验证流水线配置
                validatePipelineConfiguration(pipelineAnnotation, stages);

                // 生成流水线实现
                generatePipelineImplementation(classElement, pipelineAnnotation, stages);
            }
        }
        return true;
    }

    // 分析流水线阶段
    private List<PipelineStageInfo> analyzePipelineStages(TypeElement pipelineClass) {
        List<PipelineStageInfo> stages = new ArrayList<>();
        List<? extends Element> enclosedElements = pipelineClass.getEnclosedElements();

        for (Element element : enclosedElements) {
            if (element.getKind() == ElementKind.FIELD) {
                VariableElement field = (VariableElement) element;
                PipelineStage stageAnnotation = field.getAnnotation(PipelineStage.class);

                if (stageAnnotation != null) {
                    PipelineStageInfo stageInfo = PipelineStageInfo.builder()
                        .fieldName(field.getSimpleName().toString())
                        .fieldType(field.asType().toString())
                        .type(stageAnnotation.type())
                        .name(stageAnnotation.name().isEmpty() ?
                              field.getSimpleName().toString() : stageAnnotation.name())
                        .order(stageAnnotation.order())
                        .parameters(parseStageParameters(stageAnnotation.parameters()))
                        .build();

                    stages.add(stageInfo);
                }
            }
        }

        // 按order排序
        stages.sort(Comparator.comparingInt(PipelineStageInfo::getOrder));
        return stages;
    }

    // 解析阶段参数
    private Map<String, Object> parseStageParameters(String[] parameters) {
        Map<String, Object> paramMap = new HashMap<>();

        for (String param : parameters) {
            String[] keyValue = param.split("=", 2);
            if (keyValue.length == 2) {
                String key = keyValue[0].trim();
                String value = keyValue[1].trim();
                paramMap.put(key, parseParameterValue(value));
            }
        }

        return paramMap;
    }

    // 解析参数值
    private Object parseParameterValue(String value) {
        if (value.startsWith("\"") && value.endsWith("\"")) {
            return value.substring(1, value.length() - 1);
        } else if (value.equalsIgnoreCase("true") || value.equalsIgnoreCase("false")) {
            return Boolean.parseBoolean(value);
        } else if (value.contains(".")) {
            try {
                return Double.parseDouble(value);
            } catch (NumberFormatException e) {
                return value;
            }
        } else {
            try {
                return Integer.parseInt(value);
            } catch (NumberFormatException e) {
                return value;
            }
        }
    }

    // 验证流水线配置
    private void validatePipelineConfiguration(MLPipeline pipeline, List<PipelineStageInfo> stages) {
        // 检查必需的阶段
        Set<StageType> requiredStages = getRequiredStagesForType(pipeline.type());
        Set<StageType> configuredStages = stages.stream()
            .map(PipelineStageInfo::getType)
            .collect(Collectors.toSet());

        for (StageType required : requiredStages) {
            if (!configuredStages.contains(required)) {
                messager.printMessage(Diagnostic.Kind.ERROR,
                    "Missing required pipeline stage: " + required +
                    " for pipeline type: " + pipeline.type());
            }
        }

        // 检查阶段顺序
        validateStageOrder(stages);

        // 检查参数有效性
        validateStageParameters(stages, pipeline);
    }

    // 获取流水线类型所需的阶段
    private Set<StageType> getRequiredStagesForType(PipelineType pipelineType) {
        switch (pipelineType) {
            case CLASSIFICATION:
            case REGRESSION:
                return Set.of(
                    StageType.DATA_LOADING,
                    StageType.FEATURE_ENGINEERING,
                    StageType.MODEL_TRAINING,
                    StageType.MODEL_EVALUATION
                );
            case CLUSTERING:
                return Set.of(
                    StageType.DATA_LOADING,
                    StageType.FEATURE_ENGINEERING,
                    StageType.MODEL_TRAINING,
                    StageType.MODEL_EVALUATION
                );
            case NLP:
                return Set.of(
                    StageType.DATA_LOADING,
                    StageType.DATA_PREPROCESSING,
                    StageType.FEATURE_ENGINEERING,
                    StageType.MODEL_TRAINING
                );
            case COMPUTER_VISION:
                return Set.of(
                    StageType.DATA_LOADING,
                    StageType.DATA_PREPROCESSING,
                    StageType.FEATURE_ENGINEERING,
                    StageType.MODEL_TRAINING
                );
            default:
                return Set.of();
        }
    }

    // 验证阶段顺序
    private void validateStageOrder(List<PipelineStageInfo> stages) {
        List<StageType> validOrder = Arrays.asList(
            StageType.DATA_LOADING,
            StageType.DATA_PREPROCESSING,
            StageType.FEATURE_ENGINEERING,
            StageType.MODEL_TRAINING,
            StageType.MODEL_EVALUATION,
            StageType.MODEL_DEPLOYMENT
        );

        for (int i = 1; i < stages.size(); i++) {
            StageType current = stages.get(i - 1).getType();
            StageType next = stages.get(i).getType();

            int currentIndex = validOrder.indexOf(current);
            int nextIndex = validOrder.indexOf(next);

            if (currentIndex > nextIndex) {
                messager.printMessage(Diagnostic.Kind.ERROR,
                    "Invalid pipeline stage order: " + current +
                    " should come before " + next);
            }
        }
    }

    // 验证阶段参数
    private void validateStageParameters(List<PipelineStageInfo> stages, MLPipeline pipeline) {
        for (PipelineStageInfo stage : stages) {
            switch (stage.getType()) {
                case DATA_LOADING:
                    validateDataLoadingParameters(stage);
                    break;
                case FEATURE_ENGINEERING:
                    validateFeatureEngineeringParameters(stage, pipeline);
                    break;
                case MODEL_TRAINING:
                    validateModelTrainingParameters(stage, pipeline);
                    break;
                case MODEL_EVALUATION:
                    validateModelEvaluationParameters(stage, pipeline);
                    break;
            }
        }
    }

    // 生成流水线实现
    private void generatePipelineImplementation(TypeElement configClass,
                                              MLPipeline pipeline,
                                              List<PipelineStageInfo> stages) {
        try {
            String packageName = elementUtils.getPackageOf(configClass).getQualifiedName().toString();
            String configClassName = configClass.getSimpleName().toString();
            String pipelineClassName = configClassName + "Pipeline";

            // 生成主流水线类
            String pipelineClassContent = generatePipelineClassContent(
                packageName, pipelineClassName, pipeline, stages, configClassName);

            // 生成各个阶段实现类
            for (PipelineStageInfo stage : stages) {
                generateStageImplementationClass(packageName, stage, pipeline);
            }

            // 生成流水线工厂类
            String factoryClassContent = generatePipelineFactoryContent(
                packageName, pipelineClassName, configClassName);

            // 写入文件
            writeFile(packageName, pipelineClassName, pipelineClassContent);
            writeFile(packageName, pipelineClassName + "Factory", factoryClassContent);

        } catch (IOException e) {
            messager.printMessage(Diagnostic.Kind.ERROR,
                "Failed to generate pipeline implementation: " + e.getMessage(), configClass);
        }
    }

    // 生成流水线类内容
    private String generatePipelineClassContent(String packageName, String className,
                                              MLPipeline pipeline, List<PipelineStageInfo> stages,
                                              String configClassName) {
        StringBuilder builder = new StringBuilder();

        // 包声明
        builder.append("package ").append(packageName).append(";\n\n");

        // 导入语句
        builder.append("import java.util.*;\n");
        builder.append("import java.util.concurrent.*;\n");
        builder.append("import java.util.stream.*;\n");
        builder.append("import com.ai.core.*;\n");
        builder.append("import com.ai.data.*;\n");
        builder.append("import com.ai.model.*;\n");
        builder.append("import com.ai.evaluation.*;\n\n");

        // 类声明
        builder.append("public class ").append(className).append(" implements MLPipelineInterface {\n\n");

        // 字段声明
        builder.append("    private final String name = \"").append(pipeline.name()).append("\";\n");
        builder.append("    private final PipelineType type = PipelineType.").append(pipeline.type()).append(";\n");
        builder.append("    private final String description = \"").append(pipeline.description()).append("\";\n");
        builder.append("    private final String[] inputFeatures = new String[]{")
              .append(String.join(", ", Arrays.stream(pipeline.inputFeatures())
                                                .map(s -> "\"" + s + "\"")
                                                .toArray(String[]::new)))
              .append("};\n");
        builder.append("    private final String outputFeature = \"").append(pipeline.outputFeature()).append("\";\n");
        builder.append("    private final int batchSize = ").append(pipeline.batchSize()).append(";\n");
        builder.append("    private final int epochs = ").append(pipeline.epochs()).append(";\n\n");

        // 流水线阶段字段
        for (PipelineStageInfo stage : stages) {
            builder.append("    private ").append(stage.getFieldType()).append(" ")
                  .append(stage.getFieldName()).append(";\n");
        }
        builder.append("\n");

        // 构造函数
        builder.append("    public ").append(className).append("(").append(configClassName).append(" config) {\n");
        builder.append("        initializeStages(config);\n");
        builder.append("    }\n\n");

        // 初始化方法
        builder.append("    private void initializeStages(").append(configClassName).append(" config) {\n");
        for (PipelineStageInfo stage : stages) {
            builder.append("        this.").append(stage.getFieldName()).append(" = ")
                  .append("create").append(capitalize(stage.getName())).append("(config);\n");
        }
        builder.append("    }\n\n");

        // 阶段创建方法
        for (PipelineStageInfo stage : stages) {
            builder.append("    private ").append(stage.getFieldType()).append(" ")
                  .append("create").append(capitalize(stage.getName()))
                  .append("(").append(configClassName).append(" config) {\n");
            builder.append("        return new ").append(stage.getName()).append("StageImpl(");

            // 添加构造参数
            List<String> constructorParams = new ArrayList<>();
            stage.getParameters().forEach((key, value) -> {
                constructorParams.add(key + "=" + formatJavaLiteral(value));
            });
            builder.append(String.join(", ", constructorParams));

            builder.append(");\n");
            builder.append("    }\n\n");
        }

        // 执行方法
        builder.append("    @Override\n");
        builder.append("    public PipelineResult execute(Dataset dataset) {\n");
        builder.append("        try {\n");
        builder.append("            long startTime = System.currentTimeMillis();\n\n");

        // 生成执行代码
        Object currentData = "dataset";
        for (PipelineStageInfo stage : stages) {
            switch (stage.getType()) {
                case DATA_LOADING:
                    builder.append("            // 数据加载阶段\n");
                    builder.append("            Dataset loadedData = ").append(stage.getFieldName()).append(".execute(")
                          .append(currentData).append(");\n");
                    currentData = "loadedData";
                    break;
                case DATA_PREPROCESSING:
                    builder.append("            // 数据预处理阶段\n");
                    builder.append("            Dataset preprocessedData = ").append(stage.getFieldName()).append(".execute(")
                          .append(currentData).append(");\n");
                    currentData = "preprocessedData";
                    break;
                case FEATURE_ENGINEERING:
                    builder.append("            // 特征工程阶段\n");
                    builder.append("            FeatureEngineeredData featureData = ").append(stage.getFieldName()).append(".execute(")
                          .append(currentData).append(");\n");
                    currentData = "featureData";
                    break;
                case MODEL_TRAINING:
                    builder.append("            // 模型训练阶段\n");
                    builder.append("            TrainedModel model = ").append(stage.getFieldName()).append(".execute(")
                          .append(currentData).append(");\n");
                    currentData = "model";
                    break;
                case MODEL_EVALUATION:
                    builder.append("            // 模型评估阶段\n");
                    builder.append("            EvaluationMetrics metrics = ").append(stage.getFieldName()).append(".execute(")
                          .append(currentData).append(");\n");
                    currentData = "metrics";
                    break;
                case MODEL_DEPLOYMENT:
                    builder.append("            // 模型部署阶段\n");
                    builder.append("            DeploymentResult deployment = ").append(stage.getFieldName()).append(".execute(")
                          .append(currentData).append(");\n");
                    currentData = "deployment";
                    break;
            }
            builder.append("\n");
        }

        builder.append("            long endTime = System.currentTimeMillis();\n");
        builder.append("            long executionTime = endTime - startTime;\n\n");

        builder.append("            return new PipelineResult(");
        builder.append(currentData).append(", executionTime, getName());\n");
        builder.append("            \n");
        builder.append("        } catch (Exception e) {\n");
        builder.append("            throw new PipelineExecutionException(\"Pipeline execution failed\", e);\n");
        builder.append("        }\n");
        builder.append("    }\n\n");

        // Getter方法
        builder.append("    @Override\n");
        builder.append("    public String getName() {\n");
        builder.append("        return name;\n");
        builder.append("    }\n\n");

        builder.append("    @Override\n");
        builder.append("    public PipelineType getType() {\n");
        builder.append("        return type;\n");
        builder.append("    }\n\n");

        builder.append("    @Override\n");
        builder.append("    public String getDescription() {\n");
        builder.append("        return description;\n");
        builder.append("    }\n\n");

        // 结束类
        builder.append("}\n");

        return builder.toString();
    }

    // 生成阶段实现类
    private void generateStageImplementationClass(String packageName, PipelineStageInfo stage,
                                                MLPipeline pipeline) throws IOException {
        String className = stage.getName() + "StageImpl";

        StringBuilder builder = new StringBuilder();

        // 包声明
        builder.append("package ").append(packageName).append(";\n\n");

        // 导入语句
        builder.append("import com.ai.pipeline.*;\n");
        builder.append("import com.ai.data.*;\n\n");

        // 类声明
        builder.append("public class ").append(className).append(" implements PipelineStage {\n\n");

        // 字段
        stage.getParameters().forEach((key, value) -> {
            builder.append("    private final ").append(getParameterType(key, value))
                  .append(" ").append(key).append(" = ").append(formatJavaLiteral(value)).append(";\n");
        });

        builder.append("\n");

        // 构造函数
        builder.append("    public ").append(className).append("(");

        List<String> constructorParams = new ArrayList<>();
        stage.getParameters().forEach((key, value) -> {
            constructorParams.add(getParameterType(key, value) + " " + key);
        });

        builder.append(String.join(", ", constructorParams));
        builder.append(") {\n");

        // 构造函数体
        stage.getParameters().forEach((key, value) -> {
            builder.append("        this.").append(key).append(" = ").append(key).append(";\n");
        });

        builder.append("    }\n\n");

        // 执行方法
        builder.append("    @Override\n");
        builder.append("    public Object execute(Object input) {\n");

        // 根据阶段类型生成执行逻辑
        switch (stage.getType()) {
            case DATA_LOADING:
                builder.append("        return loadData(input);\n");
                break;
            case DATA_PREPROCESSING:
                builder.append("        return preprocessData(input);\n");
                break;
            case FEATURE_ENGINEERING:
                builder.append("        return engineerFeatures(input);\n");
                break;
            case MODEL_TRAINING:
                builder.append("        return trainModel(input);\n");
                break;
            case MODEL_EVALUATION:
                builder.append("        return evaluateModel(input);\n");
                break;
            case MODEL_DEPLOYMENT:
                builder.append("        return deployModel(input);\n");
                break;
        }

        builder.append("    }\n\n");

        // 生成具体实现方法
        generateStageSpecificMethods(builder, stage);

        builder.append("}\n");

        // 写入文件
        writeFile(packageName, className, builder.toString());
    }

    // 生成阶段特定方法
    private void generateStageSpecificMethods(StringBuilder builder, PipelineStageInfo stage) {
        switch (stage.getType()) {
            case DATA_LOADING:
                builder.append("    private Dataset loadData(Object input) {\n");
                builder.append("        // 数据加载实现\n");
                builder.append("        if (input instanceof String) {\n");
                builder.append("            return DataLoader.loadFromPath((String) input);\n");
                builder.append("        } else if (input instanceof Dataset) {\n");
                builder.append("            return (Dataset) input;\n");
                builder.append("        } else {\n");
                builder.append("            throw new IllegalArgumentException(\"Unsupported input type\");\n");
                builder.append("        }\n");
                builder.append("    }\n\n");
                break;

            case FEATURE_ENGINEERING:
                builder.append("    private FeatureEngineeredData engineerFeatures(Object input) {\n");
                builder.append("        // 特征工程实现\n");
                builder.append("        if (input instanceof Dataset) {\n");
                builder.append("            Dataset dataset = (Dataset) input;\n");
                builder.append("            // 应用特征提取、选择、变换等\n");
                builder.append("            return new FeatureEngineeredData(dataset);\n");
                builder.append("        } else {\n");
                builder.append("            throw new IllegalArgumentException(\"Expected Dataset input\");\n");
                builder.append("        }\n");
                builder.append("    }\n\n");
                break;

            case MODEL_TRAINING:
                builder.append("    private TrainedModel trainModel(Object input) {\n");
                builder.append("        // 模型训练实现\n");
                builder.append("        if (input instanceof FeatureEngineeredData) {\n");
                builder.append("            FeatureEngineeredData data = (FeatureEngineeredData) input;\n");
                builder.append("            Model model = createModel();\n");
                builder.append("            return model.train(data, epochs, batchSize);\n");
                builder.append("        } else {\n");
                builder.append("            throw new IllegalArgumentException(\"Expected FeatureEngineeredData\");\n");
                builder.append("        }\n");
                builder.append("    }\n\n");
                builder.append("    private Model createModel() {\n");
                builder.append("        // 根据流水线类型创建合适的模型\n");
                builder.append("        return ModelFactory.createModel(type);\n");
                builder.append("    }\n\n");
                break;

            case MODEL_EVALUATION:
                builder.append("    private EvaluationMetrics evaluateModel(Object input) {\n");
                builder.append("        // 模型评估实现\n");
                builder.append("        if (input instanceof TrainedModel) {\n");
                builder.append("            TrainedModel model = (TrainedModel) input;\n");
                builder.append("            Dataset testSet = loadTestSet();\n");
                builder.append("            return model.evaluate(testSet);\n");
                builder.append("        } else {\n");
                builder.append("            throw new IllegalArgumentException(\"Expected TrainedModel\");\n");
                builder.append("        }\n");
                builder.append("    }\n\n");
                break;
        }
    }

    // 生成流水线工厂类
    private String generatePipelineFactoryContent(String packageName, String pipelineClassName,
                                                  String configClassName) {
        StringBuilder builder = new StringBuilder();

        builder.append("package ").append(packageName).append(";\n\n");
        builder.append("public class ").append(pipelineClassName).append("Factory {\n\n");
        builder.append("    public static ").append(pipelineClassName).append(" create(")
              .append(configClassName).append(" config) {\n");
        builder.append("        return new ").append(pipelineClassName).append("(config);\n");
        builder.append("    }\n\n");

        builder.append("    public static ").append(pipelineClassName).append(" createFromConfig(String configPath) {\n");
        builder.append("        ").append(configClassName).append(" config = ConfigLoader.load(")
              .append(configClassName).append(".class, configPath);\n");
        builder.append("        return create(config);\n");
        builder.append("    }\n\n");

        builder.append("}\n");

        return builder.toString();
    }

    // 写入文件
    private void writeFile(String packageName, String className, String content) throws IOException {
        JavaFileObject builderFile = filer.createSourceFile(packageName + "." + className);

        try (PrintWriter out = new PrintWriter(builderFile.openWriter())) {
            out.write(content);
        }
    }

    // 工具方法
    private String getParameterType(String key, Object value) {
        if (value instanceof String) return "String";
        if (value instanceof Integer) return "int";
        if (value instanceof Double) return "double";
        if (value instanceof Boolean) return "boolean";
        return "Object";
    }

    private String formatJavaLiteral(Object value) {
        if (value instanceof String) {
            return "\"" + value + "\"";
        }
        return value.toString();
    }

    private String capitalize(String str) {
        return str.substring(0, 1).toUpperCase() + str.substring(1);
    }

    // 流水线阶段信息类
    private static class PipelineStageInfo {
        private final String fieldName;
        private final String fieldType;
        private final StageType type;
        private final String name;
        private final int order;
        private final Map<String, Object> parameters;

        // Builder模式实现
        public static class Builder {
            private String fieldName;
            private String fieldType;
            private StageType type;
            private String name;
            private int order;
            private Map<String, Object> parameters = new HashMap<>();

            public Builder fieldName(String fieldName) {
                this.fieldName = fieldName;
                return this;
            }

            public Builder fieldType(String fieldType) {
                this.fieldType = fieldType;
                return this;
            }

            public Builder type(StageType type) {
                this.type = type;
                return this;
            }

            public Builder name(String name) {
                this.name = name;
                return this;
            }

            public Builder order(int order) {
                this.order = order;
                return this;
            }

            public Builder parameters(Map<String, Object> parameters) {
                this.parameters = parameters;
                return this;
            }

            public PipelineStageInfo build() {
                return new PipelineStageInfo(fieldName, fieldType, type, name, order, parameters);
            }
        }

        private PipelineStageInfo(String fieldName, String fieldType, StageType type,
                                 String name, int order, Map<String, Object> parameters) {
            this.fieldName = fieldName;
            this.fieldType = fieldType;
            this.type = type;
            this.name = name;
            this.order = order;
            this.parameters = parameters;
        }

        // Getter方法
        public String getFieldName() { return fieldName; }
        public String getFieldType() { return fieldType; }
        public StageType getType() { return type; }
        public String getName() { return name; }
        public int getOrder() { return order; }
        public Map<String, Object> getParameters() { return parameters; }
    }
}
```

### 问题32: 基于注解处理器的API接口文档生成器

**面试题**: 如何设计注解处理器来为AI服务自动生成API文档和客户端代码？

**口语化答案**:
"注解处理器可以根据API注解自动生成完整的文档和客户端代码：

```java
// API服务注解
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.SOURCE)
public @interface AIService {
    String name();
    String version() default "1.0";
    String description() default "";
    String basePath() default "/api";
}

// API端点注解
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.SOURCE)
public @interface APIEndpoint {
    String path();
    HTTPMethod method();
    String description() default "";
    String[] produces() default {"application/json"};
    String[] consumes() default {"application/json"};
}

// API参数注解
@Target(ElementType.PARAMETER)
@Retention(RetentionPolicy.SOURCE)
public @interface APIParam {
    String name() default "";
    String description() default "";
    ParamType type() default ParamType.QUERY;
    boolean required() default true;
    String defaultValue() default "";
    String validation() default "";
}

// HTTP方法枚举
public enum HTTPMethod {
    GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS
}

// 参数类型枚举
public enum ParamType {
    PATH, QUERY, HEADER, BODY, FORM
}

// API文档生成处理器
@SupportedAnnotationTypes({
    "com.ai.annotations.AIService",
    "com.ai.annotations.APIEndpoint",
    "com.ai.annotations.APIParam"
})
@SupportedSourceVersion(SourceVersion.RELEASE_17)
public class APIDocumentationProcessor extends AbstractProcessor {

    private Elements elementUtils;
    private Types typeUtils;
    private Filer filer;
    private Messager messager;

    @Override
    public synchronized void init(ProcessingEnvironment processingEnv) {
        super.init(processingEnv);
        elementUtils = processingEnv.getElementUtils();
        typeUtils = processingEnv.getTypeUtils();
        filer = processingEnv.getFiler();
        messager = processingEnv.getMessager();
    }

    @Override
    public boolean process(Set<? extends TypeElement> annotations, RoundEnvironment roundEnv) {
        // 查找所有带有@AIService注解的接口
        Set<? extends Element> serviceInterfaces = roundEnv.getElementsAnnotatedWith(
            elementUtils.getTypeElement("com.ai.annotations.AIService"));

        for (Element element : serviceInterfaces) {
            if (element.getKind() == ElementKind.INTERFACE) {
                TypeElement interfaceElement = (TypeElement) element;
                AIService serviceAnnotation = interfaceElement.getAnnotation(AIService.class);

                // 分析API端点
                List<EndpointInfo> endpoints = analyzeEndpoints(interfaceElement);

                // 生成Markdown文档
                generateMarkdownDocumentation(interfaceElement, serviceAnnotation, endpoints);

                // 生成OpenAPI/Swagger规范
                generateOpenAPISpecification(interfaceElement, serviceAnnotation, endpoints);

                // 生成客户端代码
                generateClientCode(interfaceElement, serviceAnnotation, endpoints);

                // 生成API测试代码
                generateTestCode(interfaceElement, serviceAnnotation, endpoints);
            }
        }
        return true;
    }

    // 分析API端点
    private List<EndpointInfo> analyzeEndpoints(TypeElement serviceInterface) {
        List<EndpointInfo> endpoints = new ArrayList<>();
        List<? extends Element> enclosedElements = serviceInterface.getEnclosedElements();

        for (Element element : enclosedElements) {
            if (element.getKind() == ElementKind.METHOD) {
                ExecutableElement method = (ExecutableElement) element;
                APIEndpoint endpointAnnotation = method.getAnnotation(APIEndpoint.class);

                if (endpointAnnotation != null) {
                    EndpointInfo endpoint = analyzeEndpoint(method, endpointAnnotation);
                    endpoints.add(endpoint);
                }
            }
        }

        return endpoints;
    }

    // 分析单个端点
    private EndpointInfo analyzeEndpoint(ExecutableElement method, APIEndpoint annotation) {
        return EndpointInfo.builder()
            .methodName(method.getSimpleName().toString())
            .httpMethod(annotation.method())
            .path(annotation.path())
            .description(annotation.description())
            .produces(Arrays.asList(annotation.produces()))
            .consumes(Arrays.asList(annotation.consumes()))
            .parameters(analyzeParameters(method))
            .returnType(method.getReturnType().toString())
            .build();
    }

    // 分析参数
    private List<ParameterInfo> analyzeParameters(ExecutableElement method) {
        List<ParameterInfo> parameters = new ArrayList<>();
        List<? extends VariableElement> parameterElements = method.getParameters();

        for (VariableElement param : parameterElements) {
            APIParam paramAnnotation = param.getAnnotation(APIParam.class);

            if (paramAnnotation != null) {
                ParameterInfo parameterInfo = ParameterInfo.builder()
                    .name(paramAnnotation.name().isEmpty() ?
                          param.getSimpleName().toString() : paramAnnotation.name())
                    .type(param.asType().toString())
                    .paramType(paramAnnotation.type())
                    .description(paramAnnotation.description())
                    .required(paramAnnotation.required())
                    .defaultValue(paramAnnotation.defaultValue())
                    .validation(paramAnnotation.validation())
                    .build();

                parameters.add(parameterInfo);
            }
        }

        return parameters;
    }

    // 生成Markdown文档
    private void generateMarkdownDocumentation(TypeElement serviceInterface,
                                               AIService serviceAnnotation,
                                               List<EndpointInfo> endpoints) {
        try {
            String packageName = elementUtils.getPackageOf(serviceInterface).getQualifiedName().toString();
            String docClassName = serviceInterface.getSimpleName().toString() + "Documentation";

            String markdownContent = generateMarkdownContent(
                serviceInterface, serviceAnnotation, endpoints);

            // 写入Markdown文件
            JavaFileObject docFile = filer.createResource(
                StandardLocation.SOURCE_OUTPUT,
                "",
                "docs/" + docClassName + ".md");

            try (PrintWriter out = new PrintWriter(docFile.openWriter())) {
                out.write(markdownContent);
            }

        } catch (IOException e) {
            messager.printMessage(Diagnostic.Kind.ERROR,
                "Failed to generate markdown documentation: " + e.getMessage(), serviceInterface);
        }
    }

    // 生成Markdown内容
    private String generateMarkdownContent(TypeElement serviceInterface,
                                           AIService serviceAnnotation,
                                           List<EndpointInfo> endpoints) {
        StringBuilder builder = new StringBuilder();

        // 标题
        builder.append("# ").append(serviceAnnotation.name()).append(" API Documentation\n\n");

        // 基本信息
        builder.append("## API Information\n\n");
        builder.append("- **Name**: ").append(serviceAnnotation.name()).append("\n");
        builder.append("- **Version**: ").append(serviceAnnotation.version()).append("\n");
        builder.append("- **Description**: ").append(serviceAnnotation.description()).append("\n");
        builder.append("- **Base Path**: ").append(serviceAnnotation.basePath()).append("\n\n");

        // 端点列表
        builder.append("## Endpoints\n\n");

        for (EndpointInfo endpoint : endpoints) {
            builder.append("### ").append(endpoint.getHttpMethod())
                  .append(" ").append(endpoint.getPath()).append("\n\n");

            builder.append("**Description**: ").append(endpoint.getDescription()).append("\n\n");

            // 参数表格
            if (!endpoint.getParameters().isEmpty()) {
                builder.append("#### Parameters\n\n");
                builder.append("| Name | Type | Location | Required | Description |\n");
                builder.append("|------|------|----------|----------|------------|\n");

                for (ParameterInfo param : endpoint.getParameters()) {
                    builder.append("| ").append(param.getName())
                          .append(" | ").append(param.getType())
                          .append(" | ").append(param.getParamType())
                          .append(" | ").append(param.isRequired() ? "Yes" : "No")
                          .append(" | ").append(param.getDescription())
                          .append(" |\n");
                }
                builder.append("\n");
            }

            // 响应信息
            builder.append("#### Response\n\n");
            builder.append("**Content-Type**: ").append(String.join(", ", endpoint.getProduces())).append("\n");
            builder.append("**Schema**: ").append(endpoint.getReturnType()).append("\n\n");

            builder.append("---\n\n");
        }

        return builder.toString();
    }

    // 生成OpenAPI规范
    private void generateOpenAPISpecification(TypeElement serviceInterface,
                                              AIService serviceAnnotation,
                                              List<EndpointInfo> endpoints) {
        try {
            String packageName = elementUtils.getPackageOf(serviceInterface).getQualifiedName().toString();
            String specClassName = serviceInterface.getSimpleName().toString() + "OpenAPISpec";

            String openAPIContent = generateOpenAPIContent(
                serviceAnnotation, endpoints);

            // 写入JSON文件
            JavaFileObject specFile = filer.createResource(
                StandardLocation.SOURCE_OUTPUT,
                "",
                "openapi/" + specClassName + ".json");

            try (PrintWriter out = new PrintWriter(specFile.openWriter())) {
                out.write(openAPIContent);
            }

        } catch (IOException e) {
            messager.printMessage(Diagnostic.Kind.ERROR,
                "Failed to generate OpenAPI specification: " + e.getMessage(), serviceInterface);
        }
    }

    // 生成OpenAPI内容
    private String generateOpenAPIContent(AIService serviceAnnotation, List<EndpointInfo> endpoints) {
        StringBuilder builder = new StringBuilder();

        builder.append("{\n");
        builder.append("  \"openapi\": \"3.0.0\",\n");
        builder.append("  \"info\": {\n");
        builder.append("    \"title\": \"").append(serviceAnnotation.name()).append("\",\n");
        builder.append("    \"version\": \"").append(serviceAnnotation.version()).append("\",\n");
        builder.append("    \"description\": \"").append(serviceAnnotation.description()).append("\"\n");
        builder.append("  },\n");

        builder.append("  \"servers\": [\n");
        builder.append("    {\n");
        builder.append("      \"url\": \"").append(serviceAnnotation.basePath()).append("\",\n");
        builder.append("      \"description\": \"Default server\"\n");
        builder.append("    }\n");
        builder.append("  ],\n");

        builder.append("  \"paths\": {\n");

        for (int i = 0; i < endpoints.size(); i++) {
            EndpointInfo endpoint = endpoints.get(i);

            builder.append("    \"").append(endpoint.getPath()).append("\": {\n");
            builder.append("      \"").append(endpoint.getHttpMethod().toString().toLowerCase()).append("\": {\n");
            builder.append("        \"summary\": \"").append(endpoint.getDescription()).append("\",\n");
            builder.append("        \"description\": \"").append(endpoint.getDescription()).append("\",\n");
            builder.append("        \"tags\": [\"").append(serviceAnnotation.name()).append("\"],\n");

            // 参数
            if (!endpoint.getParameters().isEmpty()) {
                builder.append("        \"parameters\": [\n");

                for (int j = 0; j < endpoint.getParameters().size(); j++) {
                    ParameterInfo param = endpoint.getParameters().get(j);

                    builder.append("          {\n");
                    builder.append("            \"name\": \"").append(param.getName()).append("\",\n");
                    builder.append("            \"in\": \"").append(param.getParamType().toString().toLowerCase()).append("\",\n");
                    builder.append("            \"description\": \"").append(param.getDescription()).append("\",\n");
                    builder.append("            \"required\": ").append(param.isRequired()).append(",\n");
                    builder.append("            \"schema\": {\n");
                    builder.append("              \"type\": \"").append(getOpenAPIType(param.getType())).append("\"\n");
                    builder.append("            }\n");
                    builder.append("          }");

                    if (j < endpoint.getParameters().size() - 1) {
                        builder.append(",");
                    }

                    builder.append("\n");
                }

                builder.append("        ],\n");
            }

            // 响应
            builder.append("        \"responses\": {\n");
            builder.append("          \"200\": {\n");
            builder.append("            \"description\": \"Successful response\",\n");
            builder.append("            \"content\": {\n");

            for (String contentType : endpoint.getProduces()) {
                builder.append("              \"").append(contentType).append("\": {\n");
                builder.append("                \"schema\": {\n");
                builder.append("                  \"$ref\": \"#/components/schemas/")
                      .append(endpoint.getReturnType()).append("\"\n");
                builder.append("                }\n");
                builder.append("              }");

                if (!contentType.equals(endpoint.getProduces()[endpoint.getProduces().length - 1])) {
                    builder.append(",");
                }

                builder.append("\n");
            }

            builder.append("            }\n");
            builder.append("          }\n");
            builder.append("        }\n");
            builder.append("      }\n");
            builder.append("    }");

            if (i < endpoints.size() - 1) {
                builder.append(",");
            }

            builder.append("\n");
        }

        builder.append("  },\n");

        // 组件定义
        builder.append("  \"components\": {\n");
        builder.append("    \"schemas\": {\n");

        Set<String> referencedTypes = endpoints.stream()
            .map(EndpointInfo::getReturnType)
            .collect(Collectors.toSet());

        int typeIndex = 0;
        for (String type : referencedTypes) {
            builder.append("      \"").append(type).append("\": {\n");
            builder.append("        \"type\": \"object\",\n");
            builder.append("        \"description\": \"Generated schema for ").append(type).append("\"\n");
            builder.append("      }");

            if (typeIndex < referencedTypes.size() - 1) {
                builder.append(",");
            }

            builder.append("\n");
            typeIndex++;
        }

        builder.append("    }\n");
        builder.append("  }\n");
        builder.append("}\n");

        return builder.toString();
    }

    // 生成客户端代码
    private void generateClientCode(TypeElement serviceInterface,
                                   AIService serviceAnnotation,
                                   List<EndpointInfo> endpoints) {
        try {
            String packageName = elementUtils.getPackageOf(serviceInterface).getQualifiedName().toString();
            String clientClassName = serviceInterface.getSimpleName().toString() + "Client";
            String serviceInterfaceName = serviceInterface.getSimpleName().toString();

            String clientContent = generateClientContent(
                packageName, clientClassName, serviceInterfaceName,
                serviceAnnotation, endpoints);

            // 写入客户端类
            JavaFileObject clientFile = filer.createSourceFile(
                packageName + "." + clientClassName);

            try (PrintWriter out = new PrintWriter(clientFile.openWriter())) {
                out.write(clientContent);
            }

        } catch (IOException e) {
            messager.printMessage(Diagnostic.Kind.ERROR,
                "Failed to generate client code: " + e.getMessage(), serviceInterface);
        }
    }

    // 生成客户端内容
    private String generateClientContent(String packageName, String clientClassName,
                                        String serviceInterfaceName, AIService serviceAnnotation,
                                        List<EndpointInfo> endpoints) {
        StringBuilder builder = new StringBuilder();

        // 包声明
        builder.append("package ").append(packageName).append(";\n\n");

        // 导入语句
        builder.append("import java.util.*;\n");
        builder.append("import java.net.http.*;\n");
        builder.append("import java.net.URI;\n");
        builder.append("import com.fasterxml.jackson.databind.ObjectMapper;\n");
        builder.append("import com.fasterxml.jackson.core.type.TypeReference;\n\n");

        // 类声明
        builder.append("public class ").append(clientClassName).append(" implements ").append(serviceInterfaceName).append(" {\n\n");

        // 字段
        builder.append("    private final HttpClient httpClient;\n");
        builder.append("    private final ObjectMapper objectMapper;\n");
        builder.append("    private final String baseUrl;\n\n");

        // 构造函数
        builder.append("    public ").append(clientClassName).append("(String baseUrl) {\n");
        builder.append("        this.httpClient = HttpClient.newHttpClient();\n");
        builder.append("        this.objectMapper = new ObjectMapper();\n");
        builder.append("        this.baseUrl = baseUrl + \"").append(serviceAnnotation.basePath()).append("\";\n");
        builder.append("    }\n\n");

        builder.append("    public ").append(clientClassName).append("() {\n");
        builder.append("        this(\"http://localhost:8080\");\n");
        builder.append("    }\n\n");

        // 生成端点方法
        for (EndpointInfo endpoint : endpoints) {
            generateClientMethod(builder, endpoint);
        }

        // 结束类
        builder.append("}\n");

        return builder.toString();
    }

    // 生成客户端方法
    private void generateClientMethod(StringBuilder builder, EndpointInfo endpoint) {
        String methodName = endpoint.getMethodName();
        String httpMethod = endpoint.getHttpMethod().toString();
        String path = endpoint.getPath();
        String returnType = endpoint.getReturnType();

        // 方法签名
        builder.append("    @Override\n");
        builder.append("    public ").append(returnType).append(" ").append(methodName).append("(");

        // 参数列表
        List<String> paramList = new ArrayList<>();
        for (ParameterInfo param : endpoint.getParameters()) {
            paramList.add(param.getType() + " " + param.getName());
        }
        builder.append(String.join(", ", paramList));
        builder.append(") {\n");

        // 方法体
        builder.append("        try {\n");

        // 构建URL
        builder.append("            String url = baseUrl + \"").append(path).append("\";\n");

        // 处理路径参数
        for (ParameterInfo param : endpoint.getParameters()) {
            if (param.getParamType() == ParamType.PATH) {
                builder.append("            url = url.replace(\"{").append(param.getName())
                      .append("}\", String.valueOf(").append(param.getName()).append("));\n");
            }
        }

        // 构建请求
        builder.append("            HttpRequest.Builder requestBuilder = HttpRequest.newBuilder()\n");
        builder.append("                .uri(URI.create(url))\n");
        builder.append("                .method(\"").append(httpMethod).append("\", ");

        if (endpoint.getConsumes().contains("application/json") &&
            endpoint.getParameters().stream().anyMatch(p -> p.getParamType() == ParamType.BODY)) {
            builder.append("HttpRequest.BodyPublishers.ofString(\n");
            builder.append("                    objectMapper.writeValueAsString(\n");

            // 查找body参数
            ParameterInfo bodyParam = endpoint.getParameters().stream()
                .filter(p -> p.getParamType() == ParamType.BODY)
                .findFirst()
                .orElse(null);

            if (bodyParam != null) {
                builder.append("                        ").append(bodyParam.getName()).append("\n");
            }

            builder.append("                    ))\n");
        } else {
            builder.append("HttpRequest.BodyPublishers.noBody()\n");
        }

        builder.append("                );\n");

        // 添加查询参数
        for (ParameterInfo param : endpoint.getParameters()) {
            if (param.getParamType() == ParamType.QUERY) {
                builder.append("            if (").append(param.getName()).append(" != null) {\n");
                builder.append("                requestBuilder.uri(URI.create(url + \"?")
                      .append(param.getName()).append("=\" + ")
                      .append(param.getName()).append("));\n");
                builder.append("            }\n");
            }
        }

        // 添加头部
        builder.append("            requestBuilder.header(\"Content-Type\", \"application/json\");\n");
        builder.append("            requestBuilder.header(\"Accept\", \"application/json\");\n\n");

        // 发送请求
        builder.append("            HttpRequest request = requestBuilder.build();\n");
        builder.append("            HttpResponse<String> response = httpClient.send(request, ");
        builder.append("HttpResponse.BodyHandlers.ofString());\n\n");

        // 处理响应
        builder.append("            if (response.statusCode() == 200) {\n");

        if (!returnType.equals("void")) {
            builder.append("                return objectMapper.readValue(response.body(), ");
            builder.append("new TypeReference<").append(returnType).append(">() {});\n");
        } else {
            builder.append("                // Void return type\n");
        }

        builder.append("            } else {\n");
        builder.append("                throw new RuntimeException(\"HTTP request failed with status: \" + response.statusCode());\n");
        builder.append("            }\n\n");

        builder.append("        } catch (Exception e) {\n");
        builder.append("            throw new RuntimeException(\"Failed to execute API call\", e);\n");
        builder.append("        }\n");
        builder.append("    }\n\n");
    }

    // 生成测试代码
    private void generateTestCode(TypeElement serviceInterface,
                                AIService serviceAnnotation,
                                List<EndpointInfo> endpoints) {
        try {
            String packageName = elementUtils.getPackageOf(serviceInterface).getQualifiedName().toString();
            String testClassName = serviceInterface.getSimpleName().toString() + "Test";

            String testContent = generateTestContent(
                packageName, testClassName, serviceAnnotation, endpoints);

            // 写入测试类
            JavaFileObject testFile = filer.createSourceFile(
                packageName + "." + testClassName);

            try (PrintWriter out = new PrintWriter(testFile.openWriter())) {
                out.write(testContent);
            }

        } catch (IOException e) {
            messager.printMessage(Diagnostic.Kind.ERROR,
                "Failed to generate test code: " + e.getMessage(), serviceInterface);
        }
    }

    // 生成测试内容
    private String generateTestContent(String packageName, String testClassName,
                                      AIService serviceAnnotation, List<EndpointInfo> endpoints) {
        StringBuilder builder = new StringBuilder();

        // 包声明
        builder.append("package ").append(packageName).append(";\n\n");

        // 导入语句
        builder.append("import org.junit.jupiter.api.*;\n");
        builder.append("import org.junit.jupiter.api.extension.ExtendWith;\n");
        builder.append("import static org.junit.jupiter.api.Assertions.*;\n\n");

        // 类声明
        builder.append("public class ").append(testClassName).append(" {\n\n");

        // 客户端字段
        builder.append("    private ").append(serviceInterface.getSimpleName().toString())
              .append("Client client;\n\n");

        // 设置方法
        builder.append("    @BeforeEach\n");
        builder.append("    public void setUp() {\n");
        builder.append("        client = new ").append(serviceInterface.getSimpleName().toString())
              .append("Client(\"http://localhost:8080\");\n");
        builder.append("    }\n\n");

        // 为每个端点生成测试方法
        for (EndpointInfo endpoint : endpoints) {
            generateEndpointTest(builder, endpoint);
        }

        // 结束类
        builder.append("}\n");

        return builder.toString();
    }

    // 生成端点测试
    private void generateEndpointTest(StringBuilder builder, EndpointInfo endpoint) {
        String methodName = endpoint.getMethodName();

        builder.append("    @Test\n");
        builder.append("    public void test").append(capitalize(methodName)).append("() {\n");
        builder.append("        // Test ").append(endpoint.getDescription()).append("\n");
        builder.append("        assertDoesNotThrow(() -> {\n");

        // 准备测试数据
        for (ParameterInfo param : endpoint.getParameters()) {
            if (param.isRequired()) {
                builder.append("            ").append(param.getType()).append(" ")
                      .append(param.getName()).append(" = ");
                builder.append(generateTestParameterValue(param.getType()));
                builder.append(";\n");
            }
        }

        // 调用方法
        builder.append("            ");
        if (!endpoint.getReturnType().equals("void")) {
            builder.append("var result = ");
        }

        builder.append("client.").append(methodName).append("(");

        List<String> callParams = endpoint.getParameters().stream()
            .filter(ParameterInfo::isRequired)
            .map(ParameterInfo::getName)
            .collect(Collectors.toList());

        builder.append(String.join(", ", callParams));
        builder.append(");\n");

        builder.append("        });\n");
        builder.append("    }\n\n");
    }

    // 工具方法
    private String getOpenAPIType(String javaType) {
        if (javaType.equals("String")) return "string";
        if (javaType.equals("int") || javaType.equals("Integer")) return "integer";
        if (javaType.equals("long") || javaType.equals("Long")) return "integer";
        if (javaType.equals("double") || javaType.equals("Double")) return "number";
        if (javaType.equals("boolean") || javaType.equals("Boolean")) return "boolean";
        if (javaType.startsWith("List<")) return "array";
        return "object";
    }

    private String generateTestParameterValue(String type) {
        if (type.equals("String")) return "\"test\"";
        if (type.equals("int") || type.equals("Integer")) return "1";
        if (type.equals("long") || type.equals("Long")) return "1L";
        if (type.equals("double") || type.equals("Double")) return "1.0";
        if (type.equals("boolean") || type.equals("Boolean")) return "true";
        return "null";
    }

    private String capitalize(String str) {
        return str.substring(0, 1).toUpperCase() + str.substring(1);
    }

    // 端点信息类
    private static class EndpointInfo {
        // 使用Builder模式构建
        public static class Builder {
            private String methodName;
            private HTTPMethod httpMethod;
            private String path;
            private String description;
            private List<String> produces;
            private List<String> consumes;
            private List<ParameterInfo> parameters;
            private String returnType;

            public Builder methodName(String methodName) {
                this.methodName = methodName;
                return this;
            }

            public Builder httpMethod(HTTPMethod httpMethod) {
                this.httpMethod = httpMethod;
                return this;
            }

            public Builder path(String path) {
                this.path = path;
                return this;
            }

            public Builder description(String description) {
                this.description = description;
                return this;
            }

            public Builder produces(List<String> produces) {
                this.produces = produces;
                return this;
            }

            public Builder consumes(List<String> consumes) {
                this.consumes = consumes;
                return this;
            }

            public Builder parameters(List<ParameterInfo> parameters) {
                this.parameters = parameters;
                return this;
            }

            public Builder returnType(String returnType) {
                this.returnType = returnType;
                return this;
            }

            public EndpointInfo build() {
                return new EndpointInfo(methodName, httpMethod, path, description,
                                       produces, consumes, parameters, returnType);
            }
        }

        private final String methodName;
        private final HTTPMethod httpMethod;
        private final String path;
        private final String description;
        private final List<String> produces;
        private final List<String> consumes;
        private final List<ParameterInfo> parameters;
        private final String returnType;

        private EndpointInfo(String methodName, HTTPMethod httpMethod, String path,
                              String description, List<String> produces,
                              List<String> consumes, List<ParameterInfo> parameters,
                              String returnType) {
            this.methodName = methodName;
            this.httpMethod = httpMethod;
            this.path = path;
            this.description = description;
            this.produces = produces;
            this.consumes = consumes;
            this.parameters = parameters;
            this.returnType = returnType;
        }

        // Getter方法
        public String getMethodName() { return methodName; }
        public HTTPMethod getHttpMethod() { return httpMethod; }
        public String getPath() { return path; }
        public String getDescription() { return description; }
        public List<String> getProduces() { return produces; }
        public List<String> getConsumes() { return consumes; }
        public List<ParameterInfo> getParameters() { return parameters; }
        public String getReturnType() { return returnType; }
    }

    // 参数信息类
    private static class ParameterInfo {
        // Builder模式实现
        public static class Builder {
            private String name;
            private String type;
            private ParamType paramType;
            private String description;
            private boolean required;
            private String defaultValue;
            private String validation;

            public Builder name(String name) {
                this.name = name;
                return this;
            }

            public Builder type(String type) {
                this.type = type;
                return this;
            }

            public Builder paramType(ParamType paramType) {
                this.paramType = paramType;
                return this;
            }

            public Builder description(String description) {
                this.description = description;
                return this;
            }

            public Builder required(boolean required) {
                this.required = required;
                return this;
            }

            public Builder defaultValue(String defaultValue) {
                this.defaultValue = defaultValue;
                return this;
            }

            public Builder validation(String validation) {
                this.validation = validation;
                return this;
            }

            public ParameterInfo build() {
                return new ParameterInfo(name, type, paramType, description,
                                         required, defaultValue, validation);
            }
        }

        private final String name;
        private final String type;
        private final ParamType paramType;
        private final String description;
        private final boolean required;
        private final String defaultValue;
        private final String validation;

        private ParameterInfo(String name, String type, ParamType paramType,
                               String description, boolean required,
                               String defaultValue, String validation) {
            this.name = name;
            this.type = type;
            this.paramType = paramType;
            this.description = description;
            this.required = required;
            this.defaultValue = defaultValue;
            this.validation = validation;
        }

        // Getter方法
        public String getName() { return name; }
        public String getType() { return type; }
        public ParamType getParamType() { return paramType; }
        public String getDescription() { return description; }
        public boolean isRequired() { return required; }
        public String getDefaultValue() { return defaultValue; }
        public String getValidation() { return validation; }
    }
}
```

### 问题33-70: [包含38个进阶问题，涵盖：]
- 复杂注解处理器架构设计
- 增量处理和缓存机制
- 编译时类型检查和验证
- 代码模板引擎集成
- 多模块注解处理器
- 注解处理器性能优化
- 错误处理和诊断
- 元编程技术深入应用
- 代码生成最佳实践
- 注解处理器测试
- 编译器API高级用法
- 类型系统和泛型处理
- 注解继承和组合
- 编译时依赖解析
- 生成代码的质量保证
- 注解处理器与构建工具集成
- 自定义编译插件开发
- 代码重构和优化生成
- 编译时资源管理
- 注解处理器的安全性
- 条件编译特性
- 代码格式化和美化
- 文档生成自动化
- 国际化支持生成
- 版本兼容性处理
- 性能分析代码生成
- 日志和监控代码生成
- 测试用例自动生成
- API版本管理
- 代码覆盖率分析
- 持续集成支持

## ⭐⭐⭐ 专家题 (71-100)

### 问题71: 基于注解处理器的AI模型自动优化代码生成

**面试题**: 如何设计注解处理器来生成AI模型性能优化的样板代码？

**口语化答案**:
"可以设计智能注解处理器来生成模型优化和性能调优的代码：

```java
// 模型优化配置注解
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.SOURCE)
public @interface ModelOptimization {
    OptimizationType[] types() default {OptimizationType.QUANTIZATION};
    OptimizationTarget target() default OptimizationTarget.INFERENCE;
    Precision[] precisionLevels() default {Precision.INT8, Precision.FLOAT16};
    boolean enablePruning() default true;
    boolean enableDistillation() default false;
    String[] optimizationTechniques() default {};
}

// 优化类型枚举
public enum OptimizationType {
    QUANTIZATION, PRUNING, DISTILLATION, KNOWLEDGE_DISTILLATION,
    LOW_RANK_DECOMPOSITION, WEIGHT_SHARING, NEURAL_ARCHITECTURE_SEARCH
}

// 优化目标枚举
public enum OptimizationTarget {
    INFERENCE, TRAINING, MEMORY_USAGE, POWER_CONSUMPTION
}

// 精度级别枚举
public enum Precision {
    INT8, INT16, INT32, FLOAT16, FLOAT32, BFLOAT16
}

// 性能基准注解
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.SOURCE)
public @interface PerformanceBenchmark {
    String benchmarkName();
    String[] metrics() default {"latency", "throughput", "accuracy"};
    int warmupIterations() default 10;
    int measurementIterations() default 100;
    String dataset() default "";
}

// 模型优化处理器
@SupportedAnnotationTypes({
    "com.ai.annotations.ModelOptimization",
    "com.ai.annotations.PerformanceBenchmark"
})
@SupportedSourceVersion(SourceVersion.RELEASE_17)
public class ModelOptimizationProcessor extends AbstractProcessor {

    private Elements elementUtils;
    private Types typeUtils;
    private Filer filer;
    private Messager messager;
    private OptimizationTemplateEngine templateEngine;

    @Override
    public synchronized void init(ProcessingEnvironment processingEnv) {
        super.init(processingEnv);
        elementUtils = processingEnv.getElementUtils();
        typeUtils = processingEnv.getTypeUtils();
        filer = processingEnv.getFiler();
        messager = processingEnv.getMessager();
        this.templateEngine = new OptimizationTemplateEngine();
    }

    @Override
    public boolean process(Set<? extends TypeElement> annotations, RoundEnvironment roundEnv) {
        // 查找所有带有@ModelOptimization注解的类
        Set<? extends Element> modelClasses = roundEnv.getElementsAnnotatedWith(
            elementUtils.getTypeElement("com.ai.annotations.ModelOptimization"));

        for (Element element : modelClasses) {
            if (element.getKind() == ElementKind.CLASS) {
                TypeElement classElement = (TypeElement) element;
                ModelOptimization optimizationAnnotation = classElement.getAnnotation(ModelOptimization.class);

                // 分析模型结构
                ModelStructureAnalysis structureAnalysis = analyzeModelStructure(classElement);

                // 生成优化策略
                OptimizationStrategy strategy = generateOptimizationStrategy(
                    classElement, optimizationAnnotation, structureAnalysis);

                // 生成优化代码
                generateOptimizationCode(classElement, strategy);

                // 生成性能基准测试
                generatePerformanceBenchmarks(classElement);

                // 生成监控和分析代码
                generateMonitoringCode(classElement, strategy);
            }
        }
        return true;
    }

    // 分析模型结构
    private ModelStructureAnalysis analyzeModelStructure(TypeElement modelClass) {
        ModelStructureAnalysis.Builder builder = ModelStructureAnalysis.builder();

        // 分析层结构
        analyzeLayerStructure(modelClass, builder);

        // 分析参数
        analyzeModelParameters(modelClass, builder);

        // 分析计算复杂度
        analyzeComputationalComplexity(modelClass, builder);

        // 分析内存使用
        analyzeMemoryUsage(modelClass, builder);

        return builder.build();
    }

    // 分析层结构
    private void analyzeLayerStructure(TypeElement modelClass, ModelStructureAnalysis.Builder builder) {
        // 查找层容器
        Element layersContainer = findLayersContainer(modelClass);
        if (layersContainer != null) {
            List<LayerInfo> layers = extractLayerInfo(layersContainer);
            builder.layers(layers);

            // 分析层类型分布
            Map<String, Integer> layerTypeDistribution = calculateLayerTypeDistribution(layers);
            builder.layerTypeDistribution(layerTypeDistribution);
        }
    }

    // 查找层容器
    private Element findLayersContainer(TypeElement modelClass) {
        List<? extends Element> enclosedElements = modelClass.getEnclosedElements();

        for (Element element : enclosedElements) {
            if (element.getKind() == ElementKind.FIELD) {
                VariableElement field = (VariableElement) element;

                // 检查是否为List<NeuralLayer>类型
                if (isLayersField(field)) {
                    return field;
                }
            }
        }
        return null;
    }

    // 检查是否为层字段
    private boolean isLayersField(VariableElement field) {
        String fieldType = field.asType().toString();
        return fieldType.equals("java.util.List<com.ai.core.NeuralLayer>") ||
               fieldType.equals("List<NeuralLayer>") ||
               fieldType.contains("Layer");
    }

    // 提取层信息
    private List<LayerInfo> extractLayerInfo(Element layersContainer) {
        List<LayerInfo> layers = new ArrayList<>();

        // 这里需要从容器中提取实际的层信息
        // 由于在编译时，我们只能分析注解和类型信息

        return layers;
    }

    // 计算层类型分布
    private Map<String, Integer> calculateLayerTypeDistribution(List<LayerInfo> layers) {
        Map<String, Integer> distribution = new HashMap<>();

        for (LayerInfo layer : layers) {
            String type = layer.getType();
            distribution.put(type, distribution.getOrDefault(type, 0) + 1);
        }

        return distribution;
    }

    // 生成优化策略
    private OptimizationStrategy generateOptimizationStrategy(TypeElement modelClass,
                                                          ModelOptimization annotation,
                                                          ModelStructureAnalysis structureAnalysis) {
        OptimizationStrategy.Builder builder = OptimizationStrategy.builder();

        // 基于注解配置的基础策略
        for (OptimizationType type : annotation.types()) {
            OptimizationTechnique technique = createOptimizationTechnique(type, annotation);
            builder.addTechnique(technique);
        }

        // 基于模型结构的智能策略
        addIntelligentOptimizationStrategies(builder, structureAnalysis, annotation);

        return builder.build();
    }

    // 创建优化技术
    private OptimizationTechnique createOptimizationTechnique(OptimizationType type, ModelOptimization annotation) {
        return switch (type) {
            case QUANTIZATION -> createQuantizationTechnique(annotation);
            case PRUNING -> createPruningTechnique(annotation);
            case DISTILLATION -> createDistillationTechnique(annotation);
            case LOW_RANK_DECOMPOSITION -> createLowRankTechnique(annotation);
            default -> new GenericOptimizationTechnique(type.name());
        };
    }

    // 创建量化技术
    private OptimizationTechnique createQuantizationTechnique(ModelOptimization annotation) {
        QuantizationTechnique technique = new QuantizationTechnique();

        // 设置精度级别
        for (Precision precision : annotation.precisionLevels()) {
            technique.addPrecisionLevel(precision);
        }

        // 设置量化策略
        technique.setStrategy(QuantizationStrategy.POST_TRAINING_QUANTIZATION);
        technique.setCalibrationDataset("calibration_dataset.json");

        return technique;
    }

    // 创建剪枝技术
    private OptimizationTechnique createPruningTechnique(ModelOptimization annotation) {
        PruningTechnique technique = new PruningTechnique();

        technique.setMethod(PruningMethod.MAGNITUDE_BASED);
        technique.setSparsityLevel(0.5); // 50%稀疏度
        technique.setIterative(true);

        return technique;
    }

    // 添加智能优化策略
    private void addIntelligentOptimizationStrategies(OptimizationStrategy.Builder builder,
                                                    ModelStructureAnalysis structureAnalysis,
                                                    ModelOptimization annotation) {
        // 基于模型大小选择策略
        long parameterCount = structureAnalysis.getParameterCount();

        if (parameterCount > 100_000_000) { // 大于1亿参数
            // 大模型：使用量化 + 剪枝 + 知识蒸馏
            builder.addTechnique(createLargeModelOptimization(structureAnalysis));
        } else if (parameterCount > 10_000_000) { // 中等模型
            // 中等模型：使用量化 + 剪枝
            builder.addTechnique(createMediumModelOptimization(structureAnalysis));
        } else { // 小模型
            // 小模型：主要使用量化
            builder.addTechnique(createSmallModelOptimization(structureAnalysis));
        }

        // 基于层类型选择特定优化
        Map<String, Integer> layerTypes = structureAnalysis.getLayerTypeDistribution();

        if (layerTypes.containsKey("Conv2D") || layerTypes.containsKey("Convolutional")) {
            builder.addTechnique(createConvolutionOptimization());
        }

        if (layerTypes.containsKey("LSTM") || layerTypes.containsKey("GRU")) {
            builder.addTechnique(createRNNOptimization());
        }

        if (layerTypes.containsKey("Attention") || layerTypes.containsKey("Transformer")) {
            builder.addTechnique.createTransformerOptimization();
        }
    }

    // 创建大模型优化策略
    private OptimizationTechnique createLargeModelOptimization(ModelStructureAnalysis structureAnalysis) {
        CompositeOptimizationTechnique technique = new CompositeOptimizationTechnique();
        technique.setName("LargeModelOptimization");

        // 多级量化
        QuantizationTechnique quantization = new QuantizationTechnique();
        quantization.setStrategy(QuantizationStrategy.QUANTIZATION_AWARE_TRAINING);
        quantization.addPrecisionLevel(Precision.INT8);
        quantization.addPrecisionLevel(Precision.FLOAT16);
        technique.addSubTechnique(quantization);

        // 结构化剪枝
        PruningTechnique pruning = new PruningTechnique();
        pruning.setMethod(PruningMethod.STRUCTURED);
        pruning.setSparsityLevel(0.7); // 70%稀疏度
        technique.addSubTechnique(pruning);

        // 知识蒸馏
        KnowledgeDistillationTechnique distillation = new KnowledgeDistillationTechnique();
        distillation.setTeacherModel("original_model");
        distillation.setStudentModel("distilled_model");
        distillation.setDistillationMethod(DistillationMethod.SOFT_TARGET);
        technique.addSubTechnique(distillation);

        return technique;
    }

    // 生成优化代码
    private void generateOptimizationCode(TypeElement modelClass, OptimizationStrategy strategy) {
        try {
            String packageName = elementUtils.getPackageOf(modelClass).getQualifiedName().toString();
            String modelClassName = modelClass.getSimpleName().toString();
            String optimizerClassName = modelClassName + "Optimizer";

            // 生成优化器主类
            String optimizerContent = generateOptimizerContent(
                packageName, optimizerClassName, modelClassName, strategy);

            // 生成各个优化技术的实现类
            for (OptimizationTechnique technique : strategy.getTechniques()) {
                generateTechniqueImplementation(packageName, technique, modelClassName);
            }

            // 生成优化配置类
            String configContent = generateOptimizationConfigContent(
                packageName, modelClassName + "OptimizationConfig", strategy);

            // 写入文件
            writeFile(packageName, optimizerClassName, optimizerContent);
            writeFile(packageName, modelClassName + "OptimizationConfig", configContent);

        } catch (IOException e) {
            messager.printMessage(Diagnostic.Kind.ERROR,
                "Failed to generate optimization code: " + e.getMessage(), modelClass);
        }
    }

    // 生成优化器内容
    private String generateOptimizerContent(String packageName, String optimizerClassName,
                                           String modelClassName, OptimizationStrategy strategy) {
        StringBuilder builder = new StringBuilder();

        // 包声明
        builder.append("package ").append(packageName).append(";\n\n");

        // 导入语句
        builder.append("import java.util.*;\n");
        builder.append("import java.util.concurrent.*;\n");
        builder.append("import java.util.stream.*;\n");
        builder.append("import com.ai.optimization.*;\n");
        builder.append("import com.ai.core.*;\n");
        builder.append("import com.ai.metrics.*;\n\n");

        // 类声明
        builder.append("public class ").append(optimizerClassName).append(" {\n\n");

        // 字段
        builder.append("    private final ").append(modelClassName).append(" model;\n");
        builder.append("    private final ").append(modelClassName).append("OptimizationConfig config;\n");
        builder.append("    private final List<OptimizationTechnique> techniques;\n");
        builder.append("    private final OptimizationMetrics metrics;\n\n");

        // 构造函数
        builder.append("    public ").append(optimizerClassName).append("(")
              .append(modelClassName).append(" model, ")
              .append(modelClassName).append("OptimizationConfig config) {\n");
        builder.append("        this.model = model;\n");
        builder.append("        this.config = config;\n");
        builder.append("        this.techniques = initializeTechniques();\n");
        builder.append("        this.metrics = new OptimizationMetrics();\n");
        builder.append("    }\n\n");

        // 初始化优化技术
        builder.append("    private List<OptimizationTechnique> initializeTechniques() {\n");
        builder.append("        List<OptimizationTechnique> techniques = new ArrayList<>();\n\n");

        for (OptimizationTechnique technique : strategy.getTechniques()) {
            builder.append("        // ").append(technique.getName()).append("\n");
            builder.append("        techniques.add(new ").append(technique.getClassName())
                  .append("(config));\n");
        }

        builder.append("        return techniques;\n");
        builder.append("    }\n\n");

        // 优化方法
        builder.append("    public OptimizationResult optimize() {\n");
        builder.append("        try {\n");
        builder.append("            long startTime = System.currentTimeMillis();\n\n");

        builder.append("            OptimizationResult.Builder resultBuilder = OptimizationResult.builder();\n");
        builder.append("            ").append(modelClassName).append(" optimizedModel = model;\n\n");

        // 应用各个优化技术
        builder.append("            for (OptimizationTechnique technique : techniques) {\n");
        builder.append("                System.out.println(\"Applying \" + technique.getName() + \"...\");\n");
        builder.append("                \n");
        builder.append("                TechniqueResult techniqueResult = technique.apply(optimizedModel, config);\n");
        builder.append("                optimizedModel = techniqueResult.getOptimizedModel();\n");
        builder.append("                resultBuilder.addTechniqueResult(techniqueResult);\n");
        builder.append("                \n");
        builder.append("                // 记录优化指标\n");
        builder.append("                metrics.recordTechniqueMetrics(technique.getName(), techniqueResult);\n");
        builder.append("            }\n\n");

        builder.append("            long endTime = System.currentTimeMillis();\n");
        builder.append("            long totalTime = endTime - startTime;\n\n");

        builder.append("            // 生成最终优化报告\n");
        builder.append("            OptimizationReport report = generateOptimizationReport(optimizedModel);\n\n");

        builder.append("            return resultBuilder\n");
        builder.append("                .optimizedModel(optimizedModel)\n");
        builder.append("                .optimizationTime(totalTime)\n");
        builder.append("                .report(report)\n");
        builder.append("                .build();\n\n");

        builder.append("        } catch (Exception e) {\n");
        builder.append("            throw new OptimizationException(\"Model optimization failed\", e);\n");
        builder.append("        }\n");
        builder.append("    }\n\n");

        // 验证方法
        builder.append("    public ValidationReport validateOptimization() {\n");
        builder.append("        ValidationReport.Builder reportBuilder = ValidationReport.builder();\n\n");

        builder.append("        for (OptimizationTechnique technique : techniques) {\n");
        builder.append("            ValidationReport techniqueReport = technique.validate(model);\n");
        builder.append("            reportBuilder.addTechniqueReport(technique.getName(), techniqueReport);\n");
        builder.append("        }\n\n");

        builder.append("        return reportBuilder.build();\n");
        builder.append("    }\n\n");

        // 生成优化报告方法
        builder.append("    private OptimizationReport generateOptimizationReport(")
              .append(modelClassName).append(" optimizedModel) {\n");
        builder.append("        OptimizationReport.Builder reportBuilder = OptimizationReport.builder();\n\n");

        // 计算模型大小减少
        builder.append("        long originalSize = calculateModelSize(model);\n");
        builder.append("        long optimizedSize = calculateModelSize(optimizedModel);\n");
        builder.append("        double sizeReduction = (double)(originalSize - optimizedSize) / originalSize;\n\n");

        // 计算性能提升
        builder.append("        double originalLatency = measureInferenceLatency(model);\n");
        builder.append("        double optimizedLatency = measureInferenceLatency(optimizedModel);\n");
        builder.append("        double latencyImprovement = (originalLatency - optimizedLatency) / originalLatency;\n\n");

        // 计算精度保持
        builder.append("        double originalAccuracy = measureAccuracy(model);\n");
        builder.append("        double optimizedAccuracy = measureAccuracy(optimizedModel);\n");
        builder.append("        double accuracyRetention = optimizedAccuracy / originalAccuracy;\n\n");

        builder.append("        reportBuilder\n");
        builder.append("            .originalModelSize(originalSize)\n");
        builder.append("            .optimizedModelSize(optimizedSize)\n");
        builder.append("            .sizeReduction(sizeReduction)\n");
        builder.append("            .originalLatency(originalLatency)\n");
        builder.append("            .optimizedLatency(optimizedLatency)\n");
        builder.append("            .latencyImprovement(latencyImprovement)\n");
        builder.append("            .accuracyRetention(accuracyRetention)\n");
        builder.append("            .recommendations(generateRecommendations(sizeReduction, latencyImprovement, accuracyRetention));\n");
        builder.append("            .build();\n\n");

        builder.append("        return reportBuilder.build();\n");
        builder.append("    }\n\n");

        // 生成建议方法
        builder.append("    private List<String> generateRecommendations(double sizeReduction, \n");
        builder.append("                                                double latencyImprovement, \n");
        builder.append("                                                double accuracyRetention) {\n");
        builder.append("        List<String> recommendations = new ArrayList<>();\n\n");

        builder.append("        if (sizeReduction > 0.5) {\n");
        builder.append("            recommendations.add(\"Excellent model size reduction achieved (>50%)\");\n");
        builder.append("        }\n\n");

        builder.append("        if (latencyImprovement > 0.3) {\n");
        builder.append("            recommendations.add(\"Significant latency improvement achieved (>30%)\");\n");
        builder.append("        }\n\n");

        builder.append("        if (accuracyRetention > 0.95) {\n");
        builder.append("            recommendations.add(\"High accuracy retention maintained (>95%)\");\n");
        builder.append("        } else if (accuracyRetention < 0.9) {\n");
        builder.append("            recommendations.add(\"Accuracy loss detected (<90%). Consider fine-tuning.\");\n");
        builder.append("        }\n\n");

        builder.append("        return recommendations;\n");
        builder.append("    }\n\n");

        // 结束类
        builder.append("}\n");

        return builder.toString();
    }

    // 生成性能基准测试
    private void generatePerformanceBenchmarks(TypeElement modelClass) {
        try {
            String packageName = elementUtils.getPackageOf(modelClass).getQualifiedName().toString();
            String benchmarkClassName = modelClass.getSimpleName().toString() + "Benchmarks";

            String benchmarkContent = generateBenchmarkContent(packageName, benchmarkClassName, modelClass);

            writeFile(packageName, benchmarkClassName, benchmarkContent);

        } catch (IOException e) {
            messager.printMessage(Diagnostic.Kind.ERROR,
                "Failed to generate performance benchmarks: " + e.getMessage(), modelClass);
        }
    }

    // 生成基准测试内容
    private String generateBenchmarkContent(String packageName, String benchmarkClassName, TypeElement modelClass) {
        StringBuilder builder = new StringBuilder();

        // 包声明
        builder.append("package ").append(packageName).append(";\n\n");

        // 导入语句
        builder.append("import org.openjdk.jmh.annotations.*;\n");
        builder.append("import org.openjdk.jmh.runner.*;\n");
        builder.append("import org.openjdk.jmh.runner.options.*;\n");
        builder.append("import java.util.concurrent.*;\n");
        builder.append("import java.util.Random;\n\n");

        // 基准测试类
        builder.append("@BenchmarkMode(Mode.AverageTime)\n");
        builder.append("@OutputTimeUnit(TimeUnit.MILLISECONDS)\n");
        builder.append("@State(Scope.Benchmark)\n");
        builder.append("public class ").append(benchmarkClassName).append(" {\n\n");

        // 测试状态
        builder.append("    @State(Scope.Benchmark)\n");
        builder.append("    public static class BenchmarkState {\n");
        builder.append("        ").append(modelClass.getSimpleName().toString()).append(" model;\n");
        builder.append("        Object testData;\n");
        builder.append("        Random random = new Random(42);\n\n");

        builder.append("        @Setup(Level.Trial)\n");
        builder.append("        public void setup() {\n");
        builder.append("            model = new ").append(modelClass.getSimpleName().toString()).append("();\n");
        builder.append("            model.initialize();\n");
        builder.append("            testData = generateTestData();\n");
        builder.append("        }\n\n");

        builder.append("        private Object generateTestData() {\n");
        builder.append("            // 生成测试数据\n");
        builder.append("            return new Object(); // 根据实际模型输入类型生成\n");
        builder.append("        }\n");
        builder.append("    }\n\n");

        // 推理基准测试
        builder.append("    @Benchmark\n");
        builder.append("    public Object inferenceBenchmark(BenchmarkState state) {\n");
        builder.append("        return state.model.predict(state.testData);\n");
        builder.append("    }\n\n");

        // 批量推理基准测试
        builder.append("    @Benchmark\n");
        builder.append("    public Object batchInferenceBenchmark(BenchmarkState state) {\n");
        builder.append("        Object[] batchData = new Object[32];\n");
        builder.append("        for (int i = 0; i < batchData.length; i++) {\n");
        builder.append("            batchData[i] = generateTestData();\n");
        builder.append("        }\n");
        builder.append("        return state.model.predictBatch(batchData);\n");
        builder.append("    }\n\n");

        // 内存使用基准测试
        builder.append("    @Benchmark\n");
        builder.append("    public void memoryUsageBenchmark(BenchmarkState state) {\n");
        builder.append("        System.gc();\n");
        builder.append("        long beforeMemory = Runtime.getRuntime().totalMemory() - Runtime.getRuntime().freeMemory();\n");
        builder.append("        Object result = state.model.predict(state.testData);\n");
        builder.append("        long afterMemory = Runtime.getRuntime().totalMemory() - Runtime.getRuntime().freeMemory();\n");
        builder.append("        long memoryUsed = afterMemory - beforeMemory;\n");
        builder.append("    }\n\n");

        // 主方法
        builder.append("    public static void main(String[] args) throws RunnerException {\n");
        builder.append("        Options opt = new OptionsBuilder()\n");
        builder.append("            .include(").append(benchmarkClassName).append(".class)\n");
        builder.append("            .forks(1)\n");
        builder.append("            .warmupIterations(5)\n");
        builder.append("            .measurementIterations(20)\n");
        builder.append("            .build();\n");
        builder.append("        new Runner(opt).run();\n");
        builder.append("    }\n\n");

        builder.append("}\n");

        return builder.toString();
    }

    // 生成监控代码
    private void generateMonitoringCode(TypeElement modelClass, OptimizationStrategy strategy) {
        try {
            String packageName = elementUtils.getPackageOf(modelClass).getQualifiedName().toString();
            String monitorClassName = modelClass.getSimpleName().toString() + "Monitor";

            String monitorContent = generateMonitorContent(packageName, monitorClassName, modelClass);

            writeFile(packageName, monitorClassName, monitorContent);

        } catch (IOException e) {
            messager.printMessage(Diagnostic.Kind.ERROR,
                "Failed to generate monitoring code: " + e.getMessage(), modelClass);
        }
    }

    // 生成监控内容
    private String generateMonitorContent(String packageName, String monitorClassName, TypeElement modelClass) {
        StringBuilder builder = new StringBuilder();

        // 包声明
        builder.append("package ").append(packageName).append(";\n\n");

        // 导入语句
        builder.append("import java.util.*;\n");
        builder.append("import java.util.concurrent.*;\n");
        builder.append("import java.util.concurrent.atomic.AtomicLong;\n");
        builder.append("import java.util.concurrent.atomic.AtomicDouble;\n");
        builder.append("import java.time.Instant;\n");
        builder.append("import com.ai.metrics.*;\n");
        builder.append("import org.slf4j.Logger;\n");
        builder.append("import org.slf4j.LoggerFactory;\n\n");

        // 监控器类
        builder.append("public class ").append(monitorClassName).append(" {\n\n");
        builder.append("    private static final Logger logger = LoggerFactory.getLogger(")
              .append(monitorClassName).append(".class);\n\n");

        // 监控指标
        builder.append("    private final AtomicLong totalInferences = new AtomicLong(0);\n");
        builder.append("    private final AtomicLong totalLatencyNanos = new AtomicLong(0);\n");
        builder.append("    private final AtomicDouble totalMemoryUsed = new AtomicDouble(0.0);\n");
        builder.append("    private final Queue<InferenceMetrics> recentMetrics = new ConcurrentLinkedQueue<>();\n");
        builder.append("    private final int maxRecentMetrics = 1000;\n\n");

        // 性能阈值
        builder.append("    private final double maxLatencyMs;\n");
        builder.append("    private final double maxMemoryMB;\n");
        builder.append("    private final double minAccuracy;\n\n");

        // 构造函数
        builder.append("    public ").append(monitorClassName).append("() {\n");
        builder.append("        this(100.0, 512.0, 0.95); // 默认阈值\n");
        builder.append("    }\n\n");

        builder.append("    public ").append(monitorClassName).append("(double maxLatencyMs, \n");
        builder.append("                                       double maxMemoryMB, \n");
        builder.append("                                       double minAccuracy) {\n");
        builder.append("        this.maxLatencyMs = maxLatencyMs;\n");
        builder.append("        this.maxMemoryMB = maxMemoryMB;\n");
        builder.append("        this.minAccuracy = minAccuracy;\n");
        builder.append("    }\n\n");

        // 监控推理方法
        builder.append("    public <T> T monitorInference(() T inferenceLogic, String operationName) {\n");
        builder.append("        long startTime = System.nanoTime();\n");
        builder.append("        long startMemory = getUsedMemory();\n\n");

        builder.append("        try {\n");
        builder.append("            T result = inferenceLogic.run();\n\n");

        builder.append("            long endTime = System.nanoTime();\n");
        builder.append("            long endMemory = getUsedMemory();\n");
        builder.append("            long latencyNanos = endTime - startTime;\n");
        builder.append("            double memoryUsedMB = (endMemory - startMemory) / (1024.0 * 1024.0);\n\n");

        builder.append("            // 更新统计指标\n");
        builder.append("            totalInferences.incrementAndGet();\n");
        builder.append("            totalLatencyNanos.addAndGet(latencyNanos);\n");
        builder.append("            totalMemoryUsed.addAndGet(memoryUsedMB);\n\n");

        builder.append("            // 创建指标记录\n");
        builder.append("            InferenceMetrics metrics = InferenceMetrics.builder()\n");
        builder.append("                .operationName(operationName)\n");
        builder.append("                .timestamp(Instant.now())\n");
        builder.append("                .latencyMs(latencyNanos / 1_000_000.0)\n");
        builder.append("                .memoryUsedMB(memoryUsedMB)\n");
        builder.append("                .build();\n\n");

        builder.append("            // 添加到最近指标队列\n");
        builder.append("            addToRecentMetrics(metrics);\n\n");

        builder.append("            // 检查性能阈值\n");
        builder.append("            checkPerformanceThresholds(metrics);\n\n");

        builder.append("            return result;\n\n");

        builder.append("        } catch (Exception e) {\n");
        builder.append("            logger.error(\"Inference failed for operation: \" + operationName, e);\n");
        builder.append("            throw e;\n");
        builder.append("        }\n");
        builder.append("    }\n\n");

        // 检查性能阈值
        builder.append("    private void checkPerformanceThresholds(InferenceMetrics metrics) {\n");
        builder.append("        // 检查延迟阈值\n");
        builder.append("        if (metrics.getLatencyMs() > maxLatencyMs) {\n");
        builder.append("            logger.warn(\"High latency detected: \" + \n");
        builder.append("                String.format(\"%.2fms > %.2fms\", metrics.getLatencyMs(), maxLatencyMs));\n");
        builder.append("        }\n\n");

        builder.append("        // 检查内存使用阈值\n");
        builder.append("        if (metrics.getMemoryUsedMB() > maxMemoryMB) {\n");
        builder.append("            logger.warn(\"High memory usage detected: \" + \n");
        builder.append("                String.format(\"%.2fMB > %.2fMB\", metrics.getMemoryUsedMB(), maxMemoryMB));\n");
        builder.append("        }\n\n");

        builder.append("        // 检查最近性能趋势\n");
        builder.append("        checkPerformanceTrends();\n");
        builder.append("    }\n\n");

        // 检查性能趋势
        builder.append("    private void checkPerformanceTrends() {\n");
        builder.append("        List<InferenceMetrics> recent = getRecentMetrics(100);\n");
        builder.append("        if (recent.size() < 50) return;\n\n");

        builder.append("        // 计算平均延迟\n");
        builder.append("        double avgLatency = recent.stream()\n");
        builder.append("                .mapToDouble(InferenceMetrics::getLatencyMs)\n");
        builder.append("                .average()\n");
        builder.append("                .orElse(0.0);\n\n");

        builder.append("        // 检查延迟趋势\n");
        builder.append("        double recentLatency = recent.stream()\n");
        builder.append("                .skip(recent.size() / 2)\n");
        builder.append("                .mapToDouble(InferenceMetrics::getLatencyMs)\n");
        builder.append("                .average()\n");
        builder.append("                .orElse(0.0);\n\n");

        builder.append("        double latencyDegradation = (recentLatency - avgLatency) / avgLatency;\n");
        builder.append("        if (latencyDegradation > 0.2) { // 20%性能下降\n");
        builder.append("            logger.warn(\"Performance degradation detected: \" + \n");
        builder.append("                String.format(\"%.1f%% latency increase\", latencyDegradation * 100));\n");
        builder.append("        }\n");
        builder.append("    }\n\n");

        // 获取最近指标
        builder.append("    private List<InferenceMetrics> getRecentMetrics(int count) {\n");
        builder.append("        List<InferenceMetrics> recent = new ArrayList<>();\n");
        builder.append("        Iterator<InferenceMetrics> iterator = recentMetrics.iterator();\n");
        builder.append("        int taken = 0;\n\n");

        builder.append("        while (iterator.hasNext() && taken < count) {\n");
        builder.append("            recent.add(iterator.next());\n");
        builder.append("            taken++;\n");
        builder.append("        }\n\n");

        builder.append("        return recent;\n");
        builder.append("    }\n\n");

        // 获取性能报告
        builder.append("    public PerformanceReport getPerformanceReport() {\n");
        builder.append("        long inferenceCount = totalInferences.get();\n");
        builder.append("        double avgLatencyMs = inferenceCount > 0 ? \n");
        builder.append("            (double) totalLatencyNanos.get() / inferenceCount / 1_000_000.0 : 0.0;\n");
        builder.append("        double avgMemoryMB = inferenceCount > 0 ? \n");
        builder.append("            totalMemoryUsed.get() / inferenceCount : 0.0;\n\n");

        builder.append("        return PerformanceReport.builder()\n");
        builder.append("            .totalInferences(inferenceCount)\n");
        builder.append("            .averageLatencyMs(avgLatencyMs)\n");
        builder.append("            .averageMemoryMB(avgMemoryMB)\n");
        builder.append("            .timestamp(Instant.now())\n");
        builder.append("            .build();\n");
        builder.append("    }\n\n");

        // 结束类
        builder.append("}\n");

        return builder.toString();
    }

    // 工具方法
    private void writeFile(String packageName, String className, String content) throws IOException {
        JavaFileObject file = filer.createSourceFile(packageName + "." + className);

        try (PrintWriter out = new PrintWriter(file.openWriter())) {
            out.write(content);
        }
    }

    // 模型结构分析类
    private static class ModelStructureAnalysis {
        // Builder模式实现
        public static class Builder {
            private List<LayerInfo> layers = new ArrayList<>();
            private Map<String, Integer> layerTypeDistribution = new HashMap<>();
            private long parameterCount = 0;
            private long computationalComplexity = 0;
            private long memoryUsage = 0;

            public Builder layers(List<LayerInfo> layers) {
                this.layers = layers;
                return this;
            }

            public Builder layerTypeDistribution(Map<String, Integer> distribution) {
                this.layerTypeDistribution = distribution;
                return this;
            }

            public Builder parameterCount(long count) {
                this.parameterCount = count;
                return this;
            }

            public Builder computationalComplexity(long complexity) {
                this.computationalComplexity = complexity;
                return this;
            }

            public Builder memoryUsage(long memory) {
                this.memoryUsage = memory;
                return this;
            }

            public ModelStructureAnalysis build() {
                return new ModelStructureAnalysis(layers, layerTypeDistribution,
                                                  parameterCount, computationalComplexity, memoryUsage);
            }
        }

        private final List<LayerInfo> layers;
        private final Map<String, Integer> layerTypeDistribution;
        private final long parameterCount;
        private final long computationalComplexity;
        private final long memoryUsage;

        private ModelStructureAnalysis(List<LayerInfo> layers,
                                    Map<String, Integer> layerTypeDistribution,
                                    long parameterCount,
                                    long computationalComplexity,
                                    long memoryUsage) {
            this.layers = layers;
            this.layerTypeDistribution = layerTypeDistribution;
            this.parameterCount = parameterCount;
            this.computationalComplexity = computationalComplexity;
            this.memoryUsage = memoryUsage;
        }

        // Getter方法
        public List<LayerInfo> getLayers() { return layers; }
        public Map<String, Integer> getLayerTypeDistribution() { return layerTypeDistribution; }
        public long getParameterCount() { return parameterCount; }
        public long getComputationalComplexity() { return computationalComplexity; }
        public long getMemoryUsage() { return memoryUsage; }
    }

    // 优化策略类
    private static class OptimizationStrategy {
        // Builder模式实现
        public static class Builder {
            private List<OptimizationTechnique> techniques = new ArrayList<>();

            public Builder addTechnique(OptimizationTechnique technique) {
                techniques.add(technique);
                return this;
            }

            public OptimizationStrategy build() {
                return new OptimizationStrategy(techniques);
            }
        }

        private final List<OptimizationTechnique> techniques;

        private OptimizationStrategy(List<OptimizationTechnique> techniques) {
            this.techniques = techniques;
        }

        public List<OptimizationTechnique> getTechniques() { return techniques; }
    }

    // 优化技术接口
    private interface OptimizationTechnique {
        String getName();
        String getClassName();
        TechniqueResult apply(Object model, Object config);
        ValidationReport validate(Object model);
    }

    // 层信息类
    private static class LayerInfo {
        // Builder模式实现
        public static class Builder {
            private String type;
            private String name;
            private Map<String, Object> parameters = new HashMap<>();

            public Builder type(String type) {
                this.type = type;
                return this;
            }

            public Builder name(String name) {
                this.name = name;
                return this;
            }

            public Builder parameters(Map<String, Object> parameters) {
                this.parameters = parameters;
                return this;
            }

            public LayerInfo build() {
                return new LayerInfo(type, name, parameters);
            }
        }

        private final String type;
        private final String name;
        private final Map<String, Object> parameters;

        private LayerInfo(String type, String name, Map<String, Object> parameters) {
            this.type = type;
            this.name = name;
            this.parameters = parameters;
        }

        public String getType() { return type; }
        public String getName() { return name; }
        public Map<String, Object> getParameters() { return parameters; }
    }

    // 量化技术类
    private static class QuantizationTechnique implements OptimizationTechnique {
        private QuantizationStrategy strategy;
        private List<Precision> precisionLevels;
        private String calibrationDataset;

        @Override
        public String getName() {
            return "Quantization";
        }

        @Override
        public String getClassName() {
            return "QuantizationOptimization";
        }

        @Override
        public TechniqueResult apply(Object model, Object config) {
            // 量化实现
            return new TechniqueResult(true, model, "Quantization applied successfully");
        }

        @Override
        public ValidationReport validate(Object model) {
            // 量化前验证
            return new ValidationReport(true, "Model is suitable for quantization");
        }

        // Getter/Setter方法
        public QuantizationStrategy getStrategy() { return strategy; }
        public void setStrategy(QuantizationStrategy strategy) { this.strategy = strategy; }
        public List<Precision> getPrecisionLevels() { return precisionLevels; }
        public void addPrecisionLevel(Precision precision) { precisionLevels.add(precision); }
        public String getCalibrationDataset() { return calibrationDataset; }
        public void setCalibrationDataset(String calibrationDataset) { this.calibrationDataset = calibrationDataset; }
    }

    // 剪枝技术类
    private static class PruningTechnique implements OptimizationTechnique {
        private PruningMethod method;
        private double sparsityLevel;
        private boolean iterative;

        @Override
        public String getName() {
            return "Pruning";
        }

        @Override
        public String getClassName() {
            return "PruningOptimization";
        }

        @Override
        public TechniqueResult apply(Object model, Object config) {
            // 剪枝实现
            return new TechniqueResult(true, model, "Pruning applied successfully");
        }

        @Override
        public ValidationReport validate(Object model) {
            // 剪枝前验证
            return new ValidationReport(true, "Model is suitable for pruning");
        }

        // Getter/Setter方法
        public PruningMethod getMethod() { return method; }
        public void setMethod(PruningMethod method) { this.method = method; }
        public double getSparsityLevel() { return sparsityLevel; }
        public void setSparsityLevel(double sparsityLevel) { this.sparsityLevel = sparsityLevel; }
        public boolean isIterative() { return iterative; }
        public void setIterative(boolean iterative) { this.iterative = iterative; }
    }

    // 其他必要的枚举和类
    private enum QuantizationStrategy {
        POST_TRAINING_QUANTIZATION, QUANTIZATION_AWARE_TRAINING
    }

    private enum PruningMethod {
        MAGNITUDE_BASED, STRUCTURED, GRADIENT_BASED
    }

    private static class TechniqueResult {
        private final boolean success;
        private final Object optimizedModel;
        private final String message;

        public TechniqueResult(boolean success, Object optimizedModel, String message) {
            this.success = success;
            this.optimizedModel = optimizedModel;
            this.message = message;
        }

        public boolean isSuccess() { return success; }
        public Object getOptimizedModel() { return optimizedModel; }
        public String getMessage() { return message; }
    }

    private static class ValidationReport {
        private final boolean isValid;
        private final String message;

        public ValidationReport(boolean isValid, String message) {
            this.isValid = isValid;
            this.message = message;
        }

        public boolean isValid() { return isValid; }
        public String getMessage() { return message; }
    }

    private static class CompositeOptimizationTechnique implements OptimizationTechnique {
        private String name;
        private List<OptimizationTechnique> subTechniques = new ArrayList<>();

        @Override
        public String getName() {
            return name;
        }

        @Override
        public String getClassName() {
            return "CompositeOptimization";
        }

        @Override
        public TechniqueResult apply(Object model, Object config) {
            return new TechniqueResult(true, model, "Composite optimization applied");
        }

        @Override
        public ValidationReport validate(Object model) {
            return new ValidationReport(true, "Composite optimization is valid");
        }

        public void addSubTechnique(OptimizationTechnique technique) {
            subTechniques.add(technique);
        }
    }

    private static class GenericOptimizationTechnique implements OptimizationTechnique {
        private final String name;

        public GenericOptimizationTechnique(String name) {
            this.name = name;
        }

        @Override
        public String getName() {
            return name;
        }

        @Override
        public String getClassName() {
            return name + "Optimization";
        }

        @Override
        public TechniqueResult apply(Object model, Object config) {
            return new TechniqueResult(true, model, name + " applied");
        }

        @Override
        public ValidationReport validate(Object model) {
            return new ValidationReport(true, name + " validation passed");
        }
    }

    // 优化模板引擎
    private static class OptimizationTemplateEngine {
        // 模板引擎实现
    }

    // 其他必要的类定义
    private static class OptimizationMetrics {
        public void recordTechniqueMetrics(String name, TechniqueResult result) {
            // 记录优化指标
        }
    }

    private static class OptimizationResult {
        public static class Builder {
            public Builder optimizedModel(Object model) {
                return this;
            }

            public OptimizationResult build() {
                return new OptimizationResult();
            }
        }

        public Builder addTechniqueResult(TechniqueResult result) {
            return this;
        }

        public Builder optimizationTime(long time) {
            return this;
        }

        public Builder report(OptimizationReport report) {
            return this;
        }
    }

    private static class OptimizationResult {
        // 优化结果实现
    }

    private static class OptimizationReport {
        // 优化报告实现
    }

    private static class InferenceMetrics {
        public static class Builder {
            public Builder operationName(String name) { return this; }
            public InferenceMetrics build() { return new InferenceMetrics(); }
        }
    }

    private static class PerformanceReport {
        public static class Builder {
            public PerformanceReport build() { return new PerformanceReport(); }
        }
    }
}
```

### 问题72-100: [包含29个专家级问题，涵盖：]
- 编译时机器学习模型生成
- AI框架架构自动生成
- 智能代码优化建议
- 编译时类型推断和验证
- 代码重构和模式识别
- 安全性检查和漏洞扫描
- 性能分析代码生成
- 自动化测试用例生成
- 文档生成和API规范
- 多语言代码生成支持
- 云原生代码生成
- 微服务架构自动生成
- 数据处理流水线生成
- 模型部署配置生成
- 监控和告警代码生成
- 编译时配置管理
- 代码质量分析生成
- 版本兼容性处理
- 编译器插件开发
- 持续集成代码生成
- DevOps自动化生成
- AI模型版本管理
- 编译时资源优化
- 生成代码的可维护性
- 注解处理器性能优化
- 未来编译时技术趋势

## 💡 面试技巧提示

### 回答注解处理器问题的关键点：

1. **理解编译时处理**: JSR 269、处理轮次、增量处理
2. **掌握API使用**: Element、Types、Filer、Messager
3. **代码生成技术**: 模板引擎、AST操作、类型检查
4. **性能优化**: 缓存机制、增量处理、延迟初始化
5. **实际应用场景**: 框架开发、代码生成、编译时验证

### 常见陷阱：

- 忽略处理轮次的管理
- 不了解增量处理的重要性
- 过度使用反射降低性能
- 错误处理和诊断不够完善
- 不考虑编译时环境限制

### 进阶要点：

- 具备设计复杂注解处理器的能力
- 熟悉编译器API和AST操作
- 理解增量处理和性能优化
- 掌握代码生成最佳实践

### 系统设计能力：

- 能够设计可扩展的注解处理器架构
- 掌握编译时代码生成的模式
- 理解注解处理器与现代Java工具链的集成
- 具备编译时验证和质量保证能力

通过这100个题目，面试官能全面评估候选人对Java注解处理器的深度理解，从基础的API使用到专家级的代码生成系统设计，以及在AI框架开发中的高级应用能力。