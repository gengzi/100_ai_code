package com.easyloan.loanapp;

import com.easyloan.api.model.UserProfile;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "loan-user")
public interface UserClient {

    @GetMapping("/user/{id}")
    UserProfile getUser(@PathVariable("id") String id);
}
