# Spring AI与生成式AI集成 (100题)

## ⭐ 基础题 (1-30)

### 问题1: Spring AI框架的核心组件和使用

**面试题**: 如何使用Spring AI框架快速集成LLM模型，实现聊天机器人功能？

**口语化答案**:
"Spring AI提供了简洁的LLM集成方式。我会这样构建一个聊天机器人：

```java
// Spring AI配置类
@Configuration
@EnableChatClients
public class SpringAIConfiguration {

    @Bean
    public ChatClient chatClient(ChatClient.Builder builder) {
        return builder
            .defaultSystem("你是一个专业的AI助手，请用简洁明了的语言回答用户问题。")
            .defaultFunctions("getCurrentWeather", "getStockPrice") // 可用函数
            .build();
    }

    @Bean
    public OpenAiChatModel openAiChatModel(OpenAiApi openAiApi) {
        return new OpenAiChatModel(openAiApi, OpenAiChatOptions.builder()
            .withModel("gpt-3.5-turbo")
            .withTemperature(0.7)
            .withMaxTokens(1000)
            .build());
    }

    @Bean
    public OpenAiApi openAiApi(@Value("${spring.ai.openai.api-key}") String apiKey) {
        return new OpenAiApi(apiKey);
    }
}

// 聊天机器人服务
@Service
@Slf4j
public class ChatBotService {

    private final ChatClient chatClient;
    private final ConversationHistoryStore historyStore;
    private final FunctionCallbackRegistry functionRegistry;

    public ChatBotService(ChatClient chatClient,
                          ConversationHistoryStore historyStore,
                          FunctionCallbackRegistry functionRegistry) {
        this.chatClient = chatClient;
        this.historyStore = historyStore;
        this.functionRegistry = functionRegistry;
        registerFunctions();
    }

    public ChatResponse chat(String sessionId, String userMessage) {
        try {
            // 获取对话历史
            List<Message> conversationHistory = historyStore.getConversationHistory(sessionId);

            // 构建用户消息
            UserMessage userMsg = new UserMessage(userMessage);

            // 执行聊天
            Prompt prompt = new Prompt(List.of(userMsg));
            ChatResponse response = chatClient.call(prompt);

            // 保存对话历史
            historyStore.saveMessage(sessionId, userMsg);
            historyStore.saveMessage(sessionId, response.getResult().getOutput());

            return response;

        } catch (Exception e) {
            log.error("聊天处理失败: sessionId={}", sessionId, e);
            throw new ChatException("聊天处理失败", e);
        }
    }

    // 流式聊天
    public Flux<ChatResponse> streamChat(String sessionId, String userMessage) {
        List<Message> conversationHistory = historyStore.getConversationHistory(sessionId);
        UserMessage userMsg = new UserMessage(userMessage);

        Prompt prompt = new Prompt(List.of(userMsg));

        return chatClient.stream(prompt)
            .doOnComplete(() -> {
                // 保存对话历史
                historyStore.saveMessage(sessionId, userMsg);
            });
    }

    // 带上下文的聊天
    public ChatResponse contextualChat(String sessionId, String userMessage, Map<String, Object> context) {
        // 构建增强的系统提示
        String systemPrompt = buildContextualSystemPrompt(context);

        ChatClient contextualClient = ChatClient.builder(chatClient)
            .defaultSystem(systemPrompt)
            .build();

        UserMessage userMsg = new UserMessage(userMessage);
        Prompt prompt = new Prompt(List.of(userMsg));

        ChatResponse response = contextualClient.call(prompt);

        // 保存对话历史
        historyStore.saveMessage(sessionId, userMsg);
        historyStore.saveMessage(sessionId, response.getResult().getOutput());

        return response;
    }

    private String buildContextualSystemPrompt(Map<String, Object> context) {
        StringBuilder promptBuilder = new StringBuilder();
        promptBuilder.append("你是一个专业的AI助手。");

        // 添加上下文信息
        if (context.containsKey("userProfile")) {
            UserProfile profile = (UserProfile) context.get("userProfile");
            promptBuilder.append(String.format("用户信息: %s", profile.toString()));
        }

        if (context.containsKey("businessContext")) {
            String businessContext = (String) context.get("businessContext");
            promptBuilder.append(String.format("业务背景: %s", businessContext));
        }

        if (context.containsKey("taskType")) {
            String taskType = (String) context.get("taskType");
            promptBuilder.append(String.format("任务类型: %s", taskType));
        }

        promptBuilder.append("请根据以上信息回答用户问题。");
        return promptBuilder.toString();
    }

    private void registerFunctions() {
        // 注册天气查询函数
        FunctionCallback weatherFunction = FunctionCallbackWrapper.builder(new WeatherService())
            .withName("getCurrentWeather")
            .withDescription("获取指定城市的当前天气")
            .withResponseConverter((response) -> "" + response)
            .build();

        functionRegistry.register(weatherFunction);

        // 注册股票价格查询函数
        FunctionCallback stockFunction = FunctionCallbackWrapper.builder(new StockService())
            .withName("getStockPrice")
            .withDescription("获取指定股票的当前价格")
            .withResponseConverter((response) -> "" + response)
            .build();

        functionRegistry.register(stockFunction);
    }
}

// 对话历史存储
@Component
public class ConversationHistoryStore {

    private final RedisTemplate<String, Object> redisTemplate;
    private final ObjectMapper objectMapper;
    private final int maxHistorySize = 50;

    public ConversationHistoryStore(RedisTemplate<String, Object> redisTemplate,
                                   ObjectMapper objectMapper) {
        this.redisTemplate = redisTemplate;
        this.objectMapper = objectMapper;
    }

    public List<Message> getConversationHistory(String sessionId) {
        try {
            String key = "conversation:" + sessionId;
            List<Object> messages = redisTemplate.opsForList().range(key, 0, -1);

            return messages.stream()
                .map(this::deserializeMessage)
                .filter(Objects::nonNull)
                .collect(Collectors.toList());

        } catch (Exception e) {
            log.error("获取对话历史失败: sessionId={}", sessionId, e);
            return Collections.emptyList();
        }
    }

    public void saveMessage(String sessionId, Message message) {
        try {
            String key = "conversation:" + sessionId;
            redisTemplate.opsForList().rightPush(key, serializeMessage(message));

            // 限制历史记录长度
            redisTemplate.opsForList().trim(key, -maxHistorySize, -1);
            redisTemplate.expire(key, Duration.ofDays(7));

        } catch (Exception e) {
            log.error("保存对话消息失败: sessionId={}", sessionId, e);
        }
    }

    public void clearConversation(String sessionId) {
        try {
            String key = "conversation:" + sessionId;
            redisTemplate.delete(key);
        } catch (Exception e) {
            log.error("清除对话历史失败: sessionId={}", sessionId, e);
        }
    }

    private Object serializeMessage(Message message) {
        try {
            Map<String, Object> messageMap = new HashMap<>();
            messageMap.put("type", message.getClass().getSimpleName());
            messageMap.put("content", message.getContent());
            messageMap.put("timestamp", System.currentTimeMillis());

            if (message instanceof UserMessage) {
                UserMessage userMessage = (UserMessage) message;
                messageMap.put("mediaType", userMessage.getMediaType().toString());
            } else if (message instanceof AssistantMessage) {
                AssistantMessage assistantMessage = (AssistantMessage) message;
                messageMap.put("metadata", assistantMessage.getMetadata());
            }

            return objectMapper.writeValueAsString(messageMap);

        } catch (Exception e) {
            log.error("消息序列化失败", e);
            return null;
        }
    }

    private Message deserializeMessage(Object serializedMessage) {
        try {
            String json = (String) serializedMessage;
            Map<String, Object> messageMap = objectMapper.readValue(json, Map.class);

            String type = (String) messageMap.get("type");
            String content = (String) messageMap.get("content");

            switch (type) {
                case "UserMessage":
                    return new UserMessage(content);
                case "AssistantMessage":
                    Map<String, Object> metadata = (Map<String, Object>) messageMap.getOrDefault("metadata", Collections.emptyMap());
                    return new AssistantMessage(content, metadata);
                case "SystemMessage":
                    return new SystemMessage(content);
                default:
                    log.warn("未知消息类型: {}", type);
                    return null;
            }

        } catch (Exception e) {
            log.error("消息反序列化失败", e);
            return null;
        }
    }
}

// REST控制器
@RestController
@RequestMapping("/api/v1/chat")
@Slf4j
public class ChatController {

    private final ChatBotService chatBotService;

    public ChatController(ChatBotService chatBotService) {
        this.chatBotService = chatBotService;
    }

    @PostMapping("/chat")
    public ResponseEntity<ChatResponse> chat(@RequestBody ChatRequest request) {
        try {
            ChatResponse response = chatBotService.chat(request.getSessionId(), request.getMessage());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("聊天请求处理失败", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ChatResponse("抱歉，聊天服务暂时不可用。"));
        }
    }

    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<ServerSentEvent<String>> streamChat(@RequestParam String sessionId,
                                                     @RequestParam String message) {
        return chatBotService.streamChat(sessionId, message)
            .map(response -> ServerSentEvent.builder(response.getResult().getOutput().getContent()).build())
            .onErrorReturn(ServerSentEvent.builder("抱歉，流式聊天出现错误。").build());
    }

    @PostMapping("/contextual")
    public ResponseEntity<ChatResponse> contextualChat(@RequestBody ContextualChatRequest request) {
        try {
            ChatResponse response = chatBotService.contextualChat(
                request.getSessionId(),
                request.getMessage(),
                request.getContext()
            );
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("上下文聊天请求处理失败", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ChatResponse("抱歉，上下文聊天服务暂时不可用。"));
        }
    }

    @DeleteMapping("/history/{sessionId}")
    public ResponseEntity<Void> clearHistory(@PathVariable String sessionId) {
        // 实现清除历史记录的逻辑
        return ResponseEntity.ok().build();
    }

    @GetMapping("/history/{sessionId}")
    public ResponseEntity<List<MessageDTO>> getHistory(@PathVariable String sessionId) {
        // 实现获取历史记录的逻辑
        return ResponseEntity.ok(Collections.emptyList());
    }
}

// 函数服务实现
@Component
public class WeatherService {

    public record WeatherRequest(String city) {}

    public record WeatherResponse(String city, double temperature, String description) {}

    @FunctionInfo(name = "getCurrentWeather", description = "获取指定城市的当前天气")
    public WeatherResponse getCurrentWeather(WeatherRequest request) {
        // 模拟天气API调用
        Random random = new Random();
        double temperature = 15 + random.nextDouble() * 20; // 15-35度
        String[] descriptions = {"晴天", "多云", "阴天", "小雨"};
        String description = descriptions[random.nextInt(descriptions.length)];

        return new WeatherResponse(request.city(), temperature, description);
    }
}

@Component
public class StockService {

    public record StockRequest(String symbol) {}

    public record StockResponse(String symbol, double price, double change) {}

    @FunctionInfo(name = "getStockPrice", description = "获取指定股票的当前价格")
    public StockResponse getStockPrice(StockRequest request) {
        // 模拟股票API调用
        Random random = new Random();
        double price = 50 + random.nextDouble() * 200; // 50-250
        double change = (random.nextDouble() - 0.5) * 10; // -5 to +5

        return new StockResponse(request.symbol(), price, change);
    }
}

// 请求和响应DTO
public record ChatRequest(String sessionId, String message) {}

public record ContextualChatRequest(String sessionId, String message, Map<String, Object> context) {}

public record ChatResponse(String response) {}

public record MessageDTO(String type, String content, long timestamp) {}

public record UserProfile(String name, String preferences, String language) {}
```

## ⭐⭐ 进阶题 (31-70)

### 问题31: RAG系统的Spring AI实现

**面试题**: 如何使用Spring AI构建RAG（检索增强生成）系统？

**口语化答案**:
"RAG系统需要向量存储和检索功能。我会这样设计和实现：

```java
// RAG系统服务
@Service
@Slf4j
public class RAGService {

    private final ChatClient chatClient;
    private final VectorStore vectorStore;
    private final DocumentRetriever documentRetriever;
    private final EmbeddingModel embeddingModel;

    public RAGService(ChatClient chatClient,
                      VectorStore vectorStore,
                      DocumentRetriever documentRetriever,
                      EmbeddingModel embeddingModel) {
        this.chatClient = chatClient;
        this.vectorStore = vectorStore;
        this.documentRetriever = documentRetriever;
        this.embeddingModel = embeddingModel;
    }

    // RAG查询
    public RAGResponse ragQuery(RAGRequest request) {
        try {
            // 1. 检索相关文档
            List<Document> relevantDocs = retrieveRelevantDocuments(request.getQuery());

            // 2. 构建增强的提示
            String enhancedPrompt = buildEnhancedPrompt(request.getQuery(), relevantDocs);

            // 3. 生成回答
            ChatResponse response = generateResponse(enhancedPrompt);

            // 4. 构建RAG响应
            return new RAGResponse(
                response.getResult().getOutput().getContent(),
                relevantDocs,
                response.getMetadata()
            );

        } catch (Exception e) {
            log.error("RAG查询失败: query={}", request.getQuery(), e);
            throw new RAGException("RAG查询失败", e);
        }
    }

    // 流式RAG查询
    public Flux<RAGResponse> streamRagQuery(RAGRequest request) {
        return Mono.fromCallable(() -> retrieveRelevantDocuments(request.getQuery()))
            .flatMapMany(relevantDocs -> {
                String enhancedPrompt = buildEnhancedPrompt(request.getQuery(), relevantDocs);
                return generateStreamResponse(enhancedPrompt)
                    .map(response -> new RAGResponse(
                        response.getResult().getOutput().getContent(),
                        relevantDocs,
                        response.getMetadata()
                    ));
            })
            .onErrorReturn(new RAGResponse("抱歉，RAG查询出现错误。", Collections.emptyList(), null));
    }

    private List<Document> retrieveRelevantDocuments(String query) {
        try {
            // 将查询转换为向量
            float[] queryVector = embeddingModel.embed(query);

            // 执行向量搜索
            List<VectorStore.SearchResult> searchResults = vectorStore.search(
                queryVector,
                request.getTopK() != null ? request.getTopK() : 5,
                request.getThreshold() != null ? request.getThreshold() : 0.7
            );

            // 获取文档内容
            return searchResults.stream()
                .map(result -> documentRetriever.getDocument(result.getId()))
                .filter(Objects::nonNull)
                .collect(Collectors.toList());

        } catch (Exception e) {
            log.error("文档检索失败: query={}", query, e);
            return Collections.emptyList();
        }
    }

    private String buildEnhancedPrompt(String query, List<Document> relevantDocs) {
        StringBuilder promptBuilder = new StringBuilder();

        // 添加系统提示
        promptBuilder.append("你是一个专业的AI助手。请基于以下提供的上下文信息回答用户问题。\n\n");
        promptBuilder.append("上下文信息：\n");

        // 添加相关文档
        for (int i = 0; i < relevantDocs.size(); i++) {
            Document doc = relevantDocs.get(i);
            promptBuilder.append(String.format("%d. %s\n", i + 1, doc.getContent()));
        }

        promptBuilder.append("\n用户问题：");
        promptBuilder.append(query);
        promptBuilder.append("\n\n请基于以上上下文信息回答用户问题。如果上下文中没有相关信息，请明确说明。");

        return promptBuilder.toString();
    }

    private ChatResponse generateResponse(String prompt) {
        SystemMessage systemMsg = new SystemMessage("你是一个专业的AI助手，请基于提供的上下文信息回答问题。");
        UserMessage userMsg = new UserMessage(prompt);

        Prompt chatPrompt = new Prompt(List.of(systemMsg, userMsg));
        return chatClient.call(chatPrompt);
    }

    private Flux<ChatResponse> generateStreamResponse(String prompt) {
        SystemMessage systemMsg = new SystemMessage("你是一个专业的AI助手，请基于提供的上下文信息回答问题。");
        UserMessage userMsg = new UserMessage(prompt);

        Prompt chatPrompt = new Prompt(List.of(systemMsg, userMsg));
        return chatClient.stream(chatPrompt);
    }

    // 文档管理
    public void addDocument(Document document) {
        try {
            // 生成文档向量
            float[] vector = embeddingModel.embed(document.getContent());

            // 存储到向量数据库
            vectorStore.add(document.getId(), vector, document.getMetadata());

            log.info("文档添加成功: docId={}", document.getId());

        } catch (Exception e) {
            log.error("文档添加失败: docId={}", document.getId(), e);
            throw new DocumentException("文档添加失败", e);
        }
    }

    public void addDocuments(List<Document> documents) {
        documents.parallelStream().forEach(this::addDocument);
    }

    public void deleteDocument(String documentId) {
        try {
            vectorStore.delete(documentId);
            documentRetriever.deleteDocument(documentId);
            log.info("文档删除成功: docId={}", documentId);
        } catch (Exception e) {
            log.error("文档删除失败: docId={}", documentId, e);
            throw new DocumentException("文档删除失败", e);
        }
    }

    public List<Document> searchDocuments(String query, int topK, double threshold) {
        try {
            float[] queryVector = embeddingModel.embed(query);

            return vectorStore.search(queryVector, topK, threshold).stream()
                .map(result -> documentRetriever.getDocument(result.getId()))
                .filter(Objects::nonNull)
                .collect(Collectors.toList());

        } catch (Exception e) {
            log.error("文档搜索失败: query={}", query, e);
            return Collections.emptyList();
        }
    }
}

// 向量存储接口
public interface VectorStore {

    void add(String id, float[] vector, Map<String, Object> metadata);

    List<SearchResult> search(float[] queryVector, int topK, double threshold);

    void delete(String id);

    List<SearchResult> similaritySearch(String id, int topK);

    class SearchResult {
        private final String id;
        private final double similarity;
        private final Map<String, Object> metadata;

        public SearchResult(String id, double similarity, Map<String, Object> metadata) {
            this.id = id;
            this.similarity = similarity;
            this.metadata = metadata;
        }

        // getters...
        public String getId() { return id; }
        public double getSimilarity() { return similarity; }
        public Map<String, Object> getMetadata() { return metadata; }
    }
}

// Redis向量存储实现
@Component
public class RedisVectorStore implements VectorStore {

    private final RedisTemplate<String, Object> redisTemplate;
    private final ObjectMapper objectMapper;

    public RedisVectorStore(RedisTemplate<String, Object> redisTemplate,
                           ObjectMapper objectMapper) {
        this.redisTemplate = redisTemplate;
        this.objectMapper = objectMapper;
    }

    @Override
    public void add(String id, float[] vector, Map<String, Object> metadata) {
        try {
            String key = "vector:" + id;

            // 存储向量
            VectorDocument vectorDoc = new VectorDocument(id, vector, metadata);
            redisTemplate.opsForValue().set(key, objectMapper.writeValueAsString(vectorDoc));

            // 存储向量索引用于搜索（简化实现）
            for (int i = 0; i < vector.length; i++) {
                String indexKey = String.format("vector_idx:%d:%.3f", i, vector[i]);
                redisTemplate.opsForSet().add(indexKey, id);
            }

            redisTemplate.expire(key, Duration.ofDays(30));

        } catch (Exception e) {
            log.error("向量存储失败: id={}", id, e);
            throw new VectorStoreException("向量存储失败", e);
        }
    }

    @Override
    public List<SearchResult> search(float[] queryVector, int topK, double threshold) {
        // 简化的向量搜索实现
        // 实际中应该使用专门的向量数据库如Pinecone、Weaviate等

        List<SearchResult> results = new ArrayList<>();

        // 这里应该实现实际的向量相似度计算
        // 为了演示，返回空列表
        return results;
    }

    @Override
    public void delete(String id) {
        try {
            String key = "vector:" + id;
            String vectorData = (String) redisTemplate.opsForValue().get(key);

            if (vectorData != null) {
                VectorDocument doc = objectMapper.readValue(vectorData, VectorDocument.class);
                float[] vector = doc.getVector();

                // 删除索引
                for (int i = 0; i < vector.length; i++) {
                    String indexKey = String.format("vector_idx:%d:%.3f", i, vector[i]);
                    redisTemplate.opsForSet().remove(indexKey, id);
                }
            }

            redisTemplate.delete(key);

        } catch (Exception e) {
            log.error("向量删除失败: id={}", id, e);
            throw new VectorStoreException("向量删除失败", e);
        }
    }

    @Override
    public List<SearchResult> similaritySearch(String id, int topK) {
        try {
            String key = "vector:" + id;
            String vectorData = (String) redisTemplate.opsForValue().get(key);

            if (vectorData == null) {
                return Collections.emptyList();
            }

            VectorDocument doc = objectMapper.readValue(vectorData, VectorDocument.class);
            return search(doc.getVector(), topK, 0.5);

        } catch (Exception e) {
            log.error("相似度搜索失败: id={}", id, e);
            return Collections.emptyList();
        }
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    private static class VectorDocument {
        private String id;
        private float[] vector;
        private Map<String, Object> metadata;
    }
}

// 文档检索器
@Component
public class DocumentRetriever {

    private final RedisTemplate<String, Object> redisTemplate;
    private final ObjectMapper objectMapper;

    public DocumentRetriever(RedisTemplate<String, Object> redisTemplate,
                             ObjectMapper objectMapper) {
        this.redisTemplate = redisTemplate;
        this.objectMapper = objectMapper;
    }

    public Document getDocument(String documentId) {
        try {
            String key = "document:" + documentId;
            String documentData = (String) redisTemplate.opsForValue().get(key);

            if (documentData == null) {
                return null;
            }

            return objectMapper.readValue(documentData, Document.class);

        } catch (Exception e) {
            log.error("文档获取失败: documentId={}", documentId, e);
            return null;
        }
    }

    public void saveDocument(Document document) {
        try {
            String key = "document:" + document.getId();
            redisTemplate.opsForValue().set(key, objectMapper.writeValueAsString(document));
            redisTemplate.expire(key, Duration.ofDays(30));
        } catch (Exception e) {
            log.error("文档保存失败: documentId={}", document.getId(), e);
        }
    }

    public void deleteDocument(String documentId) {
        String key = "document:" + documentId;
        redisTemplate.delete(key);
    }
}

// RAG REST控制器
@RestController
@RequestMapping("/api/v1/rag")
@Slf4j
public class RAGController {

    private final RAGService ragService;

    public RAGController(RAGService ragService) {
        this.ragService = ragService;
    }

    @PostMapping("/query")
    public ResponseEntity<RAGResponse> query(@RequestBody RAGRequest request) {
        try {
            RAGResponse response = ragService.ragQuery(request);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("RAG查询失败", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new RAGResponse("抱歉，RAG查询服务暂时不可用。", Collections.emptyList(), null));
        }
    }

    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<ServerSentEvent<String>> streamQuery(@RequestParam String query,
                                                       @RequestParam(required = false) Integer topK,
                                                       @RequestParam(required = false) Double threshold) {
        RAGRequest request = new RAGRequest(query);
        if (topK != null) request.setTopK(topK);
        if (threshold != null) request.setThreshold(threshold);

        return ragService.streamRagQuery(request)
            .map(response -> ServerSentEvent.builder(response.getResponse()).build())
            .onErrorReturn(ServerSentEvent.builder("抱歉，RAG流式查询出现错误。").build());
    }

    @PostMapping("/documents")
    public ResponseEntity<Void> addDocument(@RequestBody Document document) {
        try {
            ragService.addDocument(document);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            log.error("添加文档失败", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping("/documents/batch")
    public ResponseEntity<Void> addDocuments(@RequestBody List<Document> documents) {
        try {
            ragService.addDocuments(documents);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            log.error("批量添加文档失败", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @DeleteMapping("/documents/{documentId}")
    public ResponseEntity<Void> deleteDocument(@PathVariable String documentId) {
        try {
            ragService.deleteDocument(documentId);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            log.error("删除文档失败: documentId={}", documentId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/search")
    public ResponseEntity<List<Document>> searchDocuments(@RequestParam String query,
                                                         @RequestParam(defaultValue = "5") int topK,
                                                         @RequestParam(defaultValue = "0.7") double threshold) {
        try {
            List<Document> documents = ragService.searchDocuments(query, topK, threshold);
            return ResponseEntity.ok(documents);
        } catch (Exception e) {
            log.error("文档搜索失败", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}

// DTO类
public record RAGRequest(String query, Integer topK, Double threshold) {}

public record RAGResponse(String response, List<Document> sourceDocuments, Map<String, Object> metadata) {}

public record Document(String id, String content, String title, String url, Map<String, Object> metadata) {}
```

## ⭐⭐⭐ 专家题 (71-100)

### 问题71: 多模态AI系统的Spring AI实现

**面试题**: 如何使用Spring AI构建支持文本、图像、音频的多模态AI系统？

**口语化答案**:
"多模态AI需要处理不同类型的数据。我会设计一个统一的多模态处理架构：

```java
// 多模态AI服务
@Service
@Slf4j
public class MultiModalAIService {

    private final ChatClient textChatClient;
    private final ImageAnalysisClient imageClient;
    private final AudioProcessingClient audioClient;
    private final MultiModalEmbeddingService embeddingService;
    private final ModalityFusionService fusionService;

    public MultiModalAIService(ChatClient textChatClient,
                              ImageAnalysisClient imageClient,
                              AudioProcessingClient audioClient,
                              MultiModalEmbeddingService embeddingService,
                              ModalityFusionService fusionService) {
        this.textChatClient = textChatClient;
        this.imageClient = imageClient;
        this.audioClient = audioClient;
        this.embeddingService = embeddingService;
        this.fusionService = fusionService;
    }

    // 多模态查询
    public MultiModalResponse processMultiModalQuery(MultiModalRequest request) {
        try {
            log.info("处理多模态查询: 模态={}", request.getModalities());

            // 1. 处理各种模态的数据
            Map<Modality, Object> processedData = processModalities(request);

            // 2. 生成多模态嵌入
            MultiModalEmbedding embedding = embeddingService.generateEmbedding(processedData);

            // 3. 执行模态融合和推理
            FusionResult fusionResult = fusionService.fuseAndInfer(embedding, request.getQuery());

            // 4. 生成最终响应
            return generateMultiModalResponse(fusionResult, processedData);

        } catch (Exception e) {
            log.error("多模态查询处理失败", e);
            throw new MultiModalException("多模态查询处理失败", e);
        }
    }

    // 流式多模态处理
    public Flux<MultiModalResponse> processMultiModalQueryStream(MultiModalRequest request) {
        return Flux.fromIterable(request.getModalities())
            .flatMap(modality -> processModalityStream(modality, request))
            .collectList()
            .flatMapMany(processedData -> {
                MultiModalEmbedding embedding = embeddingService.generateEmbedding(processedData);
                return fusionService.fuseAndInferStream(embedding, request.getQuery())
                    .map(fusionResult -> generateMultiModalResponse(fusionResult, processedData));
            })
            .onErrorReturn(new MultiModalResponse("抱歉，多模态处理出现错误。"));
    }

    private Map<Modality, Object> processModalities(MultiModalRequest request) {
        Map<Modality, Object> processedData = new HashMap<>();

        // 处理文本模态
        if (request.getModalities().contains(Modality.TEXT) && request.getText() != null) {
            processedData.put(Modality.TEXT, processText(request.getText()));
        }

        // 处理图像模态
        if (request.getModalities().contains(Modality.IMAGE) && request.getImageData() != null) {
            processedData.put(Modality.IMAGE, processImage(request.getImageData()));
        }

        // 处理音频模态
        if (request.getModalities().contains(Modality.AUDIO) && request.getAudioData() != null) {
            processedData.put(Modality.AUDIO, processAudio(request.getAudioData()));
        }

        // 处理视频模态
        if (request.getModalities().contains(Modality.VIDEO) && request.getVideoData() != null) {
            processedData.put(Modality.VIDEO, processVideo(request.getVideoData()));
        }

        return processedData;
    }

    private Mono<Object> processModalityStream(Modality modality, MultiModalRequest request) {
        switch (modality) {
            case TEXT:
                return Mono.just(processText(request.getText()));
            case IMAGE:
                return Mono.just(processImage(request.getImageData()));
            case AUDIO:
                return Mono.just(processAudio(request.getAudioData()));
            case VIDEO:
                return Mono.just(processVideo(request.getVideoData()));
            default:
                return Mono.error(new UnsupportedOperationException("不支持的模态: " + modality));
        }
    }

    private TextProcessingResult processText(String text) {
        try {
            // 文本预处理
            String cleanedText = preprocessText(text);

            // 文本分析
            ChatResponse textAnalysis = textChatClient.call(
                new Prompt(List.of(new UserMessage("分析以下文本的情感和主题: " + cleanedText)))
            );

            return new TextProcessingResult(cleanedText, textAnalysis.getResult().getOutput().getContent());

        } catch (Exception e) {
            log.error("文本处理失败", e);
            return new TextProcessingResult(text, "文本处理失败");
        }
    }

    private ImageProcessingResult processImage(byte[] imageData) {
        try {
            // 图像分析
            ImageAnalysisResult analysis = imageClient.analyzeImage(imageData);

            // 图像描述生成
            String description = generateImageDescription(analysis);

            return new ImageProcessingResult(imageData, analysis, description);

        } catch (Exception e) {
            log.error("图像处理失败", e);
            return new ImageProcessingResult(imageData, null, "图像处理失败");
        }
    }

    private AudioProcessingResult processAudio(byte[] audioData) {
        try {
            // 音频分析
            AudioAnalysisResult analysis = audioClient.analyzeAudio(audioData);

            // 语音识别
            String transcript = generateTranscript(analysis);

            return new AudioProcessingResult(audioData, analysis, transcript);

        } catch (Exception e) {
            log.error("音频处理失败", e);
            return new AudioProcessingResult(audioData, null, "音频处理失败");
        }
    }

    private VideoProcessingResult processVideo(byte[] videoData) {
        try {
            // 视频帧提取
            List<byte[]> frames = extractVideoFrames(videoData);

            // 视频分析
            VideoAnalysisResult analysis = analyzeVideoFrames(frames);

            return new VideoProcessingResult(videoData, frames, analysis);

        } catch (Exception e) {
            log.error("视频处理失败", e);
            return new VideoProcessingResult(videoData, Collections.emptyList(), null);
        }
    }

    private String preprocessText(String text) {
        // 文本清理和预处理
        return text.trim().replaceAll("\\s+", " ");
    }

    private String generateImageDescription(ImageAnalysisResult analysis) {
        // 使用视觉语言模型生成图像描述
        ChatResponse response = textChatClient.call(
            new Prompt(List.of(new UserMessage("请描述这张图片的主要内容: " + analysis.toString())))
        );
        return response.getResult().getOutput().getContent();
    }

    private String generateTranscript(AudioAnalysisResult analysis) {
        // 使用语音识别模型生成转录文本
        ChatResponse response = textChatClient.call(
            new Prompt(List.of(new UserMessage("请转录以下音频内容: " + analysis.toString())))
        );
        return response.getResult().getOutput().getContent();
    }

    private List<byte[]> extractVideoFrames(byte[] videoData) {
        // 视频帧提取逻辑
        List<byte[]> frames = new ArrayList<>();
        // 简化实现：返回空列表
        return frames;
    }

    private VideoAnalysisResult analyzeVideoFrames(List<byte[]> frames) {
        // 视频帧分析
        return new VideoAnalysisResult(frames.size(), "视频分析完成");
    }

    private MultiModalResponse generateMultiModalResponse(FusionResult fusionResult,
                                                        Map<Modality, Object> processedData) {
        // 构建多模态响应
        MultiModalResponse response = new MultiModalResponse();
        response.setTextResponse(fusionResult.getTextResponse());

        // 添加各模态的处理结果
        if (processedData.containsKey(Modality.IMAGE)) {
            response.setImageAnalysis(((ImageProcessingResult) processedData.get(Modality.IMAGE)).getAnalysis());
        }

        if (processedData.containsKey(Modality.AUDIO)) {
            response.setAudioTranscript(((AudioProcessingResult) processedData.get(Modality.AUDIO)).getTranscript());
        }

        if (processedData.containsKey(Modality.VIDEO)) {
            response.setVideoAnalysis(((VideoProcessingResult) processedData.get(Modality.VIDEO)).getAnalysis());
        }

        response.setConfidence(fusionResult.getConfidence());
        response.setProcessingTime(fusionResult.getProcessingTime());

        return response;
    }
}

// 模态融合服务
@Service
@Slf4j
public class ModalityFusionService {

    private final ChatClient fusionChatClient;
    private final EmbeddingModel embeddingModel;

    public ModalityFusionService(ChatClient fusionChatClient,
                                EmbeddingModel embeddingModel) {
        this.fusionChatClient = fusionChatClient;
        this.embeddingModel = embeddingModel;
    }

    public FusionResult fuseAndInfer(MultiModalEmbedding embedding, String query) {
        try {
            // 1. 构建融合提示
            String fusionPrompt = buildFusionPrompt(embedding, query);

            // 2. 执行融合推理
            ChatResponse response = fusionChatClient.call(
                new Prompt(List.of(new UserMessage(fusionPrompt)))
            );

            // 3. 解析融合结果
            return parseFusionResult(response, embedding);

        } catch (Exception e) {
            log.error("模态融合失败", e);
            throw new FusionException("模态融合失败", e);
        }
    }

    public Flux<FusionResult> fuseAndInferStream(MultiModalEmbedding embedding, String query) {
        String fusionPrompt = buildFusionPrompt(embedding, query);

        Prompt prompt = new Prompt(List.of(new UserMessage(fusionPrompt)));

        return fusionChatClient.stream(prompt)
            .map(response -> parseFusionResult(response, embedding))
            .onErrorReturn(new FusionResult("融合处理出现错误", 0.0, 0));
    }

    private String buildFusionPrompt(MultiModalEmbedding embedding, String query) {
        StringBuilder promptBuilder = new StringBuilder();

        promptBuilder.append("你是一个专业的多模态AI助手。");
        promptBuilder.append("请基于以下多模态信息回答用户问题：\n\n");

        // 添加各模态信息
        if (embedding.getTextEmbedding() != null) {
            promptBuilder.append("文本信息：");
            promptBuilder.append(embedding.getTextEmbedding().toString());
            promptBuilder.append("\n\n");
        }

        if (embedding.getImageEmbedding() != null) {
            promptBuilder.append("图像信息：");
            promptBuilder.append("图像内容已处理完成");
            promptBuilder.append("\n\n");
        }

        if (embedding.getAudioEmbedding() != null) {
            promptBuilder.append("音频信息：");
            promptBuilder.append("音频内容已处理完成");
            promptBuilder.append("\n\n");
        }

        promptBuilder.append("用户问题：");
        promptBuilder.append(query);
        promptBuilder.append("\n\n请综合以上多模态信息，给出详细、准确的回答。");

        return promptBuilder.toString();
    }

    private FusionResult parseFusionResult(ChatResponse response, MultiModalEmbedding embedding) {
        String textResponse = response.getResult().getOutput().getContent();
        double confidence = calculateConfidence(response, embedding);
        long processingTime = System.currentTimeMillis();

        return new FusionResult(textResponse, confidence, processingTime);
    }

    private double calculateConfidence(ChatResponse response, MultiModalEmbedding embedding) {
        // 基于响应内容和嵌入质量计算置信度
        String content = response.getResult().getOutput().getContent();

        // 简化的置信度计算
        double contentQuality = content.length() > 100 ? 0.9 : 0.6;
        double embeddingQuality = embedding.getOverallQuality();

        return (contentQuality + embeddingQuality) / 2.0;
    }
}

// 多模态嵌入服务
@Service
public class MultiModalEmbeddingService {

    private final EmbeddingModel textEmbeddingModel;
    private final EmbeddingModel imageEmbeddingModel;
    private final EmbeddingModel audioEmbeddingModel;

    public MultiModalEmbeddingService(EmbeddingModel textEmbeddingModel,
                                     EmbeddingModel imageEmbeddingModel,
                                     EmbeddingModel audioEmbeddingModel) {
        this.textEmbeddingModel = textEmbeddingModel;
        this.imageEmbeddingModel = imageEmbeddingModel;
        this.audioEmbeddingModel = audioEmbeddingModel;
    }

    public MultiModalEmbedding generateEmbedding(Map<Modality, Object> processedData) {
        MultiModalEmbedding embedding = new MultiModalEmbedding();

        // 生成文本嵌入
        if (processedData.containsKey(Modality.TEXT)) {
            TextProcessingResult textResult = (TextProcessingResult) processedData.get(Modality.TEXT);
            float[] textEmbedding = textEmbeddingModel.embed(textResult.getCleanText());
            embedding.setTextEmbedding(textEmbedding);
        }

        // 生成图像嵌入
        if (processedData.containsKey(Modality.IMAGE)) {
            ImageProcessingResult imageResult = (ImageProcessingResult) processedData.get(Modality.IMAGE);
            String imageDescription = imageResult.getDescription();
            float[] imageEmbedding = imageEmbeddingModel.embed(imageDescription);
            embedding.setImageEmbedding(imageEmbedding);
        }

        // 生成音频嵌入
        if (processedData.containsKey(Modality.AUDIO)) {
            AudioProcessingResult audioResult = (AudioProcessingResult) processedData.get(Modality.AUDIO);
            String transcript = audioResult.getTranscript();
            float[] audioEmbedding = audioEmbeddingModel.embed(transcript);
            embedding.setAudioEmbedding(audioEmbedding);
        }

        // 计算整体质量
        embedding.setOverallQuality(calculateOverallQuality(embedding));

        return embedding;
    }

    private double calculateOverallQuality(MultiModalEmbedding embedding) {
        int modalityCount = 0;
        double totalQuality = 0.0;

        if (embedding.getTextEmbedding() != null) {
            modalityCount++;
            totalQuality += calculateEmbeddingQuality(embedding.getTextEmbedding());
        }

        if (embedding.getImageEmbedding() != null) {
            modalityCount++;
            totalQuality += calculateEmbeddingQuality(embedding.getImageEmbedding());
        }

        if (embedding.getAudioEmbedding() != null) {
            modalityCount++;
            totalQuality += calculateEmbeddingQuality(embedding.getAudioEmbedding());
        }

        return modalityCount > 0 ? totalQuality / modalityCount : 0.0;
    }

    private double calculateEmbeddingQuality(float[] embedding) {
        // 简化的嵌入质量计算
        double norm = 0.0;
        for (float value : embedding) {
            norm += value * value;
        }
        norm = Math.sqrt(norm);

        // 基于向量的范数计算质量
        return Math.min(1.0, norm / 100.0);
    }
}

// 客户端接口
public interface ImageAnalysisClient {
    ImageAnalysisResult analyzeImage(byte[] imageData);
}

public interface AudioProcessingClient {
    AudioAnalysisResult analyzeAudio(byte[] audioData);
}

// DTO类
public enum Modality {
    TEXT, IMAGE, AUDIO, VIDEO
}

public record MultiModalRequest(Set<Modality> modalities, String text, byte[] imageData, byte[] audioData, byte[] videoData, String query) {}

public record MultiModalResponse(String textResponse, ImageAnalysisResult imageAnalysis, String audioTranscript, VideoAnalysisResult videoAnalysis, double confidence, long processingTime) {}

public record TextProcessingResult(String cleanText, String analysis) {}

public record ImageProcessingResult(byte[] imageData, ImageAnalysisResult analysis, String description) {}

public record AudioProcessingResult(byte[] audioData, AudioAnalysisResult analysis, String transcript) {}

public record VideoProcessingResult(byte[] videoData, List<byte[]> frames, VideoAnalysisResult analysis) {}

public record ImageAnalysisResult(String description, List<String> objects, float confidence) {}

public record AudioAnalysisResult(String duration, String language, float confidence) {}

public record VideoAnalysisResult(int frameCount, String description) {}

public record MultiModalEmbedding(float[] textEmbedding, float[] imageEmbedding, float[] audioEmbedding, double overallQuality) {}

public record FusionResult(String textResponse, double confidence, long processingTime) {}

// 多模态REST控制器
@RestController
@RequestMapping("/api/v1/multimodal")
@Slf4j
public class MultiModalController {

    private final MultiModalAIService multiModalAIService;

    public MultiModalController(MultiModalAIService multiModalAIService) {
        this.multiModalAIService = multiModalAIService;
    }

    @PostMapping("/process")
    public ResponseEntity<MultiModalResponse> processMultiModal(@RequestBody MultiModalRequest request) {
        try {
            MultiModalResponse response = multiModalAIService.processMultiModalQuery(request);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("多模态处理失败", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new MultiModalResponse("抱歉，多模态处理服务暂时不可用。", null, null, null, 0.0, 0));
        }
    }

    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<ServerSentEvent<String>> processMultiModalStream(
            @RequestParam Set<Modality> modalities,
            @RequestParam(required = false) String text,
            @RequestParam(required = false) String query) {

        MultiModalRequest request = new MultiModalRequest(modalities, text, null, null, null, query);

        return multiModalAIService.processMultiModalQueryStream(request)
            .map(response -> ServerSentEvent.builder(response.getTextResponse()).build())
            .onErrorReturn(ServerSentEvent.builder("抱歉，多模态流式处理出现错误。").build());
    }
}
```

## 💡 面试技巧提示

### Spring AI面试要点：

1. **框架核心**: ChatClient、EmbeddingModel、PromptTemplate
2. **RAG系统**: 向量存储、文档检索、上下文增强
3. **多模态处理**: 文本、图像、音频的统一处理架构
4. **函数调用**: Spring AI的Function Calling机制
5. **流式处理**: 实时响应和错误处理

### 常见错误：
- 不了解Spring AI的核心组件和使用方式
- 缺乏RAG系统的实际实现经验
- 忽略多模态数据的处理复杂性
- 没有考虑性能优化和资源管理
- 不了解向量数据库和嵌入模型的选择

通过这些题目，面试官能全面考察候选人对Spring AI框架和生成式AI技术的掌握程度。