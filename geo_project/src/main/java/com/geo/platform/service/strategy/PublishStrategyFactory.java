package com.geo.platform.service.strategy;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * 发布策略工厂
 * 负责管理所有平台的发布策略
 */
@Component
public class PublishStrategyFactory {

    private final Map<String, PublishStrategy> strategies = new HashMap<>();

    @Autowired
    public PublishStrategyFactory(List<PublishStrategy> strategyList) {
        // 自动注入所有发布策略
        for (PublishStrategy strategy : strategyList) {
            registerStrategy(strategy);
        }
    }

    /**
     * 注册发布策略
     */
    public void registerStrategy(PublishStrategy strategy) {
        strategies.put(strategy.getPlatformType().toLowerCase(), strategy);
    }

    /**
     * 获取发布策略
     */
    public PublishStrategy getStrategy(String platformType) {
        return strategies.get(platformType.toLowerCase());
    }

    /**
     * 检查平台是否支持
     */
    public boolean isSupported(String platformType) {
        return strategies.containsKey(platformType.toLowerCase());
    }

    /**
     * 获取所有支持的平台类型
     */
    public Set<String> getSupportedPlatforms() {
        return strategies.keySet();
    }

    /**
     * 获取所有策略
     */
    public Map<String, PublishStrategy> getAllStrategies() {
        return new HashMap<>(strategies);
    }

    /**
     * 批量初始化平台
     */
    public void initializePlatforms(List<String> platformTypes) {
        for (String platformType : platformTypes) {
            PublishStrategy strategy = getStrategy(platformType);
            if (strategy != null && !strategy.isInitialized()) {
                strategy.initializePlatform();
            }
        }
    }

    /**
     * 清理所有平台资源
     */
    public void cleanupAll() {
        for (PublishStrategy strategy : strategies.values()) {
            strategy.cleanup();
        }
    }

    /**
     * 获取平台状态信息
     */
    public PlatformStatus getPlatformStatus(String platformType) {
        PublishStrategy strategy = getStrategy(platformType);
        if (strategy == null) {
            return PlatformStatus.NOT_SUPPORTED;
        }

        if (!strategy.isInitialized()) {
            return PlatformStatus.NOT_INITIALIZED;
        }

        return PlatformStatus.READY;
    }

    /**
     * 平台状态枚举
     */
    public enum PlatformStatus {
        NOT_SUPPORTED("不支持"),
        NOT_INITIALIZED("未初始化"),
        READY("就绪");

        private final String description;

        PlatformStatus(String description) {
            this.description = description;
        }

        public String getDescription() {
            return description;
        }
    }
}