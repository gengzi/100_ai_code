package com.example.sftps3.config;

import java.net.URI;
import java.util.List;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.util.StringUtils;

@ConfigurationProperties(prefix = "storage")
public class StorageProperties {

    /** Storage targets; MVP uses the first target only */
    private List<StorageTarget> targets;

    public List<StorageTarget> getTargets() {
        return targets;
    }

    public void setTargets(List<StorageTarget> targets) {
        this.targets = targets;
    }

    public static class StorageTarget {
        /** Unique name */
        private String name = "default";

        /** Region */
        private String region = "us-east-1";

        /** Endpoint override to support S3/OSS/MinIO, etc. */
        private URI endpoint;

        private boolean pathStyle = true;

        /** AK/SK; or rely on default credentials chain */
        private String accessKey;

        private String secretKey;

        private String bucket;

        private String basePrefix = "";

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }

        public String getRegion() {
            return region;
        }

        public void setRegion(String region) {
            this.region = region;
        }

        public URI getEndpoint() {
            return endpoint;
        }

        public void setEndpoint(URI endpoint) {
            this.endpoint = endpoint;
        }

        public boolean isPathStyle() {
            return pathStyle;
        }

        public void setPathStyle(boolean pathStyle) {
            this.pathStyle = pathStyle;
        }

        public String getAccessKey() {
            return accessKey;
        }

        public void setAccessKey(String accessKey) {
            this.accessKey = accessKey;
        }

        public String getSecretKey() {
            return secretKey;
        }

        public void setSecretKey(String secretKey) {
            this.secretKey = secretKey;
        }

        public String getBucket() {
            return bucket;
        }

        public void setBucket(String bucket) {
            this.bucket = bucket;
        }

        public String getBasePrefix() {
            return basePrefix;
        }

        public void setBasePrefix(String basePrefix) {
            this.basePrefix = basePrefix;
        }

        public boolean hasStaticCredentials() {
            return StringUtils.hasText(accessKey) && StringUtils.hasText(secretKey);
        }
    }
}
