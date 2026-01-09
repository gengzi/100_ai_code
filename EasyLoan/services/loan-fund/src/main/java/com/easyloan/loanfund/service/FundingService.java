package com.easyloan.loanfund.service;

import org.springframework.stereotype.Service;

@Service
public class FundingService {

    public String chooseChannel(int amount) {
        if (amount <= 10000) {
            return "FAST-CASH";
        }
        if (amount <= 20000) {
            return "BANK-A";
        }
        return "BANK-B";
    }
}
