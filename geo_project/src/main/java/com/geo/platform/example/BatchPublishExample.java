package com.geo.platform.example;

import com.geo.platform.service.PlatformPublishService;
import com.geo.platform.service.strategy.PublishOptions;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.List;
import java.util.Map;

/**
 * 批量发布使用示例
 */
@Component
public class BatchPublishExample implements CommandLineRunner {

    private static final Logger logger = LoggerFactory.getLogger(BatchPublishExample.class);

    @Autowired
    private PlatformPublishService platformPublishService;

    @Override
    public void run(String... args) throws Exception {
        // 只有在包含特定参数时才执行示例
        if (args.length > 0 && "batch-publish-example".equals(args[0])) {
            demonstrateBatchPublish();
        }
    }

    /**
     * 演示批量发布功能
     */
    public void demonstrateBatchPublish() {
        try {
            logger.info("=== 批量发布功能演示 ===");

            // 1. 获取支持的平台
            logger.info("支持的平台: {}", platformPublishService.getSupportedPlatforms());

            // 2. 获取平台状态
            logger.info("平台状态: {}", platformPublishService.getPlatformStatuses());

            // 3. 准备发布内容
            String title = "策略模式重构后的批量发布测试";
            String content = """
# 策略模式重构后的批量发布测试

## 概述
本文演示了重构后的批量发布功能，使用了策略模式和工厂模式。

## 改进内容
1. **策略模式** - 每个平台都有独立的发布策略
2. **批量并发** - 支持多平台并发发布
3. **任务管理** - 可查询和管理批量发布任务
4. **智能重试** - 自动重试失败的发布
5. **回退机制** - 支持回退到原有方法

## 技术特点
- 线程安全的批量发布
- 进度跟踪和状态管理
- 配置化的发布选项
- 详细的日志记录

## 测试平台
- CSDN（改进版）
- 微博
- 其他平台...

## 总结
重构后的系统具有更好的扩展性、可维护性和可靠性。
""";

            // 4. 创建发布选项
            PublishOptions options = PublishOptions.createDefault()
                .addTag("技术")
                .addTag("编程")
                .addTag("设计模式")
                .setSummary("演示策略模式重构后的批量发布功能")
                .setCustomOption("priority", "high");

            // 5. 执行批量发布
            List<String> platforms = Arrays.asList("csdn", "weibo"); // 只测试已实现的平台

            logger.info("开始批量发布到平台: {}", platforms);
            Map<String, PlatformPublishService.PublishResult> results =
                platformPublishService.batchPublish(platforms, content, title, options);

            // 6. 处理结果
            logger.info("=== 批量发布结果 ===");
            results.forEach((platform, result) -> {
                if (result.isSuccess()) {
                    logger.info("✅ {} 发布成功: {}", platform, result.getMessage());
                    if (result.getUrl() != null) {
                        logger.info("   URL: {}", result.getUrl());
                    }
                } else {
                    logger.error("❌ {} 发布失败: {}", platform, result.getMessage());
                }
            });

            // 7. 统计
            long successCount = results.values().stream()
                .mapToLong(r -> r.isSuccess() ? 1 : 0)
                .sum();

            logger.info("批量发布完成 - 成功: {}/{}", successCount, results.size());

        } catch (Exception e) {
            logger.error("批量发布演示失败", e);
        }
    }

    /**
     * 演示单个平台发布（使用策略模式）
     */
    public void demonstrateSinglePublish() {
        try {
            logger.info("=== 单平台发布演示 ===");

            String title = "CSDN改进版发布测试";
            String content = """
# CSDN改进版发布测试

## 改进内容
1. 智能元素定位
2. 坐标计算优化
3. 增强等待机制
4. 完善错误处理

## 测试
测试改进版CSDN发布功能是否正常工作。
""";

            PublishOptions options = PublishOptions.createDefault()
                .addTag("技术")
                .addTag("测试");

            logger.info("发布到CSDN");
            PlatformPublishService.PublishResult result =
                platformPublishService.publishContent("csdn", content, title, options);

            if (result.isSuccess()) {
                logger.info("✅ CSDN发布成功: {}", result.getMessage());
                logger.info("   URL: {}", result.getUrl());
            } else {
                logger.error("❌ CSDN发布失败: {}", result.getMessage());
            }

        } catch (Exception e) {
            logger.error("单平台发布演示失败", e);
        }
    }

    /**
     * 演示任务管理
     */
    public void demonstrateTaskManagement() {
        logger.info("=== 任务管理演示 ===");

        // 获取活跃任务
        var activeTasks = platformPublishService.getActiveBatchTasks();
        logger.info("当前活跃任务数: {}", activeTasks.size());

        activeTasks.forEach(task -> {
            logger.info("任务ID: {}", task.getTaskId());
            logger.info("平台数量: {}", task.getTotalCount());
            logger.info("成功数量: {}", task.getSuccessCount());
            logger.info("进度: {:.1f}%", task.getProgress());
            logger.info("状态: {}", task.getStatuses());
        });
    }
}