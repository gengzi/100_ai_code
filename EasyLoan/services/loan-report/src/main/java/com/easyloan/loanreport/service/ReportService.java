package com.easyloan.loanreport.service;

import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class ReportService {

    private final Map<String, Integer> counters = new ConcurrentHashMap<>();

    public void increment(String key) {
        counters.merge(key, 1, Integer::sum);
    }

    public Map<String, Integer> snapshot() {
        return counters;
    }
}
