# Architecture

## Business scenario

An internet lending platform handles user onboarding, credit evaluation, risk scoring,
loan application intake, order creation, funding, and notification callbacks.

## Service boundaries

- gateway: entry point, routing, auth, rate limit, and circuit breaking
- loan-user: borrower profile, KYC, and user lifecycle
- loan-risk: risk model, rules engine, and risk decision
- loan-credit: credit score and limit calculation
- loan-app: application intake and orchestration
- loan-order: order state machine, repayment schedule
- loan-fund: channel selection and disbursement
- loan-notify: SMS, email, webhook callbacks
- loan-report: reporting, metrics, and BI export

## Call flow (typical)

1. Client calls gateway to submit loan application.
2. gateway routes to loan-app.
3. loan-app uses OpenFeign to fetch user profile from loan-user.
4. loan-app calls loan-risk and loan-credit via Dubbo for low-latency RPC.
5. loan-app creates an order via loan-order.
6. loan-app requests funding from loan-fund.
7. loan-app notifies users via loan-notify.
8. loan-app records a report event via loan-report.

## Design choices

- Nacos provides both service discovery and externalized configuration.
- Gateway centralizes security, rate limit, and routing.
- Sentinel protects services with circuit breaking and throttling.
- Dubbo is used for internal RPC with strict contracts and low latency.
- OpenFeign is used for REST calls with simple HTTP integration.
- SkyWalking traces all services to visualize end-to-end latency.
