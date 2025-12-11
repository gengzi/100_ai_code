# Spring AI与OpenAI集成开发

## 题目1: ⭐ Spring AI基础配置与OpenAI API集成

**问题描述**:
Spring AI提供了与多种AI模型提供商的集成接口。请说明如何配置Spring AI与OpenAI的集成，包括API密钥配置、客户端创建和基本的聊天功能实现。

**答案要点**:
- **依赖配置**: 添加Spring AI OpenAI starter
- **API密钥管理**: 通过application.yml配置或环境变量
- **客户端创建**: 使用ChatClient进行API调用
- **错误处理**: 处理API限流和异常情况

**代码示例**:
```yaml
# application.yml
spring:
  ai:
    openai:
      api-key: ${OPENAI_API_KEY}
      chat:
        options:
          model: gpt-3.5-turbo
          temperature: 0.7
          max-tokens: 1000
```

```java
@Configuration
public class OpenAIConfig {

    @Bean
    public ChatClient chatClient(OpenAiChatModel chatModel) {
        return ChatClient.builder(chatModel)
            .defaultSystem("你是一个专业的Java技术顾问，请用专业且友好的语气回答问题。")
            .defaultFunctions("getCurrentTime", "getWeather")  // 注册函数调用
            .build();
    }

    @Bean
    public OpenAiApi openAiApi() {
        return new OpenAiApi(System.getenv("OPENAI_API_KEY"));
    }
}

@Service
public class ChatService {

    private final ChatClient chatClient;

    public ChatService(ChatClient chatClient) {
        this.chatClient = chatClient;
    }

    public String chat(String message) {
        return chatClient.prompt()
            .user(message)
            .call()
            .content();
    }

    public String chatWithHistory(String message, List<ChatMessage> history) {
        ChatPrompt.Builder promptBuilder = ChatPrompt.builder();

        // 添加历史消息
        for (ChatMessage msg : history) {
            if (msg.isUser()) {
                promptBuilder.user(msg.getContent());
            } else {
                promptBuilder.system(msg.getContent());
            }
        }

        promptBuilder.user(message);

        return chatClient.prompt(promptBuilder.build())
            .call()
            .content();
    }

    // 流式响应
    public Flux<String> streamChat(String message) {
        return chatClient.prompt()
            .user(message)
            .stream()
            .content();
    }
}

@Data
@AllArgsConstructor
public class ChatMessage {
    private String content;
    private boolean isUser;
    private LocalDateTime timestamp;
}
```

---

## 题目2: ⭐⭐ 函数调用(Function Calling)在Spring AI中的实现

**问题描述**:
OpenAI的Function Calling功能允许AI调用外部API。请设计一个完整的Spring AI应用，实现天气查询、时间获取等函数调用功能。

**答案要点**:
- **函数定义**: 使用@Function注解定义可调用函数
- **参数类型**: 支持复杂对象参数
- **响应处理**: 解析函数调用结果并返回给AI
- **错误处理**: 函数调用失败时的fallback机制

**代码示例**:
```java
@RestController
@RequestMapping("/api/chat")
public class ChatController {

    private final ChatClient chatClient;
    private final WeatherService weatherService;
    private final TimeService timeService;

    public ChatController(ChatClient chatClient, WeatherService weatherService, TimeService timeService) {
        this.chatClient = chatClient;
        this.weatherService = weatherService;
        this.timeService = timeService;
    }

    @PostMapping("/chat")
    public ResponseEntity<String> chat(@RequestBody ChatRequest request) {
        try {
            String response = chatClient.prompt()
                .user(request.getMessage())
                .functions("getWeather", "getCurrentTime")
                .call()
                .content();

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("抱歉，处理您的请求时遇到了问题: " + e.getMessage());
        }
    }

    @PostMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<ServerSentEvent<String>> streamChat(@RequestBody ChatRequest request) {
        return chatClient.prompt()
            .user(request.getMessage())
            .functions("getWeather", "getCurrentTime")
            .stream()
            .content()
            .map(content -> ServerSentEvent.builder(content).build());
    }
}

// 函数定义
@Component
public class WeatherFunctions {

    private final WeatherService weatherService;

    public WeatherFunctions(WeatherService weatherService) {
        this.weatherService = weatherService;
    }

    @Function("获取指定城市的当前天气信息")
    public WeatherInfo getWeather(
            @Param("城市名称，例如：北京、上海、深圳") String city,
            @Param("温度单位，可选：celsius(摄氏度)或fahrenheit(华氏度)", defaultValue = "celsius") String unit) {

        try {
            return weatherService.getWeather(city, unit);
        } catch (Exception e) {
            throw new RuntimeException("无法获取天气信息: " + e.getMessage());
        }
    }
}

@Component
public class TimeFunctions {

    private final TimeService timeService;

    public TimeFunctions(TimeService timeService) {
        this.timeService = timeService;
    }

    @Function("获取当前时间信息")
    public TimeInfo getCurrentTime(
            @Param("时区，例如：Asia/Shanghai、UTC、America/New_York", defaultValue = "UTC") String timezone) {

        try {
            return timeService.getCurrentTime(timezone);
        } catch (Exception e) {
            throw new RuntimeException("无法获取时间信息: " + e.getMessage());
        }
    }
}

// 数据传输对象
@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class WeatherInfo {
    private String city;
    private double temperature;
    private String unit;
    private String description;
    private int humidity;
    private double windSpeed;
    private String windDirection;

    @JsonCreator
    public WeatherInfo(
            @JsonProperty("city") String city,
            @JsonProperty("temperature") double temperature,
            @JsonProperty("unit") String unit,
            @JsonProperty("description") String description,
            @JsonProperty("humidity") int humidity,
            @JsonProperty("windSpeed") double windSpeed,
            @JsonProperty("windDirection") String windDirection) {
        this.city = city;
        this.temperature = temperature;
        this.unit = unit;
        this.description = description;
        this.humidity = humidity;
        this.windSpeed = windSpeed;
        this.windDirection = windDirection;
    }
}

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class TimeInfo {
    private String timezone;
    private String currentTime;
    private String date;
    private String dayOfWeek;
    private String utcOffset;

    @JsonCreator
    public TimeInfo(
            @JsonProperty("timezone") String timezone,
            @JsonProperty("currentTime") String currentTime,
            @JsonProperty("date") String date,
            @JsonProperty("dayOfWeek") String dayOfWeek,
            @JsonProperty("utcOffset") String utcOffset) {
        this.timezone = timezone;
        this.currentTime = currentTime;
        this.date = date;
        this.dayOfWeek = dayOfWeek;
        this.utcOffset = utcOffset;
    }
}

// 服务实现
@Service
public class WeatherService {

    public WeatherInfo getWeather(String city, String unit) {
        // 模拟天气API调用
        Random random = new Random();

        double temperature;
        if ("celsius".equalsIgnoreCase(unit)) {
            temperature = 15 + random.nextDouble() * 20; // 15-35°C
        } else {
            temperature = 59 + random.nextDouble() * 36; // 59-95°F
        }

        String[] descriptions = {"晴天", "多云", "阴天", "小雨", "大雨"};
        String description = descriptions[random.nextInt(descriptions.length)];

        int humidity = 40 + random.nextInt(50); // 40-90%
        double windSpeed = random.nextDouble() * 20; // 0-20 km/h

        String[] directions = {"北", "东北", "东", "东南", "南", "西南", "西", "西北"};
        String windDirection = directions[random.nextInt(directions.length)];

        return new WeatherInfo(city, temperature, unit, description, humidity, windSpeed, windDirection);
    }
}

@Service
public class TimeService {

    public TimeInfo getCurrentTime(String timezone) {
        try {
            ZoneId zoneId = ZoneId.of(timezone);
            ZonedDateTime now = ZonedDateTime.now(zoneId);

            DateTimeFormatter timeFormatter = DateTimeFormatter.ofPattern("HH:mm:ss");
            DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");

            String dayOfWeek = now.getDayOfWeek().getDisplayName(
                TextStyle.FULL, Locale.CHINESE);

            return new TimeInfo(
                timezone,
                now.format(timeFormatter),
                now.format(dateFormatter),
                dayOfWeek,
                zoneId.getRules().getOffset(now.toInstant()).toString()
            );

        } catch (Exception e) {
            // 使用UTC作为默认时区
            ZonedDateTime now = ZonedDateTime.now(ZoneId.UTC);
            DateTimeFormatter timeFormatter = DateTimeFormatter.ofPattern("HH:mm:ss");
            DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");

            return new TimeInfo(
                "UTC",
                now.format(timeFormatter),
                now.format(dateFormatter),
                now.getDayOfWeek().toString(),
                "+00:00"
            );
        }
    }
}

// 请求和响应对象
@Data
@AllArgsConstructor
public class ChatRequest {
    private String message;
    private String sessionId; // 可选，用于会话管理
}

@Data
@AllArgsConstructor
public class ChatResponse {
    private String response;
    private String sessionId;
    private List<FunctionCall> functionCalls;
    private LocalDateTime timestamp;
}

@Data
@AllArgsConstructor
public class FunctionCall {
    private String functionName;
    private Map<String, Object> arguments;
    private Object result;
}
```

---

## 题目3: ⭐⭐⭐ 多模态AI应用：Spring AI处理图像和文本

**问题描述**:
现代AI模型支持多模态输入，包括文本和图像。请设计一个Spring Boot应用，集成OpenAI的Vision API，实现图像分析、OCR和视觉问答功能。

**答案要点**:
- **多模态输入**: 支持图像+文本的组合查询
- **文件上传**: 处理图像文件上传和存储
- **Base64编码**: 将图像转换为AI模型可处理的格式
- **异步处理**: 大图像处理的异步机制

**代码示例**:
```java
@RestController
@RequestMapping("/api/vision")
@RequiredArgsConstructor
public class VisionController {

    private final OpenAiImageModel imageModel;
    private final ChatClient chatClient;
    private final FileStorageService fileStorageService;

    @PostMapping("/analyze")
    public ResponseEntity<VisionResponse> analyzeImage(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "question", required = false) String question) {

        try {
            // 1. 保存上传的文件
            String filePath = fileStorageService.storeFile(file);
            String base64Image = encodeImageToBase64(filePath);

            // 2. 构建多模态提示
            UserMessage userMessage = new UserMessage(
                question != null ? question : "请描述这张图片的内容",
                List.of(new Media(MimeTypeUtils.IMAGE_JPEG, base64Image))
            );

            // 3. 调用Vision API
            ChatResponse response = chatClient.prompt()
                .messages(userMessage)
                .call()
                .chatResponse();

            VisionResponse visionResponse = new VisionResponse(
                response.getResult().getOutput().getContent(),
                filePath,
                file.getOriginalFilename(),
                LocalDateTime.now()
            );

            return ResponseEntity.ok(visionResponse);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new VisionResponse("图像分析失败: " + e.getMessage(), null, null, null));
        }
    }

    @PostMapping("/ocr")
    public ResponseEntity<OCRResponse> extractText(@RequestParam("file") MultipartFile file) {
        try {
            String filePath = fileStorageService.storeFile(file);
            String base64Image = encodeImageToBase64(filePath);

            UserMessage userMessage = new UserMessage(
                "请提取图片中的所有文字内容，保持原有的格式和布局",
                List.of(new Media(MimeTypeUtils.IMAGE_JPEG, base64Image))
            );

            ChatResponse response = chatClient.prompt()
                .messages(userMessage)
                .call()
                .chatResponse();

            OCRResponse ocrResponse = new OCRResponse(
                response.getResult().getOutput().getContent(),
                filePath,
                file.getOriginalFilename(),
                LocalDateTime.now()
            );

            return ResponseEntity.ok(ocrResponse);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new OCRResponse("文字提取失败: " + e.getMessage(), null, null, null));
        }
    }

    @PostMapping("/compare")
    public ResponseEntity<ComparisonResponse> compareImages(
            @RequestParam("file1") MultipartFile file1,
            @RequestParam("file2") MultipartFile file2) {

        try {
            String filePath1 = fileStorageService.storeFile(file1);
            String filePath2 = fileStorageService.storeFile(file2);

            String base64Image1 = encodeImageToBase64(filePath1);
            String base64Image2 = encodeImageToBase64(filePath2);

            // 构建对比请求
            UserMessage userMessage = new UserMessage(
                "请比较这两张图片的相似性，分析它们的相同点和不同点",
                List.of(
                    new Media(MimeTypeUtils.IMAGE_JPEG, base64Image1),
                    new Media(MimeTypeUtils.IMAGE_JPEG, base64Image2)
                )
            );

            ChatResponse response = chatClient.prompt()
                .messages(userMessage)
                .call()
                .chatResponse();

            ComparisonResponse comparisonResponse = new ComparisonResponse(
                response.getResult().getOutput().getContent(),
                filePath1,
                filePath2,
                file1.getOriginalFilename(),
                file2.getOriginalFilename(),
                LocalDateTime.now()
            );

            return ResponseEntity.ok(comparisonResponse);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ComparisonResponse("图片对比失败: " + e.getMessage(), null, null, null, null, null));
        }
    }

    private String encodeImageToBase64(String filePath) throws IOException {
        byte[] imageBytes = Files.readAllBytes(Paths.get(filePath));
        return Base64.getEncoder().encodeToString(imageBytes);
    }
}

// 文件存储服务
@Service
public class FileStorageService {

    @Value("${app.upload.dir:./uploads}")
    private String uploadDir;

    private final Path fileStorageLocation;

    public FileStorageService() {
        this.fileStorageLocation = Paths.get(uploadDir).toAbsolutePath().normalize();
        try {
            Files.createDirectories(this.fileStorageLocation);
        } catch (IOException ex) {
            throw new RuntimeException("无法创建上传目录", ex);
        }
    }

    public String storeFile(MultipartFile file) {
        // 文件名标准化
        String fileName = StringUtils.cleanPath(file.getOriginalFilename());

        try {
            // 检查文件名是否包含非法字符
            if (fileName.contains("..")) {
                throw new RuntimeException("文件名包含非法字符: " + fileName);
            }

            // 生成唯一文件名
            String fileExtension = getFileExtension(fileName);
            String newFileName = UUID.randomUUID().toString() + "." + fileExtension;

            Path targetLocation = this.fileStorageLocation.resolve(newFileName);
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);

            return targetLocation.toString();

        } catch (IOException ex) {
            throw new RuntimeException("无法存储文件: " + fileName, ex);
        }
    }

    private String getFileExtension(String fileName) {
        if (fileName == null || fileName.lastIndexOf(".") == -1) {
            return "";
        }
        return fileName.substring(fileName.lastIndexOf(".") + 1);
    }
}

// 响应数据类
@Data
@AllArgsConstructor
@NoArgsConstructor
public class VisionResponse {
    private String analysis;
    private String imagePath;
    private String fileName;
    private LocalDateTime timestamp;
}

@Data
@AllArgsConstructor
@NoArgsConstructor
public class OCRResponse {
    private String extractedText;
    private String imagePath;
    private String fileName;
    private LocalDateTime timestamp;
}

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ComparisonResponse {
    private String comparison;
    private String imagePath1;
    private String imagePath2;
    private String fileName1;
    private String fileName2;
    private LocalDateTime timestamp;
}

// 配置类
@Configuration
@EnableConfigurationProperties({OpenAiProperties.class})
public class VisionConfig {

    @Bean
    public OpenAiImageModel openAiImageModel(OpenAiConnectionProperties properties) {
        return new OpenAiImageModel(
            new OpenAiApi(properties.getApiKey()),
            OpenAiImageOptions.builder()
                .model("gpt-4-vision-preview")
                .build()
        );
    }

    @Bean
    public ChatClient visionChatClient(OpenAiChatModel chatModel) {
        return ChatClient.builder(chatModel)
            .defaultSystem("你是一个专业的图像分析专家，能够准确描述和分析图像内容。")
            .build();
    }
}

@ConfigurationProperties(prefix = "spring.ai.openai")
@Data
public class OpenAiProperties {
    private String apiKey;
    private String chatOptions;
}
```

---

## 题目4: ⭐⭐⭐⭐ Spring AI与向量数据库集成实现RAG系统

**问题描述**:
检索增强生成(RAG)结合了向量搜索和文本生成能力。请设计一个完整的Spring Boot RAG系统，包括文档处理、向量化、向量存储和检索生成。

**答案要点**:
- **文档处理**: 支持多种格式的文档解析
- **文本分块**: 智能文档分割策略
- **向量化**: 使用OpenAI embeddings进行文本向量化
- **向量存储**: 集成向量数据库(如Milvus、Pinecone)
- **检索策略**: 相似度搜索和混合检索

**代码示例**:
```java
@RestController
@RequestMapping("/api/rag")
@RequiredArgsConstructor
public class RAGController {

    private final RAGService ragService;
    private final DocumentProcessor documentProcessor;
    private final VectorStore vectorStore;

    @PostMapping("/upload")
    public ResponseEntity<UploadResponse> uploadDocument(@RequestParam("file") MultipartFile file) {
        try {
            // 1. 处理文档
            List<DocumentChunk> chunks = documentProcessor.processDocument(file);

            // 2. 生成向量和存储
            List<String> chunkIds = ragService.storeDocumentChunks(chunks, file.getOriginalFilename());

            UploadResponse response = new UploadResponse(
                file.getOriginalFilename(),
                chunkIds.size(),
                chunkIds,
                "文档上传成功"
            );

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new UploadResponse(file.getOriginalFilename(), 0, null,
                    "文档上传失败: " + e.getMessage()));
        }
    }

    @PostMapping("/query")
    public ResponseEntity<RAGResponse> query(@RequestBody RAGRequest request) {
        try {
            // 1. 向量检索
            List<DocumentChunk> relevantChunks = vectorStore.search(
                request.getQuery(),
                request.getTopK() != null ? request.getTopK() : 5
            );

            // 2. 生成增强回复
            String enhancedResponse = ragService.generateEnhancedResponse(
                request.getQuery(),
                relevantChunks,
                request.getConversationHistory()
            );

            RAGResponse response = new RAGResponse(
                enhancedResponse,
                relevantChunks,
                request.getQuery(),
                LocalDateTime.now()
            );

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new RAGResponse("查询处理失败: " + e.getMessage(),
                    null, request.getQuery(), null));
        }
    }

    @GetMapping("/documents")
    public ResponseEntity<List<DocumentInfo>> listDocuments() {
        List<DocumentInfo> documents = ragService.listDocuments();
        return ResponseEntity.ok(documents);
    }

    @DeleteMapping("/documents/{documentId}")
    public ResponseEntity<Void> deleteDocument(@PathVariable String documentId) {
        ragService.deleteDocument(documentId);
        return ResponseEntity.noContent().build();
    }
}

@Service
public class RAGService {

    private final ChatClient chatClient;
    private final VectorStore vectorStore;
    private final EmbeddingModel embeddingModel;
    private final DocumentRepository documentRepository;

    public RAGService(ChatClient chatClient, VectorStore vectorStore,
                     EmbeddingModel embeddingModel, DocumentRepository documentRepository) {
        this.chatClient = chatClient;
        this.vectorStore = vectorStore;
        this.embeddingModel = embeddingModel;
        this.documentRepository = documentRepository;
    }

    public List<String> storeDocumentChunks(List<DocumentChunk> chunks, String fileName) {
        List<String> chunkIds = new ArrayList<>();

        for (DocumentChunk chunk : chunks) {
            // 1. 生成embedding
            List<Double> embedding = embeddingModel.embed(chunk.getContent());

            // 2. 创建向量文档
            VectorDocument vectorDoc = VectorDocument.builder()
                .id(UUID.randomUUID().toString())
                .content(chunk.getContent())
                .embedding(embedding)
                .metadata(createMetadata(chunk, fileName))
                .build();

            // 3. 存储到向量数据库
            vectorStore.add(vectorDoc);

            // 4. 保存文档信息到关系数据库
            documentRepository.save(createDocumentEntity(vectorDoc, chunk, fileName));

            chunkIds.add(vectorDoc.getId());
        }

        return chunkIds;
    }

    public String generateEnhancedResponse(String query, List<DocumentChunk> relevantChunks,
                                         List<ChatMessage> history) {
        // 1. 构建上下文
        String context = buildContext(relevantChunks);

        // 2. 构建系统提示
        String systemPrompt = buildSystemPrompt(context);

        // 3. 构建对话历史
        ChatPrompt.Builder promptBuilder = ChatPrompt.builder()
            .system(systemPrompt);

        if (history != null) {
            for (ChatMessage msg : history) {
                if (msg.isUser()) {
                    promptBuilder.user(msg.getContent());
                } else {
                    promptBuilder.system(msg.getContent());
                }
            }
        }

        promptBuilder.user(query);

        // 4. 生成回复
        return chatClient.prompt(promptBuilder.build())
            .call()
            .content();
    }

    private String buildContext(List<DocumentChunk> chunks) {
        StringBuilder context = new StringBuilder("以下是与查询相关的文档内容：\n\n");

        for (int i = 0; i < chunks.size(); i++) {
            DocumentChunk chunk = chunks.get(i);
            context.append(String.format("[文档片段 %d]\n来源：%s\n内容：%s\n\n",
                i + 1, chunk.getSource(), chunk.getContent()));
        }

        return context.toString();
    }

    private String buildSystemPrompt(String context) {
        return String.format(
            "你是一个专业的文档问答助手。请基于以下提供的文档内容来回答用户的问题。\n\n" +
            "%s\n\n" +
            "回答要求：\n" +
            "1. 严格基于提供的文档内容回答\n" +
            "2. 如果文档中没有相关信息，请明确说明\n" +
            "3. 引用具体的文档片段作为答案的依据\n" +
            "4. 回答要准确、简洁、有条理\n" +
            "5. 使用中文回答",
            context
        );
    }

    private Map<String, Object> createMetadata(DocumentChunk chunk, String fileName) {
        Map<String, Object> metadata = new HashMap<>();
        metadata.put("source", chunk.getSource());
        metadata.put("fileName", fileName);
        metadata.put("page", chunk.getPage());
        metadata.put("chunkIndex", chunk.getChunkIndex());
        metadata.put("timestamp", Instant.now());
        return metadata;
    }

    private DocumentEntity createDocumentEntity(VectorDocument vectorDoc, DocumentChunk chunk, String fileName) {
        DocumentEntity entity = new DocumentEntity();
        entity.setId(vectorDoc.getId());
        entity.setContent(chunk.getContent());
        entity.setSource(chunk.getSource());
        entity.setFileName(fileName);
        entity.setPage(chunk.getPage());
        entity.setEmbedding(vectorDoc.getEmbedding().stream()
            .map(d -> d.floatValue())
            .collect(Collectors.toList()));
        entity.setCreatedAt(LocalDateTime.now());
        return entity;
    }

    public List<DocumentInfo> listDocuments() {
        return documentRepository.findAll()
            .stream()
            .map(this::convertToDocumentInfo)
            .collect(Collectors.toList());
    }

    public void deleteDocument(String documentId) {
        // 从向量数据库删除
        vectorStore.delete(documentId);

        // 从关系数据库删除
        documentRepository.deleteById(documentId);
    }

    private DocumentInfo convertToDocumentInfo(DocumentEntity entity) {
        return new DocumentInfo(
            entity.getId(),
            entity.getFileName(),
            entity.getSource(),
            entity.getPage(),
            entity.getCreatedAt()
        );
    }
}

// 文档处理器
@Service
public class DocumentProcessor {

    private final Tika tika = new Tika();

    public List<DocumentChunk> processDocument(MultipartFile file) throws IOException {
        String content = tika.parseToString(file.getInputStream());
        String fileName = file.getOriginalFilename();

        return chunkDocument(content, fileName);
    }

    private List<DocumentChunk> chunkDocument(String content, String fileName) {
        List<DocumentChunk> chunks = new ArrayList<>();

        // 智能分块策略
        String[] paragraphs = content.split("\n\n");
        int chunkSize = 0;
        StringBuilder currentChunk = new StringBuilder();
        int chunkIndex = 0;

        for (int i = 0; i < paragraphs.length; i++) {
            String paragraph = paragraphs[i].trim();

            if (paragraph.isEmpty()) continue;

            // 如果当前块加上新段落超过限制，则创建新块
            if (chunkSize + paragraph.length() > 1000 && currentChunk.length() > 0) {
                chunks.add(new DocumentChunk(
                    currentChunk.toString(),
                    fileName,
                    1, // 简化处理，实际应该计算页码
                    chunkIndex++
                ));
                currentChunk = new StringBuilder();
                chunkSize = 0;
            }

            currentChunk.append(paragraph).append("\n\n");
            chunkSize += paragraph.length();
        }

        // 添加最后一个块
        if (currentChunk.length() > 0) {
            chunks.add(new DocumentChunk(
                currentChunk.toString(),
                fileName,
                1,
                chunkIndex
            ));
        }

        return chunks;
    }
}

// 向量存储接口
@Component
public class VectorStore {

    private final EmbeddingModel embeddingModel;
    private final RestTemplate restTemplate;

    @Value("${vector.database.url}")
    private String vectorDbUrl;

    @Value("${vector.database.api-key}")
    private String vectorDbApiKey;

    public VectorStore(EmbeddingModel embeddingModel) {
        this.embeddingModel = embeddingModel;
        this.restTemplate = new RestTemplate();
    }

    public void add(VectorDocument document) {
        String url = vectorDbUrl + "/documents";

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(vectorDbApiKey);
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<VectorDocument> request = new HttpEntity<>(document, headers);
        restTemplate.postForEntity(url, request, Void.class);
    }

    public List<DocumentChunk> search(String query, int topK) {
        // 1. 生成查询向量
        List<Double> queryEmbedding = embeddingModel.embed(query);

        // 2. 搜索相似文档
        String url = vectorDbUrl + "/search";

        Map<String, Object> requestBody = Map.of(
            "vector", queryEmbedding,
            "topK", topK,
            "includeMetadata", true
        );

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(vectorDbApiKey);
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);

        ResponseEntity<SearchResponse> response = restTemplate.postForEntity(url, request, SearchResponse.class);

        // 3. 转换结果
        return response.getBody().getResults()
            .stream()
            .map(this::convertToDocumentChunk)
            .collect(Collectors.toList());
    }

    public void delete(String documentId) {
        String url = vectorDbUrl + "/documents/" + documentId;

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(vectorDbApiKey);

        HttpEntity<Void> request = new HttpEntity<>(headers);
        restTemplate.exchange(url, HttpMethod.DELETE, request, Void.class);
    }

    private DocumentChunk convertToDocumentChunk(SearchResult result) {
        return new DocumentChunk(
            result.getContent(),
            (String) result.getMetadata().get("source"),
            (Integer) result.getMetadata().getOrDefault("page", 1),
            (Integer) result.getMetadata().getOrDefault("chunkIndex", 0)
        );
    }
}

// 数据模型
@Data
@AllArgsConstructor
public class DocumentChunk {
    private String content;
    private String source;
    private int page;
    private int chunkIndex;
}

@Data
@Builder
public class VectorDocument {
    private String id;
    private String content;
    private List<Double> embedding;
    private Map<String, Object> metadata;
}

// 请求和响应对象
@Data
@AllArgsConstructor
@NoArgsConstructor
public class UploadResponse {
    private String fileName;
    private int chunkCount;
    private List<String> chunkIds;
    private String message;
}

@Data
@AllArgsConstructor
@NoArgsConstructor
public class RAGRequest {
    private String query;
    private Integer topK;
    private List<ChatMessage> conversationHistory;
}

@Data
@AllArgsConstructor
@NoArgsConstructor
public class RAGResponse {
    private String response;
    private List<DocumentChunk> relevantChunks;
    private String query;
    private LocalDateTime timestamp;
}

@Data
@AllArgsConstructor
@NoArgsConstructor
public class DocumentInfo {
    private String id;
    private String fileName;
    private String source;
    private int page;
    private LocalDateTime createdAt;
}

// 向量数据库响应对象
@Data
public class SearchResponse {
    private List<SearchResult> results;
}

@Data
public class SearchResult {
    private String id;
    private String content;
    private double score;
    private Map<String, Object> metadata;
}
```

---

## 题目5: ⭐⭐⭐⭐⭐ 企业级Spring AI应用架构设计

**问题描述**:
设计一个企业级的Spring AI应用架构，需要支持多模型切换、负载均衡、缓存策略、监控告警等企业级特性。请提供完整的架构设计和关键实现。

**答案要点**:
- **多模型支持**: 支持不同AI模型的动态切换
- **负载均衡**: 多个API密钥的轮询和熔断
- **缓存策略**: 智能缓存常见查询结果
- **监控告警**: 请求统计、性能监控、异常告警
- **安全认证**: API密钥管理、访问控制

**代码示例**:
```java
// 核心架构服务
@Service
@Slf4j
public class EnterpriseAIService {

    private final Map<String, AIModelProvider> modelProviders;
    private final LoadBalancer loadBalancer;
    private final CacheManager cacheManager;
    private final MetricsCollector metricsCollector;
    private final AlertManager alertManager;

    public EnterpriseAIService(List<AIModelProvider> providers,
                              LoadBalancer loadBalancer,
                              CacheManager cacheManager,
                              MetricsCollector metricsCollector,
                              AlertManager alertManager) {
        this.modelProviders = providers.stream()
            .collect(Collectors.toMap(AIModelProvider::getModelName, Function.identity()));
        this.loadBalancer = loadBalancer;
        this.cacheManager = cacheManager;
        this.metricsCollector = metricsCollector;
        this.alertManager = alertManager;
    }

    @Timed(name = "ai.request.processing")
    public AIResponse processRequest(AIRequest request) {
        long startTime = System.currentTimeMillis();

        try {
            // 1. 缓存检查
            String cacheKey = generateCacheKey(request);
            AIResponse cachedResponse = cacheManager.get(cacheKey, AIResponse.class);

            if (cachedResponse != null) {
                metricsCollector.recordCacheHit();
                return cachedResponse;
            }

            // 2. 模型选择
            AIModelProvider provider = selectModelProvider(request);

            // 3. 负载均衡选择API密钥
            ApiKeyCredentials credentials = loadBalancer.selectApiKey(provider.getModelName());

            // 4. 发送请求
            AIResponse response = sendRequestWithRetry(provider, request, credentials);

            // 5. 缓存结果
            if (isCacheable(request, response)) {
                cacheManager.put(cacheKey, response, Duration.ofMinutes(30));
            }

            // 6. 记录指标
            metricsCollector.recordSuccess(request, response, System.currentTimeMillis() - startTime);

            return response;

        } catch (Exception e) {
            metricsCollector.recordFailure(request, e);
            alertManager.checkAndSendAlert(e);

            log.error("AI请求处理失败", e);
            throw new AIServiceException("AI服务处理失败: " + e.getMessage(), e);
        }
    }

    private AIModelProvider selectModelProvider(AIRequest request) {
        String requestedModel = request.getModelName();

        // 如果指定了模型
        if (requestedModel != null && modelProviders.containsKey(requestedModel)) {
            return modelProviders.get(requestedModel);
        }

        // 根据请求类型智能选择模型
        return selectBestModelForRequest(request);
    }

    private AIModelProvider selectBestModelForRequest(AIRequest request) {
        // 基于请求内容类型选择最佳模型
        String content = request.getContent().toLowerCase();

        if (content.contains("图片") || content.contains("图像")) {
            return modelProviders.get("gpt-4-vision-preview");
        } else if (content.length() > 4000 || content.contains("长篇")) {
            return modelProviders.get("gpt-4-turbo");
        } else {
            return modelProviders.get("gpt-3.5-turbo");
        }
    }

    private AIResponse sendRequestWithRetry(AIModelProvider provider, AIRequest request,
                                          ApiKeyCredentials credentials) {
        int maxRetries = 3;
        long retryDelay = 1000; // 1秒

        for (int attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                return provider.sendRequest(request, credentials);

            } catch (RateLimitException e) {
                if (attempt == maxRetries) {
                    throw new AIServiceException("达到最大重试次数，请求仍然被限流", e);
                }

                // 限流时延长等待时间
                try {
                    Thread.sleep(retryDelay * attempt);
                } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                    throw new AIServiceException("重试被中断", ie);
                }

            } catch (Exception e) {
                if (attempt == maxRetries || !isRetryableException(e)) {
                    throw e;
                }

                log.warn("请求失败，进行第 {} 次重试: {}", attempt, e.getMessage());
            }
        }

        throw new AIServiceException("所有重试都失败了");
    }

    private boolean isRetryableException(Exception e) {
        return e instanceof NetworkException ||
               e instanceof TimeoutException ||
               (e instanceof RuntimeException && e.getMessage().contains("503"));
    }

    private String generateCacheKey(AIRequest request) {
        return DigestUtils.md5Hex(
            String.format("%s_%s_%s",
                request.getModelName(),
                request.getContent(),
                request.getTemperature())
        );
    }

    private boolean isCacheable(AIRequest request, AIResponse response) {
        // 不缓存包含敏感信息的请求
        String content = request.getContent().toLowerCase();
        if (content.contains("密码") || content.contains("token") || content.contains("密钥")) {
            return false;
        }

        // 不缓存实时性要求高的请求
        if (content.contains("当前时间") || content.contains("现在") || content.contains("最新")) {
            return false;
        }

        return true;
    }
}

// AI模型提供者接口
public interface AIModelProvider {
    String getModelName();
    AIResponse sendRequest(AIRequest request, ApiKeyCredentials credentials);
    boolean isHealthy();
    ModelMetrics getMetrics();
}

@Component
public class OpenAIProvider implements AIModelProvider {

    private final RestTemplate restTemplate;
    private final OpenAiProperties properties;

    public OpenAIProvider(OpenAiProperties properties) {
        this.properties = properties;
        this.restTemplate = new RestTemplate();
    }

    @Override
    public String getModelName() {
        return "openai";
    }

    @Override
    public AIResponse sendRequest(AIRequest request, ApiKeyCredentials credentials) {
        try {
            OpenAiRequest openaiRequest = convertToOpenAiRequest(request);

            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(credentials.getApiKey());
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<OpenAiRequest> entity = new HttpEntity<>(openaiRequest, headers);

            ResponseEntity<OpenAiResponse> response = restTemplate.postForEntity(
                properties.getApiUrl() + "/chat/completions",
                entity,
                OpenAiResponse.class
            );

            if (!response.getStatusCode().is2xxSuccessful()) {
                throw new AIServiceException("OpenAI API调用失败: " + response.getStatusCode());
            }

            return convertFromOpenAiResponse(response.getBody());

        } catch (RestClientException e) {
            if (e.getMessage().contains("rate_limit_exceeded")) {
                throw new RateLimitException("OpenAI API限流", e);
            }
            throw new AIServiceException("OpenAI API调用异常", e);
        }
    }

    @Override
    public boolean isHealthy() {
        try {
            ResponseEntity<String> response = restTemplate.getForEntity(
                properties.getApiUrl() + "/models",
                String.class
            );
            return response.getStatusCode().is2xxSuccessful();
        } catch (Exception e) {
            return false;
        }
    }

    @Override
    public ModelMetrics getMetrics() {
        // 实现指标收集逻辑
        return new ModelMetrics();
    }

    private OpenAiRequest convertToOpenAiRequest(AIRequest request) {
        List<OpenAiMessage> messages = new ArrayList<>();

        if (request.getSystemPrompt() != null) {
            messages.add(new OpenAiMessage("system", request.getSystemPrompt()));
        }

        messages.add(new OpenAiMessage("user", request.getContent()));

        return OpenAiRequest.builder()
            .model(request.getModelName())
            .messages(messages)
            .temperature(request.getTemperature())
            .maxTokens(request.getMaxTokens())
            .stream(request.isStream())
            .build();
    }

    private AIResponse convertFromOpenAiResponse(OpenAiResponse openaiResponse) {
        return AIResponse.builder()
            .content(openaiResponse.getChoices().get(0).getMessage().getContent())
            .model(openaiResponse.getModel())
            .usage(openaiResponse.getUsage())
            .createdAt(Instant.ofEpochSecond(openaiResponse.getCreated()))
            .build();
    }
}

// 负载均衡器
@Component
public class LoadBalancer {

    private final Map<String, ApiKeyPool> apiKeyPools = new ConcurrentHashMap<>();
    private final CircuitBreakerRegistry circuitBreakerRegistry;

    public LoadBalancer(CircuitBreakerRegistry circuitBreakerRegistry) {
        this.circuitBreakerRegistry = circuitBreakerRegistry;
    }

    @PostConstruct
    public void initialize() {
        // 初始化不同模型的API密钥池
        apiKeyPools.put("openai", new ApiKeyPool(getOpenAiApiKeys()));
        apiKeyPools.put("gpt-4-vision-preview", new ApiKeyPool(getVisionApiKeys()));
    }

    public ApiKeyCredentials selectApiKey(String modelName) {
        ApiKeyPool pool = apiKeyPools.get(modelName);
        if (pool == null) {
            throw new AIServiceException("未找到模型 " + modelName + " 的API密钥池");
        }

        CircuitBreaker circuitBreaker = circuitBreakerRegistry.circuitBreaker(modelName);

        return circuitBreaker.executeSupplier(() -> pool.getNextApiKey());
    }

    private List<String> getOpenAiApiKeys() {
        // 从配置或密钥管理服务获取
        return Arrays.asList(
            System.getenv("OPENAI_API_KEY_1"),
            System.getenv("OPENAI_API_KEY_2"),
            System.getenv("OPENAI_API_KEY_3")
        ).filter(Objects::nonNull).collect(Collectors.toList());
    }

    private List<String> getVisionApiKeys() {
        return Arrays.asList(
            System.getenv("OPENAI_VISION_API_KEY_1"),
            System.getenv("OPENAI_VISION_API_KEY_2")
        ).filter(Objects::nonNull).collect(Collectors.toList());
    }
}

// 指标收集器
@Component
public class MetricsCollector {

    private final MeterRegistry meterRegistry;
    private final Counter requestCounter;
    private final Counter successCounter;
    private final Counter failureCounter;
    private final Counter cacheHitCounter;
    private final Timer responseTimer;

    public MetricsCollector(MeterRegistry meterRegistry) {
        this.meterRegistry = meterRegistry;
        this.requestCounter = Counter.builder("ai.requests.total")
            .description("Total AI requests")
            .register(meterRegistry);
        this.successCounter = Counter.builder("ai.requests.success")
            .description("Successful AI requests")
            .register(meterRegistry);
        this.failureCounter = Counter.builder("ai.requests.failure")
            .description("Failed AI requests")
            .register(meterRegistry);
        this.cacheHitCounter = Counter.builder("ai.cache.hits")
            .description("Cache hits")
            .register(meterRegistry);
        this.responseTimer = Timer.builder("ai.response.time")
            .description("AI response time")
            .register(meterRegistry);
    }

    public void recordRequest() {
        requestCounter.increment();
    }

    public void recordSuccess(AIRequest request, AIResponse response, long duration) {
        successCounter.increment();
        responseTimer.record(duration, TimeUnit.MILLISECONDS);

        // 记录自定义指标
        Tags tags = Tags.of(
            "model", request.getModelName(),
            "tokens", String.valueOf(response.getUsage().getTotalTokens())
        );

        meterRegistry.counter("ai.tokens.used", tags)
            .increment(response.getUsage().getTotalTokens());
    }

    public void recordFailure(AIRequest request, Exception exception) {
        failureCounter.increment();

        Tags tags = Tags.of(
            "model", request.getModelName(),
            "error", exception.getClass().getSimpleName()
        );

        meterRegistry.counter("ai.errors", tags).increment();
    }

    public void recordCacheHit() {
        cacheHitCounter.increment();
    }
}

// 告警管理器
@Component
public class AlertManager {

    private final NotificationService notificationService;
    private final Map<String, AtomicInteger> errorCounts = new ConcurrentHashMap<>();
    private final Map<String, Long> lastAlertTime = new ConcurrentHashMap<>();

    public AlertManager(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    public void checkAndSendAlert(Exception exception) {
        String errorType = exception.getClass().getSimpleName();

        // 增加错误计数
        AtomicInteger count = errorCounts.computeIfAbsent(errorType, k -> new AtomicInteger(0));
        int currentCount = count.incrementAndGet();

        // 检查是否需要发送告警
        if (shouldSendAlert(errorType, currentCount)) {
            sendAlert(errorType, currentCount, exception);
        }
    }

    private boolean shouldSendAlert(String errorType, int currentCount) {
        // 错误数量超过阈值
        if (currentCount >= 10) {
            return true;
        }

        // 严重错误立即告警
        if (errorType.contains("Security") || errorType.contains("Authentication")) {
            return true;
        }

        return false;
    }

    private void sendAlert(String errorType, int count, Exception exception) {
        Long lastTime = lastAlertTime.get(errorType);
        long currentTime = System.currentTimeMillis();

        // 限制告警频率（5分钟内最多一次）
        if (lastTime != null && (currentTime - lastTime) < 300000) {
            return;
        }

        lastAlertTime.put(errorType, currentTime);

        AlertMessage alert = AlertMessage.builder()
            .title("AI服务异常告警")
            .message(String.format("错误类型: %s, 发生次数: %d, 错误信息: %s",
                errorType, count, exception.getMessage()))
            .severity(calculateSeverity(errorType, count))
            .timestamp(LocalDateTime.now())
            .build();

        notificationService.sendAlert(alert);

        // 重置计数器
        errorCounts.get(errorType).set(0);
    }

    private AlertSeverity calculateSeverity(String errorType, int count) {
        if (count >= 50) {
            return AlertSeverity.CRITICAL;
        } else if (count >= 20) {
            return AlertSeverity.WARNING;
        } else {
            return AlertSeverity.INFO;
        }
    }
}

// 配置类
@Configuration
@EnableCircuitBreaker
public class EnterpriseAIConfig {

    @Bean
    public CircuitBreakerRegistry circuitBreakerRegistry() {
        CircuitBreakerConfig config = CircuitBreakerConfig.custom()
            .failureRateThreshold(50)
            .waitDurationInOpenState(Duration.ofSeconds(30))
            .permittedNumberOfCallsInHalfOpenState(5)
            .slidingWindowType(SlidingWindowType.COUNT_BASED)
            .slidingWindowSize(20)
            .build();

        return CircuitBreakerRegistry.of(config);
    }

    @Bean
    public CacheManager cacheManager() {
        CaffeineCacheManager cacheManager = new CaffeineCacheManager();
        cacheManager.setCaffeine(Caffeine.newBuilder()
            .maximumSize(1000)
            .expireAfterWrite(Duration.ofMinutes(30))
            .recordStats());
        return cacheManager;
    }

    @Bean
    public MeterRegistryCustomizer<MeterRegistry> metricsCommonTags() {
        return registry -> registry.config().commonTags(
            "application", "enterprise-ai-service",
            "region", System.getenv().getOrDefault("REGION", "unknown")
        );
    }
}
```

---

**总结**: Spring AI为Java开发者提供了强大的AI应用开发能力。通过合理的企业级架构设计，可以构建出可扩展、高可用、安全的AI服务。关键要点包括多模型支持、智能负载均衡、缓存优化、监控告警等企业级特性的实现。