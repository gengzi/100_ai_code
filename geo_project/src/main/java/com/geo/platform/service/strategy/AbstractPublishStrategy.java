package com.geo.platform.service.strategy;

import com.geo.platform.service.PlatformPublishService;
import com.microsoft.playwright.*;
import com.microsoft.playwright.options.LoadState;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * 抽象发布策略基类
 * 提供通用的发布功能和工具方法
 */
public abstract class AbstractPublishStrategy implements PublishStrategy {

    protected final Logger logger = LoggerFactory.getLogger(getClass());

    @Value("${publish.storage.state.path:./storage-states}")
    protected String storageStatePath;

    @Value("${publish.headless:false}")
    protected boolean headless;

    @Value("${publish.timeout:30000}")
    protected int defaultTimeout;

    @Value("${publish.retry-count:3}")
    protected int retryCount;

    @Autowired(required = false)
    protected Playwright playwright;

    protected Page page;
    protected BrowserContext context;
    protected boolean initialized = false;

    // 重试计数器
    private final AtomicInteger retryCounter = new AtomicInteger(0);

    @Override
    public boolean isInitialized() {
        return initialized && page != null && !page.isClosed();
    }

    @Override
    public boolean initializePlatform() {
        try {
            logger.info("初始化平台: {}", getPlatformName());

            if (playwright == null) {
                playwright = Playwright.create();
            }

            // 启动浏览器
            Browser browser = playwright.chromium().launch(new BrowserType.LaunchOptions()
                .setHeadless(headless)
                .setSlowMo(100)
                .setArgs(List.of(
                    "--disable-blink-features=AutomationControlled",
                    "--disable-features=VizDisplayCompositor",
                    "--no-sandbox",
                    "--disable-setuid-sandbox",
                    "--disable-dev-shm-usage",
                    "--disable-accelerated-2d-canvas",
                    "--no-first-run",
                    "--no-zygote",
                    "--disable-gpu"
                )));

            // 创建浏览器上下文
            Browser.NewContextOptions contextOptions = new Browser.NewContextOptions()
                .setViewportSize(1280, 720)
                .setLocale("zh-CN")
                .setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
                .setAcceptDownloads(true)
                .setIgnoreHTTPSErrors(true)
                .setBypassCSP(true);

            // 尝试加载保存的状态
            Path stateFile = Paths.get(storageStatePath, getPlatformType() + "_state.json");
            if (Files.exists(stateFile)) {
                try {
                    String stateJson = Files.readString(stateFile);
                    contextOptions.setStorageState(stateJson);
                    logger.info("为平台 {} 加载保存的状态", getPlatformType());
                } catch (Exception e) {
                    logger.warn("加载保存状态失败，使用默认context", e);
                }
            }

            context = browser.newContext(contextOptions);
            page = context.newPage();
            page.setDefaultTimeout(defaultTimeout);

            initialized = true;
            logger.info("平台 {} 初始化成功", getPlatformName());
            return true;

        } catch (Exception e) {
            logger.error("平台 {} 初始化失败", getPlatformName(), e);
            initialized = false;
            return false;
        }
    }

    @Override
    public PlatformPublishService.PublishResult publish(Page page, String content, String title, PublishOptions options) {
        try {
            logger.info("开始发布到平台: {}, 标题: {}", getPlatformName(), title);

            // 检查初始化状态
            if (!isInitialized()) {
                if (!initializePlatform()) {
                    return PlatformPublishService.PublishResult.failure("平台初始化失败");
                }
            }

            // 重置重试计数器
            retryCounter.set(0);

            // 导航到编辑页面
            if (!navigateToEditor()) {
                return PlatformPublishService.PublishResult.failure("导航到编辑页面失败");
            }

            // 等待页面稳定
            if (!waitForPageStable()) {
                return PlatformPublishService.PublishResult.failure("页面加载超时");
            }

            // 执行平台特定的发布流程
            return executePublishFlow(page, content, title, options);

        } catch (Exception e) {
            logger.error("发布到平台 {} 时发生异常", getPlatformName(), e);
            return PlatformPublishService.PublishResult.failure("发布失败: " + e.getMessage());
        }
    }

    /**
     * 导航到编辑页面
     */
    protected boolean navigateToEditor() {
        try {
            String editorUrl = getEditorUrl();
            logger.info("导航到编辑页面: {}", editorUrl);

            page.navigate(editorUrl, new Page.NavigateOptions()
                .setTimeout(defaultTimeout)
                .setWaitUntil(com.microsoft.playwright.options.WaitUntilState.DOMCONTENTLOADED));

            return true;
        } catch (Exception e) {
            logger.error("导航到编辑页面失败", e);
            return false;
        }
    }

    /**
     * 等待页面稳定
     */
    protected boolean waitForPageStable() {
        try {
            logger.debug("等待页面完全加载和稳定...");

            // 1. 等待网络空闲
            page.waitForLoadState(com.microsoft.playwright.options.LoadState.NETWORKIDLE,
                new Page.WaitForLoadStateOptions().setTimeout(defaultTimeout));

            // 2. 等待DOM完全加载
            page.waitForFunction("""
                () => {
                    return document.readyState === 'complete' &&
                           document.querySelector('body') !== null &&
                           window.performance !== undefined &&
                           window.performance.timing.loadEventEnd > 0;
                }
            """, new Page.WaitForFunctionOptions().setTimeout(10000));

            // 3. 额外等待动态内容
            Thread.sleep(2000);

            logger.debug("页面已稳定");
            return true;
        } catch (Exception e) {
            logger.warn("等待页面稳定时出现问题，继续执行: {}", e.getMessage());
            return true;
        }
    }

    /**
     * 执行发布流程 - 由子类实现
     */
    protected abstract PlatformPublishService.PublishResult executePublishFlow(Page page, String content, String title, PublishOptions options);

    /**
     * 智能元素定位 - 支持多种策略和回退
     */
    protected Locator findElementWithStrategies(List<ElementSelector> selectors, String elementName) {
        for (ElementSelector selector : selectors) {
            try {
                logger.debug("尝试定位{}: {}", elementName, selector.description);

                Locator element = page.locator(selector.selector);
                element.waitFor(new Locator.WaitForOptions().setTimeout(5000));

                if (element.isVisible() && element.isEnabled()) {
                    element.scrollIntoViewIfNeeded();
                    Thread.sleep(500);

                    logger.debug("成功定位{}: {}", elementName, selector.description);
                    return element;
                }
            } catch (Exception e) {
                logger.debug("{}定位失败: {} - {}", elementName, selector.description, e.getMessage());
            }
        }

        logger.warn("所有{}定位策略都失败", elementName);
        return null;
    }

    /**
     * 增强的坐标计算和点击
     */
    protected boolean safeClick(Locator element, String elementName) {
        try {
            // 1. 确保元素在视图中
            element.scrollIntoViewIfNeeded();
            Thread.sleep(300);

            // 2. 等待元素可点击
            element.waitFor(new Locator.WaitForOptions().setState(Locator.WaitForSelectorState.VISIBLE).setTimeout(5000));

            // 3. 多种点击方式
            try {
                element.click(new Locator.ClickOptions().setTimeout(3000));
                logger.debug("{}直接点击成功", elementName);
                return true;
            } catch (Exception e1) {
                logger.debug("{}直接点击失败，尝试强制点击", elementName);
                try {
                    element.click(new Locator.ClickOptions().setForce(true).setTimeout(3000));
                    logger.debug("{}强制点击成功", elementName);
                    return true;
                } catch (Exception e2) {
                    logger.debug("{}强制点击失败，尝试JavaScript点击", elementName);
                    try {
                        element.evaluate("el => el.click()");
                        logger.debug("{}JavaScript点击成功", elementName);
                        return true;
                    } catch (Exception e3) {
                        logger.error("{}所有点击方式都失败", elementName);
                        return false;
                    }
                }
            }
        } catch (Exception e) {
            logger.error("{}点击过程出错", elementName, e);
            return false;
        }
    }

    /**
     * 增强的文本填写
     */
    protected boolean safeFill(Locator element, String text, String elementName) {
        try {
            element.scrollIntoViewIfNeeded();
            Thread.sleep(300);

            safeClick(element, elementName);
            Thread.sleep(500);

            element.fill("");
            Thread.sleep(200);

            if (element.getAttribute("contenteditable") != null) {
                element.fill(text);
            } else {
                element.fill(text);
            }

            String filledText = element.inputValue();
            if (filledText.contains(text) || filledText.length() >= text.length() * 0.8) {
                logger.debug("{}填写成功", elementName);
                return true;
            } else {
                logger.warn("{}填写验证失败", elementName);
                return false;
            }
        } catch (Exception e) {
            logger.error("{}填写失败", elementName, e);
            return false;
        }
    }

    /**
     * 带重试的操作执行
     */
    protected boolean executeWithRetry(RunnableWithResult operation, String operationName) {
        for (int i = 0; i < retryCount; i++) {
            try {
                if (operation.execute()) {
                    logger.debug("{}成功", operationName);
                    return true;
                }
                logger.warn("{}失败，重试 {}/{}", operationName, i + 1, retryCount);
                if (i < retryCount - 1) {
                    Thread.sleep(2000);
                }
            } catch (Exception e) {
                logger.error("{}异常，重试 {}/{}", operationName, i + 1, retryCount, e.getMessage());
                if (i < retryCount - 1) {
                    try {
                        Thread.sleep(2000);
                    } catch (InterruptedException ie) {
                        Thread.currentThread().interrupt();
                        return false;
                    }
                }
            }
        }
        logger.error("{}最终失败", operationName);
        return false;
    }

    @Override
    public void cleanup() {
        try {
            if (page != null && !page.isClosed()) {
                page.close();
            }
            if (context != null) {
                context.close();
            }
            initialized = false;
            logger.info("平台 {} 资源已清理", getPlatformName());
        } catch (Exception e) {
            logger.error("清理平台 {} 资源时出错", getPlatformName(), e);
        }
    }

    // 辅助类
    protected static class ElementSelector {
        final String selector;
        final String description;

        ElementSelector(String selector, String description) {
            this.selector = selector;
            this.description = description;
        }
    }

    @FunctionalInterface
    protected interface RunnableWithResult {
        boolean execute() throws Exception;
    }
}