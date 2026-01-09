package com.easyloan.loanrisk;

import org.apache.dubbo.config.spring.context.annotation.EnableDubbo;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;
import org.springframework.cloud.openfeign.EnableFeignClients;

@SpringBootApplication
@EnableDiscoveryClient
@EnableFeignClients
@EnableDubbo
public class LoanRiskApplication {

    public static void main(String[] args) {
        SpringApplication.run(LoanRiskApplication.class, args);
    }
}
