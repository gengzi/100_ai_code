package com.easyloan.api.model;

public class RiskDecision {

    private String userId;
    private boolean pass;
    private String reason;

    public RiskDecision() {
    }

    public RiskDecision(String userId, boolean pass, String reason) {
        this.userId = userId;
        this.pass = pass;
        this.reason = reason;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public boolean isPass() {
        return pass;
    }

    public void setPass(boolean pass) {
        this.pass = pass;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }
}
