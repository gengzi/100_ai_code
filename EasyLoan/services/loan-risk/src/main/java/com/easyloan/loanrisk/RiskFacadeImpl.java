package com.easyloan.loanrisk;

import com.easyloan.api.facade.RiskFacade;
import com.easyloan.api.model.RiskDecision;
import com.easyloan.loanrisk.service.RiskEngine;
import org.apache.dubbo.config.annotation.DubboService;

@DubboService
public class RiskFacadeImpl implements RiskFacade {

    private final RiskEngine riskEngine;

    public RiskFacadeImpl(RiskEngine riskEngine) {
        this.riskEngine = riskEngine;
    }

    @Override
    public RiskDecision getDecision(String userId) {
        boolean pass = riskEngine.pass(userId);
        String reason = pass ? "rule-pass" : "rule-reject";
        return new RiskDecision(userId, pass, reason);
    }
}
