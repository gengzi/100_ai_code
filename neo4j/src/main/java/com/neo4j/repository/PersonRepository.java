package com.neo4j.repository;

import com.neo4j.model.Person;
import com.neo4j.util.Neo4jConnectionManager;
import org.neo4j.driver.Record;
import org.neo4j.driver.Result;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/**
 * Person 数据访问层
 */
public class PersonRepository {
    private static final Logger logger = LoggerFactory.getLogger(PersonRepository.class);
    private final Neo4jConnectionManager connectionManager;

    public PersonRepository() {
        this.connectionManager = Neo4jConnectionManager.getInstance();
    }

    public PersonRepository(Neo4jConnectionManager connectionManager) {
        this.connectionManager = connectionManager;
    }

    /**
     * 创建人员节点
     */
    public Person create(Person person) {
        String cypher = """
            CREATE (p:Person {
                name: $name,
                email: $email,
                age: $age,
                phone: $phone,
                created_at: datetime(),
                updated_at: datetime()
            })
            RETURN p
            """;

        connectionManager.executeRead(cypher, result -> {
            if (result.hasNext()) {
                Record record = result.next();
                person.setId(record.get("p").asNode().id());
            }
            return null;
        });

        logger.info("创建人员成功: {}", person.getName());
        return person;
    }

    /**
     * 根据 ID 查询人员
     */
    public Optional<Person> findById(Long id) {
        String cypher = """
            MATCH (p:Person)
            WHERE id(p) = $id
            RETURN p
            """;

        return connectionManager.executeRead(cypher, result -> {
            if (result.hasNext()) {
                return Optional.of(mapRecordToPerson(result.next()));
            }
            return Optional.empty();
        });
    }

    /**
     * 根据名称查询人员
     */
    public Optional<Person> findByName(String name) {
        String cypher = """
            MATCH (p:Person {name: $name})
            RETURN p
            """;

        return connectionManager.executeRead(cypher, result -> {
            if (result.hasNext()) {
                return Optional.of(mapRecordToPerson(result.next()));
            }
            return Optional.empty();
        });
    }

    /**
     * 查询所有人员
     */
    public List<Person> findAll() {
        String cypher = """
            MATCH (p:Person)
            RETURN p
            ORDER BY p.name
            """;

        return connectionManager.executeRead(cypher, result -> {
            List<Person> persons = new ArrayList<>();
            while (result.hasNext()) {
                persons.add(mapRecordToPerson(result.next()));
            }
            return persons;
        });
    }

    /**
     * 更新人员信息
     */
    public Person update(Person person) {
        String cypher = """
            MATCH (p:Person)
            WHERE id(p) = $id
            SET p.email = $email,
                p.age = $age,
                p.phone = $phone,
                p.updated_at = datetime()
            RETURN p
            """;

        connectionManager.executeRead(cypher, result -> {
            if (result.hasNext()) {
                return mapRecordToPerson(result.next());
            }
            return null;
        });

        logger.info("更新人员成功: {}", person.getId());
        return person;
    }

    /**
     * 删除人员
     */
    public boolean deleteById(Long id) {
        String cypher = """
            MATCH (p:Person)
            WHERE id(p) = $id
            DETACH DELETE p
            """;

        connectionManager.executeWrite(cypher);
        logger.info("删除人员成功: {}", id);
        return true;
    }

    /**
     * 统计人员数量
     */
    public long count() {
        String cypher = "MATCH (p:Person) RETURN count(p) as count";
        return connectionManager.executeRead(cypher, result -> {
            if (result.hasNext()) {
                return result.next().get("count").asLong();
            }
            return 0L;
        });
    }

    /**
     * 删除所有人员
     */
    public void deleteAll() {
        String cypher = "MATCH (p:Person) DETACH DELETE p";
        connectionManager.executeWrite(cypher);
        logger.info("删除所有人员成功");
    }

    /**
     * 将 Record 映射为 Person 对象
     */
    private Person mapRecordToPerson(Record record) {
        var node = record.get("p").asNode();
        Person person = new Person();
        person.setId(node.id());
        person.setName(node.get("name").asString());
        person.setEmail(node.get("email").asString(null));
        person.setAge(node.get("age").asInt(null));
        person.setPhone(node.get("phone").asString(null));
        return person;
    }
}
