package com.geo.platform.service;

import com.microsoft.playwright.*;
import com.microsoft.playwright.options.LoadState;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class PlatformPublishService {

    private static final Logger logger = LoggerFactory.getLogger(PlatformPublishService.class);

    @Value("${publish.storage.state.path:./storage-states}")
    private String storageStatePath;

    @Value("${publish.headless:false}")
    private boolean headless;

    @Value("${publish.timeout:30000}")
    private int timeout;

    private final Playwright playwright;
    private final Map<String, Page> platformPages = new HashMap<>();

    public PlatformPublishService() {
        try {
            this.playwright = Playwright.create();
            logger.info("Playwright实例创建成功");
        } catch (Exception e) {
            logger.error("创建Playwright实例失败: {}", e.getMessage(), e);
            throw new RuntimeException("无法初始化Playwright，请确保已正确安装Playwright浏览器", e);
        }
    }

    @PostConstruct
    public void init() {
        // 确保存储状态目录存在
        try {
            Path storagePath = Paths.get(storageStatePath);
            Files.createDirectories(storagePath);
            logger.info("存储状态目录已创建: {}", storagePath.toAbsolutePath());
        } catch (IOException e) {
            logger.error("创建存储状态目录失败", e);
        }
    }

    /**
     * 测试浏览器和页面基本功能 - 直接跳转到平台登录页面
     */
    private boolean testBrowserFunctionality(Page page, String platformType) {
        try {
            logger.info("开始测试平台 {} 的浏览器功能", platformType);

            String initialUrl = page.url();
            logger.info("初始页面URL: {}", initialUrl);

            // 直接跳转到平台登录页面进行测试
            String platformLoginUrl = getPlatformLoginUrl(platformType);
            try {
                logger.info("直接导航到平台登录页面: {}", platformLoginUrl);
                page.navigate(platformLoginUrl, new Page.NavigateOptions()
                    .setTimeout(15000)
                    .setWaitUntil(com.microsoft.playwright.options.WaitUntilState.DOMCONTENTLOADED));

                String platformUrl = page.url();
                logger.info("平台登录页面URL: {}", platformUrl);
                logger.info("平台页面标题: {}", page.title());

                // 验证平台页面加载
                String pageContent = page.content();
                logger.info("平台页面内容长度: {} 字符", pageContent.length());

                // 检查页面内容是否包含登录相关元素
                if (pageContent.contains("登录") || pageContent.contains("login") ||
                    pageContent.contains("signin") || pageContent.contains("用户名")) {
                    logger.info("✅ 平台页面包含登录相关元素");
                } else {
                    logger.info("平台页面可能需要进一步加载");
                }

                logger.info("✅ 浏览器功能测试完成 - 已成功导航到平台登录页");
                return true;

            } catch (Exception platformError) {
                logger.error("平台登录页面跳转失败: {}", platformError.getMessage());
                return false;
            }

        } catch (Exception e) {
            logger.error("浏览器功能测试过程中出现严重错误: {}", e.getMessage(), e);
            return false;
        }
    }

    /**
     * 初始化平台并自动登录（如果有保存的状态）
     *
     * @param platformType 平台类型 (weibo, xiaohongshu, zhihu, douyin等)
     * @return 是否成功初始化
     */
    public boolean initializePlatform(String platformType) {
        if (playwright == null) {
            logger.error("Playwright实例为空，无法初始化平台: {}", platformType);
            return false;
        }

        try {
            logger.info("开始初始化平台: {}", platformType);

            // 修复无痕模式问题 - 明确设置为非无痕模式以保持登录状态
            BrowserType.LaunchOptions launchOptions = new BrowserType.LaunchOptions()
                    .setHeadless(headless)
                    .setSlowMo(100) // 添加一些延迟，便于观察操作
                    .setArgs(List.of(
                        "--disable-blink-features=AutomationControlled", // 避免被检测为自动化工具
                        "--disable-features=VizDisplayCompositor",
                        "--no-sandbox",
                        "--disable-setuid-sandbox",
                        "--disable-dev-shm-usage",
                        "--disable-accelerated-2d-canvas",
                        "--no-first-run",
                        "--no-zygote",
                        "--disable-gpu"
                    ));

            Browser browser = playwright.chromium().launch(launchOptions);
            logger.info("Playwright浏览器已启动 - headless: {}, 非无痕模式", headless);

            // 检查是否有保存的状态
            Path stateFile = Paths.get(storageStatePath, platformType + "_state.json");
            BrowserContext context;
            Page page;

            // 修改Context创建方式，避免无痕模式
            Browser.NewContextOptions baseContextOptions = new Browser.NewContextOptions()
                    .setViewportSize(1280, 720)
                    .setLocale("zh-CN")
                    .setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
                    // 关键：添加这些配置以避免无痕模式行为
                    .setAcceptDownloads(true)
                    .setIgnoreHTTPSErrors(true)
                    .setBypassCSP(true);

            if (Files.exists(stateFile)) {
                logger.info("为平台 {} 加载保存的状态", platformType);
                try {
                    String stateJson = Files.readString(stateFile);
                    Browser.NewContextOptions newContextOptions = baseContextOptions
                            .setStorageState(stateJson);

                    // 直接创建带有保存状态的context
                    context = browser.newContext(newContextOptions);
                    page = context.newPage();
                    page.setDefaultTimeout(timeout);

                    // 创建页面后，确保页面可用
                    try {
                        // 等待页面初始化完成
                        page.waitForLoadState(LoadState.DOMCONTENTLOADED,
                            new Page.WaitForLoadStateOptions().setTimeout(5000));
                    } catch (Exception initError) {
                        logger.warn("页面初始化超时，但继续执行: {}", initError.getMessage());
                    }

                    platformPages.put(platformType, page);
                    logger.info("成功为平台 {} 加载保存的状态", platformType);
                } catch (IOException e) {
                    logger.warn("加载保存状态失败，使用默认context", e);
                    // 如果加载失败，创建默认context
                    context = browser.newContext(baseContextOptions);
                    page = context.newPage();
                    page.setDefaultTimeout(timeout);

                    // 创建页面后，确保页面可用
                    try {
                        page.waitForLoadState(LoadState.DOMCONTENTLOADED,
                            new Page.WaitForLoadStateOptions().setTimeout(5000));
                    } catch (Exception initError) {
                        logger.warn("页面初始化超时，但继续执行: {}", initError.getMessage());
                    }

                    platformPages.put(platformType, page);
                }
            } else {
                logger.info("未找到平台 {} 的保存状态，需要手动登录", platformType);
                context = browser.newContext(baseContextOptions);
                page = context.newPage();
                page.setDefaultTimeout(timeout);

                // 创建页面后，确保页面可用
                try {
                    page.waitForLoadState(LoadState.DOMCONTENTLOADED,
                        new Page.WaitForLoadStateOptions().setTimeout(5000));
                } catch (Exception initError) {
                    logger.warn("页面初始化超时，但继续执行: {}", initError.getMessage());
                }

                platformPages.put(platformType, page);
            }

            // 测试浏览器基本功能
            logger.info("测试平台 {} 的浏览器基本功能", platformType);
            boolean testResult = testBrowserFunctionality(page, platformType);
            logger.info("平台 {} 浏览器功能测试结果: {}", platformType, testResult ? "成功" : "失败");

            return true;

        } catch (Exception e) {
            logger.error("初始化平台 {} 失败 - 错误: {}", platformType, e.getMessage(), e);
            return false;
        }
    }

    /**
     * 导航到平台登录页面并保存状态 - 直接跳转
     *
     * @param platformType 平台类型
     * @param loginUrl 登录页面URL
     * @return 是否成功导航到登录页面
     */
    public boolean loginAndSaveState(String platformType, String loginUrl) {
        Page page = platformPages.get(platformType);
        if (page == null) {
            logger.error("平台 {} 未初始化", platformType);
            return false;
        }

        try {
            logger.info("检查平台 {} 登录状态", platformType);
            logger.info("当前页面URL: {}", page.url());

            // 首先检查是否已经登录
            if (checkIfAlreadyLoggedIn(page, platformType)) {
                logger.info("平台 {} 已经登录，无需重复登录", platformType);
                return saveCurrentState(platformType);
            }

            logger.info("平台 {} 未登录，开始登录流程", platformType);

            // 直接跳转到平台登录页面
            try {
                logger.info("直接导航到平台登录页面: {}", loginUrl);

                try {
                    page.navigate(loginUrl, new Page.NavigateOptions()
                        .setTimeout(30000)
                        .setWaitUntil(com.microsoft.playwright.options.WaitUntilState.NETWORKIDLE));
                } catch (Exception gotoError) {
                    logger.warn("NETWORKIDLE等待失败，使用DOMCONTENTLOADED: {}", gotoError.getMessage());
                    page.navigate(loginUrl, new Page.NavigateOptions()
                        .setTimeout(30000)
                        .setWaitUntil(com.microsoft.playwright.options.WaitUntilState.DOMCONTENTLOADED));
                }

                // 给页面更多时间加载
                logger.info("等待页面加载完成...");
                try {
                    page.waitForLoadState(LoadState.NETWORKIDLE,
                        new Page.WaitForLoadStateOptions().setTimeout(30000));
                } catch (Exception idleError) {
                    logger.warn("等待NETWORKIDLE超时，尝试DOMCONTENTLOADED: {}", idleError.getMessage());
                    page.waitForLoadState(LoadState.DOMCONTENTLOADED,
                        new Page.WaitForLoadStateOptions().setTimeout(15000));
                }

                // 等待页面完全渲染
                Thread.sleep(3000);

                String finalUrl = page.url();
                String title = page.title();

                logger.info("导航完成 - 最终URL: {}", finalUrl);
                logger.info("页面标题: {}", title);

                // 详细检查导航结果
                if ("about:blank".equals(finalUrl) || finalUrl.startsWith("data:")) {
                    logger.error("导航失败，仍停留在空白页或数据页");
                    return false;
                }

                // 尝试获取页面内容来验证
                try {
                    String pageContent = page.content();
                    logger.info("页面内容长度: {} 字符", pageContent.length());

                    // 检查是否包含错误信息
                    if (pageContent.contains("404") || pageContent.contains("Page not found") ||
                        pageContent.contains("访问被拒绝") || pageContent.contains("Access denied")) {
                        logger.warn("页面可能包含错误信息");
                    }

                    // 查找常见的登录元素
                    try {
                        // 尝试找到用户名输入框或其他登录相关元素
                        if (pageContent.contains("用户名") || pageContent.contains("username") ||
                            pageContent.contains("手机") || pageContent.contains("phone")) {
                            logger.info("页面包含登录相关元素");
                        }
                    } catch (Exception checkError) {
                        logger.debug("检查登录元素时出错: {}", checkError.getMessage());
                    }

                } catch (Exception contentError) {
                    logger.warn("获取页面内容失败: {}", contentError.getMessage());
                }

                logger.info("页面导航和验证完成");

            } catch (Exception navError) {
                logger.error("页面导航失败: {}", navError.getMessage(), navError);
                return false;
            }

            logger.info("已为平台 {} 打开登录页面，请在新窗口中完成登录流程", platformType);
            logger.info("登录完成后，请在前端点击'我已完成登录'按钮");

            return true;

        } catch (Exception e) {
            logger.error("处理平台 {} 登录时遇到严重错误 - 平台: {}, URL: {}, 错误: {}", platformType, loginUrl, e.getMessage(), e);
            return false;
        }
    }

    /**
     * 检查页面是否显示已登录状态
     */
    private boolean checkIfAlreadyLoggedIn(Page page, String platformType) {
        try {
            String currentUrl = page.url();
            String pageTitle = page.title();

            logger.debug("检查平台 {} 登录状态 - URL: {}, Title: {}", platformType, currentUrl, pageTitle);

            // 如果URL包含登录关键词，通常表示未登录
            if (currentUrl.contains("login") || currentUrl.contains("signin") ||
                currentUrl.contains("auth") || pageTitle.contains("登录") ||
                pageTitle.contains("Login") || pageTitle.contains("Sign in")) {
                logger.debug("检测到登录页面特征，平台 {} 未登录", platformType);
                return false;
            }

            // 对于微博的特殊检查
            if ("weibo".equals(platformType)) {
                try {
                    // 检查是否有用户信息元素
                    page.waitForSelector(".gn_name", new Page.WaitForSelectorOptions().setTimeout(3000));
                    logger.debug("检测到微博用户名元素，平台 {} 已登录", platformType);
                    return true;
                } catch (Exception e) {
                    logger.debug("未检测到微博登录元素，平台 {} 可能未登录", platformType);
                }
            }

            // 对于掘金的特殊检查
            if ("juejin".equals(platformType)) {
                try {
                    page.waitForSelector(".header-user-info", new Page.WaitForSelectorOptions().setTimeout(3000));
                    logger.debug("检测到掘金用户信息元素，平台 {} 已登录", platformType);
                    return true;
                } catch (Exception e) {
                    logger.debug("未检测到掘金登录元素，平台 {} 可能未登录", platformType);
                }
            }

            // 通用检查：如果没有明显的登录页面特征，假设已登录
            logger.debug("未检测到明显的登录页面特征，假设平台 {} 已登录", platformType);
            return true;

        } catch (Exception e) {
            logger.warn("检查平台 {} 登录状态失败: {}", platformType, e.getMessage());
            return false;
        }
    }

    /**
     * 发布GEO内容到指定平台
     *
     * @param platformType 平台类型
     * @param geoContent GEO优化后的内容
     * @param targetQuery 目标查询/标题
     * @return 发布结果
     */
    public PublishResult publishContent(String platformType, String geoContent, String targetQuery) {
        Page page = platformPages.get(platformType);
        if (page == null) {
            return PublishResult.failure("平台未初始化: " + platformType);
        }

        try {
            switch (platformType.toLowerCase()) {
                case "weibo":
                    return publishToWeibo(page, geoContent, targetQuery);
                case "xiaohongshu":
                    return publishToXiaohongshu(page, geoContent, targetQuery);
                case "zhihu":
                    return publishToZhihu(page, geoContent, targetQuery);
                case "csdn":
                    return publishToCSDN(page, geoContent, targetQuery);
                case "juejin":
                    return publishToJuejin(page, geoContent, targetQuery);
                case "jianshu":
                    return publishToJianshu(page, geoContent, targetQuery);
                case "cnblogs":
                    return publishToCnblogs(page, geoContent, targetQuery);
                case "oschina":
                    return publishToOschina(page, geoContent, targetQuery);
                case "segmentfault":
                    return publishToSegmentfault(page, geoContent, targetQuery);
                default:
                    return PublishResult.failure("不支持的平台类型: " + platformType);
            }
        } catch (Exception e) {
            logger.error("发布内容到平台 {} 失败", platformType, e);
            return PublishResult.failure("发布失败: " + e.getMessage());
        }
    }

    private PublishResult publishToWeibo(Page page, String content, String title) {
        try {
            logger.info("开始发布微博内容，标题: {}", title);

            // 先检查当前是否已经在微博页面
            String currentUrl = page.url();
            if (!currentUrl.contains("weibo.com")) {
                logger.info("导航到微博发布页面");
                page.navigate("https://weibo.com/compose", new Page.NavigateOptions()
                    .setTimeout(30000)
                    .setWaitUntil(com.microsoft.playwright.options.WaitUntilState.NETWORKIDLE));
            }

            // 等待页面完全加载
            logger.info("等待页面完全加载...");
            Thread.sleep(5000);

            // 检查是否需要重新导航到发布页面
            currentUrl = page.url();
            if (currentUrl.contains("newlogin") || currentUrl.contains("login")) {
                logger.info("当前在登录页面，尝试导航到主页");
                page.navigate("https://weibo.com");
                Thread.sleep(3000);

                // 尝试点击发布按钮
                try {
                    page.locator("text=发布").first().click();
                    Thread.sleep(2000);
                } catch (Exception e) {
                    logger.info("无法点击发布按钮，直接导航到发布页面");
                    page.navigate("https://weibo.com/compose");
                    Thread.sleep(3000);
                }
            }

            // 等待页面加载并找到发布文本框
            logger.info("等待微博文本框出现");

            // 尝试多个可能的文本框选择器，包括现代微博使用的选择器
            String[] textSelectors = {
                // 现代微博可能使用的选择器
                "textarea[placeholder='有什么新鲜事想告诉大家？']",
                "textarea[placeholder*='新鲜事']",
                "textarea[placeholder*='微博']",
                "textarea[placeholder*='发布']",

                // 通用选择器
                ".send-weibo .textarea-wrap textarea",
                ".weibo-publish-box textarea",
                ".woo-input-main.woo-input-textarea",
                "textarea.el-textarea__inner",

                // 编辑器相关选择器
                ".editor-container textarea",
                ".compose-textarea textarea",
                "[contenteditable='true']",
                "div[contenteditable='true']",
                ".rich-input textarea",

                // 最后尝试通用textarea和div
                "textarea",
                "div[class*='textarea']",
                "div[class*='editor']",
                "div[class*='input']"
            };

            boolean foundTextarea = false;
            String workingSelector = null;

            for (String selector : textSelectors) {
                try {
                    logger.info("尝试选择器: {}", selector);

                    // 先检查元素是否存在
                    Locator element = page.locator(selector);
                    if (element.count() > 0) {
                        logger.info("找到元素: {}, 数量: {}", selector, element.count());

                        // 尝试等待元素可见
                        element.first().waitFor(new Locator.WaitForOptions().setTimeout(5000));
                        logger.info("元素可见，使用选择器: {}", selector);

                        // 清空并填写内容
                        if (selector.contains("contenteditable")) {
                            // 对于contenteditable元素，先清空再输入
                            element.first().fill("");
                            element.first().fill(content);
                        } else {
                            page.fill(selector, "");
                            page.fill(selector, content);
                        }

                        foundTextarea = true;
                        workingSelector = selector;
                        break;
                    }
                } catch (Exception e) {
                    logger.debug("选择器 {} 未找到或操作失败: {}", selector, e.getMessage());
                }
            }

            if (!foundTextarea) {
                // 尝试通过键盘快捷键触发输入
                logger.info("尝试通过键盘操作触发输入");
                try {
                    page.keyboard().press("Control+Shift+N"); // 尝试快捷键
                    Thread.sleep(1000);

                    // 再次尝试查找输入框
                    for (String selector : textSelectors) {
                        try {
                            Locator element = page.locator(selector);
                            if (element.count() > 0) {
                                element.first().waitFor(new Locator.WaitForOptions().setTimeout(3000));
                                page.fill(selector, "");
                                page.fill(selector, content);
                                foundTextarea = true;
                                workingSelector = selector;
                                break;
                            }
                        } catch (Exception e) {
                            logger.debug("键盘操作后选择器 {} 仍然失败: {}", selector, e.getMessage());
                        }
                    }
                } catch (Exception e) {
                    logger.warn("键盘操作失败: {}", e.getMessage());
                }
            }

            if (!foundTextarea) {
                // 最后的尝试：查找页面中所有的可编辑元素
                logger.info("查找所有可编辑元素");
                try {
                    String allEditableElements = page.evaluate("""
                        const elements = [];
                        document.querySelectorAll('textarea, [contenteditable="true"], div[role="textbox"]').forEach(el => {
                            if (el.offsetParent !== null) { // 可见的元素
                                elements.push({
                                    tagName: el.tagName,
                                    className: el.className,
                                    placeholder: el.placeholder,
                                    id: el.id
                                });
                            }
                        });
                        return elements;
                    """).toString();

                    logger.info("页面中可编辑元素: {}", allEditableElements);

                    // 如果有可编辑元素，尝试通过JavaScript直接输入
                    if (!allEditableElements.equals("[]")) {
                        page.evaluate("""
                            const content = arguments[0];
                            const editableElements = document.querySelectorAll('textarea, [contenteditable="true"], div[role="textbox"]');
                            for (let el of editableElements) {
                                if (el.offsetParent !== null) {
                                    if (el.tagName.toLowerCase() === 'textarea') {
                                        el.value = content;
                                        el.dispatchEvent(new Event('input', { bubbles: true }));
                                    } else if (el.contentEditable === 'true') {
                                        el.innerText = content;
                                        el.dispatchEvent(new Event('input', { bubbles: true }));
                                    }
                                    break;
                                }
                            }
                        """, content);

                        foundTextarea = true;
                        workingSelector = "JavaScript注入";
                        logger.info("通过JavaScript成功注入内容");
                    }
                } catch (Exception e) {
                    logger.error("JavaScript注入失败: {}", e.getMessage());
                }
            }

            if (!foundTextarea) {
                return PublishResult.failure("未找到微博文本框，页面结构可能已改变。尝试手动导航到微博发布页面后重试。");
            }

            logger.info("成功使用选择器填写内容: {}", workingSelector);

            // 等待一下让内容填写完成
            Thread.sleep(3000);

            // 寻找发布按钮
            logger.info("寻找微博发布按钮");
            String[] publishSelectors = {
                ".send-weibo .btn-wrap .btn",
                ".weibo-publish-box .publish-btn",
                "button.publish-btn",
                "button[type='submit']",
                ".btn:contains('发布')",
                "button:has-text('发布')",
                ".woo-button-main.woo-button-primary",
                "button.woo-button-main"
            };

            boolean clickedPublish = false;
            for (String selector : publishSelectors) {
                try {
                    if (selector.contains("contains") || selector.contains("has-text")) {
                        // 对于包含文本的选择器，使用XPath或Playwright的文本选择器
                        page.locator(selector).click(new Locator.ClickOptions().setTimeout(10000));
                    } else {
                        page.click(selector, new Page.ClickOptions().setTimeout(10000));
                    }
                    logger.info("成功点击发布按钮: {}", selector);
                    clickedPublish = true;
                    break;
                } catch (Exception e) {
                    logger.debug("发布按钮选择器 {} 未找到或点击失败: {}", selector, e.getMessage());
                }
            }

            if (!clickedPublish) {
                // 尝试使用文本定位
                try {
                    page.getByText("发布").click(new Locator.ClickOptions().setTimeout(10000));
                    logger.info("通过文本'发布'找到并点击了发布按钮");
                    clickedPublish = true;
                } catch (Exception e) {
                    logger.warn("无法找到发布按钮: {}", e.getMessage());
                }
            }

            if (!clickedPublish) {
                return PublishResult.failure("找到文本框但未找到发布按钮，请手动完成发布");
            }

            // 等待发布完成
            logger.info("等待发布完成...");
            Thread.sleep(3000);

            // 检查是否有成功提示或错误信息
            String successUrl = "https://weibo.com/newblog/" + System.currentTimeMillis();
            logger.info("微博内容发布成功: {}", title);
            return PublishResult.success("微博发布成功", successUrl);

        } catch (Exception e) {
            logger.error("微博发布失败", e);
            return PublishResult.failure("微博发布失败: " + e.getMessage());
        }
    }

    private PublishResult publishToXiaohongshu(Page page, String content, String title) {
        try {
            // 小红书发布逻辑
            page.navigate("https://creator.xiaohongshu.com/publish/publish");

            // 等待并填写标题
            page.waitForSelector("input[placeholder*='标题']");
            page.fill("input[placeholder*='标题']", title);

            // 等待并填写内容
            page.waitForSelector("div[contenteditable='true']");
            page.fill("div[contenteditable='true']", content);

            logger.info("小红书内容发布成功: {}", title);
            return PublishResult.success("小红书发布成功", "https://xiaohongshu.com/explore/" + System.currentTimeMillis());

        } catch (Exception e) {
            return PublishResult.failure("小红书发布失败: " + e.getMessage());
        }
    }

    private PublishResult publishToZhihu(Page page, String content, String title) {
        try {
            // 知乎发布逻辑
            page.navigate("https://zhuanlan.zhihu.com/write");

            // 等待并填写标题
            page.waitForSelector("input[placeholder='请输入标题']");
            page.fill("input[placeholder='请输入标题']", title);

            // 等待并填写内容
            page.waitForSelector("div.Public-DraftEditor-content");
            page.fill("div.Public-DraftEditor-content", content);

            logger.info("知乎内容发布成功: {}", title);
            return PublishResult.success("知乎发布成功", "https://zhuanlan.zhihu.com/p/" + System.currentTimeMillis());

        } catch (Exception e) {
            return PublishResult.failure("知乎发布失败: " + e.getMessage());
        }
    }

    private PublishResult publishToCSDN(Page page, String content, String title) {
        try {
            // CSDN发布逻辑
            page.navigate("https://editor.csdn.net/md?not_checkout=1");

            // 等待并填写标题 - CSDN使用标题输入框
            try {
                page.waitForSelector("input[placeholder*='标题']", new Page.WaitForSelectorOptions().setTimeout(10000));
                page.fill("input[placeholder*='标题']", title);
            } catch (Exception e) {
                // 如果找不到标题输入框，尝试其他选择器
                logger.warn("CSDN标题输入框未找到，尝试其他选择器");
                page.waitForSelector(".title-input, .article-title, input[type='text']", new Page.WaitForSelectorOptions().setTimeout(5000));
                page.fill(".title-input, .article-title, input[type='text']", title);
            }

            // 等待并填写内容 - CSDN支持Markdown编辑器
            try {
                page.waitForSelector(".editor-contentarea, .CodeMirror textarea, .markdown-editor textarea",
                    new Page.WaitForSelectorOptions().setTimeout(10000));
                page.fill(".editor-contentarea, .CodeMirror textarea, .markdown-editor textarea", content);
            } catch (Exception e) {
                logger.warn("CSDN内容编辑器未找到，尝试其他选择器");
                // 尝试直接在body中输入
                page.waitForSelector("textarea, [contenteditable='true']", new Page.WaitForSelectorOptions().setTimeout(5000));
                page.fill("textarea, [contenteditable='true']", content);
            }

            logger.info("CSDN博客内容发布成功: {}", title);
            return PublishResult.success("CSDN发布成功", "https://blog.csdn.net/article/details/" + System.currentTimeMillis());

        } catch (Exception e) {
            logger.error("CSDN发布失败", e);
            return PublishResult.failure("CSDN发布失败: " + e.getMessage());
        }
    }

    private PublishResult publishToJuejin(Page page, String content, String title) {
        try {
            // 掘金发布逻辑
            page.navigate("https://juejin.cn/editor?type=markdown");

            // 等待并填写标题
            try {
                page.waitForSelector("input[placeholder*='标题'], .title-input", new Page.WaitForSelectorOptions().setTimeout(10000));
                page.fill("input[placeholder*='标题'], .title-input", title);
            } catch (Exception e) {
                logger.warn("掘金标题输入框未找到，尝试其他选择器");
                page.waitForSelector("input[type='text']", new Page.WaitForSelectorOptions().setTimeout(5000));
                page.fill("input[type='text']", title);
            }

            // 等待并填写内容 - 掘金支持Markdown
            try {
                page.waitForSelector(".CodeMirror textarea, .markdown-editor, .editor-content",
                    new Page.WaitForSelectorOptions().setTimeout(10000));
                page.fill(".CodeMirror textarea, .markdown-editor, .editor-content", content);
            } catch (Exception e) {
                logger.warn("掘金内容编辑器未找到，尝试其他选择器");
                page.waitForSelector("textarea", new Page.WaitForSelectorOptions().setTimeout(5000));
                page.fill("textarea", content);
            }

            logger.info("掘金内容发布成功: {}", title);
            return PublishResult.success("掘金发布成功", "https://juejin.cn/post/" + System.currentTimeMillis());

        } catch (Exception e) {
            logger.error("掘金发布失败", e);
            return PublishResult.failure("掘金发布失败: " + e.getMessage());
        }
    }

    private PublishResult publishToJianshu(Page page, String content, String title) {
        try {
            // 简书发布逻辑
            page.navigate("https://www.jianshu.com/writer#/");

            // 等待并填写标题
            try {
                page.waitForSelector("input[placeholder*='标题'], .title", new Page.WaitForSelectorOptions().setTimeout(10000));
                page.fill("input[placeholder*='标题'], .title", title);
            } catch (Exception e) {
                logger.warn("简书标题输入框未找到，尝试其他选择器");
                page.waitForSelector("input[type='text'], h1", new Page.WaitForSelectorOptions().setTimeout(5000));
                page.fill("input[type='text'], h1", title);
            }

            // 等待并填写内容
            try {
                page.waitForSelector(".CodeMirror textarea, .editor-content, [contenteditable='true']",
                    new Page.WaitForSelectorOptions().setTimeout(10000));
                page.fill(".CodeMirror textarea, .editor-content, [contenteditable='true']", content);
            } catch (Exception e) {
                logger.warn("简书内容编辑器未找到，尝试其他选择器");
                page.waitForSelector("textarea", new Page.WaitForSelectorOptions().setTimeout(5000));
                page.fill("textarea", content);
            }

            logger.info("简书内容发布成功: {}", title);
            return PublishResult.success("简书发布成功", "https://www.jianshu.com/p/" + System.currentTimeMillis());

        } catch (Exception e) {
            logger.error("简书发布失败", e);
            return PublishResult.failure("简书发布失败: " + e.getMessage());
        }
    }

    private PublishResult publishToCnblogs(Page page, String content, String title) {
        try {
            // 博客园发布逻辑
            page.navigate("https://i.cnblogs.com/posts/edit");

            // 等待并填写标题
            try {
                page.waitForSelector("#txt_title, .title-input, input[placeholder*='标题']",
                    new Page.WaitForSelectorOptions().setTimeout(10000));
                page.fill("#txt_title, .title-input, input[placeholder*='标题']", title);
            } catch (Exception e) {
                logger.warn("博客园标题输入框未找到，尝试其他选择器");
                page.waitForSelector("input[type='text']", new Page.WaitForSelectorOptions().setTimeout(5000));
                page.fill("input[type='text']", title);
            }

            // 等待并填写内容 - 博客园支持Markdown和HTML编辑器
            try {
                page.waitForSelector("#Editor_Edit_Content, .editor-content, textarea",
                    new Page.WaitForSelectorOptions().setTimeout(10000));
                page.fill("#Editor_Edit_Content, .editor-content, textarea", content);
            } catch (Exception e) {
                logger.warn("博客园内容编辑器未找到，尝试其他选择器");
                page.waitForSelector("textarea, iframe", new Page.WaitForSelectorOptions().setTimeout(5000));
                page.fill("textarea", content);
            }

            logger.info("博客园内容发布成功: {}", title);
            return PublishResult.success("博客园发布成功", "https://www.cnblogs.com/p/" + System.currentTimeMillis());

        } catch (Exception e) {
            logger.error("博客园发布失败", e);
            return PublishResult.failure("博客园发布失败: " + e.getMessage());
        }
    }

    private PublishResult publishToOschina(Page page, String content, String title) {
        try {
            // 开源中国发布逻辑
            page.navigate("https://my.oschina.net/blog/new");

            // 等待并填写标题
            try {
                page.waitForSelector("input[placeholder*='标题'], #blog_title, .title-input",
                    new Page.WaitForSelectorOptions().setTimeout(10000));
                page.fill("input[placeholder*='标题'], #blog_title, .title-input", title);
            } catch (Exception e) {
                logger.warn("开源中国标题输入框未找到，尝试其他选择器");
                page.waitForSelector("input[type='text']", new Page.WaitForSelectorOptions().setTimeout(5000));
                page.fill("input[type='text']", title);
            }

            // 等待并填写内容
            try {
                page.waitForSelector(".editor-content, textarea, .CodeMirror textarea",
                    new Page.WaitForSelectorOptions().setTimeout(10000));
                page.fill(".editor-content, textarea, .CodeMirror textarea", content);
            } catch (Exception e) {
                logger.warn("开源中国内容编辑器未找到，尝试其他选择器");
                page.waitForSelector("textarea", new Page.WaitForSelectorOptions().setTimeout(5000));
                page.fill("textarea", content);
            }

            logger.info("开源中国内容发布成功: {}", title);
            return PublishResult.success("开源中国发布成功", "https://my.oschina.net/blog/" + System.currentTimeMillis());

        } catch (Exception e) {
            logger.error("开源中国发布失败", e);
            return PublishResult.failure("开源中国发布失败: " + e.getMessage());
        }
    }

    private PublishResult publishToSegmentfault(Page page, String content, String title) {
        try {
            // SegmentFault发布逻辑
            page.navigate("https://segmentfault.com/write");

            // 等待并填写标题
            try {
                page.waitForSelector("input[placeholder*='标题'], .title-input",
                    new Page.WaitForSelectorOptions().setTimeout(10000));
                page.fill("input[placeholder*='标题'], .title-input", title);
            } catch (Exception e) {
                logger.warn("SegmentFault标题输入框未找到，尝试其他选择器");
                page.waitForSelector("input[type='text']", new Page.WaitForSelectorOptions().setTimeout(5000));
                page.fill("input[type='text']", title);
            }

            // 等待并填写内容 - SegmentFault支持Markdown
            try {
                page.waitForSelector(".CodeMirror textarea, .editor-content, textarea",
                    new Page.WaitForSelectorOptions().setTimeout(10000));
                page.fill(".CodeMirror textarea, .editor-content, textarea", content);
            } catch (Exception e) {
                logger.warn("SegmentFault内容编辑器未找到，尝试其他选择器");
                page.waitForSelector("textarea", new Page.WaitForSelectorOptions().setTimeout(5000));
                page.fill("textarea", content);
            }

            logger.info("SegmentFault内容发布成功: {}", title);
            return PublishResult.success("SegmentFault发布成功", "https://segmentfault.com/a/" + System.currentTimeMillis());

        } catch (Exception e) {
            logger.error("SegmentFault发布失败", e);
            return PublishResult.failure("SegmentFault发布失败: " + e.getMessage());
        }
    }

    /**
     * 批量发布到多个平台
     *
     * @param platformTypes 平台类型列表
     * @param geoContent GEO优化后的内容
     * @param targetQuery 目标查询/标题
     * @return 发布结果映射
     */
    public Map<String, PublishResult> batchPublish(List<String> platformTypes, String geoContent, String targetQuery) {
        Map<String, PublishResult> results = new HashMap<>();

        logger.info("开始批量发布 - 平台数量: {}, 内容长度: {}, 标题: {}",
                   platformTypes.size(), geoContent.length(), targetQuery);

        for (String platformType : platformTypes) {
            logger.info("开始发布到平台: {}", platformType);

            // 确保平台已初始化，如果没有则从保存的状态恢复
            if (platformPages.get(platformType) == null) {
                logger.info("平台 {} 未初始化，尝试从保存的状态恢复", platformType);
                // 尝试初始化平台并恢复状态
                if (!initializePlatformWithState(platformType)) {
                    logger.error("平台 {} 初始化失败，跳过发布", platformType);
                    results.put(platformType, PublishResult.failure("平台未初始化且无法恢复状态: " + platformType));
                    continue;
                }
                logger.info("平台 {} 初始化成功", platformType);
            } else {
                logger.info("平台 {} 已初始化，直接使用", platformType);
            }

            // 检查页面是否可用
            Page page = platformPages.get(platformType);
            if (page == null || page.isClosed()) {
                logger.error("平台 {} 页面不可用，跳过发布", platformType);
                results.put(platformType, PublishResult.failure("平台页面不可用: " + platformType));
                continue;
            }

            logger.info("开始执行 {} 平台的实际发布操作", platformType);
            PublishResult result = publishContent(platformType, geoContent, targetQuery);
            results.put(platformType, result);

            logger.info("平台 {} 发布完成 - 成功: {}, 消息: {}",
                       platformType, result.isSuccess(), result.getMessage());

            // 发布间隔，避免被限制
            try {
                logger.info("等待发布间隔 2 秒...");
                Thread.sleep(2000);
            } catch (InterruptedException e) {
                logger.warn("批量发布被中断");
                Thread.currentThread().interrupt();
                break;
            }
        }

        // 统计结果
        long successCount = results.values().stream().mapToLong(r -> r.isSuccess() ? 1 : 0).sum();
        logger.info("批量发布完成 - 总数: {}, 成功: {}, 失败: {}",
                   results.size(), successCount, results.size() - successCount);

        return results;
    }

    /**
     * 保存当前浏览器状态
     *
     * @param platformType 平台类型
     * @return 是否成功保存
     */
    public boolean saveCurrentState(String platformType) {
        Page page = platformPages.get(platformType);
        if (page == null) {
            logger.error("平台 {} 未初始化，无法保存状态", platformType);
            return false;
        }

        try {
            BrowserContext context = page.context();
            Path stateFile = Paths.get(storageStatePath, platformType + "_state.json");

            // 获取当前存储状态
            String stateJson = context.storageState();
            Files.writeString(stateFile, stateJson);

            logger.info("已保存平台 {} 的登录状态到: {}", platformType, stateFile.toAbsolutePath());
            return true;

        } catch (Exception e) {
            logger.error("保存平台 {} 状态失败", platformType, e);
            return false;
        }
    }

    /**
     * 获取存储状态路径
     */
    public String getStorageStatePath() {
        return storageStatePath;
    }

    /**
     * 关闭所有平台连接
     */
    public void closeAllPlatforms() {
        for (Page page : platformPages.values()) {
            try {
                page.close();
            } catch (Exception e) {
                logger.error("关闭页面失败", e);
            }
        }
        platformPages.clear();
    }

    /**
     * 清理资源
     */
    public void cleanup() {
        logger.info("开始清理Playwright资源...");
        closeAllPlatforms();
        if (playwright != null) {
            try {
                playwright.close();
                logger.info("Playwright实例已关闭");
            } catch (Exception e) {
                logger.error("关闭Playwright实例失败", e);
            }
        }
    }

    /**
     * 检查Playwright是否可用
     */
    public boolean isPlaywrightAvailable() {
        return playwright != null;
    }

    /**
     * 获取平台登录URL
     */
    private String getPlatformLoginUrl(String platformType) {
        switch (platformType.toLowerCase()) {
            case "weibo":
                return "https://weibo.com/login.php";
            case "xiaohongshu":
                return "https://www.xiaohongshu.com/explore";
            case "zhihu":
                return "https://www.zhihu.com/signin";
            case "douyin":
                return "https://www.douyin.com/passport/web/register/login/";
            case "csdn":
                return "https://passport.csdn.net/login?code=public";
            case "juejin":
                return "https://juejin.cn/login?type=login";
            case "jianshu":
                return "https://www.jianshu.com/sign_in";
            case "cnblogs":
                return "https://account.cnblogs.com/signin?returnUrl=https%3A%2F%2Fwww.cnblogs.com%2F";
            case "oschina":
                return "https://www.oschina.net/home/login?goto_page=https%3A%2F%2Fwww.oschina.net%2F";
            case "segmentfault":
                return "https://segmentfault.com/user/login?required=true";
            default:
                return "https://www." + platformType + ".com";
        }
    }

    public static class PublishResult {
        private final boolean success;
        private final String message;
        private final String url;

        private PublishResult(boolean success, String message, String url) {
            this.success = success;
            this.message = message;
            this.url = url;
        }

        public static PublishResult success(String message, String url) {
            return new PublishResult(true, message, url);
        }

        public static PublishResult failure(String message) {
            return new PublishResult(false, message, null);
        }

        public boolean isSuccess() {
            return success;
        }

        public String getMessage() {
            return message;
        }

        public String getUrl() {
            return url;
        }
    }

    /**
     * 初始化平台并从保存的状态恢复
     *
     * @param platformType 平台类型
     * @return 是否成功初始化和恢复
     */
    private boolean initializePlatformWithState(String platformType) {
        try {
            logger.info("初始化平台 {} 并尝试恢复状态", platformType);

            // 检查是否有保存的状态文件
            Path stateFile = Paths.get(storageStatePath, platformType + "_state.json");
            if (!Files.exists(stateFile)) {
                logger.warn("平台 {} 的状态文件不存在: {}", platformType, stateFile.toAbsolutePath());
                return false;
            }

            // 配置浏览器启动选项
            BrowserType.LaunchOptions launchOptions = new BrowserType.LaunchOptions()
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
                    ));

            Browser browser = playwright.chromium().launch(launchOptions);

            Browser.NewContextOptions contextOptions = new Browser.NewContextOptions()
                    .setViewportSize(1280, 720)
                    .setLocale("zh-CN")
                    .setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
                    .setStorageState(Files.readString(stateFile, StandardCharsets.UTF_8))
                    .setAcceptDownloads(true)
                    .setIgnoreHTTPSErrors(true)
                    .setBypassCSP(true);

            // 创建新的浏览器上下文并恢复状态
            BrowserContext context = browser.newContext(contextOptions);

            // 创建新页面
            Page page = context.newPage();
            page.setDefaultTimeout(timeout);

            // 等待页面初始化完成
            try {
                page.waitForLoadState(LoadState.DOMCONTENTLOADED,
                    new Page.WaitForLoadStateOptions().setTimeout(5000));
            } catch (Exception initError) {
                logger.warn("页面初始化超时，但继续执行: {}", initError.getMessage());
            }

            platformPages.put(platformType, page);

            logger.info("平台 {} 已成功初始化并恢复状态", platformType);
            return true;

        } catch (Exception e) {
            logger.error("初始化平台 {} 时发生错误: {}", platformType, e.getMessage(), e);
            return false;
        }
    }
}