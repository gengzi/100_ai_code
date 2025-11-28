package com.geo.platform.repository;

import com.geo.platform.model.OptimizationRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface OptimizationRecordRepository extends JpaRepository<OptimizationRecord, Long> {

    /**
     * 根据optimizationId查找记录
     */
    Optional<OptimizationRecord> findByOptimizationId(String optimizationId);

    /**
     * 查找最近的N条记录
     */
    @Query("SELECT o FROM OptimizationRecord o ORDER BY o.createdAt DESC")
    List<OptimizationRecord> findRecentRecords();

    /**
     * 根据标题模糊搜索
     */
    @Query("SELECT o FROM OptimizationRecord o WHERE o.title IS NOT NULL AND LOWER(o.title) LIKE LOWER(CONCAT('%', :title, '%')) ORDER BY o.createdAt DESC")
    List<OptimizationRecord> findByTitleContaining(@Param("title") String title);

    /**
     * 根据目标查询模糊搜索
     */
    @Query("SELECT o FROM OptimizationRecord o WHERE LOWER(o.targetQuery) LIKE LOWER(CONCAT('%', :query, '%')) ORDER BY o.createdAt DESC")
    List<OptimizationRecord> findByTargetQueryContaining(@Param("query") String query);

    /**
     * 获取所有记录，按创建时间倒序
     */
    List<OptimizationRecord> findAllByOrderByCreatedAtDesc();

    /**
     * 检查optimizationId是否已存在
     */
    boolean existsByOptimizationId(String optimizationId);
}