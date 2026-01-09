# Neo4j 数据库项目

基于 Java 和 Neo4j 的图数据库项目,实现了人员、公司及其关系的完整管理。

## 项目特性

- ✅ 完整的三层架构设计(Controller-Service-Repository)
- ✅ Neo4j 图数据库连接管理
- ✅ 节点和关系的增删改查
- ✅ 复杂的图查询操作(路径查找、推荐算法等)
- ✅ 批量操作支持
- ✅ 事务管理
- ✅ 示例代码和测试用例

## 技术栈

- **Java**: 17
- **构建工具**: Maven
- **数据库**: Neo4j 5.x
- **驱动**: Neo4j Java Driver 5.23.0
- **日志**: SLF4J + Logback

## 项目结构

```
neo4j-database/
├── src/main/java/com/neo4j/
│   ├── config/                    # 配置层
│   │   └── Neo4jConfig.java       # Neo4j 连接配置
│   ├── model/                     # 实体模型层
│   │   ├── Person.java            # 人员节点
│   │   ├── Company.java           # 公司节点
│   │   ├── WorkRelationship.java  # 工作关系
│   │   └── RelationshipTypes.java # 关系类型常量
│   ├── repository/                # 数据访问层
│   │   ├── PersonRepository.java
│   │   ├── CompanyRepository.java
│   │   └── RelationshipRepository.java
│   ├── service/                   # 业务逻辑层
│   │   ├── PersonService.java
│   │   ├── CompanyService.java
│   │   └── GraphService.java
│   ├── util/                      # 工具类
│   │   └── Neo4jConnectionManager.java  # 连接管理器
│   ├── example/                   # 示例代码
│   │   ├── AdvancedQueryExample.java
│   │   └── BatchOperationExample.java
│   └── Neo4jApplication.java      # 主应用程序
├── src/main/resources/
│   └── logback.xml                # 日志配置
├── .env                           # 环境变量配置
├── .env.example                   # 环境变量示例
├── .gitignore
└── pom.xml                        # Maven 配置
```

## 快速开始

### 1. 安装 Neo4j

#### Windows:
```bash
# 使用 Chocolatey
choco install neo4j

# 或从官网下载安装包
# https://neo4j.com/download/
```

#### Linux/Mac:
```bash
# 使用 Homebrew (Mac)
brew install neo4j

# 或使用 Docker
docker run \
    --name neo4j \
    -p 7474:7474 -p 7687:7687 \
    -e NEO4J_AUTH=neo4j/12345678 \
    neo4j:latest
```

### 2. 启动 Neo4j

```bash
# Windows
neo4j.bat console

# Linux/Mac
neo4j console

# Docker
docker start neo4j
```

访问 Neo4j Browser: http://localhost:7474

### 3. 配置项目

编辑 `.env` 文件,配置数据库连接信息:

```properties
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=12345678
NEO4J_DATABASE=neo4j
```

### 4. 编译项目

```bash
mvn clean compile
```

### 5. 运行主程序

```bash
mvn exec:java -Dexec.mainClass="com.neo4j.Neo4jApplication"
```

### 6. 运行示例程序

```bash
# 高级查询示例
mvn exec:java -Dexec.mainClass="com.neo4j.example.AdvancedQueryExample"

# 批量操作示例
mvn exec:java -Dexec.mainClass="com.neo4j.example.BatchOperationExample"
```

## 核心功能

### 1. 节点管理

#### 创建人员
```java
Person person = new Person("张三", "zhangsan@example.com", 30);
personService.createPerson(person);
```

#### 创建公司
```java
Company company = new Company("科技公司", "互联网", "北京");
companyService.createCompany(company);
```

### 2. 关系管理

#### 创建工作关系
```java
graphService.hireEmployee(
    "张三",           // 姓名
    "科技公司",       // 公司名
    "软件工程师",     // 职位
    "研发部",         // 部门
    15000            // 薪资
);
```

#### 创建朋友关系
```java
graphService.befriendPersons("张三", "李四", 8);
```

#### 创建管理关系
```java
graphService.assignManager("张三", "王五", "直接上级");
```

### 3. 图查询

#### 查询人员工作信息
```java
List<String> workInfo = graphService.getPersonWorkInfo("张三");
```

#### 查询公司员工
```java
List<String> employees = graphService.getCompanyEmployees("科技公司");
```

#### 查找最短路径
```java
String path = graphService.findRelationshipPath("张三", "李四");
```

#### 推荐朋友
```java
List<String> recommendations = graphService.recommendFriends("张三", 5);
```

## 数据模型

### 节点类型

#### Person (人员)
- `id`: 节点ID
- `name`: 姓名
- `email`: 邮箱
- `age`: 年龄
- `phone`: 电话
- `created_at`: 创建时间
- `updated_at`: 更新时间

#### Company (公司)
- `id`: 节点ID
- `name`: 公司名称
- `industry`: 行业
- `location`: 地点
- `employee_count`: 员工数量
- `created_at`: 创建时间
- `updated_at`: 更新时间

### 关系类型

#### WORKS_AT (工作关系)
- `position`: 职位
- `department`: 部门
- `salary`: 薪资
- `start_date`: 开始日期
- `status`: 状态(ACTIVE/TERMINATED/RESIGNED)

#### MANAGES (管理关系)
- `level`: 管理层级
- `since`: 开始时间

#### FRIEND_OF (朋友关系)
- `closeness`: 亲密程度(1-10)
- `since`: 建立时间

#### COLLEAGUE (同事关系)
- `since`: 开始时间

## 高级查询示例

### 1. 查询朋友网络
```cypher
MATCH (p:Person {name: '张三'})-[:FRIEND_OF*1..2]-(friend:Person)
RETURN DISTINCT friend.name
```

### 2. 统计公司员工数
```cypher
MATCH (c:Company)<-[:WORKS_AT]-(p:Person)
RETURN c.name, count(p) as employeeCount
ORDER BY employeeCount DESC
```

### 3. 查找共同好友
```cypher
MATCH (p1:Person {name: '张三'})-[:FRIEND_OF]->(friend)-[:FRIEND_OF]->(p2:Person)
WHERE p1 <> p2
RETURN p2.name, count(friend) as mutualFriends
ORDER BY mutualFriends DESC
```

### 4. 查找最短路径
```cypher
MATCH path = shortestPath(
  (p1:Person)-[:FRIEND_OF*]-(p2:Person)
)
WHERE p1.name = '张三' AND p2.name = '李四'
RETURN path
```

## 配置说明

### 连接池配置

```properties
# 最大连接池大小
MAX_CONNECTION_POOL_SIZE=50

# 连接获取超时时间(秒)
CONNECTION_ACQUISITION_TIMEOUT=60

# 最大事务重试时间(秒)
MAX_TRANSACTION_RETRY_TIME=30
```

### 日志配置

日志配置位于 `src/main/resources/logback.xml`:

- 日志级别: DEBUG
- 控制台输出: 彩色日志
- 文件输出: `logs/neo4j-app.log`

## 常见问题

### 1. 连接失败
**问题**: 无法连接到 Neo4j 数据库

**解决方案**:
- 确认 Neo4j 服务已启动
- 检查 `.env` 文件配置是否正确
- 验证端口 7687 是否被占用

### 2. 认证失败
**问题**: 用户名或密码错误

**解决方案**:
- 检查 `.env` 中的 `NEO4J_USER` 和 `NEO4J_PASSWORD`
- 确认 Neo4j 使用的认证密码

### 3. 编译错误
**问题**: Maven 依赖下载失败

**解决方案**:
```bash
# 清理并重新下载依赖
mvn clean install -U

# 使用阿里云镜像(可选)
# 在 settings.xml 中配置镜像源
```

## 性能优化建议

1. **索引优化**: 为常用查询字段创建索引
```cypher
CREATE INDEX ON :Person(name);
CREATE INDEX ON :Company(name);
```

2. **批量操作**: 使用批量插入而非逐条插入

3. **查询优化**: 使用 `PROFILE` 分析查询性能
```cypher
PROFILE MATCH (p:Person) RETURN p;
```

4. **连接池**: 根据负载调整连接池大小

## 扩展功能建议

- [ ] 添加 REST API 接口(Spring Boot)
- [ ] 实现数据导入导出功能
- [ ] 添加图可视化展示
- [ ] 实现更多推荐算法
- [ ] 添加缓存机制
- [ ] 实现数据分析和报表

## 参考文档

- [Neo4j 官方文档](https://neo4j.com/docs/)
- [Neo4j Java Driver 文档](https://neo4j.com/docs/java-manual/current/)
- [Cypher 查询语言](https://neo4j.com/docs/cypher-manual/current/)

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request!

## 联系方式

如有问题,请通过 Issue 联系。
