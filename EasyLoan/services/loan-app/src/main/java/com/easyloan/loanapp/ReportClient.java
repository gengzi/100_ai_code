package com.easyloan.loanapp;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;

@FeignClient(name = "loan-report")
public interface ReportClient {

    @PostMapping("/report/record")
    void record(@RequestParam("key") String key);
}
