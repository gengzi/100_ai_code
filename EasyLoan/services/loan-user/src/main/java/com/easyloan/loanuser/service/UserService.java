package com.easyloan.loanuser.service;

import com.easyloan.loanuser.model.UserEntity;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class UserService {

    private final Map<String, UserEntity> userStore = new ConcurrentHashMap<>();

    public UserService() {
        userStore.put("u1001", new UserEntity("u1001", "Li Wei", 28, "KYC-2", "Shanghai", 12000));
        userStore.put("u1002", new UserEntity("u1002", "Zhang Min", 35, "KYC-3", "Beijing", 18000));
        userStore.put("u1003", new UserEntity("u1003", "Chen Hao", 22, "KYC-1", "Hangzhou", 8000));
    }

    public UserEntity getUser(String userId) {
        return userStore.get(userId);
    }
}
