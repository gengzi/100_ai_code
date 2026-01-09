package com.easyloan.loanapp;

import com.easyloan.loanapp.model.OrderCreateResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;

@FeignClient(name = "loan-order")
public interface OrderClient {

    @PostMapping("/order/create")
    OrderCreateResponse create(@RequestParam("userId") String userId,
                               @RequestParam("amount") int amount);

    @PostMapping("/order/fund/{orderId}")
    OrderCreateResponse fund(@PathVariable("orderId") String orderId);
}
