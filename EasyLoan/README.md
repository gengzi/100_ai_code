# EasyLoan Microservices (Practice Scaffold)

This repository is a hands-on scaffold for an internet lending system built with Spring Cloud Alibaba.
It focuses on wiring Nacos, Gateway, Sentinel, Dubbo, OpenFeign, and SkyWalking into a realistic
service split.

## Services

- gateway: Spring Cloud Gateway edge service
- loan-app: loan application intake and submission
- loan-user: borrower profile and KYC
- loan-risk: risk scoring and rules
- loan-credit: credit assessment and limits
- loan-order: loan order lifecycle
- loan-fund: funding channel and disbursement
- loan-notify: async notifications and callbacks
- loan-report: metrics and reporting
- loan-api: shared RPC interfaces and DTOs
- loan-common: shared utilities and configs

## Quick Start (local)

1. Start infrastructure:
   - Nacos (config + discovery)
   - Sentinel dashboard
   - SkyWalking OAP + UI
   - MySQL, Redis (optional)

   See: `infra/docker-compose.yml`

2. Import Nacos configs:
   - Load all files from `nacos-configs/` into Nacos
   - For each service, use dataId = `{spring.application.name}.yaml`
   - Use group = `DEFAULT_GROUP` and namespace = `public`

3. Run services:
   - Gateway first, then other services
   - Add SkyWalking agent when launching (see `docs/components.md`)

4. Access:
   - Nacos: http://localhost:8848/nacos
   - Sentinel: http://localhost:8858
   - SkyWalking UI: http://localhost:8080
   - Gateway: http://localhost:8081

## Docs

- Architecture: `docs/architecture.md`
- Component usage and design: `docs/components.md`
- Module logic and rationale: `docs/modules.md`
- Runbook: `docs/runbook.md`
- Nacos config layout: `nacos-configs/README.md`
