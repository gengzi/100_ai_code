package com.neo4j.model;

/**
 * 关系类型常量定义
 */
public class RelationshipTypes {
    /**
     * 工作关系: Person -> WORKS_AT -> Company
     */
    public static final String WORKS_AT = "WORKS_AT";

    /**
     * 管理关系: Person -> MANAGES -> Person
     */
    public static final String MANAGES = "MANAGES";

    /**
     * 同事关系: Person -> COLLEAGUE -> Person
     */
    public static final String COLLEAGUE = "COLLEAGUE";

    /**
     * 朋友关系: Person -> FRIEND_OF -> Person
     */
    public static final String FRIEND_OF = "FRIEND_OF";

    /**
     * 合作关系: Company -> PARTNERS_WITH -> Company
     */
    public static final String PARTNERS_WITH = "PARTNERS_WITH";

    private RelationshipTypes() {
        // 私有构造函数防止实例化
    }
}
