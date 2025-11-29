package com.geo.platform.repository;

import com.geo.platform.model.Content;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ContentRepository extends JpaRepository<Content, Long> {

    /**
     * 根据optimizationId查找内容记录
     */
    List<Content> findByOptimizationId(String optimizationId);

    /**
     * 根据status查找内容记录
     */
    List<Content> findByStatus(String status);

    /**
     * 根据platformType查找内容记录
     */
    List<Content> findByPlatformType(String platformType);

    /**
     * 查找最近的N条优化记录
     */
    @Query("SELECT c FROM Content c WHERE c.status = 'OPTIMIZED' ORDER BY c.createdAt DESC")
    List<Content> findRecentOptimizedContent();

    /**
     * 获取所有不同的optimizationId
     */
    @Query("SELECT DISTINCT c.optimizationId FROM Content c WHERE c.optimizationId IS NOT NULL ORDER BY c.optimizationId DESC")
    List<String> findAllOptimizationIds();

    /**
     * 根据标题模糊搜索
     */
    @Query("SELECT c FROM Content c WHERE c.title IS NOT NULL AND LOWER(c.title) LIKE LOWER(CONCAT('%', :title, '%')) ORDER BY c.createdAt DESC")
    List<Content> findByTitleContaining(@Param("title") String title);
}