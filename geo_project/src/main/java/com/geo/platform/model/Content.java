package com.geo.platform.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "geo_content")
public class Content {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String rawContent;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String targetQuery;

    @Column(columnDefinition = "TEXT")
    private String optimizedContent;

    @Column(length = 200)
    private String title;

    @Column(length = 50)
    private String optimizationId;

    @Column(nullable = false)
    private String platformType;

    @Column(length = 500)
    private String publishedUrl;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column
    private LocalDateTime publishedAt;

    @Column(nullable = false)
    private String status; // CREATED, OPTIMIZED, PUBLISHED, FAILED

    @Column(columnDefinition = "TEXT")
    private String errorMessage;

    // 默认构造函数
    public Content() {
        this.createdAt = LocalDateTime.now();
        this.status = "CREATED";
    }

    // 带参数的构造函数
    public Content(String rawContent, String targetQuery, String platformType) {
        this();
        this.rawContent = rawContent;
        this.targetQuery = targetQuery;
        this.platformType = platformType;
    }

    // 完整参数的构造函数
    public Content(String rawContent, String targetQuery, String platformType, String title, String optimizationId) {
        this();
        this.rawContent = rawContent;
        this.targetQuery = targetQuery;
        this.platformType = platformType;
        this.title = title;
        this.optimizationId = optimizationId;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getRawContent() {
        return rawContent;
    }

    public void setRawContent(String rawContent) {
        this.rawContent = rawContent;
    }

    public String getTargetQuery() {
        return targetQuery;
    }

    public void setTargetQuery(String targetQuery) {
        this.targetQuery = targetQuery;
    }

    public String getOptimizedContent() {
        return optimizedContent;
    }

    public void setOptimizedContent(String optimizedContent) {
        this.optimizedContent = optimizedContent;
    }

    public String getPlatformType() {
        return platformType;
    }

    public void setPlatformType(String platformType) {
        this.platformType = platformType;
    }

    public String getPublishedUrl() {
        return publishedUrl;
    }

    public void setPublishedUrl(String publishedUrl) {
        this.publishedUrl = publishedUrl;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getPublishedAt() {
        return publishedAt;
    }

    public void setPublishedAt(LocalDateTime publishedAt) {
        this.publishedAt = publishedAt;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getErrorMessage() {
        return errorMessage;
    }

    public void setErrorMessage(String errorMessage) {
        this.errorMessage = errorMessage;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getOptimizationId() {
        return optimizationId;
    }

    public void setOptimizationId(String optimizationId) {
        this.optimizationId = optimizationId;
    }

    // 状态常量
    public static final String STATUS_CREATED = "CREATED";
    public static final String STATUS_OPTIMIZED = "OPTIMIZED";
    public static final String STATUS_PUBLISHED = "PUBLISHED";
    public static final String STATUS_FAILED = "FAILED";

    // 便捷方法
    public void markAsOptimized(String optimizedContent) {
        this.optimizedContent = optimizedContent;
        this.status = STATUS_OPTIMIZED;
    }

    public void markAsPublished(String publishedUrl) {
        this.publishedUrl = publishedUrl;
        this.publishedAt = LocalDateTime.now();
        this.status = STATUS_PUBLISHED;
    }

    public void markAsFailed(String errorMessage) {
        this.errorMessage = errorMessage;
        this.status = STATUS_FAILED;
    }
}