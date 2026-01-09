package com.easyloan.api.model;

public class CreditDecision {

    private String userId;
    private int score;
    private int creditLimit;

    public CreditDecision() {
    }

    public CreditDecision(String userId, int score, int creditLimit) {
        this.userId = userId;
        this.score = score;
        this.creditLimit = creditLimit;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public int getScore() {
        return score;
    }

    public void setScore(int score) {
        this.score = score;
    }

    public int getCreditLimit() {
        return creditLimit;
    }

    public void setCreditLimit(int creditLimit) {
        this.creditLimit = creditLimit;
    }
}
