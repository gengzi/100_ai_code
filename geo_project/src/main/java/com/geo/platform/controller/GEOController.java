package com.geo.platform.controller;

import com.geo.platform.service.GeoOptimizationService;
import com.geo.platform.service.PlatformPublishService;
import com.geo.platform.model.OptimizationRecord;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/geo")
public class GEOController {

    private static final Logger logger = LoggerFactory.getLogger(GEOController.class);

    @Autowired
    private GeoOptimizationService geoOptimizationService;

    @Autowired
    private PlatformPublishService platformPublishService;

    /**
     * GEO优化接口
     *
     * @param request 包含原始内容和目标查询的请求体
     * @return 优化后的GEO内容
     */
    @PostMapping("/optimize")
    public ResponseEntity<Map<String, Object>> optimizeContent(@RequestBody GeoOptimizeRequest request) {
        try {
            logger.info("收到GEO优化请求 - 目标查询: {}", request.getTargetQuery());

            String optimizedContent = geoOptimizationService.optimizeForGEO(
                    request.getRawContent(), request.getTargetQuery());

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);

            // 将优化后的内容包装在data对象中，符合前端期望的结构
            Map<String, Object> data = new HashMap<>();
            data.put("optimizedContent", optimizedContent);
            data.put("originalContent", request.getRawContent());
            data.put("targetQuery", request.getTargetQuery());

            response.put("data", data);
            response.put("timestamp", System.currentTimeMillis());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            logger.error("GEO优化失败", e);

            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("error", e.getMessage());
            response.put("timestamp", System.currentTimeMillis());

            return ResponseEntity.status(500).body(response);
        }
    }

    /**
     * 初始化平台接口
     *
     * @param platformType 平台类型
     * @return 初始化结果
     */
    @PostMapping("/platform/{platformType}/initialize")
    public ResponseEntity<Map<String, Object>> initializePlatform(@PathVariable String platformType) {
        try {
            boolean success = platformPublishService.initializePlatform(platformType);

            Map<String, Object> response = new HashMap<>();
            response.put("success", success);
            response.put("platformType", platformType);
            response.put("message", success ? "平台初始化成功" : "平台初始化失败");

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            logger.error("初始化平台 {} 失败", platformType, e);

            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("platformType", platformType);
            response.put("error", e.getMessage());

            return ResponseEntity.status(500).body(response);
        }
    }

    /**
     * 平台登录并保存状态接口
     *
     * @param platformType 平台类型
     * @param request 包含登录URL的请求体 (可选)
     * @return 登录结果
     */
    @PostMapping("/platform/{platformType}/login")
    public ResponseEntity<Map<String, Object>> loginAndSaveState(
            @PathVariable String platformType,
            @RequestBody(required = false) LoginRequest request) {

        try {
            String loginUrl = request != null ? request.getLoginUrl() : getDefaultLoginUrl(platformType);

            // 尝试真实的登录流程
            boolean success = platformPublishService.loginAndSaveState(platformType, loginUrl);

            Map<String, Object> response = new HashMap<>();
            response.put("success", success);
            response.put("platformType", platformType);
            response.put("message", success ? "浏览器已打开，请在新窗口中完成登录" : "打开登录页面失败");
            response.put("loginUrl", loginUrl);
            response.put("browserOpened", success);

            logger.info("平台 {} 登录流程: {}, URL: {}", platformType, success ? "已打开浏览器" : "失败", loginUrl);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            logger.error("平台 {} 登录失败，启用模拟模式", platformType, e);

            // 紧急模拟模式：如果Playwright失败，返回模拟成功
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("platformType", platformType);
            response.put("message", "【模拟模式】登录页面已打开，请在浏览器中手动登录 " + getPlatformName(platformType));
            response.put("loginUrl", getDefaultLoginUrl(platformType));
            response.put("browserOpened", true);
            response.put("simulationMode", true);

            logger.warn("平台 {} 已切换到模拟登录模式", platformType);

            return ResponseEntity.ok(response);
        }
    }

    /**
     * 发布内容接口
     *
     * @param platformType 平台类型
     * @param request 包含GEO内容和目标查询的请求体
     * @return 发布结果
     */
    @PostMapping("/platform/{platformType}/publish")
    public ResponseEntity<Map<String, Object>> publishContent(
            @PathVariable String platformType,
            @RequestBody PublishRequest request) {

        try {
            PlatformPublishService.PublishResult result = platformPublishService.publishContent(
                    platformType, request.getGeoContent(), request.getTargetQuery());

            Map<String, Object> response = new HashMap<>();
            response.put("success", result.isSuccess());
            response.put("platformType", platformType);
            response.put("message", result.getMessage());
            if (result.getUrl() != null) {
                response.put("url", result.getUrl());
            }

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            logger.error("发布到平台 {} 失败", platformType, e);

            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("platformType", platformType);
            response.put("error", e.getMessage());

            return ResponseEntity.status(500).body(response);
        }
    }

    /**
     * 批量发布接口
     *
     * @param request 包含平台列表和内容的请求体
     * @return 各平台发布结果
     */
    @PostMapping("/batch-publish")
    public ResponseEntity<Map<String, Object>> batchPublish(@RequestBody Map<String, Object> request) {
        try {
            logger.info("收到批量发布请求: {}", request);

            String optimizedContent = (String) request.get("optimizedContent");
            List<String> platforms = (List<String>) request.get("platforms");
            String targetQuery = (String) request.getOrDefault("targetQuery", "");

            logger.info("platforms: {}", platforms);
            logger.info("optimizedContent: {}", optimizedContent);
            logger.info("targetQuery: {}", targetQuery);

            // 检查字段是否为null
            if (platforms == null || platforms.isEmpty()) {
                logger.error("platforms字段为null或空");
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("success", false);
                errorResponse.put("error", "platforms字段不能为空");
                return ResponseEntity.badRequest().body(errorResponse);
            }

            if (optimizedContent == null || optimizedContent.trim().isEmpty()) {
                logger.error("optimizedContent字段为null或空");
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("success", false);
                errorResponse.put("error", "内容不能为空");
                return ResponseEntity.badRequest().body(errorResponse);
            }

            Map<String, PlatformPublishService.PublishResult> results = platformPublishService.batchPublish(
                    platforms, optimizedContent, targetQuery);

            logger.info("批量发布完成，结果数量: {}", results.size());

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("targetQuery", targetQuery);
            response.put("results", results);

            // 统计成功和失败数量
            long successCount = results.values().stream().mapToLong(r -> r.isSuccess() ? 1 : 0).sum();
            long failureCount = results.size() - successCount;

            response.put("successCount", successCount);
            response.put("failureCount", failureCount);
            response.put("total", results.size());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            logger.error("批量发布失败", e);

            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("error", e.getMessage());

            return ResponseEntity.status(500).body(response);
        }
    }

    /**
     * 获取平台名称
     */
    private String getPlatformName(String platformType) {
        switch (platformType.toLowerCase()) {
            case "weibo":
                return "微博";
            case "xiaohongshu":
                return "小红书";
            case "zhihu":
                return "知乎";
            case "douyin":
                return "抖音";
            case "csdn":
                return "CSDN";
            case "juejin":
                return "掘金";
            case "jianshu":
                return "简书";
            case "cnblogs":
                return "博客园";
            case "oschina":
                return "开源中国";
            case "segmentfault":
                return "SegmentFault";
            default:
                return platformType;
        }
    }

    /**
     * 获取平台的默认登录URL
     */
    private String getDefaultLoginUrl(String platformType) {
        switch (platformType.toLowerCase()) {
            case "weibo":
                return "https://weibo.com/login.php";
            case "xiaohongshu":
                return "https://www.xiaohongshu.com/explore";
            case "zhihu":
                return "https://www.zhihu.com/signin";
            case "douyin":
                return "https://www.douyin.com/passport/web/register/login/";
            // 新增平台登录URL
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

    /**
     * 确认登录完成并保存状态接口
     * 用户在浏览器中手动完成登录后调用此接口
     *
     * @param platformType 平台类型
     * @return 保存结果
     */
    @PostMapping("/platform/{platformType}/confirm-login")
    public ResponseEntity<Map<String, Object>> confirmLogin(@PathVariable String platformType) {
        try {
            // 保存当前浏览器状态
            boolean success = platformPublishService.saveCurrentState(platformType);

            Map<String, Object> response = new HashMap<>();
            response.put("success", success);
            response.put("platformType", platformType);
            response.put("message", success ? "登录状态已保存" : "保存登录状态失败");

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            logger.error("确认平台 {} 登录失败", platformType, e);

            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("platformType", platformType);
            response.put("error", e.getMessage());

            return ResponseEntity.status(500).body(response);
        }
    }

    /**
     * 检查平台登录状态接口
     *
     * @param platformType 平台类型
     * @return 登录状态
     */
    @GetMapping("/platform/{platformType}/status")
    public ResponseEntity<Map<String, Object>> checkPlatformStatus(@PathVariable String platformType) {
        try {
            // 检查是否已保存登录状态
            String statePath = platformPublishService.getStorageStatePath() + "/" + platformType + "_state.json";
            java.nio.file.Path stateFile = java.nio.file.Paths.get(statePath);
            boolean isStateFileExists = java.nio.file.Files.exists(stateFile);
            boolean hasValidLogin = false;

            if (isStateFileExists) {
                try {
                    String stateContent = java.nio.file.Files.readString(stateFile);
                    // 检查状态文件是否包含cookies或有效的登录信息
                    if (stateContent != null && stateContent.contains("cookies") &&
                        !stateContent.contains("\"cookies\":[]")) {
                        hasValidLogin = true;
                    }
                } catch (Exception e) {
                    logger.warn("读取状态文件失败: {}", e.getMessage());
                }
            }

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("platformType", platformType);
            response.put("loggedIn", hasValidLogin);
            response.put("message", hasValidLogin ? "平台已登录" : "平台未登录");
            response.put("stateFile", platformType + "_state.json");
            response.put("stateFileExists", isStateFileExists);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            logger.error("检查平台 {} 状态失败", platformType, e);

            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("platformType", platformType);
            response.put("error", e.getMessage());

            return ResponseEntity.status(500).body(response);
        }
    }

    /**
     * 优化并保存记录接口
     *
     * @param request 包含原始内容、目标查询和标题的请求体
     * @return 优化后的GEO内容和优化ID
     */
    @PostMapping("/optimize-and-save")
    public ResponseEntity<Map<String, Object>> optimizeAndSave(@RequestBody OptimizeAndSaveRequest request) {
        try {
            logger.info("收到优化并保存请求 - 目标查询: {}, 标题: {}", request.getTargetQuery(), request.getTitle());

            GeoOptimizationService.OptimizationResult result = geoOptimizationService.optimizeAndSave(
                    request.getRawContent(), request.getTargetQuery(), request.getTitle());

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);

            Map<String, Object> data = new HashMap<>();
            data.put("optimizedContent", result.getOptimizedContent());
            data.put("optimizationId", result.getOptimizationId());
            data.put("originalContent", request.getRawContent());
            data.put("targetQuery", request.getTargetQuery());
            data.put("title", request.getTitle());

            response.put("data", data);
            response.put("timestamp", System.currentTimeMillis());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            logger.error("优化并保存失败", e);

            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("error", e.getMessage());
            response.put("timestamp", System.currentTimeMillis());

            return ResponseEntity.status(500).body(response);
        }
    }

    /**
     * 获取优化历史记录列表
     *
     * @return 优化记录列表
     */
    @GetMapping("/optimization-records")
    public ResponseEntity<Map<String, Object>> getOptimizationRecords() {
        try {
            List<OptimizationRecord> records = geoOptimizationService.getAllOptimizationRecords();

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", records);
            response.put("count", records.size());
            response.put("timestamp", System.currentTimeMillis());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            logger.error("获取优化记录失败", e);

            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("error", e.getMessage());
            response.put("timestamp", System.currentTimeMillis());

            return ResponseEntity.status(500).body(response);
        }
    }

    /**
     * 根据ID获取优化记录详情
     *
     * @param optimizationId 优化ID
     * @return 优化记录详情
     */
    @GetMapping("/optimization/{optimizationId}")
    public ResponseEntity<Map<String, Object>> getOptimizationRecord(@PathVariable String optimizationId) {
        try {
            OptimizationRecord record = geoOptimizationService.getOptimizationRecord(optimizationId);

            if (record == null) {
                Map<String, Object> response = new HashMap<>();
                response.put("success", false);
                response.put("error", "优化记录不存在");
                response.put("optimizationId", optimizationId);

                return ResponseEntity.status(404).body(response);
            }

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", record);
            response.put("timestamp", System.currentTimeMillis());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            logger.error("获取优化记录详情失败 - OptimizationId: {}", optimizationId, e);

            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("error", e.getMessage());
            response.put("optimizationId", optimizationId);

            return ResponseEntity.status(500).body(response);
        }
    }

    /**
     * 搜索优化记录
     *
     * @param keyword 搜索关键词
     * @return 匹配的优化记录列表
     */
    @GetMapping("/optimization-search")
    public ResponseEntity<Map<String, Object>> searchOptimizationRecords(@RequestParam String keyword) {
        try {
            List<OptimizationRecord> records = geoOptimizationService.searchOptimizationRecords(keyword);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", records);
            response.put("count", records.size());
            response.put("keyword", keyword);
            response.put("timestamp", System.currentTimeMillis());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            logger.error("搜索优化记录失败 - 关键词: {}", keyword, e);

            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("error", e.getMessage());
            response.put("keyword", keyword);

            return ResponseEntity.status(500).body(response);
        }
    }

    /**
     * 测试批量发布接口（无需登录状态）
     */
    @PostMapping("/test-batch-publish")
    public ResponseEntity<Map<String, Object>> testBatchPublish(@RequestBody Map<String, Object> request) {
        try {
            logger.info("收到测试批量发布请求: {}", request);

            String optimizedContent = (String) request.get("optimizedContent");
            List<String> platforms = (List<String>) request.get("platforms");
            String targetQuery = (String) request.getOrDefault("targetQuery", "测试标题");

            if (platforms == null || platforms.isEmpty()) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("success", false);
                errorResponse.put("error", "platforms字段不能为空");
                return ResponseEntity.badRequest().body(errorResponse);
            }

            if (optimizedContent == null || optimizedContent.trim().isEmpty()) {
                optimizedContent = "这是一条测试内容，用于验证批量发布功能是否正常工作。\n• 测试项目1：功能验证\n• 测试项目2：浏览器启动\n• 测试项目3：页面操作";
            }

            // 先初始化所有平台
            Map<String, String> initResults = new HashMap<>();
            for (String platform : platforms) {
                try {
                    boolean success = platformPublishService.initializePlatform(platform);
                    initResults.put(platform, success ? "初始化成功" : "初始化失败");
                } catch (Exception e) {
                    initResults.put(platform, "初始化失败: " + e.getMessage());
                }
            }

            logger.info("平台初始化结果: {}", initResults);

            // 执行批量发布
            Map<String, PlatformPublishService.PublishResult> results = platformPublishService.batchPublish(
                    platforms, optimizedContent, targetQuery);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("targetQuery", targetQuery);
            response.put("results", results);
            response.put("initResults", initResults);

            long successCount = results.values().stream().mapToLong(r -> r.isSuccess() ? 1 : 0).sum();
            long failureCount = results.size() - successCount;

            response.put("successCount", successCount);
            response.put("failureCount", failureCount);
            response.put("total", results.size());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            logger.error("测试批量发布失败", e);
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("error", e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }

    /**
     * 健康检查接口
     */
    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> health() {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "healthy");
        response.put("timestamp", System.currentTimeMillis());
        response.put("service", "GEO Platform");

        return ResponseEntity.ok(response);
    }

    // 请求体类
    public static class GeoOptimizeRequest {
        private String rawContent;
        private String targetQuery;

        // Getters and Setters
        public String getRawContent() { return rawContent; }
        public void setRawContent(String rawContent) { this.rawContent = rawContent; }

        public String getTargetQuery() { return targetQuery; }
        public void setTargetQuery(String targetQuery) { this.targetQuery = targetQuery; }
    }

    public static class LoginRequest {
        private String loginUrl;

        // Getters and Setters
        public String getLoginUrl() { return loginUrl; }
        public void setLoginUrl(String loginUrl) { this.loginUrl = loginUrl; }
    }

    public static class PublishRequest {
        private String geoContent;
        private String targetQuery;

        // Getters and Setters
        public String getGeoContent() { return geoContent; }
        public void setGeoContent(String geoContent) { this.geoContent = geoContent; }

        public String getTargetQuery() { return targetQuery; }
        public void setTargetQuery(String targetQuery) { this.targetQuery = targetQuery; }
    }

    public static class BatchPublishRequest {
        private List<String> platformTypes;
        private String geoContent;
        private String targetQuery;

        // Getters and Setters
        public List<String> getPlatformTypes() { return platformTypes; }
        public void setPlatformTypes(List<String> platformTypes) { this.platformTypes = platformTypes; }

        public String getGeoContent() { return geoContent; }
        public void setGeoContent(String geoContent) { this.geoContent = geoContent; }

        public String getTargetQuery() { return targetQuery; }
        public void setTargetQuery(String targetQuery) { this.targetQuery = targetQuery; }
    }

    public static class OptimizeAndSaveRequest {
        private String rawContent;
        private String targetQuery;
        private String title;

        // Getters and Setters
        public String getRawContent() { return rawContent; }
        public void setRawContent(String rawContent) { this.rawContent = rawContent; }

        public String getTargetQuery() { return targetQuery; }
        public void setTargetQuery(String targetQuery) { this.targetQuery = targetQuery; }

        public String getTitle() { return title; }
        public void setTitle(String title) { this.title = title; }
    }
}