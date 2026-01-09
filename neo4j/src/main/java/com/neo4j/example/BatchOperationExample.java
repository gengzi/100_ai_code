package com.neo4j.example;

import com.neo4j.model.Person;
import com.neo4j.model.Company;
import com.neo4j.service.PersonService;
import com.neo4j.service.CompanyService;
import com.neo4j.util.Neo4jConnectionManager;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.ArrayList;
import java.util.List;

/**
 * 批量操作示例
 */
public class BatchOperationExample {
    private static final Logger logger = LoggerFactory.getLogger(BatchOperationExample.class);

    public static void main(String[] args) {
        logger.info("批量操作示例启动");

        try {
            Neo4jConnectionManager connectionManager = Neo4jConnectionManager.getInstance();
            PersonService personService = new PersonService();
            CompanyService companyService = new CompanyService();

            // 运行批量操作示例
            runBatchOperations(personService, companyService);

        } catch (Exception e) {
            logger.error("执行失败", e);
        } finally {
            Neo4jConnectionManager.getInstance().close();
        }
    }

    private static void runBatchOperations(PersonService personService, CompanyService companyService) {
        logger.info("\n=== 批量创建人员 ===");

        // 创建批量人员数据
        List<Person> persons = new ArrayList<>();
        for (int i = 1; i <= 10; i++) {
            Person person = new Person("员工" + i, "employee" + i + "@example.com", 25 + i);
            persons.add(person);
        }

        // 批量创建
        long startTime = System.currentTimeMillis();
        personService.createPersonsBatch(persons);
        long endTime = System.currentTimeMillis();

        logger.info("批量创建 {} 个人员完成,耗时: {} ms", persons.size(), endTime - startTime);
        logger.info("当前人员总数: {}", personService.countPersons());

        logger.info("\n=== 批量创建公司 ===");

        // 创建批量公司数据
        List<Company> companies = new ArrayList<>();
        String[] industries = {"互联网", "金融", "教育", "医疗", "制造业"};
        for (int i = 1; i <= 5; i++) {
            Company company = new Company("公司" + i, industries[i - 1], "北京");
            companies.add(company);
        }

        // 批量创建
        startTime = System.currentTimeMillis();
        companyService.createCompaniesBatch(companies);
        endTime = System.currentTimeMillis();

        logger.info("批量创建 {} 个公司完成,耗时: {} ms", companies.size(), endTime - startTime);
        logger.info("当前公司总数: {}", companyService.countCompanies());

        logger.info("\n=== 批量操作示例完成 ===\n");
    }
}
