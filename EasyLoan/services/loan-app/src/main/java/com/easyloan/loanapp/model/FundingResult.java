package com.easyloan.loanapp.model;

public class FundingResult {

    private String orderId;
    private String channel;
    private String status;

    public FundingResult() {
    }

    public FundingResult(String orderId, String channel, String status) {
        this.orderId = orderId;
        this.channel = channel;
        this.status = status;
    }

    public String getOrderId() {
        return orderId;
    }

    public void setOrderId(String orderId) {
        this.orderId = orderId;
    }

    public String getChannel() {
        return channel;
    }

    public void setChannel(String channel) {
        this.channel = channel;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
