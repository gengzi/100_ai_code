package com.easyloan.loannotify;

import com.easyloan.loannotify.service.NotifyService;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class NotifyController {

    private final NotifyService notifyService;

    public NotifyController(NotifyService notifyService) {
        this.notifyService = notifyService;
    }

    @PostMapping("/notify/loan")
    public NotifyResult notifyLoan(@RequestParam("orderId") String orderId,
                                   @RequestParam("userId") String userId) {
        String channel = notifyService.pickChannel(userId);
        return new NotifyResult(orderId, channel, "SENT");
    }
}
