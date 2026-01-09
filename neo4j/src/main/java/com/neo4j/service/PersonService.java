package com.neo4j.service;

import com.neo4j.model.Person;
import com.neo4j.repository.PersonRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.List;
import java.util.Optional;

/**
 * Person 业务逻辑层
 */
public class PersonService {
    private static final Logger logger = LoggerFactory.getLogger(PersonService.class);
    private final PersonRepository personRepository;

    public PersonService() {
        this.personRepository = new PersonRepository();
    }

    public PersonService(PersonRepository personRepository) {
        this.personRepository = personRepository;
    }

    /**
     * 创建人员
     */
    public Person createPerson(Person person) {
        if (person.getName() == null || person.getName().trim().isEmpty()) {
            throw new IllegalArgumentException("人员姓名不能为空");
        }

        // 检查是否已存在同名人员
        Optional<Person> existing = personRepository.findByName(person.getName());
        if (existing.isPresent()) {
            logger.warn("人员已存在: {}", person.getName());
            return existing.get();
        }

        return personRepository.create(person);
    }

    /**
     * 根据 ID 获取人员
     */
    public Optional<Person> getPersonById(Long id) {
        if (id == null || id <= 0) {
            throw new IllegalArgumentException("无效的人员 ID");
        }
        return personRepository.findById(id);
    }

    /**
     * 根据名称获取人员
     */
    public Optional<Person> getPersonByName(String name) {
        if (name == null || name.trim().isEmpty()) {
            throw new IllegalArgumentException("人员姓名不能为空");
        }
        return personRepository.findByName(name);
    }

    /**
     * 获取所有人员
     */
    public List<Person> getAllPersons() {
        return personRepository.findAll();
    }

    /**
     * 更新人员信息
     */
    public Person updatePerson(Long id, Person person) {
        if (id == null || id <= 0) {
            throw new IllegalArgumentException("无效的人员 ID");
        }

        Optional<Person> existing = personRepository.findById(id);
        if (existing.isEmpty()) {
            throw new RuntimeException("人员不存在: " + id);
        }

        person.setId(id);
        return personRepository.update(person);
    }

    /**
     * 删除人员
     */
    public boolean deletePerson(Long id) {
        if (id == null || id <= 0) {
            throw new IllegalArgumentException("无效的人员 ID");
        }

        Optional<Person> existing = personRepository.findById(id);
        if (existing.isEmpty()) {
            logger.warn("尝试删除不存在的人员: {}", id);
            return false;
        }

        return personRepository.deleteById(id);
    }

    /**
     * 统计人员数量
     */
    public long countPersons() {
        return personRepository.count();
    }

    /**
     * 批量创建人员
     */
    public void createPersonsBatch(List<Person> persons) {
        if (persons == null || persons.isEmpty()) {
            throw new IllegalArgumentException("人员列表不能为空");
        }

        logger.info("开始批量创建 {} 个人员", persons.size());
        for (Person person : persons) {
            try {
                createPerson(person);
            } catch (Exception e) {
                logger.error("创建人员失败: {}", person.getName(), e);
            }
        }
        logger.info("批量创建完成");
    }

    /**
     * 搜索人员(按姓名模糊匹配)
     */
    public List<Person> searchPersons(String keyword) {
        // 这里可以扩展更复杂的搜索逻辑
        return personRepository.findAll().stream()
                .filter(p -> p.getName() != null && p.getName().contains(keyword))
                .toList();
    }
}
