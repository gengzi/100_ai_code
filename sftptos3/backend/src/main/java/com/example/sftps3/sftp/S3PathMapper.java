package com.example.sftps3.sftp;

import com.example.sftps3.config.StorageProperties;

public class S3PathMapper {

    private final StorageProperties.StorageTarget target;

    public S3PathMapper(StorageProperties.StorageTarget target) {
        this.target = target;
    }

    /**
     * Map SFTP path to S3 key, ensuring prefix is joined with '/'
     */
    public String toKey(String sftpPath) {
        String normalized = normalize(sftpPath);
        String base = normalize(target.getBasePrefix());
        if (base.isEmpty()) {
            return normalized;
        }
        if (normalized.isEmpty()) {
            return base;
        }
        return base + "/" + normalized;
    }

    private String normalize(String path) {
        if (path == null || path.isEmpty() || "/".equals(path)) {
            return "";
        }
        String cleaned = path.replace('\\', '/');
        if (cleaned.startsWith("/")) {
            cleaned = cleaned.substring(1);
        }
        if (cleaned.endsWith("/")) {
            cleaned = cleaned.substring(0, cleaned.length() - 1);
        }
        return cleaned;
    }
}
