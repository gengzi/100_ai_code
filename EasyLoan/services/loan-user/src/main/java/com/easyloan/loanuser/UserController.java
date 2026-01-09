package com.easyloan.loanuser;

import com.easyloan.api.model.UserProfile;
import com.easyloan.loanuser.model.UserEntity;
import com.easyloan.loanuser.service.UserService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/user/{id}")
    public UserProfile getUser(@PathVariable("id") String id) {
        UserEntity entity = userService.getUser(id);
        if (entity == null) {
            return new UserProfile(id, "unknown", "KYC-0");
        }
        return new UserProfile(entity.getUserId(), entity.getName(), entity.getKycLevel());
    }
}
