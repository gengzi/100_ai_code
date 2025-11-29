package com.geo.platform.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "optimization_records")
public class OptimizationRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(length = 50, unique = true, nullable = false)
    private String optimizationId;

    @Column(length = 200)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String rawContent;

    @Column(columnDefinition = "TEXT")
    private String targetQuery;

    @Column(columnDefinition = "TEXT")
    private String optimizedContent;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    // 默认构造函数
    public OptimizationRecord() {
        this.createdAt = LocalDateTime.now();
    }

    // 带参数的构造函数
    public OptimizationRecord(String optimizationId, String title, String rawContent, String targetQuery, String optimizedContent) {
        this();
        this.optimizationId = optimizationId;
        this.title = title;
        this.rawContent = rawContent;
        this.targetQuery = targetQuery;
        this.optimizedContent = optimizedContent;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getOptimizationId() {
        return optimizationId;
    }

    public void setOptimizationId(String optimizationId) {
        this.optimizationId = optimizationId;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
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

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}