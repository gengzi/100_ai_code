package com.neo4j.repository;

import com.neo4j.model.RelationshipTypes;
import com.neo4j.util.Neo4jConnectionManager;
import org.neo4j.driver.Result;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * 关系数据访问层
 */
public class RelationshipRepository {
    private static final Logger logger = LoggerFactory.getLogger(RelationshipRepository.class);
    private final Neo4jConnectionManager connectionManager;

    public RelationshipRepository() {
        this.connectionManager = Neo4jConnectionManager.getInstance();
    }

    public RelationshipRepository(Neo4jConnectionManager connectionManager) {
        this.connectionManager = connectionManager;
    }

    /**
     * 创建工作关系: Person -[WORKS_AT]-> Company
     */
    public void createWorkRelationship(Long personId, Long companyId,
                                        String position, String department, Integer salary) {
        String cypher = """
            MATCH (p:Person)
            WHERE id(p) = $personId
            MATCH (c:Company)
            WHERE id(c) = $companyId
            CREATE (p)-[r:WORKS_AT {
                position: $position,
                department: $department,
                salary: $salary,
                start_date: datetime(),
                status: 'ACTIVE'
            }]->(c)
            RETURN r
            """;

        connectionManager.executeWrite(cypher);
        logger.info("创建工作关系成功: Person {} -> Company {}", personId, companyId);
    }

    /**
     * 创建管理关系: Person -[MANAGES]-> Person
     */
    public void createManagementRelationship(Long managerId, Long subordinateId, String level) {
        String cypher = """
            MATCH (manager:Person)
            WHERE id(manager) = $managerId
            MATCH (subordinate:Person)
            WHERE id(subordinate) = $subordinateId
            CREATE (manager)-[r:MANAGES {
                level: $level,
                since: datetime()
            }]->(subordinate)
            RETURN r
            """;

        connectionManager.executeWrite(cypher);
        logger.info("创建管理关系成功: {} -> {}", managerId, subordinateId);
    }

    /**
     * 创建朋友关系: Person -[FRIEND_OF]-> Person
     */
    public void createFriendRelationship(Long personId1, Long personId2, Integer closeness) {
        String cypher = """
            MATCH (p1:Person)
            WHERE id(p1) = $personId1
            MATCH (p2:Person)
            WHERE id(p2) = $personId2
            CREATE (p1)-[r:FRIEND_OF {
                closeness: $closeness,
                since: datetime()
            }]->(p2)
            RETURN r
            """;

        connectionManager.executeWrite(cypher);
        logger.info("创建朋友关系成功: {} -> {}", personId1, personId2);
    }

    /**
     * 创建同事关系: Person -[COLLEAGUE]-> Person
     */
    public void createColleagueRelationship(Long personId1, Long personId2) {
        String cypher = """
            MATCH (p1:Person)
            WHERE id(p1) = $personId1
            MATCH (p2:Person)
            WHERE id(p2) = $personId2
            CREATE (p1)-[r:COLLEAGUE {
                since: datetime()
            }]->(p2)
            RETURN r
            """;

        connectionManager.executeWrite(cypher);
        logger.info("创建同事关系成功: {} -> {}", personId1, personId2);
    }

    /**
     * 创建合作关系: Company -[PARTNERS_WITH]-> Company
     */
    public void createPartnershipRelationship(Long companyId1, Long companyId2, String partnershipType) {
        String cypher = """
            MATCH (c1:Company)
            WHERE id(c1) = $companyId1
            MATCH (c2:Company)
            WHERE id(c2) = $companyId2
            CREATE (c1)-[r:PARTNERS_WITH {
                type: $partnershipType,
                since: datetime()
            }]->(c2)
            RETURN r
            """;

        connectionManager.executeWrite(cypher);
        logger.info("创建合作关系成功: Company {} -> Company {}", companyId1, companyId2);
    }

    /**
     * 删除关系
     */
    public void deleteRelationship(Long fromId, Long toId, String relationshipType) {
        String cypher = String.format("""
            MATCH (a)-[r:%s]->(b)
            WHERE id(a) = $fromId AND id(b) = $toId
            DELETE r
            """, relationshipType);

        connectionManager.executeWrite(cypher);
        logger.info("删除关系成功: {} -[{}]-> {}", fromId, relationshipType, toId);
    }

    /**
     * 查询人员的所有工作关系
     */
    public Result findPersonWorkRelationships(Long personId) {
        String cypher = """
            MATCH (p:Person)-[r:WORKS_AT]->(c:Company)
            WHERE id(p) = $personId
            RETURN p, r, c
            """;

        return connectionManager.executeRead(cypher, result -> result);
    }

    /**
     * 查询公司的所有员工
     */
    public Result findCompanyEmployees(Long companyId) {
        String cypher = """
            MATCH (p:Person)-[r:WORKS_AT]->(c:Company)
            WHERE id(c) = $companyId
            RETURN p, r, c
            """;

        return connectionManager.executeRead(cypher, result -> result);
    }

    /**
     * 查询人员的朋友网络
     */
    public Result findPersonFriends(Long personId, int maxDepth) {
        String cypher = String.format("""
            MATCH (p:Person)-[r:FRIEND_OF*1..%d]-(friend:Person)
            WHERE id(p) = $personId
            RETURN DISTINCT p, friend, r
            """, maxDepth);

        return connectionManager.executeRead(cypher, result -> result);
    }

    /**
     * 查询最短路径
     */
    public Result findShortestPath(Long fromId, Long toId, String relationshipType) {
        String cypher = String.format("""
            MATCH path = shortestPath(
                (p1:Person)-[:%s*]-(p2:Person)
            )
            WHERE id(p1) = $fromId AND id(p2) = $toId
            RETURN path
            """, relationshipType);

        return connectionManager.executeRead(cypher, result -> result);
    }

    /**
     * 推荐潜在连接
     */
    public Result recommendConnections(Long personId, int limit) {
        String cypher = """
            MATCH (p:Person)-[:FRIEND_OF]->(friend:Person)-[:FRIEND_OF]->(potential:Person)
            WHERE id(p) = $personId
            AND NOT (p)-[:FRIEND_OF]-(potential)
            AND id(potential) <> $personId
            RETURN potential.name as name, count(*) as mutualFriends
            ORDER BY mutualFriends DESC
            LIMIT $limit
            """;

        return connectionManager.executeRead(cypher, result -> result);
    }
}
