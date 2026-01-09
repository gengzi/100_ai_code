package com.neo4j.service;

import com.neo4j.model.Company;
import com.neo4j.repository.CompanyRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.List;
import java.util.Optional;

/**
 * Company 业务逻辑层
 */
public class CompanyService {
    private static final Logger logger = LoggerFactory.getLogger(CompanyService.class);
    private final CompanyRepository companyRepository;

    public CompanyService() {
        this.companyRepository = new CompanyRepository();
    }

    public CompanyService(CompanyRepository companyRepository) {
        this.companyRepository = companyRepository;
    }

    /**
     * 创建公司
     */
    public Company createCompany(Company company) {
        if (company.getName() == null || company.getName().trim().isEmpty()) {
            throw new IllegalArgumentException("公司名称不能为空");
        }

        // 检查是否已存在同名公司
        Optional<Company> existing = companyRepository.findByName(company.getName());
        if (existing.isPresent()) {
            logger.warn("公司已存在: {}", company.getName());
            return existing.get();
        }

        return companyRepository.create(company);
    }

    /**
     * 根据 ID 获取公司
     */
    public Optional<Company> getCompanyById(Long id) {
        if (id == null || id <= 0) {
            throw new IllegalArgumentException("无效的公司 ID");
        }
        return companyRepository.findById(id);
    }

    /**
     * 根据名称获取公司
     */
    public Optional<Company> getCompanyByName(String name) {
        if (name == null || name.trim().isEmpty()) {
            throw new IllegalArgumentException("公司名称不能为空");
        }
        return companyRepository.findByName(name);
    }

    /**
     * 获取所有公司
     */
    public List<Company> getAllCompanies() {
        return companyRepository.findAll();
    }

    /**
     * 根据行业获取公司
     */
    public List<Company> getCompaniesByIndustry(String industry) {
        if (industry == null || industry.trim().isEmpty()) {
            throw new IllegalArgumentException("行业名称不能为空");
        }
        return companyRepository.findByIndustry(industry);
    }

    /**
     * 更新公司信息
     */
    public Company updateCompany(Long id, Company company) {
        if (id == null || id <= 0) {
            throw new IllegalArgumentException("无效的公司 ID");
        }

        Optional<Company> existing = companyRepository.findById(id);
        if (existing.isEmpty()) {
            throw new RuntimeException("公司不存在: " + id);
        }

        company.setId(id);
        return companyRepository.update(company);
    }

    /**
     * 删除公司
     */
    public boolean deleteCompany(Long id) {
        if (id == null || id <= 0) {
            throw new IllegalArgumentException("无效的公司 ID");
        }

        Optional<Company> existing = companyRepository.findById(id);
        if (existing.isEmpty()) {
            logger.warn("尝试删除不存在的公司: {}", id);
            return false;
        }

        return companyRepository.deleteById(id);
    }

    /**
     * 统计公司数量
     */
    public long countCompanies() {
        return companyRepository.count();
    }

    /**
     * 批量创建公司
     */
    public void createCompaniesBatch(List<Company> companies) {
        if (companies == null || companies.isEmpty()) {
            throw new IllegalArgumentException("公司列表不能为空");
        }

        logger.info("开始批量创建 {} 个公司", companies.size());
        for (Company company : companies) {
            try {
                createCompany(company);
            } catch (Exception e) {
                logger.error("创建公司失败: {}", company.getName(), e);
            }
        }
        logger.info("批量创建完成");
    }

    /**
     * 搜索公司(按名称或行业模糊匹配)
     */
    public List<Company> searchCompanies(String keyword) {
        return companyRepository.findAll().stream()
                .filter(c -> (c.getName() != null && c.getName().contains(keyword)) ||
                            (c.getIndustry() != null && c.getIndustry().contains(keyword)))
                .toList();
    }
}
