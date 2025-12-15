# Java IO系统与大数据处理 (100题)

## ⭐ 基础题 (1-30)

### 问题1: Java IO模型在AI数据加载中的应用

**面试题**: 在机器学习项目中，如何选择合适的IO模型来高效加载大规模数据集？

**口语化答案**:
"我会根据数据特点和硬件条件来选择IO模型：

1. **小文件批量读取**: 使用BufferedIO提高缓存命中率
2. **大文件流式处理**: 使用NIO的FileChannel和Memory-Mapped Files
3. **网络数据获取**: 使用异步IO避免阻塞

```java
public class DataLoadingStrategy {

    // 传统IO - 适合小文件批量加载
    public List<DataSample> loadDatasetWithBufferedIO(String datasetPath) throws IOException {
        List<DataSample> dataset = new ArrayList<>();

        try (BufferedReader reader = new BufferedReader(
                new FileReader(datasetPath), 8192 * 4)) {  // 32KB缓冲区

            String line;
            while ((line = reader.readLine()) != null) {
                DataSample sample = parseDataSample(line);
                dataset.add(sample);
            }
        }

        return dataset;
    }

    // NIO - 适合大文件内存映射
    public List<DataSample> loadDatasetWithMappedFile(String datasetPath) throws IOException {
        List<DataSample> dataset = new ArrayList<>();

        try (RandomAccessFile file = new RandomAccessFile(datasetPath, "r");
             FileChannel channel = file.getChannel()) {

            long fileSize = channel.size();
            MappedByteBuffer buffer = channel.map(
                FileChannel.MapMode.READ_ONLY, 0, fileSize);

            StringBuilder lineBuilder = new StringBuilder();
            while (buffer.hasRemaining()) {
                char c = (char) buffer.get();
                if (c == '\n') {
                    DataSample sample = parseDataSample(lineBuilder.toString());
                    dataset.add(sample);
                    lineBuilder.setLength(0);
                } else {
                    lineBuilder.append(c);
                }
            }
        }

        return dataset;
    }

    // 异步IO - 适合网络数据获取
    public CompletableFuture<List<DataSample>> loadDatasetAsync(String... urls) {
        List<CompletableFuture<List<DataSample>>> futures = Arrays.stream(urls)
            .map(url -> CompletableFuture.supplyAsync(() -> {
                try {
                    return fetchAndParseData(url);
                } catch (IOException e) {
                    throw new RuntimeException("Failed to load data from: " + url, e);
                }
            }))
            .collect(Collectors.toList());

        return CompletableFuture.allOf(futures.toArray(new CompletableFuture[0]))
            .thenApply(v -> futures.stream()
                .map(CompletableFuture::join)
                .flatMap(List::stream)
                .collect(Collectors.toList()));
    }
}
```

### 问题2: 序列化机制在AI模型持久化中的应用

**面试题**: 在深度学习项目中，如何高效地序列化和反序列化神经网络模型？

**口语化答案**:
"模型序列化需要考虑效率、兼容性和安全性。我会这样设计：

```java
public class ModelSerializer {

    // 自定义高效序列化格式
    public static class BinaryModelFormat {

        public static void serializeModel(NeuralNetwork model, String filePath) throws IOException {
            try (DataOutputStream dos = new DataOutputStream(
                    new BufferedOutputStream(new FileOutputStream(filePath)))) {

                // 写入版本号
                dos.writeInt(1);

                // 写入网络架构信息
                dos.writeInt(model.getLayerCount());
                for (Layer layer : model.getLayers()) {
                    serializeLayer(dos, layer);
                }

                // 写入权重参数
                serializeWeights(dos, model.getWeights());

                // 写入训练元数据
                serializeMetadata(dos, model.getTrainingMetadata());
            }
        }

        private static void serializeLayer(DataOutputStream dos, Layer layer) throws IOException {
            // 写入层类型
            dos.writeUTF(layer.getClass().getSimpleName());

            // 写入层配置
            dos.writeInt(layer.getInputSize());
            dos.writeInt(layer.getOutputSize());
            dos.writeUTF(layer.getActivationFunction());

            // 写入超参数
            Map<String, Object> hyperparams = layer.getHyperparameters();
            dos.writeInt(hyperparams.size());
            for (Map.Entry<String, Object> entry : hyperparams.entrySet()) {
                dos.writeUTF(entry.getKey());
                serializeValue(dos, entry.getValue());
            }
        }

        private static void serializeWeights(DataOutputStream dos, Weights weights) throws IOException {
            double[][][] weightArrays = weights.getArrays();

            // 写入权重数组维度
            dos.writeInt(weightArrays.length);
            if (weightArrays.length > 0) {
                dos.writeInt(weightArrays[0].length);
                if (weightArrays[0].length > 0) {
                    dos.writeInt(weightArrays[0][0].length);
                }
            }

            // 写入权重值
            for (double[][] matrix : weightArrays) {
                for (double[] row : matrix) {
                    for (double value : row) {
                        dos.writeDouble(value);
                    }
                }
            }
        }

        private static void serializeValue(DataOutputStream dos, Object value) throws IOException {
            if (value instanceof Double) {
                dos.writeByte(1);  // Double类型标记
                dos.writeDouble((Double) value);
            } else if (value instanceof Integer) {
                dos.writeByte(2);  // Integer类型标记
                dos.writeInt((Integer) value);
            } else if (value instanceof String) {
                dos.writeByte(3);  // String类型标记
                dos.writeUTF((String) value);
            } else if (value instanceof Boolean) {
                dos.writeByte(4);  // Boolean类型标记
                dos.writeBoolean((Boolean) value);
            }
        }
    }

    // 模型压缩序列化
    public static void compressAndSerializeModel(NeuralNetwork model, String filePath) throws IOException {
        try (GZIPOutputStream gzos = new GZIPOutputStream(
                new BufferedOutputStream(new FileOutputStream(filePath)));
             DataOutputStream dos = new DataOutputStream(gzos)) {

            BinaryModelFormat.serializeModel(model, dos);
        }
    }

    // 增量序列化 - 只保存变化的部分
    public static void incrementalSerialize(NeuralNetwork model, String basePath) throws IOException {
        String snapshotPath = basePath + "_incremental_" + System.currentTimeMillis();

        try (DataOutputStream dos = new DataOutputStream(
                new BufferedOutputStream(new FileOutputStream(snapshotPath)))) {

            // 写入基础模型文件的哈希值
            String baseHash = calculateFileHash(basePath);
            dos.writeUTF(baseHash);

            // 只写入变化的权重
            Map<String, double[]> changedWeights = model.getChangedWeights();
            dos.writeInt(changedWeights.size());

            for (Map.Entry<String, double[]> entry : changedWeights.entrySet()) {
                dos.writeUTF(entry.getKey());
                double[] weights = entry.getValue();
                dos.writeInt(weights.length);
                for (double weight : weights) {
                    dos.writeDouble(weight);
                }
            }
        }
    }
}
```

## ⭐⭐ 进阶题 (31-70)

### 问题31: NIO在实时数据流处理中的应用

**面试题**: 在在线学习系统中，如何利用NIO实现高效的实时数据流处理？

**口语化答案**:
"在线学习需要低延迟的数据处理，NIO的Selector机制非常适合：

```java
public class RealTimeDataProcessor {
    private final Selector selector;
    private final ExecutorService processingPool;
    private final Queue<DataEvent> eventQueue;
    private volatile boolean running;

    public RealTimeDataProcessor() throws IOException {
        this.selector = Selector.open();
        this.processingPool = Executors.newFixedThreadPool(
            Runtime.getRuntime().availableProcessors());
        this.eventQueue = new ConcurrentLinkedQueue<>();
        this.running = true;
    }

    // 启动数据处理器
    public void start() throws IOException {
        new Thread(this::eventLoop).start();
        new Thread(this::processEvents).start();
    }

    // 注册数据源
    public void registerDataSource(SocketChannel channel, DataProcessor processor) throws IOException {
        channel.configureBlocking(false);
        channel.register(selector, SelectionKey.OP_READ, processor);
    }

    // 事件循环
    private void eventLoop() {
        try {
            while (running) {
                selector.select();
                Iterator<SelectionKey> keys = selector.selectedKeys().iterator();

                while (keys.hasNext()) {
                    SelectionKey key = keys.next();
                    keys.remove();

                    if (key.isReadable()) {
                        handleReadableKey(key);
                    }
                }
            }
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    // 处理可读事件
    private void handleReadableKey(SelectionKey key) throws IOException {
        SocketChannel channel = (SocketChannel) key.channel();
        DataProcessor processor = (DataProcessor) key.attachment();

        ByteBuffer buffer = ByteBuffer.allocate(8192);
        int bytesRead = channel.read(buffer);

        if (bytesRead == -1) {
            // 连接关闭
            key.cancel();
            channel.close();
            return;
        }

        if (bytesRead > 0) {
            buffer.flip();
            byte[] data = new byte[buffer.limit()];
            buffer.get(data);

            // 将数据事件加入队列
            eventQueue.offer(new DataEvent(data, processor, channel));
        }
    }

    // 处理数据事件
    private void processEvents() {
        while (running) {
            DataEvent event = eventQueue.poll();
            if (event != null) {
                processingPool.submit(() -> {
                    try {
                        // 处理数据并生成学习信号
                        LearningSignal signal = event.processor.process(event.data);

                        // 异步发送学习信号
                        if (signal != null) {
                            sendLearningSignal(event.channel, signal);
                        }
                    } catch (Exception e) {
                        e.printStackTrace();
                    }
                });
            } else {
                Thread.yield();
            }
        }
    }

    // 发送学习信号
    private void sendLearningSignal(SocketChannel channel, LearningSignal signal) {
        try {
            ByteBuffer buffer = ByteBuffer.wrap(serializeSignal(signal));
            while (buffer.hasRemaining()) {
                channel.write(buffer);
            }
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    // 数据事件
    private static class DataEvent {
        final byte[] data;
        final DataProcessor processor;
        final SocketChannel channel;

        DataEvent(byte[] data, DataProcessor processor, SocketChannel channel) {
            this.data = data;
            this.processor = processor;
            this.channel = channel;
        }
    }
}
```

### 问题32: 内存映射文件在超大规模数据集处理中的应用

**面试题**: 当数据集大小超过内存容量时，如何使用内存映射文件技术进行高效处理？

**口语化答案**:
"内存映射文件是处理超大数据集的关键技术：

```java
public class MassiveDatasetProcessor {
    private static final int CHUNK_SIZE = 1024 * 1024 * 100;  // 100MB chunks
    private final String datasetPath;
    private final long totalSize;

    public MassiveDatasetProcessor(String datasetPath) throws IOException {
        this.datasetPath = datasetPath;
        this.totalSize = new File(datasetPath).length();
    }

    // 分块处理数据集
    public void processDatasetInChunks(DataChunkProcessor processor) throws IOException {
        try (RandomAccessFile file = new RandomAccessFile(datasetPath, "r");
             FileChannel channel = file.getChannel()) {

            long offset = 0;
            while (offset < totalSize) {
                long chunkSize = Math.min(CHUNK_SIZE, totalSize - offset);

                processChunk(channel, offset, chunkSize, processor);
                offset += chunkSize;
            }
        }
    }

    // 处理单个数据块
    private void processChunk(FileChannel channel, long offset, long size,
                             DataChunkProcessor processor) throws IOException {

        MappedByteBuffer buffer = channel.map(
            FileChannel.MapMode.READ_ONLY, offset, size);

        // 预加载数据到内存
        buffer.load();

        try {
            // 处理数据块
            processor.process(buffer, offset);
        } finally {
            // 释放内存
            cleanBuffer(buffer);
        }
    }

    // 并行处理数据块
    public void parallelProcessDataset(DataChunkProcessor processor, int threadCount) throws IOException {
        long chunkSize = totalSize / threadCount;
        ExecutorService executor = Executors.newFixedThreadPool(threadCount);

        List<Future<?>> futures = new ArrayList<>();

        for (int i = 0; i < threadCount; i++) {
            final long startOffset = i * chunkSize;
            final long endOffset = (i == threadCount - 1) ? totalSize : (i + 1) * chunkSize;
            final int threadIndex = i;

            futures.add(executor.submit(() -> {
                try {
                    processRange(startOffset, endOffset, processor, threadIndex);
                } catch (IOException e) {
                    e.printStackTrace();
                }
            }));
        }

        // 等待所有任务完成
        for (Future<?> future : futures) {
            try {
                future.get();
            } catch (InterruptedException | ExecutionException e) {
                e.printStackTrace();
            }
        }

        executor.shutdown();
    }

    // 处理数据范围
    private void processRange(long startOffset, long endOffset,
                             DataChunkProcessor processor, int threadIndex) throws IOException {

        try (RandomAccessFile file = new RandomAccessFile(datasetPath, "r");
             FileChannel channel = file.getChannel()) {

            long currentOffset = startOffset;
            while (currentOffset < endOffset) {
                long remainingSize = endOffset - currentOffset;
                long chunkSize = Math.min(CHUNK_SIZE, remainingSize);

                MappedByteBuffer buffer = channel.map(
                    FileChannel.MapMode.READ_ONLY, currentOffset, chunkSize);

                try {
                    processor.process(buffer, currentOffset);
                } finally {
                    cleanBuffer(buffer);
                }

                currentOffset += chunkSize;
            }
        }
    }

    // 清理内存映射缓冲区
    private void cleanBuffer(MappedByteBuffer buffer) {
        try {
            Method cleanerMethod = buffer.getClass().getMethod("cleaner");
            cleanerMethod.setAccessible(true);
            Object cleaner = cleanerMethod.invoke(buffer);
            Method cleanMethod = cleaner.getClass().getMethod("clean");
            cleanMethod.invoke(cleaner);
        } catch (Exception e) {
            // 如果清理失败，让GC处理
            buffer = null;
            System.gc();
        }
    }

    // 数据块处理器接口
    public interface DataChunkProcessor {
        void process(MappedByteBuffer buffer, long offset) throws IOException;
    }
}
```

## ⭐⭐⭐ 专家题 (71-100)

### 问题71: 零拷贝技术在高速数据传输中的应用

**面试题**: 在分布式深度学习训练中，如何利用零拷贝技术优化节点间的数据传输效率？

**口语化答案**:
"零拷贝技术可以显著减少CPU开销和内存带宽消耗：

```java
public class ZeroCopyDataTransfer {

    // 使用FileChannel.transferTo进行零拷贝文件传输
    public static long transferModelParameters(File source, SocketChannel destination) throws IOException {
        try (FileChannel fileChannel = FileChannel.open(source.toPath(),
                StandardOpenOption.READ)) {

            long fileSize = fileChannel.size();
            long position = 0;
            long transferred = 0;

            // 分块传输，避免单次传输过大
            while (transferred < fileSize) {
                long chunkSize = Math.min(fileSize - transferred, 64 * 1024 * 1024); // 64MB chunks
                long currentTransferred = fileChannel.transferTo(position, chunkSize, destination);

                if (currentTransferred == 0) {
                    break; // 传输完成
                }

                transferred += currentTransferred;
                position += currentTransferred;
            }

            return transferred;
        }
    }

    // 使用DirectByteBuffer进行零拷贝网络传输
    public static class ZeroCopyNetworkTransfer {
        private final SocketChannel channel;
        private final int bufferSize;

        public ZeroCopyNetworkTransfer(SocketChannel channel, int bufferSize) {
            this.channel = channel;
            this.bufferSize = bufferSize;
        }

        // 传输训练数据批次
        public void transferBatch(TrainingBatch batch) throws IOException {
            // 使用直接缓冲区
            ByteBuffer directBuffer = ByteBuffer.allocateDirect(bufferSize);

            // 序列化批次到直接缓冲区
            serializeBatchToDirectBuffer(batch, directBuffer);
            directBuffer.flip();

            // 零拷贝传输
            while (directBuffer.hasRemaining()) {
                channel.write(directBuffer);
            }

            // 清理直接缓冲区
            cleanDirectBuffer(directBuffer);
        }

        // 接收训练数据批次
        public TrainingBatch receiveBatch() throws IOException {
            ByteBuffer directBuffer = ByteBuffer.allocateDirect(bufferSize);

            // 读取数据到直接缓冲区
            while (directBuffer.hasRemaining()) {
                int bytesRead = channel.read(directBuffer);
                if (bytesRead == -1) {
                    throw new IOException("Connection closed while reading batch");
                }
            }

            directBuffer.flip();
            TrainingBatch batch = deserializeBatchFromDirectBuffer(directBuffer);

            cleanDirectBuffer(directBuffer);
            return batch;
        }

        private void serializeBatchToDirectBuffer(TrainingBatch batch, ByteBuffer buffer) {
            // 序列化逻辑...
        }

        private TrainingBatch deserializeBatchFromDirectBuffer(ByteBuffer buffer) {
            // 反序列化逻辑...
            return null;
        }

        private void cleanDirectBuffer(ByteBuffer buffer) {
            if (buffer instanceof DirectBuffer) {
                Cleaner cleaner = ((DirectBuffer) buffer).cleaner();
                if (cleaner != null) {
                    cleaner.clean();
                }
            }
        }
    }

    // 使用Memory-mapped文件进行共享内存传输
    public static class SharedMemoryTransfer {
        private final RandomAccessFile sharedFile;
        private final FileChannel channel;
        private final MappedByteBuffer sharedBuffer;
        private final Semaphore readSemaphore;
        private final Semaphore writeSemaphore;

        public SharedMemoryTransfer(String sharedPath, long size) throws IOException {
            this.sharedFile = new RandomAccessFile(sharedPath, "rw");
            this.sharedFile.setLength(size);
            this.channel = sharedFile.getChannel();
            this.sharedBuffer = channel.map(FileChannel.MapMode.READ_WRITE, 0, size);
            this.readSemaphore = new Semaphore(0);
            this.writeSemaphore = new Semaphore(1);
        }

        // 写入数据到共享内存
        public void writeToSharedMemory(byte[] data) throws IOException {
            writeSemaphore.acquireUninterruptibly();

            try {
                sharedBuffer.clear();
                sharedBuffer.put(data);

                // 通知读取端
                readSemaphore.release();
            } finally {
                writeSemaphore.release();
            }
        }

        // 从共享内存读取数据
        public byte[] readFromSharedMemory() throws IOException {
            readSemaphore.acquireUninterruptibly();

            try {
                sharedBuffer.flip();
                byte[] data = new byte[sharedBuffer.remaining()];
                sharedBuffer.get(data);

                return data;
            } finally {
                writeSemaphore.release();
            }
        }

        public void close() throws IOException {
            channel.close();
            sharedFile.close();
        }
    }
}
```

### 问题72: 异步IO在AI模型推理管道中的应用

**面试题**: 如何设计一个基于异步IO的AI模型推理管道，实现高吞吐量的实时推理服务？

**口语化答案**:
"异步IO推理管道需要协调数据预处理、模型推理和后处理：

```java
public class AsyncInferencePipeline {
    private final AsynchronousFileChannel dataChannel;
    private final AsynchronousSocketChannel inferenceChannel;
    private final ExecutorService executorService;
    private final CompletionService<InferenceResult> completionService;
    private final Queue<PendingRequest> requestQueue;

    public AsyncInferencePipeline() throws IOException {
        this.executorService = Executors.newFixedThreadPool(
            Runtime.getRuntime().availableProcessors() * 2);
        this.completionService = new ExecutorCompletionService<>(executorService);
        this.requestQueue = new ConcurrentLinkedQueue<>();
        this.dataChannel = AsynchronousFileChannel.open(
            Paths.get("model_weights.bin"), StandardOpenOption.READ);
        this.inferenceChannel = AsynchronousSocketChannel.open();
    }

    // 异步处理推理请求
    public CompletableFuture<InferenceResult> processInferenceAsync(
            InferenceRequest request) {

        CompletableFuture<InferenceResult> future = new CompletableFuture<>();

        // 将请求加入队列
        PendingRequest pendingRequest = new PendingRequest(request, future);
        requestQueue.offer(pendingRequest);

        // 启动异步处理
        processRequestAsync(pendingRequest);

        return future;
    }

    // 异步处理单个请求
    private void processRequestAsync(PendingRequest pendingRequest) {
        CompletableFuture.supplyAsync(() -> {
            try {
                // 1. 异步数据预处理
                PreprocessedData preprocessedData = preprocessDataAsync(
                    pendingRequest.request.getInputData()).get();

                // 2. 异步模型加载
                ModelWeights weights = loadModelWeightsAsync().get();

                // 3. 异步推理计算
                RawInferenceResult rawResult = performInferenceAsync(
                    preprocessedData, weights).get();

                // 4. 异步后处理
                InferenceResult finalResult = postProcessResultAsync(rawResult).get();

                return finalResult;

            } catch (Exception e) {
                throw new RuntimeException("Inference failed", e);
            }
        }, executorService).whenComplete((result, throwable) -> {
            if (throwable != null) {
                pendingRequest.future.completeExceptionally(throwable);
            } else {
                pendingRequest.future.complete(result);
            }
        });
    }

    // 异步数据预处理
    private CompletableFuture<PreprocessedData> preprocessDataAsync(byte[] inputData) {
        return CompletableFuture.supplyAsync(() -> {
            // 数据预处理逻辑
            PreprocessedData data = new PreprocessedData();

            // 归一化、缩放、特征提取等
            normalizeInputData(inputData, data);
            extractFeatures(inputData, data);

            return data;
        }, executorService);
    }

    // 异步加载模型权重
    private CompletableFuture<ModelWeights> loadModelWeightsAsync() {
        CompletableFuture<ModelWeights> future = new CompletableFuture<>();

        ByteBuffer buffer = ByteBuffer.allocateDirect(1024 * 1024); // 1MB buffer
        long position = 0;

        loadWeightsChunk(buffer, position, future);

        return future;
    }

    // 分块加载权重
    private void loadWeightsChunk(ByteBuffer buffer, long position,
                                 CompletableFuture<ModelWeights> future) {

        dataChannel.read(buffer, position, null, new CompletionHandler<Integer, Void>() {

            @Override
            public void completed(Integer bytesRead, Void attachment) {
                if (bytesRead == -1) {
                    // 权重加载完成
                    ModelWeights weights = parseWeightsFromBuffer(buffer);
                    future.complete(weights);
                } else {
                    // 继续加载下一块
                    buffer.flip();
                    processWeightChunk(buffer);
                    buffer.clear();

                    loadWeightsChunk(buffer, position + bytesRead, future);
                }
            }

            @Override
            public void failed(Throwable exc, Void attachment) {
                future.completeExceptionally(exc);
            }
        });
    }

    // 异步推理计算
    private CompletableFuture<RawInferenceResult> performInferenceAsync(
            PreprocessedData data, ModelWeights weights) {

        return CompletableFuture.supplyAsync(() -> {
            // 使用GPU或CPU进行推理计算
            return computeInference(data, weights);
        }, executorService);
    }

    // 异步后处理
    private CompletableFuture<InferenceResult> postProcessResultAsync(RawInferenceResult rawResult) {
        return CompletableFuture.supplyAsync(() -> {
            // 结果后处理逻辑
            InferenceResult result = new InferenceResult();

            // 应用softmax、解码标签、计算置信度等
            applySoftmax(rawResult, result);
            decodeLabels(rawResult, result);
            calculateConfidence(rawResult, result);

            return result;
        }, executorService);
    }

    // 批量异步推理
    public List<CompletableFuture<InferenceResult>> processBatchInferenceAsync(
            List<InferenceRequest> requests) {

        List<CompletableFuture<InferenceResult>> futures = new ArrayList<>();

        // 预处理所有请求
        List<CompletableFuture<PreprocessedData>> preprocessedFutures = requests.stream()
            .map(request -> preprocessDataAsync(request.getInputData()))
            .collect(Collectors.toList());

        // 等待所有预处理完成
        CompletableFuture<Void> allPreprocessing = CompletableFuture.allOf(
            preprocessedFutures.toArray(new CompletableFuture[0]));

        // 批量推理
        return allPreprocessing.thenApply(v -> {
            List<PreprocessedData> preprocessedData = preprocessedFutures.stream()
                .map(CompletableFuture::join)
                .collect(Collectors.toList());

            return performBatchInference(preprocessedData);
        }).thenCompose(batchFuture -> batchFuture).join();
    }

    // 待处理请求
    private static class PendingRequest {
        final InferenceRequest request;
        final CompletableFuture<InferenceResult> future;

        PendingRequest(InferenceRequest request, CompletableFuture<InferenceResult> future) {
            this.request = request;
            this.future = future;
        }
    }

    // 关闭管道
    public void shutdown() {
        executorService.shutdown();
        try {
            if (!executorService.awaitTermination(30, TimeUnit.SECONDS)) {
                executorService.shutdownNow();
            }
        } catch (InterruptedException e) {
            executorService.shutdownNow();
            Thread.currentThread().interrupt();
        }

        try {
            dataChannel.close();
            inferenceChannel.close();
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
}
```

## 💡 面试技巧提示

### 回答IO系统问题的关键点：

1. **分析数据特征**: 大小、访问模式、延迟要求
2. **选择合适的IO模型**: 阻塞IO、NIO、异步IO
3. **考虑性能优化**: 缓冲区大小、内存映射、零拷贝
4. **错误处理和资源管理**: 确保资源正确释放
5. **并发安全性**: 多线程环境下的数据一致性

### 常见陷阱：

- 忽略缓冲区大小对性能的影响
- 忘记处理IO异常和资源清理
- 不了解零拷贝技术的适用场景
- 混淆同步IO和异步IO的使用场景

通过这些题目，面试官能全面评估候选人对Java IO系统的深度理解和在大数据处理场景下的应用能力。