package com.easyloan.loancredit;

import com.easyloan.api.facade.CreditFacade;
import com.easyloan.api.model.CreditDecision;
import com.easyloan.loancredit.service.CreditEngine;
import org.apache.dubbo.config.annotation.DubboService;

@DubboService
public class CreditFacadeImpl implements CreditFacade {

    private final CreditEngine creditEngine;

    public CreditFacadeImpl(CreditEngine creditEngine) {
        this.creditEngine = creditEngine;
    }

    @Override
    public CreditDecision getDecision(String userId) {
        int score = creditEngine.score(userId);
        int limit = creditEngine.limit(score);
        return new CreditDecision(userId, score, limit);
    }
}
