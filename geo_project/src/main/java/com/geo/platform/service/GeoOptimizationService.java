package com.geo.platform.service;

import com.geo.platform.model.Content;
import com.geo.platform.model.OptimizationRecord;
import com.geo.platform.repository.ContentRepository;
import com.geo.platform.repository.OptimizationRecordRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.model.ChatResponse;
import org.springframework.ai.openai.OpenAiChatModel;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.retry.annotation.Retryable;
import org.springframework.retry.annotation.Backoff;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class GeoOptimizationService {

    private static final Logger logger = LoggerFactory.getLogger(GeoOptimizationService.class);

    private final ChatClient chatClient;

    @Autowired
    private ContentRepository contentRepository;

    @Autowired
    private OptimizationRecordRepository optimizationRecordRepository;

    public GeoOptimizationService(OpenAiChatModel chatModel) {
        this.chatClient = ChatClient.create(chatModel);
        logger.info("GeoOptimizationService 初始化完成，使用Spring AI ChatClient");
    }

    /**
     * 将原始内容优化为 Generative Engine Optimization (GEO) 格式
     *
     * @param rawContent 原始用户输入内容
     * @param targetQuery 目标主题或问题，例如 '杭州咖啡馆推荐'
     * @return 优化后的GEO格式内容
     */
    @Retryable(value = {Exception.class},
               maxAttempts = 3,
               backoff = @Backoff(delay = 1000, multiplier = 2))
    public String optimizeForGEO(String rawContent, String targetQuery) {
        if (rawContent == null || rawContent.trim().isEmpty()) {
            throw new IllegalArgumentException("原始内容不能为空");
        }

        if (targetQuery == null || targetQuery.trim().isEmpty()) {
            throw new IllegalArgumentException("目标查询不能为空");
        }

        String prompt = buildGEOPrompt(rawContent, targetQuery);
        logger.info("开始GEO优化 - 目标查询: {}, 原始内容长度: {}", targetQuery, rawContent.length());

        try {
            ChatResponse response = chatClient
                .prompt()
                .user(prompt)
                .call()
                .chatResponse();

            String optimizedContent = response.getResult().getOutput().getContent();

            logger.info("GEO优化完成 - 优化后内容长度: {}, Token使用: {}",
                       optimizedContent.length(),
                       response.getMetadata().getUsage() != null ?
                           response.getMetadata().getUsage().toString() : "N/A");

            return optimizedContent;

        } catch (Exception e) {
            logger.error("GEO优化失败 - 目标查询: {}, 错误: {}", targetQuery, e.getMessage(), e);
            throw new RuntimeException("GEO优化失败: " + e.getMessage(), e);
        }
    }

    private String buildGEOPrompt(String rawContent, String targetQuery) {
        return String.format("""
            你是一个 GEO（生成式引擎优化）专家。请将以下内容重写为：

            **核心要求：**
            1. 开头直接回答核心问题（1-2句总结）
            2. 使用分点列表（• 或 -）呈现事实
            3. 包含具体名称、地址、时间、价格等可验证信息
            4. 避免主观形容词（如"超棒""绝了"），改用客观描述
            5. 如果信息不足，请标注 [需补充：XXX]
            6. 确保内容准确、可信，便于AI搜索引用

            **原始内容：**
            %s

            **目标问题：**
            %s

            **输出要求：**
            - 输出纯文本格式，不要包含思考过程
            - 重点关注可验证的具体信息
            - 保持简洁明了的结构
            """, rawContent, targetQuery);
    }

    /**
     * 优化并保存记录
     *
     * @param rawContent 原始内容
     * @param targetQuery 目标查询
     * @param title 标题（可选）
     * @return 优化后的GEO格式内容和优化ID
     */
    @Transactional
    public OptimizationResult optimizeAndSave(String rawContent, String targetQuery, String title) {
        // 先进行优化
        String optimizedContent = optimizeForGEO(rawContent, targetQuery);

        // 生成唯一的优化ID
        String optimizationId = generateOptimizationId();

        // 如果没有提供标题，使用目标查询作为标题
        if (title == null || title.trim().isEmpty()) {
            title = targetQuery;
        }

        // 保存到优化记录表
        OptimizationRecord record = new OptimizationRecord(optimizationId, title, rawContent, targetQuery, optimizedContent);
        optimizationRecordRepository.save(record);

        logger.info("优化记录已保存 - OptimizationId: {}, Title: {}", optimizationId, title);

        return new OptimizationResult(optimizedContent, optimizationId);
    }

    /**
     * 获取所有优化记录
     *
     * @return 优化记录列表
     */
    public List<OptimizationRecord> getAllOptimizationRecords() {
        return optimizationRecordRepository.findAllByOrderByCreatedAtDesc();
    }

    /**
     * 根据ID获取优化记录
     *
     * @param optimizationId 优化ID
     * @return 优化记录
     */
    public OptimizationRecord getOptimizationRecord(String optimizationId) {
        return optimizationRecordRepository.findByOptimizationId(optimizationId).orElse(null);
    }

    /**
     * 搜索优化记录
     *
     * @param keyword 搜索关键词
     * @return 匹配的优化记录列表
     */
    public List<OptimizationRecord> searchOptimizationRecords(String keyword) {
        if (keyword == null || keyword.trim().isEmpty()) {
            return getAllOptimizationRecords();
        }

        // 在标题中搜索
        List<OptimizationRecord> titleResults = optimizationRecordRepository.findByTitleContaining(keyword);

        // 在目标查询中搜索
        List<OptimizationRecord> queryResults = optimizationRecordRepository.findByTargetQueryContaining(keyword);

        // 合并结果并去重
        return titleResults.stream()
                .distinct()
                .sorted((r1, r2) -> r2.getCreatedAt().compareTo(r1.getCreatedAt()))
                .toList();
    }

    /**
     * 生成唯一的优化ID
     */
    private String generateOptimizationId() {
        return "OPT_" + System.currentTimeMillis() + "_" + UUID.randomUUID().toString().substring(0, 8);
    }

    /**
     * 优化结果包装类
     */
    public static class OptimizationResult {
        private final String optimizedContent;
        private final String optimizationId;

        public OptimizationResult(String optimizedContent, String optimizationId) {
            this.optimizedContent = optimizedContent;
            this.optimizationId = optimizationId;
        }

        public String getOptimizedContent() {
            return optimizedContent;
        }

        public String getOptimizationId() {
            return optimizationId;
        }
    }
}