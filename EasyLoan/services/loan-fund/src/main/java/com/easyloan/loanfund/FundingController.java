package com.easyloan.loanfund;

import com.easyloan.loanfund.service.FundingService;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class FundingController {

    private final FundingService fundingService;

    public FundingController(FundingService fundingService) {
        this.fundingService = fundingService;
    }

    @PostMapping("/fund/disburse")
    public FundingResult disburse(@RequestParam("orderId") String orderId,
                                  @RequestParam("amount") int amount) {
        String channel = fundingService.chooseChannel(amount);
        return new FundingResult(orderId, channel, "SUCCESS");
    }
}
