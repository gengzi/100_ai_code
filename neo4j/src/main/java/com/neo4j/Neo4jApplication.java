package com.neo4j;

import com.neo4j.service.GraphService;
import com.neo4j.service.PersonService;
import com.neo4j.service.CompanyService;
import com.neo4j.util.Neo4jConnectionManager;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Neo4j 应用程序主类
 */
public class Neo4jApplication {
    private static final Logger logger = LoggerFactory.getLogger(Neo4jApplication.class);

    public static void main(String[] args) {
        logger.info("========================================");
        logger.info("Neo4j 数据库应用程序启动");
        logger.info("========================================");

        try {
            // 初始化连接管理器
            Neo4jConnectionManager connectionManager = Neo4jConnectionManager.getInstance();
            logger.info("Neo4j 连接管理器初始化成功");

            // 创建服务实例
            GraphService graphService = new GraphService();
            PersonService personService = new PersonService();
            CompanyService companyService = new CompanyService();

            // 运行示例
            runExamples(graphService, personService, companyService);

            logger.info("========================================");
            logger.info("应用程序执行完成");
            logger.info("========================================");

        } catch (Exception e) {
            logger.error("应用程序执行失败", e);
            System.exit(1);
        } finally {
            // 关闭连接
            Neo4jConnectionManager.getInstance().close();
        }
    }

    /**
     * 运行示例代码
     */
    private static void runExamples(GraphService graphService,
                                    PersonService personService,
                                    CompanyService companyService) {
        logger.info("\n--- 开始运行示例 ---\n");

        try {
            // 示例 1: 清空数据库
            logger.info("1. 清空数据库...");
            graphService.clearDatabase();
            logger.info("   数据库已清空\n");

            // 示例 2: 招聘员工
            logger.info("2. 招聘员工到公司...");
            graphService.hireEmployee("张三", "科技公司", "软件工程师", "研发部", 15000);
            graphService.hireEmployee("李四", "科技公司", "产品经理", "产品部", 18000);
            graphService.hireEmployee("王五", "科技公司", "测试工程师", "测试部", 12000);
            graphService.hireEmployee("赵六", "金融公司", "数据分析师", "数据部", 16000);
            logger.info("   员工招聘完成\n");

            // 示例 3: 建立管理关系
            logger.info("3. 建立管理关系...");
            graphService.assignManager("张三", "王五", "直接上级");
            graphService.assignManager("李四", "张三", "部门主管");
            logger.info("   管理关系建立完成\n");

            // 示例 4: 建立朋友关系
            logger.info("4. 建立朋友关系...");
            graphService.befriendPersons("张三", "李四", 8);
            graphService.befriendPersons("张三", "赵六", 6);
            graphService.befriendPersons("李四", "王五", 7);
            logger.info("   朋友关系建立完成\n");

            // 示例 5: 查询员工信息
            logger.info("5. 查询科技公司的员工:");
            var companyEmployees = graphService.getCompanyEmployees("科技公司");
            companyEmployees.forEach(emp -> logger.info("   - {}", emp));
            logger.info("");

            // 示例 6: 查询人员工作信息
            logger.info("6. 查询张三的工作信息:");
            var workInfo = graphService.getPersonWorkInfo("张三");
            workInfo.forEach(info -> logger.info("   - {}", info));
            logger.info("");

            // 示例 7: 查询所有人员
            logger.info("7. 查询所有人员:");
            var allPersons = personService.getAllPersons();
            allPersons.forEach(person -> logger.info("   - {}", person));
            logger.info("");

            // 示例 8: 查询所有公司
            logger.info("8. 查询所有公司:");
            var allCompanies = companyService.getAllCompanies();
            allCompanies.forEach(company -> logger.info("   - {}", company));
            logger.info("");

            // 示例 9: 数据库统计
            logger.info("9. 数据库统计:");
            logger.info("   {}", graphService.getDatabaseStatistics());
            logger.info("");

            // 示例 10: 推荐朋友
            logger.info("10. 为张三推荐朋友:");
            var recommendations = graphService.recommendFriends("张三", 5);
            if (recommendations.isEmpty()) {
                logger.info("   暂无推荐");
            } else {
                recommendations.forEach(rec -> logger.info("   - {}", rec));
            }
            logger.info("");

            logger.info("--- 所有示例执行完成 ---\n");

        } catch (Exception e) {
            logger.error("示例执行失败", e);
        }
    }
}
