package com.easyloan.loanreport;

import com.easyloan.loanreport.service.ReportService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
public class ReportController {

    private final ReportService reportService;

    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    @PostMapping("/report/record")
    public void record(@RequestParam("key") String key) {
        reportService.increment(key);
    }

    @GetMapping("/report/metrics")
    public Map<String, Integer> metrics() {
        return reportService.snapshot();
    }
}
