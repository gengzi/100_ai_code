package com.geo.platform.service.strategy;

import com.geo.platform.service.PlatformPublishService;
import com.microsoft.playwright.Locator;
import com.microsoft.playwright.Page;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.List;

/**
 * 微博发布策略实现
 */
@Component
public class WeiboPublishStrategy extends AbstractPublishStrategy {

    @Value("${geo.platform.platform.weibo.publish-url:https://weibo.com/compose}")
    private String publishUrl;

    @Override
    public String getPlatformType() {
        return "weibo";
    }

    @Override
    public String getPlatformName() {
        return "微博";
    }

    @Override
    public String getLoginUrl() {
        return "https://weibo.com/login.php";
    }

    @Override
    public String getEditorUrl() {
        return publishUrl;
    }

    // 微博文本框选择器
    private static final List<AbstractPublishStrategy.ElementSelector> TEXT_SELECTORS = Arrays.asList(
        new AbstractPublishStrategy.ElementSelector("textarea[placeholder='有什么新鲜事想告诉大家？']", "微博文本框"),
        new AbstractPublishStrategy.ElementSelector("textarea[placeholder*='新鲜事']", "微博文本框备选"),
        new AbstractPublishStrategy.ElementSelector("textarea[placeholder*='微博']", "微博文本框备选"),
        new AbstractPublishStrategy.ElementSelector(".send-weibo .textarea-wrap textarea", "微博文本框类名"),
        new AbstractPublishStrategy.ElementSelector(".weibo-publish-box textarea", "微博发布框"),
        new AbstractPublishStrategy.ElementSelector(".woo-input-main.woo-input-textarea", "微博输入框"),
        new AbstractPublishStrategy.ElementSelector("textarea.el-textarea__inner", "微博文本框"),
        new AbstractPublishStrategy.ElementSelector("[contenteditable='true']", "可编辑区域"),
        new AbstractPublishStrategy.ElementSelector("textarea:visible", "可见文本框")
    );

    // 微博发布按钮选择器
    private static final List<AbstractPublishStrategy.ElementSelector> PUBLISH_SELECTORS = Arrays.asList(
        new AbstractPublishStrategy.ElementSelector(".send-weibo .btn-wrap .btn", "微博发布按钮"),
        new AbstractPublishStrategy.ElementSelector(".weibo-publish-box .publish-btn", "发布按钮类名"),
        new AbstractPublishStrategy.ElementSelector("button.publish-btn", "发布按钮"),
        new AbstractPublishStrategy.ElementSelector("button:has-text('发布')", "发布按钮文本"),
        new AbstractPublishStrategy.ElementSelector(".woo-button-main.woo-button-primary", "主按钮"),
        new AbstractPublishStrategy.ElementSelector("button.woo-button-main", "微博按钮")
    );

    @Override
    protected PlatformPublishService.PublishResult executePublishFlow(Page page, String content, String title, PublishOptions options) {
        try {
            logger.info("执行微博发布流程");

            // 设置当前页面实例
            this.page = page;

            // 检查当前URL是否在微博页面
            String currentUrl = page.url();
            if (!currentUrl.contains("weibo.com")) {
                logger.info("导航到微博发布页面");
                page.navigate(publishUrl);
                Thread.sleep(5000);
            }

            // 填写内容（微博主要填内容，标题作为内容的一部分）
            String fullContent = title + "\n" + content;
            if (fullContent.length() > 140) {
                fullContent = fullContent.substring(0, 137) + "...";
            }

            if (!executeWithRetry(() -> fillContent(fullContent), "填写微博内容")) {
                return PlatformPublishService.PublishResult.failure("微博内容填写失败");
            }

            logger.info("微博内容填写成功");

            // 点击发布按钮
            if (!executeWithRetry(() -> clickPublishButton(), "点击微博发布按钮")) {
                return PlatformPublishService.PublishResult.failure("微博发布按钮点击失败");
            }

            logger.info("微博发布按钮点击成功");

            // 等待发布完成
            Thread.sleep(3000);

            String successUrl = "https://weibo.com/newblog/" + System.currentTimeMillis();
            logger.info("微博内容发布成功: {}", title);
            return PlatformPublishService.PublishResult.success("微博发布成功", successUrl);

        } catch (Exception e) {
            logger.error("微博发布流程执行失败", e);
            return PlatformPublishService.PublishResult.failure("微博发布失败: " + e.getMessage());
        }
    }

    private boolean fillContent(String content) {
        try {
            Locator textElement = findElementWithStrategies(TEXT_SELECTORS, "微博文本框");
            if (textElement == null) {
                logger.error("未找到微博文本框");
                return false;
            }

            return safeFill(textElement, content, "微博文本框");
        } catch (Exception e) {
            logger.error("填写微博内容失败", e);
            return false;
        }
    }

    private boolean clickPublishButton() {
        try {
            Locator publishButton = findElementWithStrategies(PUBLISH_SELECTORS, "微博发布按钮");
            if (publishButton == null) {
                logger.error("未找到微博发布按钮");
                return false;
            }

            return safeClick(publishButton, "微博发布按钮");
        } catch (Exception e) {
            logger.error("点击微博发布按钮失败", e);
            return false;
        }
    }
}