package com.easyloan.loanapp;

import com.easyloan.loanapp.model.NotifyResult;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;

@FeignClient(name = "loan-notify")
public interface NotifyClient {

    @PostMapping("/notify/loan")
    NotifyResult notifyLoan(@RequestParam("orderId") String orderId,
                            @RequestParam("userId") String userId);
}
