package com.neo4j.model;

import java.time.LocalDateTime;
import java.util.Objects;

/**
 * 工作关系实体
 * Person -[WORKS_AT]-> Company
 */
public class WorkRelationship {
    private String position;
    private String department;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private Integer salary;
    private String status; // ACTIVE, TERMINATED, RESIGNED

    public WorkRelationship() {
    }

    public WorkRelationship(String position, String department) {
        this.position = position;
        this.department = department;
        this.startDate = LocalDateTime.now();
        this.status = "ACTIVE";
    }

    // Getters and Setters
    public String getPosition() {
        return position;
    }

    public void setPosition(String position) {
        this.position = position;
    }

    public String getDepartment() {
        return department;
    }

    public void setDepartment(String department) {
        this.department = department;
    }

    public LocalDateTime getStartDate() {
        return startDate;
    }

    public void setStartDate(LocalDateTime startDate) {
        this.startDate = startDate;
    }

    public LocalDateTime getEndDate() {
        return endDate;
    }

    public void setEndDate(LocalDateTime endDate) {
        this.endDate = endDate;
    }

    public Integer getSalary() {
        return salary;
    }

    public void setSalary(Integer salary) {
        this.salary = salary;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        WorkRelationship that = (WorkRelationship) o;
        return Objects.equals(position, that.position) &&
                Objects.equals(department, that.department);
    }

    @Override
    public int hashCode() {
        return Objects.hash(position, department);
    }

    @Override
    public String toString() {
        return "WorkRelationship{" +
                "position='" + position + '\'' +
                ", department='" + department + '\'' +
                ", startDate=" + startDate +
                ", endDate=" + endDate +
                ", salary=" + salary +
                ", status='" + status + '\'' +
                '}';
    }
}
