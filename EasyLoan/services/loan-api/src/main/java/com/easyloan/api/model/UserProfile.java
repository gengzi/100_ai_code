package com.easyloan.api.model;

public class UserProfile {

    private String userId;
    private String name;
    private String kycLevel;

    public UserProfile() {
    }

    public UserProfile(String userId, String name, String kycLevel) {
        this.userId = userId;
        this.name = name;
        this.kycLevel = kycLevel;
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

    public String getKycLevel() {
        return kycLevel;
    }

    public void setKycLevel(String kycLevel) {
        this.kycLevel = kycLevel;
    }
}
