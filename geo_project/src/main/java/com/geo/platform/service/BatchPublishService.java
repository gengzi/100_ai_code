package com.geo.platform.service;

import com.geo.platform.service.strategy.PublishOptions;
import com.geo.platform.service.strategy.PublishStrategy;
import com.geo.platform.service.strategy.PublishStrategyFactory;
import com.microsoft.playwright.Page;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.*;
import java.util.stream.Collectors;

/**
 * 批量发布服务
 * 支持多平台并发发布和进度跟踪
 */
@Service
public class BatchPublishService {

    private static final Logger logger = LoggerFactory.getLogger(BatchPublishService.class);

    @Autowired
    private PublishStrategyFactory strategyFactory;

    @Value("${publish.batch.max-concurrent:3}")
    private int maxConcurrentPublish;

    @Value("${publish.batch.timeout:300000}") // 5分钟
    private long batchTimeout;

    @Value("${publish.batch.interval:2000}") // 2秒间隔
    private long publishInterval;

    private final ExecutorService executorService;
    private final Map<String, BatchPublishTask> activeTasks = new ConcurrentHashMap<>();

    public BatchPublishService() {
        this.executorService = Executors.newFixedThreadPool(10);
    }

    /**
     * 批量发布任务
     */
    public static class BatchPublishTask {
        private final String taskId;
        private final List<String> platforms;
        private final String content;
        private final String title;
        private final PublishOptions options;
        private final LocalDateTime createTime;
        private final Map<String, PlatformPublishService.PublishResult> results = new ConcurrentHashMap<>();
        private final Map<String, String> statuses = new ConcurrentHashMap<>();
        private volatile boolean completed = false;

        public BatchPublishTask(String taskId, List<String> platforms, String content, String title, PublishOptions options) {
            this.taskId = taskId;
            this.platforms = new ArrayList<>(platforms);
            this.content = content;
            this.title = title;
            this.options = options;
            this.createTime = LocalDateTime.now();
            // 初始化状态
            platforms.forEach(p -> statuses.put(p, "待发布"));
        }

        // Getters
        public String getTaskId() { return taskId; }
        public List<String> getPlatforms() { return new ArrayList<>(platforms); }
        public String getContent() { return content; }
        public String getTitle() { return title; }
        public PublishOptions getOptions() { return options; }
        public LocalDateTime getCreateTime() { return createTime; }
        public Map<String, PlatformPublishService.PublishResult> getResults() { return new HashMap<>(results); }
        public Map<String, String> getStatuses() { return new HashMap<>(statuses); }
        public boolean isCompleted() { return completed; }

        public void setResult(String platform, PlatformPublishService.PublishResult result) {
            results.put(platform, result);
            statuses.put(platform, result.isSuccess() ? "成功" : "失败");
        }

        public void updateStatus(String platform, String status) {
            statuses.put(platform, status);
        }

        public void markCompleted() {
            completed = true;
        }

        public int getSuccessCount() {
            return (int) results.values().stream().mapToLong(r -> r.isSuccess() ? 1 : 0).sum();
        }

        public int getTotalCount() {
            return platforms.size();
        }

        public double getProgress() {
            return results.size() * 100.0 / platforms.size();
        }
    }

    /**
     * 创建批量发布任务
     */
    public String createBatchTask(List<String> platforms, String content, String title, PublishOptions options) {
        String taskId = generateTaskId();

        // 验证平台支持
        List<String> supportedPlatforms = platforms.stream()
            .filter(strategyFactory::isSupported)
            .collect(Collectors.toList());

        if (supportedPlatforms.isEmpty()) {
            throw new IllegalArgumentException("没有支持的平台");
        }

        BatchPublishTask task = new BatchPublishTask(taskId, supportedPlatforms, content, title, options);
        activeTasks.put(taskId, task);

        logger.info("创建批量发布任务: {}, 支持平台: {}", taskId, supportedPlatforms);
        return taskId;
    }

    /**
     * 执行批量发布
     */
    public BatchPublishResult executeBatchPublish(String taskId) {
        BatchPublishTask task = activeTasks.get(taskId);
        if (task == null) {
            return BatchPublishResult.failure("任务不存在: " + taskId);
        }

        try {
            logger.info("开始执行批量发布任务: {}", taskId);

            // 初始化所有平台
            strategyFactory.initializePlatforms(task.getPlatforms());

            // 创建发布任务
            List<CompletableFuture<Void>> futures = task.getPlatforms().stream()
                .map(platform -> CompletableFuture.runAsync(() ->
                    publishToPlatform(task, platform), executorService))
                .collect(Collectors.toList());

            // 等待所有任务完成
            CompletableFuture<Void> allTasks = CompletableFuture.allOf(
                futures.toArray(new CompletableFuture[0]));

            try {
                allTasks.get(batchTimeout, TimeUnit.MILLISECONDS);
            } catch (TimeoutException e) {
                logger.warn("批量发布任务超时: {}", taskId);
                futures.forEach(future -> future.cancel(true));
            }

            task.markCompleted();

            // 统计结果
            int successCount = task.getSuccessCount();
            int totalCount = task.getTotalCount();

            if (successCount == totalCount) {
                logger.info("批量发布任务全部成功: {}", taskId);
                return BatchPublishResult.success("全部平台发布成功", task.getResults());
            } else if (successCount > 0) {
                logger.warn("批量发布任务部分成功: {}, 成功: {}/{}", taskId, successCount, totalCount);
                return BatchPublishResult.partial("部分平台发布成功", task.getResults());
            } else {
                logger.error("批量发布任务全部失败: {}", taskId);
                return BatchPublishResult.failure("全部平台发布失败");
            }

        } catch (Exception e) {
            logger.error("批量发布任务执行异常: {}", taskId, e);
            return BatchPublishResult.failure("批量发布执行异常: " + e.getMessage());
        } finally {
            // 不立即清理任务，允许查询结果
            // cleanupTask(taskId);
        }
    }

    /**
     * 并发发布到单个平台
     */
    private void publishToPlatform(BatchPublishTask task, String platformType) {
        try {
            task.updateStatus(platformType, "发布中");
            logger.info("开始发布到平台: {}", platformType);

            PublishStrategy strategy = strategyFactory.getStrategy(platformType);
            if (strategy == null) {
                PlatformPublishService.PublishResult result = PlatformPublishService.PublishResult
                    .failure("平台策略不存在: " + platformType);
                task.setResult(platformType, result);
                return;
            }

            // 发布间隔控制
            if (publishInterval > 0) {
                Thread.sleep(publishInterval);
            }

            // 执行发布
            PlatformPublishService.PublishResult result = strategy.publish(
                null, // Page由策略内部管理
                task.getContent(),
                task.getTitle(),
                task.getOptions()
            );

            task.setResult(platformType, result);

            if (result.isSuccess()) {
                logger.info("平台 {} 发布成功", platformType);
            } else {
                logger.warn("平台 {} 发布失败: {}", platformType, result.getMessage());
            }

        } catch (Exception e) {
            logger.error("平台 {} 发布异常", platformType, e);
            PlatformPublishService.PublishResult result = PlatformPublishService.PublishResult
                .failure("发布异常: " + e.getMessage());
            task.setResult(platformType, result);
            task.updateStatus(platformType, "异常");
        }
    }

    /**
     * 获取任务状态
     */
    public BatchPublishTask getTaskStatus(String taskId) {
        return activeTasks.get(taskId);
    }

    /**
     * 获取所有活跃任务
     */
    public List<BatchPublishTask> getActiveTasks() {
        return new ArrayList<>(activeTasks.values());
    }

    /**
     * 清理任务
     */
    public void cleanupTask(String taskId) {
        BatchPublishTask task = activeTasks.remove(taskId);
        if (task != null) {
            logger.info("清理批量发布任务: {}", taskId);
        }
    }

    /**
     * 清理过期任务
     */
    public void cleanupExpiredTasks(int hours) {
        LocalDateTime cutoff = LocalDateTime.now().minusHours(hours);
        activeTasks.entrySet().removeIf(entry -> {
            boolean shouldRemove = entry.getValue().getCreateTime().isBefore(cutoff);
            if (shouldRemove) {
                logger.info("清理过期任务: {}", entry.getKey());
            }
            return shouldRemove;
        });
    }

    /**
     * 获取支持的平台列表
     */
    public Set<String> getSupportedPlatforms() {
        return strategyFactory.getSupportedPlatforms();
    }

    /**
     * 获取平台状态
     */
    public Map<String, String> getPlatformStatuses() {
        Map<String, String> statuses = new HashMap<>();
        for (String platform : strategyFactory.getSupportedPlatforms()) {
            PublishStrategyFactory.PlatformStatus status = strategyFactory.getPlatformStatus(platform);
            statuses.put(platform, status.getDescription());
        }
        return statuses;
    }

    /**
     * 批量发布结果
     */
    public static class BatchPublishResult {
        private final boolean success;
        private final String message;
        private final Map<String, PlatformPublishService.PublishResult> results;

        private BatchPublishResult(boolean success, String message, Map<String, PlatformPublishService.PublishResult> results) {
            this.success = success;
            this.message = message;
            this.results = results != null ? new HashMap<>(results) : new HashMap<>();
        }

        public static BatchPublishResult success(String message, Map<String, PlatformPublishService.PublishResult> results) {
            return new BatchPublishResult(true, message, results);
        }

        public static BatchPublishResult partial(String message, Map<String, PlatformPublishService.PublishResult> results) {
            return new BatchPublishResult(false, message, results);
        }

        public static BatchPublishResult failure(String message) {
            return new BatchPublishResult(false, message, null);
        }

        // Getters
        public boolean isSuccess() { return success; }
        public String getMessage() { return message; }
        public Map<String, PlatformPublishService.PublishResult> getResults() { return new HashMap<>(results); }

        public int getSuccessCount() {
            return (int) results.values().stream().mapToLong(r -> r.isSuccess() ? 1 : 0).sum();
        }

        public int getTotalCount() {
            return results.size();
        }
    }

    /**
     * 生成任务ID
     */
    private String generateTaskId() {
        return "batch_" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss")) +
               "_" + UUID.randomUUID().toString().substring(0, 8);
    }

    /**
     * 关闭服务
     */
    public void shutdown() {
        logger.info("关闭批量发布服务");
        executorService.shutdown();
        try {
            if (!executorService.awaitTermination(30, TimeUnit.SECONDS)) {
                executorService.shutdownNow();
            }
        } catch (InterruptedException e) {
            executorService.shutdownNow();
            Thread.currentThread().interrupt();
        }

        strategyFactory.cleanupAll();
        activeTasks.clear();
    }
}