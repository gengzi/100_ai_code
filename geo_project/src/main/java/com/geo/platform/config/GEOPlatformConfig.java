package com.geo.platform.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "geo.platform")
public class GEOPlatformConfig {

    /**
     * AI配置
     */
    private AIConfig ai = new AIConfig();

    /**
     * 发布配置
     */
    private PublishConfig publish = new PublishConfig();

    /**
     * 平台配置
     */
    private PlatformConfig platform = new PlatformConfig();

    public static class AIConfig {
        private String url = "https://api.openai.com/v1/chat/completions";
        private String key;
        private String model = "gpt-3.5-turbo";
        private int timeout = 60000;
        private double temperature = 0.3;
        private int maxTokens = 2000;

        // Getters and Setters
        public String getUrl() { return url; }
        public void setUrl(String url) { this.url = url; }

        public String getKey() { return key; }
        public void setKey(String key) { this.key = key; }

        public String getModel() { return model; }
        public void setModel(String model) { this.model = model; }

        public int getTimeout() { return timeout; }
        public void setTimeout(int timeout) { this.timeout = timeout; }

        public double getTemperature() { return temperature; }
        public void setTemperature(double temperature) { this.temperature = temperature; }

        public int getMaxTokens() { return maxTokens; }
        public void setMaxTokens(int maxTokens) { this.maxTokens = maxTokens; }
    }

    public static class PublishConfig {
        private String storageStatePath = "./storage-states";
        private boolean headless = false;
        private int timeout = 30000;
        private int publishInterval = 2000;
        private boolean autoRetry = true;
        private int maxRetries = 3;

        // Getters and Setters
        public String getStorageStatePath() { return storageStatePath; }
        public void setStorageStatePath(String storageStatePath) { this.storageStatePath = storageStatePath; }

        public boolean isHeadless() { return headless; }
        public void setHeadless(boolean headless) { this.headless = headless; }

        public int getTimeout() { return timeout; }
        public void setTimeout(int timeout) { this.timeout = timeout; }

        public int getPublishInterval() { return publishInterval; }
        public void setPublishInterval(int publishInterval) { this.publishInterval = publishInterval; }

        public boolean isAutoRetry() { return autoRetry; }
        public void setAutoRetry(boolean autoRetry) { this.autoRetry = autoRetry; }

        public int getMaxRetries() { return maxRetries; }
        public void setMaxRetries(int maxRetries) { this.maxRetries = maxRetries; }
    }

    public static class PlatformConfig {
        private PlatformInfo weibo = new PlatformInfo("weibo", "https://weibo.com", "https://weibo.com/compose");
        private PlatformInfo xiaohongshu = new PlatformInfo("xiaohongshu", "https://www.xiaohongshu.com", "https://creator.xiaohongshu.com/publish/publish");
        private PlatformInfo zhihu = new PlatformInfo("zhihu", "https://www.zhihu.com", "https://zhuanlan.zhihu.com/write");
        private PlatformInfo douyin = new PlatformInfo("douyin", "https://www.douyin.com", "https://creator.douyin.com");

        // 新增国内内容平台
        private PlatformInfo csdn = new PlatformInfo("csdn", "https://blog.csdn.net", "https://editor.csdn.net/md?not_checkout=1");
        private PlatformInfo juejin = new PlatformInfo("juejin", "https://juejin.cn", "https://juejin.cn/editor?type=markdown");
        private PlatformInfo jianshu = new PlatformInfo("jianshu", "https://www.jianshu.com", "https://www.jianshu.com/writer#/");
        private PlatformInfo cnblogs = new PlatformInfo("cnblogs", "https://www.cnblogs.com", "https://i.cnblogs.com/posts/edit");
        private PlatformInfo oschina = new PlatformInfo("oschina", "https://www.oschina.net", "https://my.oschina.net/blog/new");
        private PlatformInfo segmentfault = new PlatformInfo("segmentfault", "https://segmentfault.com", "https://segmentfault.com/write");

        public static class PlatformInfo {
            private String name;
            private String baseUrl;
            private String publishUrl;

            public PlatformInfo() {}

            public PlatformInfo(String name, String baseUrl, String publishUrl) {
                this.name = name;
                this.baseUrl = baseUrl;
                this.publishUrl = publishUrl;
            }

            // Getters and Setters
            public String getName() { return name; }
            public void setName(String name) { this.name = name; }

            public String getBaseUrl() { return baseUrl; }
            public void setBaseUrl(String baseUrl) { this.baseUrl = baseUrl; }

            public String getPublishUrl() { return publishUrl; }
            public void setPublishUrl(String publishUrl) { this.publishUrl = publishUrl; }
        }

        // Getters and Setters
        public PlatformInfo getWeibo() { return weibo; }
        public void setWeibo(PlatformInfo weibo) { this.weibo = weibo; }

        public PlatformInfo getXiaohongshu() { return xiaohongshu; }
        public void setXiaohongshu(PlatformInfo xiaohongshu) { this.xiaohongshu = xiaohongshu; }

        public PlatformInfo getZhihu() { return zhihu; }
        public void setZhihu(PlatformInfo zhihu) { this.zhihu = zhihu; }

        public PlatformInfo getDouyin() { return douyin; }
        public void setDouyin(PlatformInfo douyin) { this.douyin = douyin; }

        // 新增平台的getter和setter方法
        public PlatformInfo getCsdn() { return csdn; }
        public void setCsdn(PlatformInfo csdn) { this.csdn = csdn; }

        public PlatformInfo getJuejin() { return juejin; }
        public void setJuejin(PlatformInfo juejin) { this.juejin = juejin; }

        public PlatformInfo getJianshu() { return jianshu; }
        public void setJianshu(PlatformInfo jianshu) { this.jianshu = jianshu; }

        public PlatformInfo getCnblogs() { return cnblogs; }
        public void setCnblogs(PlatformInfo cnblogs) { this.cnblogs = cnblogs; }

        public PlatformInfo getOschina() { return oschina; }
        public void setOschina(PlatformInfo oschina) { this.oschina = oschina; }

        public PlatformInfo getSegmentfault() { return segmentfault; }
        public void setSegmentfault(PlatformInfo segmentfault) { this.segmentfault = segmentfault; }
    }

    // Getters and Setters for main config
    public AIConfig getAi() { return ai; }
    public void setAi(AIConfig ai) { this.ai = ai; }

    public PublishConfig getPublish() { return publish; }
    public void setPublish(PublishConfig publish) { this.publish = publish; }

    public PlatformConfig getPlatform() { return platform; }
    public void setPlatform(PlatformConfig platform) { this.platform = platform; }
}