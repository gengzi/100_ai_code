package com.geo.platform.service.strategy;

import java.util.List;
import java.util.Map;

/**
 * 发布选项配置类
 */
public class PublishOptions {
    private List<String> tags;
    private String summary;
    private List<String> categories;
    private String visibility = "public";
    private boolean autoSave = true;
    private boolean enableComments = true;
    private Map<String, Object> customOptions;

    public PublishOptions() {}

    public PublishOptions(List<String> tags, String summary) {
        this.tags = tags;
        this.summary = summary;
    }

    // Getters and Setters
    public List<String> getTags() { return tags; }
    public void setTags(List<String> tags) { this.tags = tags; }

    public String getSummary() { return summary; }
    public void setSummary(String summary) { this.summary = summary; }

    public List<String> getCategories() { return categories; }
    public void setCategories(List<String> categories) { this.categories = categories; }

    public String getVisibility() { return visibility; }
    public void setVisibility(String visibility) { this.visibility = visibility; }

    public boolean isAutoSave() { return autoSave; }
    public void setAutoSave(boolean autoSave) { this.autoSave = autoSave; }

    public boolean isEnableComments() { return enableComments; }
    public void setEnableComments(boolean enableComments) { this.enableComments = enableComments; }

    public Map<String, Object> getCustomOptions() { return customOptions; }
    public void setCustomOptions(Map<String, Object> customOptions) { this.customOptions = customOptions; }

    public PublishOptions addTag(String tag) {
        if (tags == null) {
            tags = new java.util.ArrayList<>();
        }
        tags.add(tag);
        return this;
    }

    public PublishOptions setCustomOption(String key, Object value) {
        if (customOptions == null) {
            customOptions = new java.util.HashMap<>();
        }
        customOptions.put(key, value);
        return this;
    }

    /**
     * 创建默认发布选项
     */
    public static PublishOptions createDefault() {
        PublishOptions options = new PublishOptions();
        options.setTags(List.of("技术", "编程", "原创"));
        options.setVisibility("public");
        options.setAutoSave(true);
        options.setEnableComments(true);
        return options;
    }
}