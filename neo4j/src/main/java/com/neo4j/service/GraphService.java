package com.neo4j.service;

import com.neo4j.model.Person;
import com.neo4j.model.Company;
import com.neo4j.repository.PersonRepository;
import com.neo4j.repository.CompanyRepository;
import com.neo4j.repository.RelationshipRepository;
import org.neo4j.driver.Record;
import org.neo4j.driver.Result;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/**
 * 图数据库业务逻辑层
 * 处理节点和关系的复杂操作
 */
public class GraphService {
    private static final Logger logger = LoggerFactory.getLogger(GraphService.class);
    private final PersonRepository personRepository;
    private final CompanyRepository companyRepository;
    private final RelationshipRepository relationshipRepository;

    public GraphService() {
        this.personRepository = new PersonRepository();
        this.companyRepository = new CompanyRepository();
        this.relationshipRepository = new RelationshipRepository();
    }

    public GraphService(PersonRepository personRepository,
                        CompanyRepository companyRepository,
                        RelationshipRepository relationshipRepository) {
        this.personRepository = personRepository;
        this.companyRepository = companyRepository;
        this.relationshipRepository = relationshipRepository;
    }

    /**
     * 招聘员工(创建人员和工作关系)
     */
    public void hireEmployee(String personName, String companyName,
                             String position, String department, Integer salary) {
        // 查找或创建人员
        Optional<Person> personOpt = personRepository.findByName(personName);
        Person person;
        if (personOpt.isEmpty()) {
            person = new Person(personName);
            personRepository.create(person);
            logger.info("创建新人员: {}", personName);
        } else {
            person = personOpt.get();
        }

        // 查找或创建公司
        Optional<Company> companyOpt = companyRepository.findByName(companyName);
        Company company;
        if (companyOpt.isEmpty()) {
            company = new Company(companyName);
            companyRepository.create(company);
            logger.info("创建新公司: {}", companyName);
        } else {
            company = companyOpt.get();
        }

        // 创建工作关系
        relationshipRepository.createWorkRelationship(
                person.getId(),
                company.getId(),
                position,
                department,
                salary
        );

        logger.info("{} 已加入 {} 担任 {}", personName, companyName, position);
    }

    /**
     * 员工离职(更新工作关系状态)
     */
    public void employeeResign(Long personId, Long companyId) {
        // 这里可以扩展更复杂的离职逻辑
        relationshipRepository.deleteRelationship(personId, companyId, "WORKS_AT");
        logger.info("员工 {} 从公司 {} 离职", personId, companyId);
    }

    /**
     * 建立朋友关系
     */
    public void befriendPersons(String personName1, String personName2, Integer closeness) {
        Optional<Person> p1 = personRepository.findByName(personName1);
        Optional<Person> p2 = personRepository.findByName(personName2);

        if (p1.isEmpty() || p2.isEmpty()) {
            throw new RuntimeException("人员不存在");
        }

        relationshipRepository.createFriendRelationship(p1.get().getId(), p2.get().getId(), closeness);
        logger.info("{} 和 {} 建立朋友关系", personName1, personName2);
    }

    /**
     * 建立管理关系
     */
    public void assignManager(String managerName, String subordinateName, String level) {
        Optional<Person> manager = personRepository.findByName(managerName);
        Optional<Person> subordinate = personRepository.findByName(subordinateName);

        if (manager.isEmpty() || subordinate.isEmpty()) {
            throw new RuntimeException("人员不存在");
        }

        relationshipRepository.createManagementRelationship(
                manager.get().getId(),
                subordinate.get().getId(),
                level
        );

        logger.info("{} 成为 {} 的管理者", managerName, subordinateName);
    }

    /**
     * 查询人员的工作关系
     */
    public List<String> getPersonWorkInfo(String personName) {
        Optional<Person> person = personRepository.findByName(personName);
        if (person.isEmpty()) {
            throw new RuntimeException("人员不存在: " + personName);
        }

        Result result = relationshipRepository.findPersonWorkRelationships(person.get().getId());
        List<String> workInfo = new ArrayList<>();

        while (result.hasNext()) {
            Record record = result.next();
            var p = record.get("p").asNode();
            var c = record.get("c").asNode();
            var r = record.get("r").asRelationship();

            workInfo.add(String.format("%s 在 %s 担任 %s (部门: %s)",
                    p.get("name").asString(),
                    c.get("name").asString(),
                    r.get("position").asString(),
                    r.get("department").asString()
            ));
        }

        return workInfo;
    }

    /**
     * 查询公司的员工
     */
    public List<String> getCompanyEmployees(String companyName) {
        Optional<Company> company = companyRepository.findByName(companyName);
        if (company.isEmpty()) {
            throw new RuntimeException("公司不存在: " + companyName);
        }

        Result result = relationshipRepository.findCompanyEmployees(company.get().getId());
        List<String> employees = new ArrayList<>();

        while (result.hasNext()) {
            Record record = result.next();
            var p = record.get("p").asNode();
            var r = record.get("r").asRelationship();

            employees.add(String.format("%s - %s (部门: %s)",
                    p.get("name").asString(),
                    r.get("position").asString(),
                    r.get("department").asString()
            ));
        }

        return employees;
    }

    /**
     * 查询两个人员之间的关系路径
     */
    public String findRelationshipPath(String personName1, String personName2) {
        Optional<Person> p1 = personRepository.findByName(personName1);
        Optional<Person> p2 = personRepository.findByName(personName2);

        if (p1.isEmpty() || p2.isEmpty()) {
            throw new RuntimeException("人员不存在");
        }

        Result result = relationshipRepository.findShortestPath(
                p1.get().getId(),
                p2.get().getId(),
                "FRIEND_OF"
        );

        if (result.hasNext()) {
            return String.format("找到 %s 和 %s 之间的连接路径", personName1, personName2);
        } else {
            return String.format("%s 和 %s 之间没有找到连接路径", personName1, personName2);
        }
    }

    /**
     * 推荐潜在朋友
     */
    public List<String> recommendFriends(String personName, int limit) {
        Optional<Person> person = personRepository.findByName(personName);
        if (person.isEmpty()) {
            throw new RuntimeException("人员不存在: " + personName);
        }

        Result result = relationshipRepository.recommendConnections(person.get().getId(), limit);
        List<String> recommendations = new ArrayList<>();

        while (result.hasNext()) {
            Record record = result.next();
            String name = record.get("name").asString();
            long mutualFriends = record.get("mutualFriends").asLong();
            recommendations.add(String.format("%s (共同好友: %d)", name, mutualFriends));
        }

        return recommendations;
    }

    /**
     * 清空数据库(谨慎使用)
     */
    public void clearDatabase() {
        logger.warn("清空所有数据");
        personRepository.deleteAll();
        companyRepository.deleteAll();
    }

    /**
     * 获取数据库统计信息
     */
    public String getDatabaseStatistics() {
        long personCount = personRepository.count();
        long companyCount = companyRepository.count();

        return String.format("数据库统计 - 人员: %d, 公司: %d", personCount, companyCount);
    }
}
