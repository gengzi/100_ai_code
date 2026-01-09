package com.easyloan.loanorder;

import com.easyloan.loanorder.model.LoanOrder;
import com.easyloan.loanorder.service.LoanOrderService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class LoanOrderController {

    private final LoanOrderService loanOrderService;

    public LoanOrderController(LoanOrderService loanOrderService) {
        this.loanOrderService = loanOrderService;
    }

    @PostMapping("/order/create")
    public LoanOrder create(@RequestParam("userId") String userId,
                            @RequestParam("amount") int amount) {
        return loanOrderService.create(userId, amount);
    }

    @PostMapping("/order/fund/{orderId}")
    public LoanOrder fund(@PathVariable("orderId") String orderId) {
        return loanOrderService.markFunded(orderId);
    }

    @GetMapping("/order/{orderId}")
    public LoanOrder get(@PathVariable("orderId") String orderId) {
        return loanOrderService.get(orderId);
    }
}
