package com.easyloan.api.facade;

import com.easyloan.api.model.RiskDecision;

public interface RiskFacade {

    RiskDecision getDecision(String userId);
}
