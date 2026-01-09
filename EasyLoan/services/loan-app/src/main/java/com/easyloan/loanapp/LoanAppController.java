package com.easyloan.loanapp;

import com.easyloan.api.facade.CreditFacade;
import com.easyloan.api.facade.RiskFacade;
import com.easyloan.api.model.CreditDecision;
import com.easyloan.api.model.RiskDecision;
import com.easyloan.api.model.UserProfile;
import com.easyloan.loanapp.model.FundingResult;
import com.easyloan.loanapp.model.NotifyResult;
import com.easyloan.loanapp.model.OrderCreateResponse;
import org.apache.dubbo.config.annotation.DubboReference;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class LoanAppController {

    private final UserClient userClient;
    private final OrderClient orderClient;
    private final FundClient fundClient;
    private final NotifyClient notifyClient;
    private final ReportClient reportClient;

    @DubboReference
    private RiskFacade riskFacade;

    @DubboReference
    private CreditFacade creditFacade;

    public LoanAppController(UserClient userClient,
                             OrderClient orderClient,
                             FundClient fundClient,
                             NotifyClient notifyClient,
                             ReportClient reportClient) {
        this.userClient = userClient;
        this.orderClient = orderClient;
        this.fundClient = fundClient;
        this.notifyClient = notifyClient;
        this.reportClient = reportClient;
    }

    @GetMapping("/app/submit/{userId}")
    public LoanAppResult submit(@PathVariable("userId") String userId,
                                @RequestParam("amount") int amount) {
        UserProfile userProfile = userClient.getUser(userId);
        RiskDecision riskDecision = riskFacade.getDecision(userId);
        CreditDecision creditDecision = creditFacade.getDecision(userId);

        if (!riskDecision.isPass()) {
            reportClient.record("risk.reject");
            return new LoanAppResult(userProfile.getUserId(), false, 0, null, null, null);
        }

        int approvedAmount = Math.min(amount, creditDecision.getCreditLimit());
        OrderCreateResponse order = orderClient.create(userId, approvedAmount);
        FundingResult fundingResult = fundClient.disburse(order.getOrderId(), approvedAmount);
        orderClient.fund(order.getOrderId());
        NotifyResult notifyResult = notifyClient.notifyLoan(order.getOrderId(), userId);

        reportClient.record("loan.approved");
        return new LoanAppResult(userProfile.getUserId(), true, creditDecision.getCreditLimit(),
                order.getOrderId(), fundingResult.getChannel(), notifyResult.getChannel());
    }
}
