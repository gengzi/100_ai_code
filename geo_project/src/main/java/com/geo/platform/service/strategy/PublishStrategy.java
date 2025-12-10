package com.geo.platform.service.strategy;

import com.geo.platform.service.PlatformPublishService;
import com.microsoft.playwright.Page;

/**
 * 平台发布策略接口
 */
public interface PublishStrategy {

    /**
     * 获取平台类型
     */
    String getPlatformType();

    /**
     * 获取平台名称
     */
    String getPlatformName();

    /**
     * 检查平台是否已初始化
     */
    boolean isInitialized();

    /**
     * 初始化平台
     */
    boolean initializePlatform();

    /**
     * 发布内容到平台
     *
     * @param page Playwright页面实例
     * @param content 要发布的内容
     * @param title 文章标题
     * @param options 发布选项（可选）
     * @return 发布结果
     */
    PlatformPublishService.PublishResult publish(Page page, String content, String title, PublishOptions options);

    /**
     * 获取平台登录URL
     */
    String getLoginUrl();

    /**
     * 获取平台编辑器URL
     */
    String getEditorUrl();

    /**
     * 清理资源
     */
    void cleanup();
}