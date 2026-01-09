package com.neo4j.util;

import com.neo4j.config.Neo4jConfig;
import org.neo4j.driver.Driver;
import org.neo4j.driver.Session;
import org.neo4j.driver.Result;
import org.neo4j.driver.Transaction;
import org.neo4j.driver.summary.ResultSummary;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.concurrent.atomic.AtomicReference;

/**
 * Neo4j 连接管理器
 * 负责管理数据库连接的生命周期
 */
public class Neo4jConnectionManager {
    private static final Logger logger = LoggerFactory.getLogger(Neo4jConnectionManager.class);
    private static volatile Neo4jConnectionManager instance;
    private final Driver driver;
    private final String database;

    private Neo4jConnectionManager(Neo4jConfig config) {
        this.driver = config.createDriver();
        this.database = config.getDatabase();
    }

    /**
     * 获取单例实例
     */
    public static Neo4jConnectionManager getInstance() {
        if (instance == null) {
            synchronized (Neo4jConnectionManager.class) {
                if (instance == null) {
                    instance = new Neo4jConnectionManager(new Neo4jConfig());
                }
            }
        }
        return instance;
    }

    /**
     * 获取 Session
     */
    public Session getSession() {
        return driver.session(Session.defaultArgs());
    }

    /**
     * 获取指定数据库的 Session
     */
    public Session getSession(String databaseName) {
        return driver.session(Session.builder().withDatabase(databaseName).build());
    }

    /**
     * 执行 Cypher 查询(只读)
     */
    public <T> T executeRead(String cypher, QueryCallback<T> callback) {
        try (Session session = getSession()) {
            return session.readTransaction(tx -> {
                Result result = tx.run(cypher);
                return callback.process(result);
            });
        } catch (Exception e) {
            logger.error("执行读操作失败: {}", cypher, e);
            throw new RuntimeException("执行读操作失败: " + e.getMessage(), e);
        }
    }

    /**
     * 执行 Cypher 查询(写入)
     */
    public ResultSummary executeWrite(String cypher) {
        return executeWrite(cypher, null);
    }

    /**
     * 执行 Cypher 查询(写入)
     */
    public ResultSummary executeWrite(String cypher, QueryCallback<ResultSummary> callback) {
        try (Session session = getSession()) {
            AtomicReference<ResultSummary> summaryRef = new AtomicReference<>();

            session.writeTransaction(tx -> {
                Result result = tx.run(cypher);
                if (callback != null) {
                    callback.process(result);
                }
                summaryRef.set(result.consume());
                return null;
            });

            return summaryRef.get();
        } catch (Exception e) {
            logger.error("执行写操作失败: {}", cypher, e);
            throw new RuntimeException("执行写操作失败: " + e.getMessage(), e);
        }
    }

    /**
     * 执行 Cypher 查询(写入)并返回结果
     */
    public <T> T executeWriteWithResult(String cypher, QueryCallback<T> callback) {
        try (Session session = getSession()) {
            return session.writeTransaction(tx -> {
                Result result = tx.run(cypher);
                return callback.process(result);
            });
        } catch (Exception e) {
            logger.error("执行写操作失败: {}", cypher, e);
            throw new RuntimeException("执行写操作失败: " + e.getMessage(), e);
        }
    }

    /**
     * 在事务中执行操作
     */
    public <T> T executeInTransaction(TransactionCallback<T> callback) {
        try (Session session = getSession()) {
            return session.writeTransaction(tx -> callback.execute(tx));
        } catch (Exception e) {
            logger.error("事务执行失败", e);
            throw new RuntimeException("事务执行失败: " + e.getMessage(), e);
        }
    }

    /**
     * 关闭连接
     */
    public void close() {
        if (driver != null) {
            driver.close();
            logger.info("Neo4j 连接已关闭");
        }
    }

    /**
     * 查询回调接口
     */
    @FunctionalInterface
    public interface QueryCallback<T> {
        T process(Result result);
    }

    /**
     * 事务回调接口
     */
    @FunctionalInterface
    public interface TransactionCallback<T> {
        T execute(Transaction transaction);
    }
}
