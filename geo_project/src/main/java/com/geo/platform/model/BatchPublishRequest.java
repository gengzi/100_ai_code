package com.geo.platform.model;

import java.util.List;

/**
 * 批量发布请求DTO
 * 匹配前端BatchPublishRequest接口
 */
public class BatchPublishRequest {

    private String optimizedContent;
    private List<String> platforms;
    private String targetQuery;

    public BatchPublishRequest() {}

    public BatchPublishRequest(String optimizedContent, List<String> platforms, String targetQuery) {
        this.optimizedContent = optimizedContent;
        this.platforms = platforms;
        this.targetQuery = targetQuery;
    }

    public String getOptimizedContent() {
        return optimizedContent;
    }

    public void setOptimizedContent(String optimizedContent) {
        this.optimizedContent = optimizedContent;
    }

    public List<String> getPlatforms() {
        return platforms;
    }

    public void setPlatforms(List<String> platforms) {
        this.platforms = platforms;
    }

    public String getTargetQuery() {
        return targetQuery;
    }

    public void setTargetQuery(String targetQuery) {
        this.targetQuery = targetQuery;
    }

    // 为了向后兼容，添加这些方法
    public String getGeoContent() {
        return optimizedContent;
    }

    public List<String> getPlatformTypes() {
        return platforms;
    }

    @Override
    public String toString() {
        return "BatchPublishRequest{" +
                "optimizedContent='" + optimizedContent + '\'' +
                ", platforms=" + platforms +
                ", targetQuery='" + targetQuery + '\'' +
                '}';
    }
}