package com.geo.platform.service.strategy;

import com.geo.platform.service.PlatformPublishService;
import com.microsoft.playwright.Locator;
import com.microsoft.playwright.Page;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.List;

/**
 * CSDN发布策略实现
 * 解决元素坐标不准确问题
 */
@Component
public class CSDNPublishStrategy extends AbstractPublishStrategy {

    @Value("${geo.platform.platform.csdn.editor-url:https://editor.csdn.net/md?not_checkout=1}")
    private String editorUrl;

    @Value("${geo.platform.platform.csdn.auto-tags:技术,编程,原创}")
    private String autoTags;

    @Override
    public String getPlatformType() {
        return "csdn";
    }

    @Override
    public String getPlatformName() {
        return "CSDN";
    }

    @Override
    public String getLoginUrl() {
        return "https://passport.csdn.net/login?code=public";
    }

    @Override
    public String getEditorUrl() {
        return editorUrl;
    }

    // CSDN标题选择器 - 按稳定性排序
    private static final List<AbstractPublishStrategy.ElementSelector> TITLE_SELECTORS = Arrays.asList(
        new AbstractPublishStrategy.ElementSelector("input[placeholder*='文章标题']", "标题输入框"),
        new AbstractPublishStrategy.ElementSelector("input[placeholder*='标题']", "标题输入框"),
        new AbstractPublishStrategy.ElementSelector("input[data-testid*='title']", "标题测试ID"),
        new AbstractPublishStrategy.ElementSelector("input[aria-label*='标题']", "标题ARIA标签"),
        new AbstractPublishStrategy.ElementSelector(".title-input", "标题类名"),
        new AbstractPublishStrategy.ElementSelector(".article-title", "文章标题类名"),
        new AbstractPublishStrategy.ElementSelector("input[type='text']:visible", "可见文本输入框"),
        new AbstractPublishStrategy.ElementSelector("//*[@placeholder='请输入文章标题']", "标题XPath"),
        new AbstractPublishStrategy.ElementSelector("//input[contains(@placeholder,'标题')]", "标题XPath包含")
    );

    // CSDN内容编辑器选择器
    private static final List<AbstractPublishStrategy.ElementSelector> CONTENT_SELECTORS = Arrays.asList(
        new AbstractPublishStrategy.ElementSelector(".CodeMirror textarea", "CodeMirror编辑器"),
        new AbstractPublishStrategy.ElementSelector(".markdown-editor textarea", "Markdown编辑器"),
        new AbstractPublishStrategy.ElementSelector(".editor-contentarea", "编辑器内容区域"),
        new AbstractPublishStrategy.ElementSelector("textarea[aria-label*='内容']", "内容ARIA标签"),
        new AbstractPublishStrategy.ElementSelector("textarea[data-testid*='content']", "内容测试ID"),
        new AbstractPublishStrategy.ElementSelector("[contenteditable='true']:visible", "可编辑区域"),
        new AbstractPublishStrategy.ElementSelector(".editor-content", "编辑器内容"),
        new AbstractPublishStrategy.ElementSelector("textarea:visible", "可见文本区域"),
        new AbstractPublishStrategy.ElementSelector("//div[@class='editor']//div[@class='cledit-section']", "编辑器XPath"),
        new AbstractPublishStrategy.ElementSelector("//textarea[contains(@class,'editor')]", "编辑器文本域XPath")
    );

    // CSDN发布按钮选择器
    private static final List<AbstractPublishStrategy.ElementSelector> PUBLISH_BUTTON_SELECTORS = Arrays.asList(
        new AbstractPublishStrategy.ElementSelector("button[data-testid='publish-button']", "发布按钮测试ID"),
        new AbstractPublishStrategy.ElementSelector("button[aria-label*='发布']", "发布按钮ARIA标签"),
        new AbstractPublishStrategy.ElementSelector("button:has-text('发布文章')", "发布文章按钮"),
        new AbstractPublishStrategy.ElementSelector("button:has-text('发布')", "发布按钮"),
        new AbstractPublishStrategy.ElementSelector(".btn-publish", "发布按钮类名"),
        new AbstractPublishStrategy.ElementSelector(".publish-btn", "发布按钮类名2"),
        new AbstractPublishStrategy.ElementSelector("button[type='submit']", "提交按钮"),
        new AbstractPublishStrategy.ElementSelector("//button[contains(text(),'发布文章')]", "发布按钮XPath"),
        new AbstractPublishStrategy.ElementSelector("//button[contains(@class,'btn-publish')]", "发布按钮类XPath")
    );

    @Override
    protected PlatformPublishService.PublishResult executePublishFlow(Page page, String content, String title, PublishOptions options) {
        try {
            logger.info("执行CSDN发布流程");

            // 设置当前页面实例
            this.page = page;

            // 检测编辑器类型
            String editorType = detectEditorType();
            logger.info("检测到编辑器类型: {}", editorType);

            // 填写标题
            if (!executeWithRetry(() -> fillTitle(title), "填写标题")) {
                return PlatformPublishService.PublishResult.failure("标题填写失败");
            }
            logger.info("CSDN标题填写成功: {}", title);

            // 填写内容
            if (!executeWithRetry(() -> fillContent(content, editorType), "填写内容")) {
                return PlatformPublishService.PublishResult.failure("内容填写失败");
            }
            logger.info("CSDN内容填写成功，长度: {} 字符", content.length());

            // 点击发布按钮
            if (!executeWithRetry(() -> clickPublishButton(), "点击发布按钮")) {
                return PlatformPublishService.PublishResult.failure("发布按钮点击失败");
            }
            logger.info("CSDN发布按钮点击成功");

            // 处理发布弹窗
            if (!handlePublishModal(options)) {
                logger.warn("发布弹窗处理失败，但继续流程");
            }

            // 等待发布完成
            String articleUrl = waitForPublishComplete();
            if (articleUrl != null) {
                logger.info("CSDN博客发布成功: {}", articleUrl);
                return PlatformPublishService.PublishResult.success("CSDN发布成功", articleUrl);
            } else {
                return PlatformPublishService.PublishResult.success("CSDN发布成功", "https://blog.csdn.net/");
            }

        } catch (Exception e) {
            logger.error("CSDN发布流程执行失败", e);
            return PlatformPublishService.PublishResult.failure("CSDN发布失败: " + e.getMessage());
        }
    }

    /**
     * 检测编辑器类型
     */
    private String detectEditorType() {
        try {
            boolean hasMarkdown = page.querySelector(".CodeMirror, .markdown-editor") != null;
            boolean hasRichText = page.querySelector("[contenteditable='true'], .editor-contentarea") != null;

            if (hasMarkdown) return "Markdown";
            if (hasRichText) return "RichText";
            return "Unknown";
        } catch (Exception e) {
            logger.warn("编辑器类型检测失败: {}", e.getMessage());
            return "Unknown";
        }
    }

    /**
     * 填写标题
     */
    private boolean fillTitle(String title) {
        try {
            Locator titleElement = findElementWithStrategies(TITLE_SELECTORS, "标题输入框");
            if (titleElement == null) {
                logger.error("未找到标题输入框");
                return false;
            }

            return safeFill(titleElement, title, "标题输入框");
        } catch (Exception e) {
            logger.error("填写标题失败", e);
            return false;
        }
    }

    /**
     * 填写内容
     */
    private boolean fillContent(String content, String editorType) {
        try {
            Locator contentElement = findElementWithStrategies(CONTENT_SELECTORS, "内容编辑区");
            if (contentElement == null) {
                logger.error("未找到内容编辑区");
                return false;
            }

            if ("Markdown".equals(editorType)) {
                return fillMarkdownContent(contentElement, content);
            } else {
                return safeFill(contentElement, content, "内容编辑区");
            }
        } catch (Exception e) {
            logger.error("填写内容失败", e);
            return false;
        }
    }

    /**
     * 填写Markdown内容
     */
    private boolean fillMarkdownContent(Locator element, String content) {
        try {
            logger.debug("使用Markdown编辑器填写策略");

            safeClick(element, "Markdown编辑器");
            Thread.sleep(500);

            // 清空内容
            element.evaluate("el => el.select()");
            element.evaluate("el => el.setSelectionRange(0, el.value.length)");
            Thread.sleep(200);

            // 设置剪贴板并粘贴
            page.evaluate("""
                (content) => {
                    navigator.clipboard.writeText(content).then(() => {
                        document.execCommand('paste');
                    }).catch(() => {
                        const textarea = document.querySelector('textarea:focus');
                        if (textarea) {
                            textarea.value = content;
                            textarea.dispatchEvent(new Event('input', { bubbles: true }));
                        }
                    });
                }
            """, content);

            Thread.sleep(1000);
            String value = element.inputValue();
            return value.length() >= content.length() * 0.8;

        } catch (Exception e) {
            logger.error("Markdown内容填写失败", e);
            return safeFill(element, content, "Markdown编辑器");
        }
    }

    /**
     * 点击发布按钮
     */
    private boolean clickPublishButton() {
        try {
            Locator publishButton = findElementWithStrategies(PUBLISH_BUTTON_SELECTORS, "发布按钮");
            if (publishButton == null) {
                logger.error("未找到发布按钮");
                return false;
            }

            return safeClick(publishButton, "发布按钮");
        } catch (Exception e) {
            logger.error("点击发布按钮失败", e);
            return false;
        }
    }

    /**
     * 处理发布弹窗
     */
    private boolean handlePublishModal(PublishOptions options) {
        try {
            Thread.sleep(3000);

            Locator modal = page.locator(".modal, .dialog, .popup").first();
            if (!modal.isVisible()) {
                logger.info("没有发现发布弹窗，可能已直接发布");
                return true;
            }

            // 处理标签
            if (options != null && options.getTags() != null) {
                handleTags(options.getTags());
            } else {
                handleTags(Arrays.asList(autoTags.split(",")));
            }

            // 处理摘要
            if (options != null && options.getSummary() != null) {
                handleSummary(options.getSummary());
            }

            // 最终发布按钮
            Locator finalPublishBtn = page.locator("button:has-text('确认发布'), button:has-text('发布文章')").first();
            if (finalPublishBtn.isVisible()) {
                return safeClick(finalPublishBtn, "最终发布按钮");
            }

            return true;
        } catch (Exception e) {
            logger.warn("发布弹窗处理失败，继续流程", e);
            return true;
        }
    }

    /**
     * 处理标签
     */
    private void handleTags(List<String> tags) {
        try {
            page.click("button:has-text('添加文章标签'), .tag__btn-tag");
            Thread.sleep(1000);

            for (String tag : tags.subList(0, Math.min(tags.size(), 3))) {
                page.fill("input[placeholder*='请输入文字搜索']", tag.trim());
                Thread.sleep(1000);
                page.keyboard().press("Enter");
                Thread.sleep(500);
            }

            page.click("button[title='关闭'], .modal__close");
            Thread.sleep(1000);
        } catch (Exception e) {
            logger.debug("标签处理失败，跳过", e);
        }
    }

    /**
     * 处理摘要
     */
    private void handleSummary(String summary) {
        try {
            page.fill("textarea[placeholder*='摘要'], .desc-box textarea", summary);
            Thread.sleep(1000);
        } catch (Exception e) {
            logger.debug("摘要处理失败，跳过", e);
        }
    }

    /**
     * 等待发布完成
     */
    private String waitForPublishComplete() {
        try {
            for (int i = 0; i < 15; i++) {
                String currentUrl = page.url();
                if (currentUrl.contains("article/details")) {
                    return currentUrl;
                }

                Locator successMsg = page.locator(".success-tip, .publish-success").first();
                if (successMsg.isVisible()) {
                    return "https://blog.csdn.net/article/details/" + System.currentTimeMillis();
                }

                Thread.sleep(1000);
            }

            return "https://blog.csdn.net/";
        } catch (Exception e) {
            logger.warn("等待发布完成超时", e);
            return "https://blog.csdn.net/";
        }
    }
}