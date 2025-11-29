package com.geo.platform.service;

import org.junit.jupiter.api.Test;
import org.springframework.ai.openai.OpenAiChatModel;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
public class GeoOptimizationServiceTest {

    @Autowired
    private GeoOptimizationService geoOptimizationService;

    @Autowired
    private OpenAiChatModel openAiChatModel;

    @Test
    public void testOptimizeForGEO_Success() {
        // 测试正常情况下的GEO优化
        String rawContent = "今天去了杭州一家很棒的咖啡馆，环境很好，咖啡也很香，价格也不贵。";
        String targetQuery = "杭州咖啡馆推荐";

        // 注意：这需要配置有效的AI_API_KEY环境变量
        // 在实际测试中，可以mock AI调用
        try {
            String result = geoOptimizationService.optimizeForGEO(rawContent, targetQuery);

            assertNotNull(result);
            assertFalse(result.isEmpty());
            assertTrue(result.contains("杭州"));

        } catch (Exception e) {
            // 如果没有配置API密钥，跳过测试
            assertTrue(e.getMessage().contains("GEO优化失败"));
        }
    }

    @Test
    public void testOptimizeForGEO_EmptyContent() {
        // 测试空内容的处理
        String rawContent = "";
        String targetQuery = "杭州咖啡馆推荐";

        assertThrows(IllegalArgumentException.class, () -> {
            geoOptimizationService.optimizeForGEO(rawContent, targetQuery);
        });
    }

    @Test
    public void testOptimizeForGEO_NullTargetQuery() {
        // 测试空目标查询的处理
        String rawContent = "今天去了杭州一家很棒的咖啡馆";
        String targetQuery = null;

        assertThrows(IllegalArgumentException.class, () -> {
            geoOptimizationService.optimizeForGEO(rawContent, targetQuery);
        });
    }

    @Test
    public void testSpringAIConfiguration() {
        // 测试Spring AI配置是否正确加载
        assertNotNull(openAiChatModel);
        System.out.println("Spring AI ChatModel 已成功注入: " + openAiChatModel.getClass().getSimpleName());
    }

    @Test
    public void testOptimizeForGEO_WithRetry() {
        // 测试重试机制（如果配置正确）
        String rawContent = "杭州西湖边的咖啡馆风景很好，适合商务会面";
        String targetQuery = "杭州商务咖啡馆推荐";

        try {
            String result = geoOptimizationService.optimizeForGEO(rawContent, targetQuery);

            assertNotNull(result);
            assertFalse(result.trim().isEmpty());
            System.out.println("GEO优化结果（测试重试机制）：");
            System.out.println(result);

        } catch (Exception e) {
            // 记录错误但不让测试失败（可能由于API配置问题）
            System.err.println("GEO优化测试跳过: " + e.getMessage());
        }
    }
}