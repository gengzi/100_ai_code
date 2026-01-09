package com.easyloan.loanapp;

import com.easyloan.loanapp.model.FundingResult;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;

@FeignClient(name = "loan-fund")
public interface FundClient {

    @PostMapping("/fund/disburse")
    FundingResult disburse(@RequestParam("orderId") String orderId,
                           @RequestParam("amount") int amount);
}
