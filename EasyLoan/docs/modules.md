# Modules and Business Logic

This document explains each module's responsibilities, main endpoints/RPCs, and the design rationale.

## gateway

Role:
- Entry point for all client traffic.
- Routes `/api/**` to internal services via Nacos discovery.

Why:
- Centralizes routing, auth, and traffic protection.
- Avoids exposing internal service addresses to clients.

Key endpoints:
- `/api/app/**` -> `loan-app`
- `/api/user/**` -> `loan-user`
- `/api/order/**` -> `loan-order`

## loan-user

Role:
- Owns borrower profile and KYC state.

Implementation:
- `UserService` maintains an in-memory user store.
- `UserController` exposes `/user/{id}` for profile queries.

Why:
- User data changes independently from lending flows, so isolate to reduce coupling.

## loan-risk

Role:
- Provides risk decision as a fast internal RPC.

Implementation:
- `RiskEngine` applies simple rule logic.
- `RiskFacadeImpl` is a Dubbo provider for `RiskFacade`.

Why:
- Risk logic is latency-sensitive and should be called via low-overhead RPC.

## loan-credit

Role:
- Computes credit score and credit limit.

Implementation:
- `CreditEngine` maps score to a limit.
- `CreditFacadeImpl` serves Dubbo requests.

Why:
- Credit decision is reused across many flows, so it is isolated and versioned.

## loan-app

Role:
- Orchestrates the loan application process.

Implementation:
- Feign calls to `loan-user`, `loan-order`, `loan-fund`, `loan-notify`, `loan-report`.
- Dubbo calls to `loan-risk`, `loan-credit`.
- Main flow: risk -> credit -> order -> fund -> notify.

Why:
- App service focuses on orchestration; core policies remain in dedicated services.

Main API:
- `GET /app/submit/{userId}?amount=10000`

## loan-order

Role:
- Owns loan order lifecycle.

Implementation:
- `LoanOrderService` stores orders in memory.
- `LoanOrderController` exposes `/order/create` and `/order/fund/{orderId}`.

Why:
- Order lifecycle is a stable, central concept that should not be embedded in orchestration.

## loan-fund

Role:
- Funding channel selection and disbursement.

Implementation:
- `FundingService` selects channel by amount.
- `/fund/disburse` returns a funding result.

Why:
- Funding partners and channels evolve; isolate to swap channels without changing app flow.

## loan-notify

Role:
- Sends notifications to users and partners.

Implementation:
- `NotifyService` chooses channel.
- `/notify/loan` sends and returns the result.

Why:
- Async notification is a separate concern and can be replaced with MQ later.

## loan-report

Role:
- Captures event counters for reporting.

Implementation:
- `/report/record` increments counters.
- `/report/metrics` exposes the current snapshot.

Why:
- Reporting should not block core flow; it should accept lightweight events.

## loan-api

Role:
- Shared RPC contracts and DTOs.

Implementation:
- `RiskFacade`, `CreditFacade` and their DTOs.

Why:
- Ensures strict contracts between Dubbo provider/consumer.

## loan-common

Role:
- Shared code placeholder for future utilities.

Why:
- Avoids duplication and helps align cross-cutting concerns.
