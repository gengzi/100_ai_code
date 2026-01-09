package com.easyloan.loancredit.service;

import org.springframework.stereotype.Service;

@Service
public class CreditEngine {

    public int score(String userId) {
        int hash = Math.abs(userId.hashCode());
        return 600 + (hash % 200);
    }

    public int limit(int score) {
        if (score >= 750) {
            return 30000;
        }
        if (score >= 700) {
            return 20000;
        }
        if (score >= 650) {
            return 12000;
        }
        return 5000;
    }
}
