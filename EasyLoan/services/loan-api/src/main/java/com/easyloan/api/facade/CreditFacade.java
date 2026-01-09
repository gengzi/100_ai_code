package com.easyloan.api.facade;

import com.easyloan.api.model.CreditDecision;

public interface CreditFacade {

    CreditDecision getDecision(String userId);
}
