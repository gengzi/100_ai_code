package com.easyloan.loanrisk.service;

import org.springframework.stereotype.Service;

@Service
public class RiskEngine {

    public boolean pass(String userId) {
        if (userId == null || userId.isEmpty()) {
            return false;
        }
        int hash = Math.abs(userId.hashCode());
        return hash % 5 != 0;
    }
}
