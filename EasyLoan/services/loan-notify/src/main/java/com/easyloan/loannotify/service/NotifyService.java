package com.easyloan.loannotify.service;

import org.springframework.stereotype.Service;

@Service
public class NotifyService {

    public String pickChannel(String userId) {
        return (userId != null && userId.endsWith("1")) ? "SMS" : "EMAIL";
    }
}
