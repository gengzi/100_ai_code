package com.neo4j.repository;

import com.neo4j.model.Company;
import com.neo4j.util.Neo4jConnectionManager;
import org.neo4j.driver.Record;
import org.neo4j.driver.Result;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/**
 * Company 数据访问层
 */
public class CompanyRepository {
    private static final Logger logger = LoggerFactory.getLogger(CompanyRepository.class);
    private final Neo4jConnectionManager connectionManager;

    public CompanyRepository() {
        this.connectionManager = Neo4jConnectionManager.getInstance();
    }

    public CompanyRepository(Neo4jConnectionManager connectionManager) {
        this.connectionManager = connectionManager;
    }

    /**
     * 创建公司节点
     */
    public Company create(Company company) {
        String cypher = """
            CREATE (c:Company {
                name: $name,
                industry: $industry,
                location: $location,
                employee_count: $employeeCount,
                created_at: datetime(),
                updated_at: datetime()
            })
            RETURN c
            """;

        connectionManager.executeRead(cypher, result -> {
            if (result.hasNext()) {
                Record record = result.next();
                company.setId(record.get("c").asNode().id());
            }
            return null;
        });

        logger.info("创建公司成功: {}", company.getName());
        return company;
    }

    /**
     * 根据 ID 查询公司
     */
    public Optional<Company> findById(Long id) {
        String cypher = """
            MATCH (c:Company)
            WHERE id(c) = $id
            RETURN c
            """;

        return connectionManager.executeRead(cypher, result -> {
            if (result.hasNext()) {
                return Optional.of(mapRecordToCompany(result.next()));
            }
            return Optional.empty();
        });
    }

    /**
     * 根据名称查询公司
     */
    public Optional<Company> findByName(String name) {
        String cypher = """
            MATCH (c:Company {name: $name})
            RETURN c
            """;

        return connectionManager.executeRead(cypher, result -> {
            if (result.hasNext()) {
                return Optional.of(mapRecordToCompany(result.next()));
            }
            return Optional.empty();
        });
    }

    /**
     * 查询所有公司
     */
    public List<Company> findAll() {
        String cypher = """
            MATCH (c:Company)
            RETURN c
            ORDER BY c.name
            """;

        return connectionManager.executeRead(cypher, result -> {
            List<Company> companies = new ArrayList<>();
            while (result.hasNext()) {
                companies.add(mapRecordToCompany(result.next()));
            }
            return companies;
        });
    }

    /**
     * 根据行业查询公司
     */
    public List<Company> findByIndustry(String industry) {
        String cypher = """
            MATCH (c:Company {industry: $industry})
            RETURN c
            ORDER BY c.name
            """;

        return connectionManager.executeRead(cypher, result -> {
            List<Company> companies = new ArrayList<>();
            while (result.hasNext()) {
                companies.add(mapRecordToCompany(result.next()));
            }
            return companies;
        });
    }

    /**
     * 更新公司信息
     */
    public Company update(Company company) {
        String cypher = """
            MATCH (c:Company)
            WHERE id(c) = $id
            SET c.industry = $industry,
                c.location = $location,
                c.employee_count = $employeeCount,
                c.updated_at = datetime()
            RETURN c
            """;

        connectionManager.executeRead(cypher, result -> {
            if (result.hasNext()) {
                return mapRecordToCompany(result.next());
            }
            return null;
        });

        logger.info("更新公司成功: {}", company.getId());
        return company;
    }

    /**
     * 删除公司
     */
    public boolean deleteById(Long id) {
        String cypher = """
            MATCH (c:Company)
            WHERE id(c) = $id
            DETACH DELETE c
            """;

        connectionManager.executeWrite(cypher);
        logger.info("删除公司成功: {}", id);
        return true;
    }

    /**
     * 统计公司数量
     */
    public long count() {
        String cypher = "MATCH (c:Company) RETURN count(c) as count";
        return connectionManager.executeRead(cypher, result -> {
            if (result.hasNext()) {
                return result.next().get("count").asLong();
            }
            return 0L;
        });
    }

    /**
     * 删除所有公司
     */
    public void deleteAll() {
        String cypher = "MATCH (c:Company) DETACH DELETE c";
        connectionManager.executeWrite(cypher);
        logger.info("删除所有公司成功");
    }

    /**
     * 将 Record 映射为 Company 对象
     */
    private Company mapRecordToCompany(Record record) {
        var node = record.get("c").asNode();
        Company company = new Company();
        company.setId(node.id());
        company.setName(node.get("name").asString());
        company.setIndustry(node.get("industry").asString(null));
        company.setLocation(node.get("location").asString(null));
        company.setEmployeeCount(node.get("employee_count").asInt(null));
        return company;
    }
}
