# LangChain4j链式AI应用开发

## 题目1: ⭐⭐ LangChain4j的核心架构与链式处理

**问题描述**:
请详细解释LangChain4j的核心架构设计，包括链式处理、组件集成、模板引擎等核心概念，并说明如何在Java应用中构建链式AI处理流水线。

**答案要点**:
- **核心架构**: Chain、Component、Template等核心组件的设计
- **链式处理**: 多个组件的顺序执行和数据传递机制
- **模板引擎**: PromptTemplate的使用和变量替换
- **内存管理**: ConversationBuffer在对话中的应用
- **工具集成**: 外部工具和API的集成方式

**核心原理**:
1. LangChain4j通过链式组件简化AI应用开发
2. 组件之间通过标准接口进行数据交换
3. 模板引擎支持动态Prompt生成和参数替换
4. 内存管理保持对话上下文和状态信息

**简洁示例代码**:
```java
// LangChain4j核心链式处理示例
@Service
public class DocumentProcessingChain {

    private final ChatLanguageModel chatModel;
    private final TextSplitter textSplitter;
    private final EmbeddingModel embeddingModel;
    private final InMemoryEmbeddingStore embeddingStore;

    public String processDocument(String inputText) {
        // 1. 文本分割
        List<TextChunk> chunks = textSplitter.split(inputText);

        // 2. 创建处理链
        Chain<String, String> processingChain = new SequentialChain<>(
            new SimpleChain<>(input -> "请分析以下文档内容：" + input),
            new SimpleChain<>(input -> "提取关键信息：" + extractKeyInfo(input))
        );

        // 3. 处理每个文档片段
        List<String> results = new ArrayList<>();
        for (TextChunk chunk : chunks) {
            String result = processingChain.apply(chunk.text());
            results.add(result);
        }

        // 4. 生成最终摘要
        String summary = summarizeResults(results);
        return summary;
    }

    private String extractKeyInfo(String content) {
        // 使用LLM提取关键信息的逻辑
        PromptTemplate template = PromptTemplate.from(
            "从以下文本中提取3个最重要的信息点：\n\n{{content}}\n\n要点："
        );

        Map<String, Object> variables = Map.of("content", content);
        Prompt prompt = template.apply(variables);

        return chatModel.generate(prompt);
    }
}
```

---

## 题目2: ⭐⭐⭐ LangChain4j中的内存管理与对话上下文

**问题描述**:
请详细说明LangChain4j中内存管理系统的设计，包括不同类型的内存存储、对话历史的维护策略，以及如何实现长期和短期记忆的结合。

**答案要点**:
- **内存类型**: ChatMemory、TokenBuffer、ConversationBuffer的设计
- **历史管理**: 对话历史的存储、检索和压缩策略
- **上下文窗口**: Token限制和上下文窗口管理
- **持久化**: 内存状态的持久化和恢复机制
- **记忆整合**: 短期记忆与长期记忆的智能结合

**核心原理**:
1. 内存系统管理对话的连续性和上下文信息
2. 不同类型的内存适应不同的应用场景
3. Token限制需要智能的上下文压缩策略
4. 持久化确保对话状态可以在会话间保持

**简洁示例代码**:
```java
// 内存管理系统示例
@Service
public class ConversationMemoryManager {

    private final ChatLanguageModel chatModel;
    private final InMemoryChatMemory chatMemory;
    private final VectorStore vectorStore;
    private final EmbeddingModel embeddingModel;

    public ConversationMemoryManager(ChatLanguageModel chatModel) {
        this.chatModel = chatModel;
        this.chatMemory = new InMemoryChatMemory();
        // 初始化向量存储用于长期记忆
        this.vectorStore = new InMemoryVectorStore(embeddingModel);
    }

    public String generateResponse(String userMessage) {
        // 1. 检索相关记忆
        List<Memory> relevantMemories = retrieveRelevantMemories(userMessage);

        // 2. 构建包含记忆的prompt
        PromptTemplate template = PromptTemplate.from(
            "你是一个智能助手。基于以下记忆信息回答用户问题：\n\n" +
            "相关记忆：\n{{memories}}\n\n" +
            "用户问题：{{question}}\n\n" +
            "请提供有帮助的回答。"
        );

        Map<String, Object> variables = Map.of(
            "memories", formatMemories(relevantMemories),
            "question", userMessage
        );

        Prompt prompt = template.apply(variables);

        // 3. 生成回答
        String response = chatModel.generate(prompt);

        // 4. 更新对话记忆
        updateConversationMemory(userMessage, response);

        return response;
    }

    private List<Memory> retrieveRelevantMemories(String query) {
        // 使用相似度检索相关记忆
        List<TextSegment> segments = new ArrayList<>();
        for (Message message : chatMemory.messages()) {
            segments.add(new TextSegment(message.text(), Metadata.of("type", "chat")));
        }

        SearchRequest searchRequest = SearchRequest.builder()
            .query(query)
            .topK(5)
            .similarities(Similarity.threshold(0.7))
            .build();

        List<TextSegment> relevantSegments = vectorStore.search(searchRequest).results();

        return relevantSegments.stream()
            .map(segment -> new Memory(segment.text(), System.currentTimeMillis()))
            .collect(Collectors.toList());
    }

    private void updateConversationMemory(String userMessage, String assistantMessage) {
        chatMemory.add(new SystemMessage("你是一个智能助手。"));
        chatMemory.add(new UserMessage(userMessage));
        chatMemory.add(new AssistantMessage(assistantMessage));

        // 保持对话长度在合理范围内
        if (chatMemory.messages().size() > 20) {
            // 压缩对话历史
            compressConversationHistory();
        }
    }

    private void compressConversationHistory() {
        // 使用LLM压缩对话历史
        List<Message> messages = new ArrayList<>(chatMemory.messages());

        if (messages.size() > 10) {
            // 保留最近的10条消息
            List<Message> recentMessages = messages.subList(messages.size() - 10, messages.size());

            // 使用LLM压缩旧消息
            String compressedHistory = compressHistory(
                messages.subList(0, messages.size() - 10)
            );

            // 清空并重建记忆
            chatMemory.clear();
            chatMemory.add(new SystemMessage("以下是压缩后的对话历史：" + compressedHistory));
            recentMessages.forEach(chatMemory::add);
        }
    }

    private String compressHistory(List<Message> messages) {
        StringBuilder history = new StringBuilder();
        for (Message message : messages) {
            history.append(message.type()).append(": ")
                   .message().append("\n");
        }

        PromptTemplate template = PromptTemplate.from(
            "请将以下对话历史压缩成简洁的摘要：\n\n{{history}}\n\n摘要："
        );

        return chatModel.generate(template.apply(Map.of("history", history.toString())));
    }

    private String formatMemories(List<Memory> memories) {
        if (memories.isEmpty()) {
            return "无相关记忆。";
        }

        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < memories.size(); i++) {
            sb.append(i + 1).append(". ")
              .append(memories.get(i).text())
              .append("\n");
        }
        return sb.toString();
    }
}
```

---

## 题题3: ⭐⭐⭐⭐ LangChain4j工具集成与外部API调用

**问题描述**:
请详细说明如何在LangChain4j中集成外部工具和API，包括自定义工具的创建、参数验证、结果处理，以及工具调用的错误处理和重试机制。

**答案要点**:
- **工具定义**: FunctionTool接口的实现和工具方法定义
- **参数处理**: 参数类型转换、验证和默认值设置
- **工具选择**: 自动和手动工具选择策略
- **执行控制**: 工具调用的执行流程和异常处理
- **结果处理**: 工具输出结果的解析和传递

**核心原理**:
1. 工具使LLM能够与外部系统进行交互
2. 函数调用机制支持复杂的工具操作
3. 参数验证确保工具调用的安全性
4. 错误处理保证工具调用的稳定性

**简洁示例代码**:
```java
// 工具定义和集成示例
@Service
public class ToolIntegrationService {

    private final WeatherService weatherService;
    private final DatabaseService databaseService;
    private final APIService apiService;

    public ToolIntegrationService(WeatherService weatherService,
                                  DatabaseService databaseService,
                                  APIService apiService) {
        this.weatherService = weatherService;
        this.databaseService = databaseService;
        this.apiService = apiService;
    }

    // 定义天气查询工具
    public FunctionTool getWeatherTool() {
        return new FunctionTool(getWeatherToolSpec());
    }

    private FunctionTool.Function getWeatherToolSpec() {
        FunctionTool.Function tool = new FunctionTool.Function("weather_query",
            "查询指定城市的天气信息",
            (FunctionTool.Request request) -> {
                String city = request.getArgument("city");
                String date = request.getArgument("date", "today");

                try {
                    WeatherInfo weather = weatherService.getWeather(city, date);
                    return Map.of(
                        "city", city,
                        "date", date,
                        "temperature", weather.getTemperature(),
                        "description", weather.getDescription(),
                        "humidity", weather.getHumidity()
                    );
                } catch (Exception e) {
                    throw new RuntimeException("天气查询失败: " + e.getMessage(), e);
                }
            },
            Map.of(
                "city", "要查询天气的城市名称",
                "date", "查询日期(默认today)"
            )
        );

        return tool;
    }

    // 定义数据库查询工具
    public FunctionTool getDatabaseTool() {
        return new FunctionTool(getDatabaseToolSpec());
    }

    private FunctionTool.Function getDatabaseToolSpec() {
        return new FunctionTool.Function("database_query",
            "查询数据库中的用户信息",
            (FunctionTool.Request request) -> {
                String query = request.getArgument("query");
                String table = request.getArgument("table");

                try {
                    return databaseService.executeQuery(table, query);
                } catch (Exception e) {
                    throw new RuntimeException("数据库查询失败: " + e.getMessage(), e);
                }
            },
            Map.of(
                "table", "要查询的表名",
                "query", "SQL查询语句"
            )
        );
    }

    // 定义API调用工具
    public FunctionTool getAPICallTool() {
        return new FunctionTool(getAPIToolSpec());
    }

    private FunctionTool.Function getAPIToolSpec() {
        return new FunctionTool.Function("api_call",
            "调用外部API接口",
            (FunctionTool.Request request) -> {
                String url = request.getArgument("url");
                String method = request.getArgument("method", "GET");
                Map<String, String> headers = parseHeaders(request.getArgument("headers", "{}"));

                try {
                    APICallResult result = apiService.callAPI(url, method, headers);
                    return Map.of(
                        "status", result.getStatus(),
                        "response", result.getResponse(),
                        "headers", result.getHeaders()
                    );
                } catch (Exception e) {
                    throw new RuntimeException("API调用失败: " + e.getMessage(), e);
                }
            },
            Map.of(
                "url", "API接口地址",
                "method", "HTTP方法(GET/POST/PUT/DELETE)",
                "headers", "HTTP请求头(JSON格式)"
            )
        );
    }

    // 带有错误处理的工具调用包装器
    public Object executeToolSafely(String toolName, Map<String, Object> arguments) {
        try {
            switch (toolName) {
                case "weather_query":
                    return executeWeatherTool(arguments);
                case "database_query":
                    return executeDatabaseTool(arguments);
                case "api_call":
                    return executeAPITool(arguments);
                default:
                    throw new IllegalArgumentException("未知工具: " + toolName);
            }
        } catch (Exception e) {
            log.error("工具执行失败: tool={}, arguments={}", toolName, arguments, e);
            return Map.of("error", e.getMessage());
        }
    }

    private WeatherInfo executeWeatherTool(Map<String, Object> args) {
        String city = (String) args.get("city");
        String date = (String) args.getOrDefault("date", "today");

        // 添加重试机制
        for (int attempt = 1; attempt <= 3; attempt++) {
            try {
                return weatherService.getWeather(city, date);
            } catch (Exception e) {
                if (attempt == 3) {
                    throw new RuntimeException("天气查询失败，已重试3次", e);
                }
                log.warn("天气查询失败，正在重试第{}次: {}", attempt, e.getMessage());
                try {
                    Thread.sleep(1000 * attempt); // 指数退避
                } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                    throw new RuntimeException("重试被中断", ie);
                }
            }
        }
    }

    private Map<String, Object> executeDatabaseTool(Map<String, Object> args) {
        String table = (String) args.get("table");
        String query = (String) args.get("query");

        // SQL注入防护
        if (!isValidSQLQuery(query)) {
            throw new SecurityException("检测到不安全的SQL查询");
        }

        Object result = databaseService.executeQuery(table, query);
        return Map.of("result", result, "timestamp", System.currentTimeMillis());
    }

    private boolean isValidSQLQuery(String query) {
        // 简单的SQL注入检测
        return !query.toLowerCase().contains("drop ") &&
               !query.toLowerCase().contains("delete ") &&
               !query.toLowerCase().contains("update ") &&
               !query.toLowerCase().contains("insert ");
    }

    private Map<String, String> parseHeaders(String headersJson) {
        try {
            ObjectMapper mapper = new ObjectMapper();
            return mapper.readValue(headersJson, new TypeReference<Map<String, String>>() {});
        } catch (Exception e) {
            log.warn("解析HTTP头失败: {}", headersJson, e);
            return new HashMap<>();
        }
    }

    public List<FunctionTool> getAllTools() {
        return Arrays.asList(
            getWeatherTool(),
            getDatabaseTool(),
            getAPICallTool()
        );
    }
}
```

---

## 题目4: ⭐⭐⭐⭐⭐ LangChain4j Agent系统与决策引擎

**问题描述**:
请详细说明LangChain4j中Agent系统的设计理念，包括Agent的类型、决策引擎、工具选择策略，以及如何构建具备推理能力的智能Agent应用。

**答案要点**:
- **Agent类型**: ReAct Agent、MRKL Agent、自定义Agent的设计
- **决策引擎**: Prompt上下文引导、工具选择逻辑
- **推理能力**: Agent的思维链、分析和规划能力
- **执行策略**: 工具执行流程和结果评估
- **性能优化**: Agent执行的并行化和优化策略

**核心原理**:
1. Agent通过思维链模拟人类的推理过程
2. 决策引擎根据上下文选择合适的工具
3. 工具执行结果用于指导后续的推理步骤
4. Agent能够根据反馈调整执行策略

**简洁示例代码**:
```java
// ReAct Agent实现
@Service
public class ReactAgent {

    private final ChatLanguageModel chatModel;
    private final List<Tool> tools;
    private final AgentExecutor agentExecutor;

    public ReactAgent(ChatLanguageModel chatModel, List<Tool> tools) {
        this.chatModel = chatModel;
        this.tools = tools;
        this.agentExecutor = new AgentExecutor();
    }

    public String processTask(String task) {
        // 1. 初始化Agent状态
        AgentState state = new AgentState();
        state.setTask(task);
        state.setThought("我需要分析这个任务并选择合适的工具来解决");

        return reasoningLoop(state);
    }

    private String reasoningLoop(AgentState state) {
        int maxIterations = 10;

        for (int iteration = 0; iteration < maxIterations; iteration++) {
            // 2. 生成思考过程
            String thought = generateThought(state);
            state.addThought(thought);

            // 3. 检查是否需要工具
            if (shouldUseTool(thought)) {
                // 4. 选择和执行工具
                Tool tool = selectTool(state);
                state.setCurrentTool(tool);

                String toolInput = generateToolInput(state);
                Object toolResult = executeTool(tool, toolInput);

                state.setObservation("使用工具 " + tool.getName() + " 的结果: " + toolResult.toString());

                // 5. 评估工具结果
                if (isGoalAchieved(state)) {
                    return generateFinalAnswer(state);
                }
            } else {
                // 6. 不需要工具时的处理
                if (isGoalAchieved(state)) {
                    return generateFinalAnswer(state);
                }
            }

            // 7. 更新状态进行下一步推理
            state.setIteration(iteration + 1);
        }

        return "无法完成该任务，已达到最大推理次数限制。";
    }

    private String generateThought(AgentState state) {
        PromptTemplate template = PromptTemplate.from(
            "任务: {{task}}\n\n" +
            "之前的思考:\n{{thoughtHistory}}\n\n" +
            "观察: {{observation}}\n\n" +
            "请思考下一步该怎么做。回答格式为: 思考: [你的思考内容]"
        );

        Map<String, Object> variables = Map.of(
            "task", state.getTask(),
            "thoughtHistory", String.join("\n", state.getThoughts()),
            "observation", state.getObservation()
        );

        Prompt prompt = template.apply(variables);
        return chatModel.generate(prompt);
    }

    private boolean shouldUseTool(String thought) {
        return thought.toLowerCase().contains("工具") ||
               thought.toLowerCase().contains("调用") ||
               thought.toLowerCase().contains("查询") ||
               thought.toLowerCase().contains("搜索");
    }

    private Tool selectTool(AgentState state) {
        // 根据任务内容和思考过程选择合适的工具
        String task = state.getTask().toLowerCase();
        String thought = state.getLastThought().toLowerCase();

        if (task.contains("天气") || thought.contains("温度")) {
            return findToolByName("weather_query");
        } else if (task.contains("数据库") || thought.contains("查询")) {
            return findToolByName("database_query");
        } else if (task.contains("api") || thought.contains("接口")) {
            return findToolByName("api_call");
        }

        return tools.get(0); // 默认第一个工具
    }

    private String generateToolInput(AgentState state) {
        PromptTemplate template = PromptTemplate.from(
            "基于以下上下文，为工具 {{toolName}} 生成合适的输入参数：\n\n" +
            "任务: {{task}}\n" +
            "思考: {{currentThought}}\n\n" +
            "请以JSON格式提供参数。"
        );

        Map<String, Object> variables = Map.of(
            "toolName", state.getCurrentTool().getName(),
            "task", state.getTask(),
            "currentThought", state.getLastThought()
        );

        Prompt prompt = template.apply(variables);
        String response = chatModel.generate(prompt);

        try {
            return response.trim();
        } catch (Exception e) {
            return state.getTask(); // 降级处理
        }
    }

    private Object executeTool(Tool tool, String input) {
        try {
            return tool.run(input);
        } catch (Exception e) {
            log.error("工具执行失败: tool={}, input={}", tool.getName(), input, e);
            return "工具执行失败: " + e.getMessage();
        }
    }

    private boolean isGoalAchieved(AgentState state) {
        // 检查任务是否已完成
        String observation = state.getObservation();

        if (observation != null && !observation.isEmpty()) {
            // 如果有工具执行结果，说明任务可能已完成
            return true;
        }

        // 检查最后一步思考是否表明任务完成
        String lastThought = state.getLastThought().toLowerCase();
        return lastThought.contains("完成") || lastThought.contains("结束");
    }

    private String generateFinalAnswer(AgentState state) {
        PromptTemplate template = PromptTemplate.from(
            "任务: {{task}}\n\n" +
            "完整的推理过程:\n{{thoughtHistory}}\n\n" +
            "观察结果: {{observation}}\n\n" +
            "请基于以上信息提供最终的答案："
        );

        Map<String, Object> variables = Map.of(
            "task", state.getTask(),
            "thoughtHistory", String.join("\n", state.getThoughts()),
            "observation", state.getObservation()
        );

        Prompt prompt = template.apply(variables);
        return chatModel.generate(prompt);
    }

    private Tool findToolByName(String toolName) {
        return tools.stream()
            .filter(tool -> tool.getName().toLowerCase().contains(toolName.toLowerCase()))
            .findFirst()
            .orElse(tools.get(0));
    }

    public void setTools(List<Tool> tools) {
        this.tools = tools;
    }
}

// Agent状态管理
public class AgentState {
    private String task;
    private List<String> thoughts = new ArrayList<>();
    private String observation;
    private Tool currentTool;
    private int iteration = 0;

    // getters and setters
    public void addThought(String thought) {
        thoughts.add(thought);
    }

    public String getLastThought() {
        return thoughts.isEmpty() ? "" : thoughts.get(thoughts.size() - 1);
    }

    public List<String> getThoughts() {
        return new ArrayList<>(thoughts);
    }

    // 其他getter和setter方法
}

// Agent执行器用于管理多个Agent的并发执行
@Service
public class AgentExecutor {

    public CompletableFuture<String> executeAgentAsync(ReActAgent agent, String task) {
        return CompletableFuture.supplyAsync(() -> agent.processTask(task));
    }

    public List<String> executeMultipleAgents(List<ReactAgent> agents, String task) {
        List<CompletableFuture<String>> futures = agents.stream()
            .map(agent -> executeAgentAsync(agent, task))
            .collect(Collectors.toList());

        try {
            return futures.stream()
                .map(CompletableFuture::join)
                .collect(Collectors.toList());
        } catch (Exception e) {
            log.error("并行Agent执行失败", e);
            return Collections.emptyList();
        }
    }

    public void setExecutor(ThreadPoolExecutor executor) {
        // 设置自定义执行器
    }
}
```

---

## 题目5: ⭐⭐⭐ LangChain4j性能优化与生产环境部署

**问题描述**:
请详细说明如何在生产环境中优化LangChain4j应用的性能，包括缓存策略、并发控制、监控指标和错误处理。

**答案要点**:
- **缓存优化**: 对象池、结果缓存、会话缓存的设计
- **并发控制**: 连接池管理、限流策略、异步处理
- **性能监控**: 响应时间、成功率、资源使用监控
- **错误处理**: 重试机制、降级策略、异常恢复
- **生产部署**: 配置管理、日志记录、健康检查

**核心原理**:
1. 缓存机制减少重复计算和API调用
2. 并发控制提高系统吞吐量和响应速度
3. 监控系统实时跟踪应用性能和健康状况
4. 健壮的错误处理确保服务的稳定性

**简洁示例代码**:
```java
// 生产环境优化的LangChain4j服务
@Service
@Slf4j
public class ProductionLangChainService {

    private final ChatLanguageModel chatModel;
    private final RedisCache cacheManager;
    private final MetricsCollector metrics;
    private final RateLimiter rateLimiter;
    private final CircuitBreaker circuitBreaker;

    public ProductionLangChainService(ChatLanguageModel chatModel,
                                        RedisCache cacheManager,
                                        MetricsCollector metrics) {
        this.chatModel = chatModel;
        this.cacheManager = cacheManager;
        this.metrics = metrics;

        // 初始化限流器：每秒100个请求
        this.rateLimiter = RateLimiter.create(100);

        // 初始化熔断器：失败率超过50%时熔断
        this.circuitBreaker = CircuitBreaker.builder()
            .failureRateThreshold(0.5)
            .slowCallDurationThreshold(5000)
            .slidingWindowType(SlidingWindowType.COUNT_BASED)
            .slidingWindowSize(20)
            .build();
    }

    public String processRequest(String userInput, String sessionId) {
        long startTime = System.currentTimeMillis();

        return circuitBreaker.executeSupplier(() -> {
            return processWithCircuitBreaker(userInput, sessionId, startTime);
        });
    }

    private String processWithCircuitBreaker(String userInput, String sessionId, long startTime) {
        // 限流检查
        if (!rateLimiter.tryAcquire()) {
            throw new RateLimitExceededException("请求过于频繁，请稍后再试");
        }

        // 检查缓存
        String cacheKey = generateCacheKey(userInput, sessionId);
        String cachedResult = cacheManager.get(cacheKey);
        if (cachedResult != null) {
            metrics.recordCacheHit();
            return cachedResult;
        }

        metrics.recordCacheMiss();

        try {
            // 执行实际处理
            String result = processWithCircuitBreakerInternal(userInput, sessionId);

            // 异步缓存结果
            CompletableFuture.runAsync(() -> {
                try {
                    cacheManager.put(cacheKey, result, Duration.ofMinutes(30));
                } catch (Exception e) {
                    log.warn("缓存写入失败: cacheKey={}", cacheKey, e);
                }
            });

            return result;

        } catch (Exception e) {
            metrics.recordError();
            log.error("请求处理失败: userInput={}, sessionId={}", userInput, sessionId, e);

            // 降级处理：返回简单的默认回复
            return generateFallbackResponse(userInput);
        } finally {
            long duration = System.currentTimeMillis() - startTime;
            metrics.recordResponseTime(duration);
        }
    }

    private String processWithCircuitBreakerInternal(String userInput, String sessionId) {
        // 检查会话缓存
        String cachedConversation = cacheManager.getConversation(sessionId);
        if (cachedConversation != null) {
            userInput = cachedConversation + "\n" + userInput;
        }

        // 使用PromptTemplate构建prompt
        PromptTemplate template = PromptTemplate.from(
            "你是一个专业的AI助手，请为用户提供帮助。\n\n" +
            "用户问题: {{userInput}}\n" +
            "请提供准确、有用的回答。"
        );

        Map<String, Object> variables = Map.of("userInput", userInput);
        Prompt prompt = template.apply(variables);

        // 执行LLM调用
        String response = chatModel.generate(prompt);

        // 更新会话缓存
        String updatedConversation = (cachedConversation != null)
            ? cachedConversation + "\n" + userInput + "\n" + response
            : userInput + "\n" + response;

        cacheManager.putConversation(sessionId, updatedConversation, Duration.ofHours(2));

        return response;
    }

    private String generateCacheKey(String userInput, String sessionId) {
        return "langchain:" + DigestUtils.md5Hex(userInput + ":" + sessionId);
    }

    private String generateFallbackResponse(String userInput) {
        // 降级响应策略
        Map<String, String> fallbackResponses = Map.of(
            "天气", "抱歉，我暂时无法查询天气信息，请稍后再试。",
            "计算", "抱歉，计算服务暂时不可用，请稍后再试。",
            "搜索", "抱歉，搜索功能暂时不可用，请稍后再试。"
        );

        String fallback = "抱歉，我暂时无法处理您的请求，请稍后再试。";

        // 根据用户输入选择更合适的降级回复
        for (Map.Entry<String, String> entry : fallbackResponses.entrySet()) {
            if (userInput.toLowerCase().contains(entry.getKey())) {
                fallback = entry.getValue();
                break;
            }
        }

        return fallback;
    }

    // 性能监控和指标收集
    @Component
    public static class MetricsCollector {
        private final MeterRegistry meterRegistry;
        private final Counter cacheHits;
        private final Counter cacheMisses;
        private final Counter errors;
        private final Timer responseTime;

        public MetricsCollector(MeterRegistry meterRegistry) {
            this.meterRegistry = meterRegistry;
            this.cacheHits = Counter.builder()
                .name("langchain.cache.hits")
                .description("缓存命中次数")
                .register(meterRegistry);

            this.cacheMisses = Counter.builder()
                .name("langchain.cache.misses")
                .description("缓存未命中次数")
                .register(metterRegistry);

            this.errors = Counter.builder()
                .name("langchain.errors")
                .description("错误次数")
                .register(meterRegistry);

            this.responseTime = Timer.builder()
                .name("langchain.response.time")
                .description("响应时间")
                .register(meterRegistry);
        }

        public void recordCacheHit() {
            cacheHits.increment();
        }

        public void recordCacheMiss() {
            cacheMisses.increment();
        }

        public void recordError() {
            errors.increment();
        }

        public void recordResponseTime(long duration) {
            responseTime.record(duration, TimeUnit.MILLISECONDS);
        }

        public double getCacheHitRate() {
            long hits = cacheHits.count();
            long misses = cacheMisses.count();
            long total = hits + misses;
            return total > 0 ? (double) hits / total : 0.0;
        }
    }
}
```

---

**总结**: LangChain4j通过链式处理组件简化了复杂AI应用的开发。从基础的数据处理链到智能的Agent系统，LangChain4j提供了丰富的组件和工具。理解其架构设计、内存管理、工具集成和性能优化，对于构建生产级的AI应用至关重要。合理的优化策略能够显著提升应用的性能、稳定性和用户体验。