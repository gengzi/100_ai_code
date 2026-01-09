package com.easyloan.loanuser.model;

public class UserEntity {

    private String userId;
    private String name;
    private int age;
    private String kycLevel;
    private String city;
    private int monthlyIncome;

    public UserEntity() {
    }

    public UserEntity(String userId, String name, int age, String kycLevel, String city, int monthlyIncome) {
        this.userId = userId;
        this.name = name;
        this.age = age;
        this.kycLevel = kycLevel;
        this.city = city;
        this.monthlyIncome = monthlyIncome;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public int getAge() {
        return age;
    }

    public void setAge(int age) {
        this.age = age;
    }

    public String getKycLevel() {
        return kycLevel;
    }

    public void setKycLevel(String kycLevel) {
        this.kycLevel = kycLevel;
    }

    public String getCity() {
        return city;
    }

    public void setCity(String city) {
        this.city = city;
    }

    public int getMonthlyIncome() {
        return monthlyIncome;
    }

    public void setMonthlyIncome(int monthlyIncome) {
        this.monthlyIncome = monthlyIncome;
    }
}
