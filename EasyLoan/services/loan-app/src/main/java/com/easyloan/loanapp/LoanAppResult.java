package com.easyloan.loanapp;

public class LoanAppResult {

    private String userId;
    private boolean riskPass;
    private int creditLimit;
    private String orderId;
    private String fundingChannel;
    private String notifyChannel;

    public LoanAppResult() {
    }

    public LoanAppResult(String userId, boolean riskPass, int creditLimit, String orderId,
                         String fundingChannel, String notifyChannel) {
        this.userId = userId;
        this.riskPass = riskPass;
        this.creditLimit = creditLimit;
        this.orderId = orderId;
        this.fundingChannel = fundingChannel;
        this.notifyChannel = notifyChannel;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public boolean isRiskPass() {
        return riskPass;
    }

    public void setRiskPass(boolean riskPass) {
        this.riskPass = riskPass;
    }

    public int getCreditLimit() {
        return creditLimit;
    }

    public void setCreditLimit(int creditLimit) {
        this.creditLimit = creditLimit;
    }

    public String getOrderId() {
        return orderId;
    }

    public void setOrderId(String orderId) {
        this.orderId = orderId;
    }

    public String getFundingChannel() {
        return fundingChannel;
    }

    public void setFundingChannel(String fundingChannel) {
        this.fundingChannel = fundingChannel;
    }

    public String getNotifyChannel() {
        return notifyChannel;
    }

    public void setNotifyChannel(String notifyChannel) {
        this.notifyChannel = notifyChannel;
    }
}
