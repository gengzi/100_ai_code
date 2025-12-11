# LangChain4j在Java中的应用 (100题)

## ⭐ 基础题 (1-30)

### 问题1: LangChain4j的核心组件和基础使用

**面试题**: 如何使用LangChain4j构建一个简单的AI问答系统？

**口语化答案**:
"LangChain4j是Java版的LangChain，提供了完整的LLM应用开发框架。我会这样构建问答系统：

```java
// LangChain4j配置类
@Configuration
public class LangChain4jConfiguration {

    @Bean
    public ChatLanguageModel chatLanguageModel() {
        return OpenAiChatModel.builder()
            .apiKey(System.getenv("OPENAI_API_KEY"))
            .modelName("gpt-3.5-turbo")
            .temperature(0.7)
            .build();
    }

    @Bean
    public EmbeddingModel embeddingModel() {
        return OpenAiEmbeddingModel.builder()
            .apiKey(System.getenv("OPENAI_API_KEY"))
            .build();
    }

    @Bean
    public EmbeddingStore embeddingStore() {
        // 使用内存向量存储（生产环境推荐使用Chroma、Pinecone等）
        return new InMemoryEmbeddingStore<>();
    }

    @Bean
    public ChatMemory chatMemory() {
        return new TokenWindowChatMemory(1000); // 1000 token的滑动窗口
    }
}

// 问答服务
@Service
@Slf4j
public class QAService {

    private final ChatLanguageModel chatLanguageModel;
    private final EmbeddingStore embeddingStore;
    private final EmbeddingModel embeddingModel;

    public QAService(ChatLanguageModel chatLanguageModel,
                     EmbeddingStore embeddingStore,
                     EmbeddingModel embeddingModel) {
        this.chatLanguageModel = chatLanguageModel;
        this.embeddingStore = embeddingStore;
        this.embeddingModel = embeddingModel;
    }

    // 简单问答
    public String simpleQA(String question) {
        Prompt prompt = Prompt.from("请回答以下问题：" + question);
        return chatLanguageModel.generate(prompt).content().text();
    }

    // 带上下文的问答
    public String contextualQA(String question, String context) {
        String systemPrompt = String.format(
            "你是一个专业的问答助手。请基于以下上下文信息回答用户问题：\n\n上下文：%s\n\n问题：%s",
            context, question
        );

        Prompt prompt = Prompt.from(systemPrompt);
        return chatLanguageModel.generate(prompt).content().text();
    }

    // 带记忆的对话
    public String conversationalQA(String sessionId, String question) {
        ChatMemory memory = getChatMemory(sessionId);

        UserMessage userMessage = UserMessage.from(question);
        memory.add(userMessage);

        List<Message> messages = memory.messages();
        Prompt prompt = Prompt.from(messages);

        AiMessage response = chatLanguageModel.generate(prompt).content();
        memory.add(response);

        return response.text();
    }

    // RAG问答
    public String ragQA(String question) {
        try {
            // 1. 检索相关文档
            List<TextSegment> relevantDocs = retrieveRelevantDocuments(question);

            // 2. 构建增强提示
            String enhancedPrompt = buildRAGPrompt(question, relevantDocs);

            // 3. 生成回答
            Prompt prompt = Prompt.from(enhancedPrompt);
            return chatLanguageModel.generate(prompt).content().text();

        } catch (Exception e) {
            log.error("RAG问答失败: question={}", question, e);
            return "抱歉，无法检索相关信息来回答您的问题。";
        }
    }

    private List<TextSegment> retrieveRelevantDocuments(String question) {
        try {
            // 将问题转换为嵌入向量
            Response<float[]> questionEmbedding = embeddingModel.embed(question);

            // 执行相似度搜索
            List<EmbeddingMatch<TextSegment>> matches = embeddingStore.findRelevant(
                questionEmbedding.content(),
                5, // top 5
                0.7 // threshold
            );

            // 提取文本段落
            return matches.stream()
                .map(EmbeddingMatch::embedded)
                .collect(Collectors.toList());

        } catch (Exception e) {
            log.error("文档检索失败", e);
            return Collections.emptyList();
        }
    }

    private String buildRAGPrompt(String question, List<TextSegment> relevantDocs) {
        StringBuilder promptBuilder = new StringBuilder();

        promptBuilder.append("你是一个专业的问答助手。请基于以下提供的上下文信息回答用户问题。\n\n");
        promptBuilder.append("上下文信息：\n");

        for (int i = 0; i < relevantDocs.size(); i++) {
            TextSegment doc = relevantDocs.get(i);
            promptBuilder.append(String.format("%d. %s\n", i + 1, doc.text()));
        }

        promptBuilder.append("\n用户问题：");
        promptBuilder.append(question);
        promptBuilder.append("\n\n请基于以上上下文信息回答用户问题。如果上下文中没有相关信息，请明确说明。");

        return promptBuilder.toString();
    }

    private ChatMemory getChatMemory sessionId) {
        // 在实际应用中，应该使用会话管理器
        return new TokenWindowChatMemory(1000);
    }

    // 添加文档到知识库
    public void addDocument(String content, Map<String, Object> metadata) {
        try {
            // 创建文本段落
            TextSegment textSegment = TextSegment.from(content, Metadata.from(metadata));

            // 生成嵌入向量
            Response<float[]> embedding = embeddingModel.embed(content);

            // 存储到向量数据库
            embeddingStore.add(embedding.content(), textSegment);

            log.info("文档添加成功，内容长度: {}", content.length());

        } catch (Exception e) {
            log.error("文档添加失败", e);
            throw new DocumentException("文档添加失败", e);
        }
    }

    // 批量添加文档
    public void addDocuments(List<Document> documents) {
        documents.parallelStream().forEach(doc -> {
            addDocument(doc.getContent(), doc.getMetadata());
        });
    }
}

// REST控制器
@RestController
@RequestMapping("/api/v1/qa")
@Slf4j
public class QAController {

    private final QAService qaService;

    public QAController(QAService qaService) {
        this.qaService = qaService;
    }

    @PostMapping("/simple")
    public ResponseEntity<String> simpleQA(@RequestBody QARequest request) {
        try {
            String answer = qaService.simpleQA(request.getQuestion());
            return ResponseEntity.ok(answer);
        } catch (Exception e) {
            log.error("简单问答失败", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("抱歉，问答服务暂时不可用。");
        }
    }

    @PostMapping("/contextual")
    public ResponseEntity<String> contextualQA(@RequestBody ContextualQARequest request) {
        try {
            String answer = qaService.contextualQA(request.getQuestion(), request.getContext());
            return ResponseEntity.ok(answer);
        } catch (Exception e) {
            log.error("上下文问答失败", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("抱歉，上下文问答服务暂时不可用。");
        }
    }

    @PostMapping("/conversational/{sessionId}")
    public ResponseEntity<String> conversationalQA(
            @PathVariable String sessionId,
            @RequestBody QARequest request) {

        try {
            String answer = qaService.conversationalQA(sessionId, request.getQuestion());
            return ResponseEntity.ok(answer);
        } catch (Exception e) {
            log.error("对话问答失败: sessionId={}", sessionId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("抱歉，对话问答服务暂时不可用。");
        }
    }

    @PostMapping("/rag")
    public ResponseEntity<String> ragQA(@RequestBody QARequest request) {
        try {
            String answer = qaService.ragQA(request.getQuestion());
            return ResponseEntity.ok(answer);
        } catch (Exception e) {
            log.error("RAG问答失败", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("抱歉，RAG问答服务暂时不可用。");
        }
    }

    @PostMapping("/documents")
    public ResponseEntity<Void> addDocument(@RequestBody Document document) {
        try {
            qaService.addDocument(document.getContent(), document.getMetadata());
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            log.error("添加文档失败", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping("/documents/batch")
    public ResponseEntity<Void> addDocuments(@RequestBody List<Document> documents) {
        try {
            qaService.addDocuments(documents);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            log.error("批量添加文档失败", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}

// 工具函数服务
@Component
public class ToolsService {

    private final WeatherService weatherService;
    private final CalculatorService calculatorService;

    public ToolsService(WeatherService weatherService, CalculatorService calculatorService) {
        this.weatherService = weatherService;
        this.calculatorService = calculatorService;
    }

    @Tool("获取指定城市的当前天气信息")
    public String getCurrentWeather(@P("城市名称") String city) {
        try {
            WeatherInfo weather = weatherService.getWeather(city);
            return String.format("%s的天气：%s，温度：%.1f°C，湿度：%.1f%%",
                city, weather.getDescription(), weather.getTemperature(), weather.getHumidity());
        } catch (Exception e) {
            return "抱歉，无法获取" + city + "的天气信息。";
        }
    }

    @Tool("执行数学计算")
    public String calculate(@P("数学表达式") String expression) {
        try {
            double result = calculatorService.calculate(expression);
            return String.format("计算结果：%s = %.2f", expression, result);
        } catch (Exception e) {
            return "抱歉，无法执行数学计算：" + expression;
        }
    }

    @Tool("获取当前时间")
    public String getCurrentTime() {
        return "当前时间：" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
    }
}

// 带工具的问答服务
@Service
@Slf4j
public class ToolQAService {

    private final ChatLanguageModel chatLanguageModel;
    private final ToolsService toolsService;

    public ToolQAService(ChatLanguageModel chatLanguageModel, ToolsService toolsService) {
        this.chatLanguageModel = chatLanguageModel;
        this.toolsService = toolsService;
    }

    public String qaWithTools(String question) {
        try {
            // 创建带有工具的聊天模型
            ChatLanguageModel toolEnabledModel = ChatLanguageModel.builder()
                .chatLanguageModel(chatLanguageModel)
                .tools(toolsService)
                .build();

            Prompt prompt = Prompt.from(question);
            return toolEnabledModel.generate(prompt).content().text();

        } catch (Exception e) {
            log.error("工具问答失败: question={}", question, e);
            return "抱歉，工具问答服务暂时不可用。";
        }
    }
}

// 请求和响应DTO
public record QARequest(String question) {}

public record ContextualQARequest(String question, String context) {}

public record Document(String content, Map<String, Object> metadata) {}

public record WeatherInfo(String description, double temperature, double humidity) {}

// 服务接口
public interface WeatherService {
    WeatherInfo getWeather(String city);
}

public interface CalculatorService {
    double calculate(String expression);
}
```

## ⭐⭐ 进阶题 (31-70)

### 问题31: LangChain4j链式处理和Agent架构

**面试题**: 如何使用LangChain4j构建复杂的处理链和智能Agent？

**口语化答案**:
"我会设计处理链来组合多个处理步骤，并构建智能Agent来自动决策：

```java
// 链式处理服务
@Service
@Slf4j
public class ChainService {

    private final ChatLanguageModel chatLanguageModel;
    private final EmbeddingModel embeddingModel;
    private final EmbeddingStore embeddingStore;

    public ChainService(ChatLanguageModel chatLanguageModel,
                        EmbeddingModel embeddingModel,
                        EmbeddingStore embeddingStore) {
        this.chatLanguageModel = chatLanguageModel;
        this.embeddingModel = embeddingModel;
        this.embeddingStore = embeddingStore;
    }

    // 文档处理链
    public String processDocumentChain(String documentContent) {
        try {
            // 1. 文档摘要链
            String summary = documentSummaryChain(documentContent);

            // 2. 关键信息提取链
            Map<String, String> keyInfo = extractKeyInfoChain(documentContent);

            // 3. 分类链
            String category = classificationChain(documentContent);

            // 4. 生成最终结果
            return String.format(
                "文档处理完成\n摘要：%s\n关键信息：%s\n分类：%s",
                summary, keyInfo, category
            );

        } catch (Exception e) {
            log.error("文档处理链失败", e);
            return "文档处理失败：" + e.getMessage();
        }
    }

    private String documentSummaryChain(String content) {
        Chain<String> chain = new LLMChain<>(
            PromptTemplate.from("请为以下文档生成一个简洁的摘要（不超过100字）：\n\n{{content}}"),
            chatLanguageModel
        );

        Map<String, Object> variables = Map.of("content", content);
        return chain.apply(variables);
    }

    private Map<String, String> extractKeyInfoChain(String content) {
        Chain<String> chain = new LLMChain<>(
            PromptTemplate.from(
                "从以下文档中提取关键信息（公司名称、日期、金额、重要人物等），" +
                "并以JSON格式返回：\n\n{{content}}"
            ),
            chatLanguageModel
        );

        Map<String, Object> variables = Map.of("content", content);
        String result = chain.apply(variables);

        try {
            // 简化的JSON解析
            return parseKeyInfo(result);
        } catch (Exception e) {
            log.warn("关键信息解析失败", e);
            return Map.of("error", "解析失败");
        }
    }

    private String classificationChain(String content) {
        Chain<String> chain = new LLMChain<>(
            PromptTemplate.from(
                "请将以下文档分类到以下类别之一：" +
                "['新闻', '报告', '邮件', '合同', '其他']。" +
                "只返回类别名称：\n\n{{content}}"
            ),
            chatLanguageModel
        );

        Map<String, Object> variables = Map.of("content", content);
        return chain.apply(variables).trim();
    }

    private Map<String, String> parseKeyInfo(String json) {
        // 简化的JSON解析逻辑
        Map<String, String> keyInfo = new HashMap<>();
        keyInfo.put("extracted", json);
        return keyInfo;
    }

    // RAG处理链
    public String ragProcessingChain(String query) {
        try {
            // 1. 查询理解链
            String enhancedQuery = queryUnderstandingChain(query);

            // 2. 文档检索链
            List<TextSegment> relevantDocs = documentRetrievalChain(enhancedQuery);

            // 3. 上下文整合链
            String integratedContext = contextIntegrationChain(enhancedQuery, relevantDocs);

            // 4. 答案生成链
            String answer = answerGenerationChain(enhancedQuery, integratedContext);

            // 5. 答案验证链
            String validatedAnswer = answerValidationChain(answer, integratedContext);

            return validatedAnswer;

        } catch (Exception e) {
            log.error("RAG处理链失败: query={}", query, e);
            return "RAG处理失败：" + e.getMessage();
        }
    }

    private String queryUnderstandingChain(String query) {
        Chain<String> chain = new LLMChain<>(
            PromptTemplate.from(
                "请理解并扩展用户的查询，使其更加具体和全面：" +
                "原查询：{{query}}" +
                "扩展后的查询："
            ),
            chatLanguageModel
        );

        Map<String, Object> variables = Map.of("query", query);
        return chain.apply(variables);
    }

    private List<TextSegment> documentRetrievalChain(String enhancedQuery) {
        try {
            // 生成查询嵌入
            Response<float[]> embedding = embeddingModel.embed(enhancedQuery);

            // 检索相关文档
            List<EmbeddingMatch<TextSegment>> matches = embeddingStore.findRelevant(
                embedding.content(), 5, 0.7);

            return matches.stream()
                .map(EmbeddingMatch::embedded)
                .collect(Collectors.toList());

        } catch (Exception e) {
            log.error("文档检索失败", e);
            return Collections.emptyList();
        }
    }

    private String contextIntegrationChain(String query, List<TextSegment> documents) {
        Chain<String> chain = new LLMChain<>(
            PromptTemplate.from(
                "请将用户查询与检索到的文档信息整合，" +
                "生成一个连贯的上下文信息：" +
                "用户查询：{{query}}" +
                "相关文档：{{documents}}" +
                "整合后的上下文："
            ),
            chatLanguageModel
        );

        Map<String, Object> variables = Map.of(
            "query", query,
            "documents", documents.stream()
                .map(TextSegment::text)
                .collect(Collectors.joining("\n\n"))
        );

        return chain.apply(variables);
    }

    private String answerGenerationChain(String query, String context) {
        Chain<String> chain = new LLMChain<>(
            PromptTemplate.from(
                "基于以下上下文信息，回答用户问题：" +
                "上下文：{{context}}" +
                "问题：{{query}}" +
                "回答："
            ),
            chatLanguageModel
        );

        Map<String, Object> variables = Map.of("query", query, "context", context);
        return chain.apply(variables);
    }

    private String answerValidationChain(String answer, String context) {
        Chain<String> chain = new LLMChain<>(
            PromptTemplate.from(
                "请验证以下答案是否基于提供的上下文信息，" +
                "如果不相关或不准确，请指出问题：" +
                "上下文：{{context}}" +
                "答案：{{answer}}" +
                "验证结果："
            ),
            chatLanguageModel
        );

        Map<String, Object> variables = Map.of("answer", answer, "context", context);
        String validation = chain.apply(variables);

        // 如果验证通过，返回原答案；否则返回验证结果
        return validation.contains("准确") || validation.contains("相关") ? answer : validation;
    }
}

// 智能Agent服务
@Service
@Slf4j
public class IntelligentAgentService {

    private final ChatLanguageModel chatLanguageModel;
    private final Map<String, Tool> availableTools;
    private final ConversationMemory conversationMemory;

    public IntelligentAgentService(ChatLanguageModel chatLanguageModel,
                                    List<Tool> tools,
                                    ConversationMemory conversationMemory) {
        this.chatLanguageModel = chatLanguageModel;
        this.conversationMemory = conversationMemory;
        this.availableTools = tools.stream()
            .collect(Collectors.toMap(Tool::getName, Function.identity()));
    }

    // 智能Agent对话
    public String agentConversation(String sessionId, String userInput) {
        try {
            // 1. 意图识别
            String intent = intentRecognition(userInput);

            // 2. 工具选择
            List<String> selectedTools = toolSelection(intent, userInput);

            // 3. 执行工具链
            String toolResults = executeToolChain(selectedTools, userInput);

            // 4. 生成最终响应
            String response = generateResponse(userInput, intent, toolResults);

            // 5. 保存对话记忆
            conversationMemory.add(new UserMessage(userInput));
            conversationMemory.add(new AiMessage(response));

            return response;

        } catch (Exception e) {
            log.error("Agent对话处理失败: sessionId={}", sessionId, e);
            return "抱歉，智能代理暂时无法处理您的请求。";
        }
    }

    private String intentRecognition(String userInput) {
        Chain<String> chain = new LLMChain<>(
            PromptTemplate.from(
                "识别用户意图，返回以下意图之一：" +
                "['search', 'calculate', 'weather', 'translate', 'general', 'help']" +
                "用户输入：{{input}}" +
                "意图："
            ),
            chatLanguageModel
        );

        Map<String, Object> variables = Map.of("input", userInput);
        String intent = chain.apply(variables).trim().toLowerCase();

        return intent.contains("search") ? "search" :
               intent.contains("calculate") ? "calculate" :
               intent.contains("weather") ? "weather" :
               intent.contains("translate") ? "translate" :
               intent.contains("help") ? "help" : "general";
    }

    private List<String> toolSelection(String intent, String userInput) {
        Chain<String> chain = new LLMChain<>(
            PromptTemplate.from(
                "基于用户意图和输入，选择需要的工具：" +
                "可用工具：{{tools}}" +
                "用户意图：{{intent}}" +
                "用户输入：{{input}}" +
                "选中的工具（用逗号分隔）："
            ),
            chatLanguageModel
        );

        Map<String, Object> variables = Map.of(
            "intent", intent,
            "input", userInput,
            "tools", String.join(", ", availableTools.keySet())
        );

        String selectedToolsStr = chain.apply(variables);
        return Arrays.stream(selectedToolsStr.split(","))
            .map(String::trim)
            .filter(availableTools::containsKey)
            .collect(Collectors.toList());
    }

    private String executeToolChain(List<String> toolNames, String userInput) {
        if (toolNames.isEmpty()) {
            return "无需使用工具。";
        }

        StringBuilder results = new StringBuilder();
        for (String toolName : toolNames) {
            try {
                Tool tool = availableTools.get(toolName);
                String toolInput = extractToolInput(toolName, userInput);
                Object toolResult = tool.run(toolInput);
                results.append(String.format("%s工具结果：%s\n", toolName, toolResult));
            } catch (Exception e) {
                log.warn("工具执行失败: tool={}", toolName, e);
                results.append(String.format("%s工具执行失败：%s\n", toolName, e.getMessage()));
            }
        }

        return results.toString();
    }

    private String extractToolInput(String toolName, String userInput) {
        Chain<String> chain = new LLMChain<>(
            PromptTemplate.from(
                "为指定工具提取参数：" +
                "工具名称：{{toolName}}" +
                "用户输入：{{input}}" +
                "工具参数："
            ),
            chatLanguageModel
        );

        Map<String, Object> variables = Map.of("toolName", toolName, "input", userInput);
        return chain.apply(variables);
    }

    private String generateResponse(String userInput, String intent, String toolResults) {
        Chain<String> chain = new LLMChain<>(
            PromptTemplate.from(
                "作为智能助手，基于用户意图、输入和工具结果，生成自然友好的回复：" +
                "用户输入：{{input}}" +
                "识别意图：{{intent}}" +
                "工具结果：{{toolResults}}" +
                "回复："
            ),
            chatLanguageModel
        );

        Map<String, Object> variables = Map.of(
            "input", userInput,
            "intent", intent,
            "toolResults", toolResults.isEmpty() ? "无" : toolResults
        );

        return chain.apply(variables);
    }

    // 复杂任务规划
    public String planAndExecuteComplexTask(String sessionId, String taskDescription) {
        try {
            // 1. 任务分解
            List<String> subtasks = taskDecomposition(taskDescription);

            // 2. 子任务规划
            List<SubTaskPlan> plans = subtaskPlanning(subtasks);

            // 3. 执行子任务
            List<String> results = executeSubtasks(plans);

            // 4. 结果整合
            String integratedResult = integrateResults(taskDescription, results);

            // 5. 保存到记忆
            conversationMemory.add(new UserMessage("复杂任务：" + taskDescription));
            conversationMemory.add(new AiMessage("任务结果：" + integratedResult));

            return integratedResult;

        } catch (Exception e) {
            log.error("复杂任务执行失败", e);
            return "抱歉，无法执行复杂任务：" + e.getMessage();
        }
    }

    private List<String> taskDecomposition(String taskDescription) {
        Chain<String> chain = new LLMChain<>(
            PromptTemplate.from(
                "将复杂任务分解为多个子任务：" +
                "任务描述：{{task}}" +
                "子任务列表（每行一个）："
            ),
            chatLanguageModel
        );

        Map<String, Object> variables = Map.of("task", taskDescription);
        String result = chain.apply(variables);

        return Arrays.stream(result.split("\n"))
            .map(String::trim)
            .filter(line -> !line.isEmpty())
            .collect(Collectors.toList());
    }

    private List<SubTaskPlan> subtaskPlanning(List<String> subtasks) {
        List<SubTaskPlan> plans = new ArrayList<>();

        for (int i = 0; i < subtasks.size(); i++) {
            String subtask = subtasks.get(i);

            Chain<String> chain = new LLMChain<>(
                PromptTemplate.from(
                    "为子任务制定执行计划：" +
                    "子任务：{{subtask}}" +
                    "执行计划（工具名称:参数）："
                ),
                chatLanguageModel
            );

            Map<String, Object> variables = Map.of("subtask", subtask);
            String plan = chain.apply(variables);

            plans.add(new SubTaskPlan(i + 1, subtask, plan));
        }

        return plans;
    }

    private List<String> executeSubtasks(List<SubTaskPlan> plans) {
        List<String> results = new ArrayList<>();

        for (SubTaskPlan plan : plans) {
            try {
                String result = executeSubtask(plan);
                results.add(result);
                log.info("子任务执行完成: subtask={}, result={}", plan.getSubtask(), result);
            } catch (Exception e) {
                String errorMsg = "子任务执行失败: " + plan.getSubtask() + " - " + e.getMessage();
                results.add(errorMsg);
                log.error(errorMsg, e);
            }
        }

        return results;
    }

    private String executeSubtask(SubTaskPlan plan) {
        // 解析计划并执行相应的工具
        String planStr = plan.getPlan();

        if (planStr.contains("search")) {
            return "搜索完成";
        } else if (planStr.contains("calculate")) {
            return "计算完成";
        } else if (planStr.contains("weather")) {
            return "天气查询完成";
        } else {
            return "通用处理完成";
        }
    }

    private String integrateResults(String originalTask, List<String> results) {
        Chain<String> chain = new LLMChain<>(
            PromptTemplate.from(
                "整合多个子任务的执行结果，生成完整的任务答案：" +
                "原始任务：{{task}}" +
                "子任务结果：{{results}}" +
                "整合后的答案："
            ),
            chatLanguageModel
        );

        Map<String, Object> variables = Map.of(
            "task", originalTask,
            "results", String.join("\n", results)
        );

        return chain.apply(variables);
    }

    // 内部类
    private static class SubTaskPlan {
        private final int sequence;
        private final String subtask;
        private final String plan;

        public SubTaskPlan(int sequence, String subtask, String plan) {
            this.sequence = sequence;
            this.subtask = subtask;
            this.plan = plan;
        }

        // getters...
        public int getSequence() { return sequence; }
        public String getSubtask() { return subtask; }
        public String getPlan() { return plan; }
    }
}

// Agent REST控制器
@RestController
@RequestMapping("/api/v1/agent")
@Slf4j
public class AgentController {

    private final IntelligentAgentService agentService;

    public AgentController(IntelligentAgentService agentService) {
        this.agentService = agentService;
    }

    @PostMapping("/chat/{sessionId}")
    public ResponseEntity<String> agentChat(@PathVariable String sessionId,
                                            @RequestBody ChatRequest request) {
        try {
            String response = agentService.agentConversation(sessionId, request.getMessage());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Agent聊天失败: sessionId={}", sessionId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("抱歉，智能代理暂时不可用。");
        }
    }

    @PostMapping("/task/{sessionId}")
    public ResponseEntity<String> executeComplexTask(@PathVariable String sessionId,
                                                     @RequestBody TaskRequest request) {
        try {
            String result = agentService.planAndExecuteComplexTask(sessionId, request.getTaskDescription());
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("复杂任务执行失败: sessionId={}", sessionId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("抱歉，复杂任务执行失败。");
        }
    }

    @GetMapping("/history/{sessionId}")
    public ResponseEntity<List<Message>> getConversationHistory(@PathVariable String sessionId) {
        try {
            List<Message> history = agentService.getConversationHistory(sessionId);
            return ResponseEntity.ok(history);
        } catch (Exception e) {
            log.error("获取对话历史失败: sessionId={}", sessionId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}

// DTO类
public record ChatRequest(String message) {}

public record TaskRequest(String taskDescription) {}

public record Document(String content, Map<String, Object> metadata) {}
```

## ⭐⭐⭐ 专家题 (71-100)

### 问题71: 多Agent协作系统在LangChain4j中的实现

**面试题**: 如何使用LangChain4j构建支持多Agent协作的复杂AI系统？

**口语化答案**:
"多Agent协作系统能够处理更复杂的任务。我会设计一个Agent协作架构：

```java
// 多Agent协作系统
@Service
@Slf4j
public class MultiAgentCollaborationSystem {

    private final Map<String, Agent> agentRegistry;
    private final AgentCoordinator coordinator;
    private final TaskQueue taskQueue;
    private final CollaborationMemory collaborationMemory;

    public MultiAgentCollaborationSystem(List<Agent> agents) {
        this.agentRegistry = agents.stream()
            .collect(Collectors.toMap(Agent::getId, Function.identity()));
        this.coordinator = new AgentCoordinator(agentRegistry);
        this.taskQueue = new TaskQueue();
        this.collaborationMemory = new CollaborationMemory();
    }

    // 提交协作任务
    public CompletableFuture<CollaborationResult> submitCollaborativeTask(CollaborativeTask task) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                log.info("开始处理协作任务: taskId={}, taskType={}", task.getId(), task.getType());

                // 1. 任务分析和分解
                TaskDecomposition decomposition = coordinator.analyzeAndDecompose(task);

                // 2. Agent分配
                Map<String, List<SubTask>> agentAssignments = coordinator.assignAgents(decomposition);

                // 3. 并行执行子任务
                Map<String, CompletableFuture<List<SubTaskResult>>> executionResults = new HashMap<>();

                for (Map.Entry<String, List<SubTask>> entry : agentAssignments.entrySet()) {
                    String agentId = entry.getKey();
                    List<SubTask> subtasks = entry.getValue();

                    CompletableFuture<List<SubTaskResult>> agentResult = executeAgentTasks(
                        agentId, subtasks, task.getId());
                    executionResults.put(agentId, agentResult);
                }

                // 4. 等待所有Agent完成
                Map<String, List<SubTaskResult>> completedResults = new HashMap<>();
                for (Map.Entry<String, CompletableFuture<List<SubTaskResult>>> entry : executionResults.entrySet()) {
                    completedResults.put(entry.getKey(), entry.getValue().get());
                }

                // 5. 结果整合和协作学习
                CollaborationResult result = integrateAndLearn(task, decomposition, completedResults);

                // 6. 保存协作记忆
                collaborationMemory.saveCollaboration(task, result);

                return result;

            } catch (Exception e) {
                log.error("协作任务处理失败: taskId={}", task.getId(), e);
                throw new CollaborationException("协作任务处理失败", e);
            }
        });
    }

    private CompletableFuture<List<SubTaskResult>> executeAgentTasks(String agentId,
                                                                   List<SubTask> subtasks,
                                                                   String parentTaskId) {
        Agent agent = agentRegistry.get(agentId);
        if (agent == null) {
            return CompletableFuture.completedFuture(Collections.emptyList());
        }

        return CompletableFuture.supplyAsync(() -> {
            List<SubTaskResult> results = new ArrayList<>();

            for (SubTask subtask : subtasks) {
                try {
                    // Agent处理子任务
                    SubTaskResult result = agent.processSubTask(subtask, parentTaskId);

                    // 记录Agent状态
                    agent.updateState(result.getSuccess(), result.getProcessingTime());

                    results.add(result);

                    // 如果子任务失败，检查是否需要重新分配
                    if (!result.getSuccess() && subtask.getRetryCount() < 3) {
                        subtask.incrementRetryCount();
                        SubTaskResult retryResult = agent.processSubTask(subtask, parentTaskId);
                        results.add(retryResult);
                    }

                } catch (Exception e) {
                    log.error("子任务处理失败: agentId={}, subtaskId={}", agentId, subtask.getId(), e);
                    results.add(new SubTaskResult(subtask.getId(), false, e.getMessage(), 0));
                }
            }

            return results;

        }).exceptionally(throwable -> {
            log.error("Agent执行失败: agentId={}", agentId, throwable);
            return Collections.emptyList();
        });
    }

    private CollaborationResult integrateAndLearn(CollaborativeTask task,
                                                 TaskDecomposition decomposition,
                                                 Map<String, List<SubTaskResult>> completedResults) {
        try {
            // 收集所有子任务结果
            List<SubTaskResult> allResults = completedResults.values().stream()
                .flatMap(List::stream)
                .collect(Collectors.toList());

            // 成功率统计
            long successCount = allResults.stream()
                .mapToLong(r -> r.getSuccess() ? 1 : 0)
                .sum();

            double successRate = (double) successCount / allResults.size();

            // 结果整合
            String integratedResult = integrateResults(task, decomposition, allResults);

            // 协作质量评估
            CollaborationQuality quality = evaluateCollaborationQuality(task, completedResults, allResults);

            // 生成最终结果
            return new CollaborationResult(
                task.getId(),
                integratedResult,
                successRate,
                quality,
                allResults,
                System.currentTimeMillis()
            );

        } catch (Exception e) {
            log.error("结果整合失败: taskId={}", task.getId(), e);
            return new CollaborationResult(task.getId(), "整合失败", 0.0, null, Collections.emptyList(), 0);
        }
    }

    private String integrateResults(CollaborativeTask task,
                                    TaskDecomposition decomposition,
                                    List<SubTaskResult> results) {
        Chain<String> chain = new LLMChain<>(
            PromptTemplate.from(
                "作为多Agent协作系统的整合者，请整合以下任务执行结果：" +
                "原始任务：{{task}}" +
                "任务分解：{{decomposition}}" +
                "各Agent执行结果：{{results}}" +
                "整合后的完整答案："
            ),
            getCoordinatorModel()
        );

        Map<String, Object> variables = Map.of(
            "task", task.getDescription(),
            "decomposition", decomposition.toString(),
            "results", results.stream()
                .map(r -> String.format("Agent处理结果：%s", r.getResult()))
                .collect(Collectors.joining("\n"))
        );

        return chain.apply(variables);
    }

    private CollaborationQuality evaluateCollaborationQuality(CollaborativeTask task,
                                                            Map<String, List<SubTaskResult>> completedResults,
                                                            List<SubTaskResult> allResults) {
        // 计算协作质量指标
        double agentEfficiency = calculateAgentEfficiency(completedResults);
        double coordinationQuality = calculateCoordinationQuality(allResults);
        double resultQuality = calculateResultQuality(allResults);

        // 学习和改进建议
        List<String> improvementSuggestions = generateImprovementSuggestions(
            task, completedResults, allResults);

        return new CollaborationQuality(
            agentEfficiency,
            coordinationQuality,
            resultQuality,
            improvementSuggestions
        );
    }

    private double calculateAgentEfficiency(Map<String, List<SubTaskResult>> completedResults) {
        Map<String, Long> agentProcessingTimes = new HashMap<>();

        for (Map.Entry<String, List<SubTaskResult>> entry : completedResults.entrySet()) {
            long totalTime = entry.getValue().stream()
                .mapToLong(SubTaskResult::getProcessingTime)
                .sum();
            agentProcessingTimes.put(entry.getKey(), totalTime);
        }

        // 基于处理时间分布计算效率
        double avgTime = agentProcessingTimes.values().stream()
            .mapToLong(Long::longValue)
            .average()
            .orElse(0.0);

        double variance = agentProcessingTimes.values().stream()
            .mapToDouble(time -> Math.pow(time - avgTime, 2))
            .average()
            .orElse(0.0);

        // 方差越小，效率越均衡
        return Math.max(0.0, 1.0 - variance / (avgTime * avgTime));
    }

    private double calculateCoordinationQuality(List<SubTaskResult> allResults) {
        // 检查任务依赖关系的处理质量
        int totalDependencies = 0;
        int satisfiedDependencies = 0;

        for (SubTaskResult result : allResults) {
            List<String> dependencies = result.getDependencies();
            totalDependencies += dependencies.size();

            for (String dependency : dependencies) {
                boolean dependencySatisfied = allResults.stream()
                    .anyMatch(r -> r.getSubtaskId().equals(dependency) && r.getSuccess());
                if (dependencySatisfied) {
                    satisfiedDependencies++;
                }
            }
        }

        return totalDependencies > 0 ? (double) satisfiedDependencies / totalDependencies : 1.0;
    }

    private double calculateResultQuality(List<SubTaskResult> allResults) {
        // 基于成功率和结果一致性计算质量
        long successCount = allResults.stream()
            .mapToLong(r -> r.getSuccess() ? 1 : 0)
            .sum();

        double successRate = (double) successCount / allResults.size();

        // 检查结果一致性（简化实现）
        double consistency = calculateResultConsistency(allResults);

        return (successRate + consistency) / 2.0;
    }

    private double calculateResultConsistency(List<SubTaskResult> allResults) {
        // 简化的一致性计算
        return 0.8; // 实际中应该基于结果内容分析一致性
    }

    private List<String> generateImprovementSuggestions(CollaborativeTask task,
                                                        Map<String, List<SubTaskResult>> completedResults,
                                                        List<SubTaskResult> allResults) {
        Chain<String> chain = new LLMChain<(
            PromptTemplate.from(
                "作为多Agent协作系统优化器，请分析以下协作过程并提出改进建议：" +
                "任务描述：{{task}}" +
                "Agent执行情况：{{completedResults}}" +
                "总体结果：{{allResults}}" +
                "改进建议（每行一条）："
            ),
            getCoordinatorModel()
        );

        Map<String, Object> variables = Map.of(
            "task", task.getDescription(),
            "completedResults", formatAgentResults(completedResults),
            "allResults", formatAllResults(allResults)
        );

        String suggestions = chain.apply(variables);

        return Arrays.stream(suggestions.split("\n"))
            .map(String::trim)
            .filter(line -> !line.isEmpty())
            .collect(Collectors.toList());
    }

    private String formatAgentResults(Map<String, List<SubTaskResult>> completedResults) {
        StringBuilder sb = new StringBuilder();
        for (Map.Entry<String, List<SubTaskResult>> entry : completedResults.entrySet()) {
            sb.append("Agent ").append(entry.getKey()).append(": ");
            sb.append("成功 ").append(entry.getValue().stream()
                .mapToLong(r -> r.getSuccess() ? 1 : 0).sum())
            sb.append("/").append(entry.getValue().size()).append(" 个任务\n");
        }
        return sb.toString();
    }

    private String formatAllResults(List<SubTaskResult> allResults) {
        return String.format("总任务数: %d, 成功: %d, 失败: %d",
            allResults.size(),
            allResults.stream().mapToLong(r -> r.getSuccess() ? 1 : 0).sum(),
            allResults.stream().mapToLong(r -> r.getSuccess() ? 0 : 1).sum()
        );
    }

    private ChatLanguageModel getCoordinatorModel() {
        // 返回协调者使用的模型
        return OpenAiChatModel.builder()
            .apiKey(System.getenv("OPENAI_API_KEY"))
            .modelName("gpt-4")
            .temperature(0.3)
            .build();
    }

    // 获取Agent状态
    public Map<String, AgentStatus> getAgentStatuses() {
        return agentRegistry.entrySet().stream()
            .collect(Collectors.toMap(
                Map.Entry::getKey,
                entry -> entry.getValue().getStatus()
            ));
    }

    // 重新分配失败的任务
    public CompletableFuture<Void> redistributeFailedTasks(String taskId) {
        return CompletableFuture.runAsync(() -> {
            try {
                // 从协作记忆中获取失败的任务
                List<SubTaskResult> failedTasks = collaborationMemory.getFailedTasks(taskId);

                // 重新分配给其他合适的Agent
                for (SubTaskResult failedTask : failedTasks) {
                    String newAgentId = coordinator.findBestAgentForTask(failedTask.getSubtask());
                    if (newAgentId != null) {
                        Agent newAgent = agentRegistry.get(newAgentId);
                        newAgent.processSubTask(failedTask.getSubtask(), taskId);
                    }
                }

            } catch (Exception e) {
                log.error("任务重新分配失败: taskId={}", taskId, e);
            }
        });
    }
}

// Agent协调器
public class AgentCoordinator {

    private final Map<String, Agent> agentRegistry;
    private final TaskDecomposer taskDecomposer;

    public AgentCoordinator(Map<String, Agent> agentRegistry) {
        this.agentRegistry = agentRegistry;
        this.taskDecomposer = new TaskDecomposer();
    }

    public TaskDecomposition analyzeAndDecompose(CollaborativeTask task) {
        return taskDecomposer.decompose(task);
    }

    public Map<String, List<SubTask>> assignAgents(TaskDecomposition decomposition) {
        Map<String, List<SubTask>> assignments = new HashMap<>();

        for (SubTask subtask : decomposition.getSubtasks()) {
            String bestAgentId = findBestAgentForTask(subtask);
            assignments.computeIfAbsent(bestAgentId, k -> new ArrayList<>()).add(subtask);
        }

        return assignments;
    }

    public String findBestAgentForTask(SubTask subtask) {
        // 基于Agent能力和任务需求进行匹配
        return agentRegistry.entrySet().stream()
            .max(Comparator.comparingDouble(entry -> calculateMatchScore(entry.getValue(), subtask)))
            .map(Map.Entry::getKey)
            .orElse("default");
    }

    private double calculateMatchScore(Agent agent, SubTask subtask) {
        // 简化的匹配分数计算
        AgentCapabilities capabilities = agent.getCapabilities();
        TaskRequirements requirements = subtask.getRequirements();

        double score = 0.0;

        // 技能匹配
        for (String skill : requirements.getRequiredSkills()) {
            if (capabilities.getSkills().contains(skill)) {
                score += 1.0;
            }
        }

        // 负载考虑
        double load = agent.getLoad();
        score -= load * 0.5;

        // 历史成功率
        score += agent.getSuccessRate();

        return score;
    }
}

// Agent抽象类
public abstract class Agent {

    protected final String id;
    protected final AgentCapabilities capabilities;
    protected final ChatLanguageModel model;
    protected volatile AgentStatus status;
    protected final AtomicLong totalTasks = new AtomicLong(0);
    protected final AtomicLong successfulTasks = new AtomicLong(0);

    public Agent(String id, AgentCapabilities capabilities, ChatLanguageModel model) {
        this.id = id;
        this.capabilities = capabilities;
        this.model = model;
        this.status = new AgentStatus();
    }

    public SubTaskResult processSubTask(SubTask subtask, String parentTaskId) {
        long startTime = System.currentTimeMillis();
        totalTasks.incrementAndGet();

        try {
            // 更新状态
            status.setCurrentlyProcessing(subtask.getId());
            status.setLastActivityTime(System.currentTimeMillis());

            // 执行子任务
            Object result = executeTask(subtask);

            long processingTime = System.currentTimeMillis() - startTime;
            boolean success = result != null;

            if (success) {
                successfulTasks.incrementAndGet();
            }

            SubTaskResult subTaskResult = new SubTaskResult(
                subtask.getId(),
                success,
                result != null ? result.toString() : "处理失败",
                processingTime,
                subtask.getDependencies()
            );

            // 更新状态
            status.setCurrentlyProcessing(null);
            status.incrementTotalProcessed();
            if (success) {
                status.incrementSuccessfulProcessed();
            }

            return subTaskResult;

        } catch (Exception e) {
            long processingTime = System.currentTimeMillis() - startTime;

            SubTaskResult subTaskResult = new SubTaskResult(
                subtask.getId(),
                false,
                e.getMessage(),
                processingTime,
                subtask.getDependencies()
            );

            status.setCurrentlyProcessing(null);
            return subTaskResult;
        }
    }

    protected abstract Object executeTask(SubTask subtask);

    public void updateState(boolean success, long processingTime) {
        status.incrementTotalProcessed();
        if (success) {
            status.incrementSuccessfulProcessed();
        }
        status.updateAverageProcessingTime(processingTime);
        status.setLastActivityTime(System.currentTimeMillis());
    }

    // getters
    public String getId() { return id; }
    public AgentCapabilities getCapabilities() { return capabilities; }
    public AgentStatus getStatus() { return status; }
    public double getLoad() { return status.getCurrentLoad(); }
    public double getSuccessRate() {
        long total = totalTasks.get();
        return total > 0 ? (double) successfulTasks.get() / total : 1.0;
    }
}

// 具体Agent实现
@Component
public class ResearchAgent extends Agent {

    public ResearchAgent() {
        super("research-agent",
              new AgentCapabilities(Set.of("search", "analyze", "summarize")),
              OpenAiChatModel.builder()
                  .apiKey(System.getenv("OPENAI_API_KEY"))
                  .modelName("gpt-4")
                  .temperature(0.3)
                  .build());
    }

    @Override
    protected Object executeTask(SubTask subtask) {
        if (subtask.getType() == SubTaskType.RESEARCH) {
            return executeResearchTask(subtask);
        } else if (subtask.getType() == SubTaskType.ANALYZE) {
            return executeAnalysisTask(subtask);
        } else {
            throw new UnsupportedOperationException("不支持的任务类型: " + subtask.getType());
        }
    }

    private String executeResearchTask(SubTask subtask) {
        Chain<String> chain = new LLMChain<>(
            PromptTemplate.from(
                "作为研究专家，请执行以下研究任务：" +
                "任务描述：{{description}}" +
                "研究结果："
            ),
            model
        );

        Map<String, Object> variables = Map.of("description", subtask.getDescription());
        return chain.apply(variables);
    }

    private String executeAnalysisTask(SubTask subtask) {
        // 实现分析逻辑
        return "分析结果：" + subtask.getDescription();
    }
}

@Component
public class CalculationAgent extends Agent {

    public CalculationAgent() {
        super("calculation-agent",
              new AgentCapabilities(Set.of("calculate", "compute", "analyze")),
              OpenAiChatModel.builder()
                  .apiKey(System.getenv("OPENAI_API_KEY"))
                  .modelName("gpt-3.5-turbo")
                  .temperature(0.1)
                  .build());
    }

    @Override
    protected Object executeTask(SubTask subtask) {
        if (subtask.getType() == SubTaskType.CALCULATE) {
            return executeCalculationTask(subtask);
        } else {
            throw new UnsupportedOperationException("不支持的任务类型: " + subtask.getType());
        }
    }

    private double executeCalculationTask(SubTask subtask) {
        // 实现计算逻辑
        try {
            // 使用计算器服务
            return Math.random() * 100; // 简化实现
        } catch (Exception e) {
            throw new CalculationException("计算失败", e);
        }
    }
}

// 数据类和枚举
public class CollaborativeTask {
    private final String id;
    private final String description;
    private final TaskType type;
    private final Map<String, Object> parameters;

    public CollaborativeTask(String id, String description, TaskType type, Map<String, Object> parameters) {
        this.id = id;
        this.description = description;
        this.type = type;
        this.parameters = parameters;
    }

    // getters...
    public String getId() { return id; }
    public String getDescription() { return description; }
    public TaskType getType() { return type; }
    public Map<String, Object> getParameters() { return parameters; }
}

public enum TaskType {
    RESEARCH, CALCULATION, ANALYSIS, CREATION, COORDINATION
}

public class SubTask {
    private final String id;
    private final String description;
    private final SubTaskType type;
    private final TaskRequirements requirements;
    private final List<String> dependencies;
    private int retryCount = 0;

    public SubTask(String id, String description, SubTaskType type, TaskRequirements requirements) {
        this(id, description, type, requirements, Collections.emptyList());
    }

    public SubTask(String id, String description, SubTaskType type, TaskRequirements requirements, List<String> dependencies) {
        this.id = id;
        this.description = description;
        this.type = type;
        this.requirements = requirements;
        this.dependencies = dependencies;
    }

    public void incrementRetryCount() {
        retryCount++;
    }

    // getters...
    public String getId() { return id; }
    public String getDescription() { return description; }
    public SubTaskType getType() { return type; }
    public TaskRequirements getRequirements() { return requirements; }
    public List<String> getDependencies() { return dependencies; }
    public int getRetryCount() { return retryCount; }
}

public enum SubTaskType {
    RESEARCH, CALCULATE, ANALYZE, SUMMARIZE, VALIDATE
}

public class TaskRequirements {
    private final Set<String> requiredSkills;
    private final Map<String, Object> constraints;

    public TaskRequirements(Set<String> requiredSkills) {
        this.requiredSkills = requiredSkills;
        this.constraints = new HashMap<>();
    }

    // getters...
    public Set<String> getRequiredSkills() { return requiredSkills; }
    public Map<String, Object> getConstraints() { return constraints; }
}

public class AgentCapabilities {
    private final Set<String> skills;
    private final Map<String, Double> skillLevels;

    public AgentCapabilities(Set<String> skills) {
        this.skills = skills;
        this.skillLevels = skills.stream()
            .collect(Collectors.toMap(Function.identity(), skill -> 0.8));
    }

    // getters...
    public Set<String> getSkills() { return skills; }
    public Map<String, Double> getSkillLevels() { return skillLevels; }
}

public class AgentStatus {
    private volatile String currentlyProcessing;
    private volatile double currentLoad;
    private long totalProcessed;
    private long successfulProcessed;
    private double averageProcessingTime;
    private long lastActivityTime;

    public void incrementTotalProcessed() { totalProcessed++; }
    public void incrementSuccessfulProcessed() { successfulProcessed++; }
    public void updateAverageProcessingTime(long time) {
        averageProcessingTime = (averageProcessingTime + time) / 2.0;
    }

    // getters and setters...
    public String getCurrentlyProcessing() { return currentlyProcessing; }
    public void setCurrentlyProcessing(String currentlyProcessing) { this.currentlyProcessing = currentlyProcessing; }
    public double getCurrentLoad() { return currentLoad; }
    public void setCurrentLoad(double currentLoad) { this.currentLoad = currentLoad; }
    public long getTotalProcessed() { return totalProcessed; }
    public long getSuccessfulProcessed() { return successfulProcessed; }
    public double getAverageProcessingTime() { return averageProcessingTime; }
    public void setAverageProcessingTime(double averageProcessingTime) { this.averageProcessingTime = averageProcessingTime; }
    public long getLastActivityTime() { return lastActivityTime; }
    public void setLastActivityTime(long lastActivityTime) { this.lastActivityTime = lastActivityTime; }
}

// REST控制器
@RestController
@RequestMapping("/api/v1/multi-agent")
public class MultiAgentController {

    private final MultiAgentCollaborationSystem collaborationSystem;

    public MultiAgentController(MultiAgentCollaborationSystem collaborationSystem) {
        this.collaborationSystem = collaborationSystem;
    }

    @PostMapping("/collaborate")
    public CompletableFuture<ResponseEntity<CollaborationResult>> submitTask(@RequestBody CollaborativeTask task) {
        return collaborationSystem.submitCollaborativeTask(task)
            .thenApply(ResponseEntity::ok)
            .exceptionally(throwable -> ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build());
    }

    @GetMapping("/agents/status")
    public ResponseEntity<Map<String, AgentStatus>> getAgentStatuses() {
        Map<String, AgentStatus> statuses = collaborationSystem.getAgentStatuses();
        return ResponseEntity.ok(statuses);
    }

    @PostMapping("/tasks/{taskId}/redistribute")
    public ResponseEntity<Void> redistributeFailedTasks(@PathVariable String taskId) {
        collaborationSystem.redistributeFailedTasks(taskId);
        return ResponseEntity.ok().build();
    }
}
```

## 💡 面试技巧提示

### LangChain4j面试要点：

1. **核心组件**: ChatModel、EmbeddingModel、PromptTemplate、Chain
2. **链式处理**: LLMChain的组合使用和处理流程设计
3. **智能Agent**: 工具调用、意图识别、任务规划
4. **多Agent协作**: 协调器设计、任务分解、结果整合
5. **向量存储**: EmbeddingStore的使用和RAG系统构建

### 常见错误：
- 不了解LangChain4j的核心架构和设计理念
- 缺乏链式处理的实际应用经验
- 忽略Agent协作的复杂性设计
- 没有考虑性能优化和错误处理
- 不了解向量数据库的选择和集成

通过这些题目，面试官能全面考察候选人对LangChain4j框架和复杂AI系统架构的掌握程度。