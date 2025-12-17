package com.example.sftps3.config;

import java.time.Duration;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "sftp")
public class SftpServerProperties {

    /** SFTP bind host, defaults to 0.0.0.0 */
    private String host = "0.0.0.0";

    /** SFTP port */
    private int port = 2022;

    /** HostKey persistence file path */
    private String hostKeyFile = "./hostkey.ser";

    /** Temp directory for buffering uploads */
    private String tempDir = "./data/tmp";

    /** TTL for temp files; sweep removes files with no activity after this duration */
    private Duration tempTtl = Duration.ofHours(4);

    /** Temp directory quota in bytes; uploads are rejected when exceeded. Default 10GB */
    private long tempQuotaBytes = 10L * 1024 * 1024 * 1024;

    public String getHost() {
        return host;
    }

    public void setHost(String host) {
        this.host = host;
    }

    public int getPort() {
        return port;
    }

    public void setPort(int port) {
        this.port = port;
    }

    public String getHostKeyFile() {
        return hostKeyFile;
    }

    public void setHostKeyFile(String hostKeyFile) {
        this.hostKeyFile = hostKeyFile;
    }

    public String getTempDir() {
        return tempDir;
    }

    public void setTempDir(String tempDir) {
        this.tempDir = tempDir;
    }

    public Duration getTempTtl() {
        return tempTtl;
    }

    public void setTempTtl(Duration tempTtl) {
        this.tempTtl = tempTtl;
    }

    public long getTempQuotaBytes() {
        return tempQuotaBytes;
    }

    public void setTempQuotaBytes(long tempQuotaBytes) {
        this.tempQuotaBytes = tempQuotaBytes;
    }
}
