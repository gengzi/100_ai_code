package com.easyloan.loanorder.service;

import com.easyloan.loanorder.model.LoanOrder;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class LoanOrderService {

    private final Map<String, LoanOrder> orderStore = new ConcurrentHashMap<>();

    public LoanOrder create(String userId, int amount) {
        String orderId = UUID.randomUUID().toString();
        LoanOrder order = new LoanOrder(orderId, userId, amount, "CREATED");
        orderStore.put(orderId, order);
        return order;
    }

    public LoanOrder markFunded(String orderId) {
        LoanOrder order = orderStore.get(orderId);
        if (order != null) {
            order.setStatus("FUNDED");
        }
        return order;
    }

    public LoanOrder get(String orderId) {
        return orderStore.get(orderId);
    }
}
