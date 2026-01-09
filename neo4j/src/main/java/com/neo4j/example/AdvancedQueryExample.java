package com.neo4j.example;

import com.neo4j.service.GraphService;
import com.neo4j.service.PersonService;
import com.neo4j.service.CompanyService;
import com.neo4j.util.Neo4jConnectionManager;
import org.neo4j.driver.Result;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * 高级查询示例
 */
public class AdvancedQueryExample {
    private static final Logger logger = LoggerFactory.getLogger(AdvancedQueryExample.class);

    public static void main(String[] args) {
        logger.info("高级查询示例启动");

        try {
            Neo4jConnectionManager connectionManager = Neo4jConnectionManager.getInstance();
            GraphService graphService = new GraphService();

            // 运行高级查询示例
            runAdvancedQueries(connectionManager);

        } catch (Exception e) {
            logger.error("执行失败", e);
        } finally {
            Neo4jConnectionManager.getInstance().close();
        }
    }

    private static void runAdvancedQueries(Neo4jConnectionManager connectionManager) {
        // 示例 1: 查询特定深度的关系
        logger.info("\n=== 示例 1: 查询人员的朋友网络(深度2) ===");
        String query1 = """
            MATCH (p:Person {name: '张三'})-[:FRIEND_OF*1..2]-(friend:Person)
            RETURN DISTINCT friend.name as friendName
            """;

        Result result1 = connectionManager.executeRead(query1, result -> result);
        while (result1.hasNext()) {
            logger.info("  朋友: {}", result1.next().get("friendName").asString());
        }

        // 示例 2: 统计每个公司的员工数量
        logger.info("\n=== 示例 2: 统计每个公司的员工数量 ===");
        String query2 = """
            MATCH (c:Company)<-[:WORKS_AT]-(p:Person)
            RETURN c.name as company, count(p) as employeeCount
            ORDER BY employeeCount DESC
            """;

        Result result2 = connectionManager.executeRead(query2, result -> result);
        while (result2.hasNext()) {
            var record = result2.next();
            logger.info("  {}: {} 名员工",
                    record.get("company").asString(),
                    record.get("employeeCount").asLong());
        }

        // 示例 3: 查找同时和朋友在同一公司工作的人员
        logger.info("\n=== 示例 3: 查找和朋友在同一公司工作的人员 ===");
        String query3 = """
            MATCH (p1:Person)-[:FRIEND_OF]->(p2:Person)
            MATCH (p1)-[:WORKS_AT]->(c:Company)<-[:WORKS_AT]-(p2)
            RETURN DISTINCT p1.name as person1, p2.name as person2, c.name as company
            """;

        Result result3 = connectionManager.executeRead(query3, result -> result);
        while (result3.hasNext()) {
            var record = result3.next();
            logger.info("  {} 和 {} 是同事,都在 {} 工作",
                    record.get("person1").asString(),
                    record.get("person2").asString(),
                    record.get("company").asString());
        }

        // 示例 4: 查找薪资最高的员工
        logger.info("\n=== 示例 4: 查找薪资最高的前3名员工 ===");
        String query4 = """
            MATCH (p:Person)-[r:WORKS_AT]->(c:Company)
            RETURN p.name as name, c.name as company, r.salary as salary, r.position as position
            ORDER BY r.salary DESC
            LIMIT 3
            """;

        Result result4 = connectionManager.executeRead(query4, result -> result);
        while (result4.hasNext()) {
            var record = result4.next();
            logger.info("  {} - {} | {} | ¥{}",
                    record.get("name").asString(),
                    record.get("company").asString(),
                    record.get("position").asString(),
                    record.get("salary").asInt());
        }

        // 示例 5: 查找没有朋友的人员
        logger.info("\n=== 示例 5: 查找没有朋友的人员 ===");
        String query5 = """
            MATCH (p:Person)
            WHERE NOT (p)-[:FRIEND_OF]-(:Person)
            RETURN p.name as name
            """;

        Result result5 = connectionManager.executeRead(query5, result -> result);
        while (result5.hasNext()) {
            logger.info("  {}", result5.next().get("name").asString());
        }

        // 示例 6: 查找共同好友数量
        logger.info("\n=== 示例 6: 查找人员的共同好友 ===");
        String query6 = """
            MATCH (p1:Person {name: '张三'})-[:FRIEND_OF]->(friend)-[:FRIEND_OF]->(p2:Person)
            WHERE p1 <> p2
            RETURN p2.name as person, count(friend) as mutualFriends
            ORDER BY mutualFriends DESC
            """;

        Result result6 = connectionManager.executeRead(query6, result -> result);
        while (result6.hasNext()) {
            var record = result6.next();
            logger.info("  {}: {} 个共同好友",
                    record.get("person").asString(),
                    record.get("mutualFriends").asLong());
        }

        logger.info("\n=== 高级查询示例完成 ===\n");
    }
}
