package com.neo4j.config;

import org.neo4j.driver.AuthTokens;
import org.neo4j.driver.Driver;
import org.neo4j.driver.GraphDatabase;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.io.InputStream;
import java.util.Properties;

/**
 * Neo4j 数据库配置类
 * 负责加载配置并创建数据库连接
 */
public class Neo4jConfig {
    private static final Logger logger = LoggerFactory.getLogger(Neo4jConfig.class);

    private String uri;
    private String username;
    private String password;
    private String database;
    private int maxConnectionPoolSize;
    private int connectionAcquisitionTimeout;
    private int maxTransactionRetryTime;

    public Neo4jConfig() {
        loadConfig();
    }

    /**
     * 从配置文件加载数据库配置
     */
    private void loadConfig() {
        Properties props = new Properties();

        // 优先从环境变量读取
        this.uri = System.getenv("NEO4J_URI");
        this.username = System.getenv("NEO4J_USER");
        this.password = System.getenv("NEO4J_PASSWORD");
        this.database = System.getenv("NEO4J_DATABASE");

        // 如果环境变量不存在,从 .env 文件读取
        if (this.uri == null || this.username == null || this.password == null) {
            try (InputStream input = getClass().getClassLoader().getResourceAsStream(".env")) {
                if (input == null) {
                    logger.warn("未找到 .env 配置文件,尝试从项目根目录读取");
                    // 尝试从项目根目录读取
                    java.io.File envFile = new java.io.File(".env");
                    if (envFile.exists()) {
                        props.load(new java.io.FileInputStream(envFile));
                        this.uri = props.getProperty("NEO4J_URI", "bolt://localhost:7687");
                        this.username = props.getProperty("NEO4J_USER", "neo4j");
                        this.password = props.getProperty("NEO4J_PASSWORD");
                        this.database = props.getProperty("NEO4J_DATABASE", "neo4j");
                    } else {
                        // 使用默认值
                        this.uri = "bolt://localhost:7687";
                        this.username = "neo4j";
                        this.password = "12345678";
                        this.database = "neo4j";
                        logger.warn("使用默认数据库配置");
                    }
                } else {
                    props.load(input);
                    this.uri = props.getProperty("NEO4J_URI");
                    this.username = props.getProperty("NEO4J_USER");
                    this.password = props.getProperty("NEO4J_PASSWORD");
                    this.database = props.getProperty("NEO4J_DATABASE", "neo4j");
                }
            } catch (IOException e) {
                logger.error("加载配置文件失败", e);
                throw new RuntimeException("加载配置文件失败", e);
            }
        }

        // 加载其他配置参数
        String poolSize = System.getenv("MAX_CONNECTION_POOL_SIZE");
        this.maxConnectionPoolSize = poolSize != null ? Integer.parseInt(poolSize) : 50;

        String timeout = System.getenv("CONNECTION_ACQUISITION_TIMEOUT");
        this.connectionAcquisitionTimeout = timeout != null ? Integer.parseInt(timeout) : 60;

        String retryTime = System.getenv("MAX_TRANSACTION_RETRY_TIME");
        this.maxTransactionRetryTime = retryTime != null ? Integer.parseInt(retryTime) : 30;

        logger.info("Neo4j 配置加载完成 - URI: {}, User: {}, Database: {}",
                this.uri, this.username, this.database);
    }

    /**
     * 创建 Neo4j Driver 实例
     */
    public Driver createDriver() {
        try {
            Driver driver = GraphDatabase.driver(
                    this.uri,
                    AuthTokens.basic(this.username, this.password)
            );

            // 验证连接
            driver.verifyConnectivity();

            logger.info("成功连接到 Neo4j 数据库");
            return driver;
        } catch (Exception e) {
            logger.error("连接 Neo4j 数据库失败", e);
            throw new RuntimeException("连接 Neo4j 数据库失败: " + e.getMessage(), e);
        }
    }

    // Getters
    public String getUri() {
        return uri;
    }

    public String getUsername() {
        return username;
    }

    public String getPassword() {
        return password;
    }

    public String getDatabase() {
        return database;
    }

    public int getMaxConnectionPoolSize() {
        return maxConnectionPoolSize;
    }

    public int getConnectionAcquisitionTimeout() {
        return connectionAcquisitionTimeout;
    }

    public int getMaxTransactionRetryTime() {
        return maxTransactionRetryTime;
    }
}
