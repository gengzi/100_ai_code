# Runbook

## Start infra (Docker)

- `docker compose -f infra/docker-compose.yml up -d`

Services:
- Nacos: 8848
- Sentinel dashboard: 8858
- SkyWalking OAP: 11800 (gRPC), 12800 (HTTP)
- SkyWalking UI: 8080

## Import Nacos configs

1. Open Nacos console
2. Create dataId for each service (e.g. `loan-app.yaml`)
3. Paste corresponding file from `nacos-configs/`
4. Group: `DEFAULT_GROUP`, Namespace: `public`

## Start gateway

- Add SkyWalking agent and run gateway.
- Verify `/actuator/health` via gateway.

## Start services

Order: loan-user -> loan-risk -> loan-credit -> loan-app -> loan-order -> loan-fund -> loan-notify -> loan-report

Each service:
- Loads `common.yaml` + its own `{app}.yaml` from Nacos
- Registers to Nacos
- Sends traces to SkyWalking

## Example Java agent

Set JVM options:
- `-javaagent:/path/to/skywalking-agent.jar`
- `-Dskywalking.agent.service_name=loan-app`
- `-Dskywalking.collector.backend_service=localhost:11800`

## Gateway routes

- `/api/user/**` -> `loan-user`
- `/api/app/**` -> `loan-app`
- `/api/order/**` -> `loan-order`

## Sample business call

- `GET /api/app/submit/u1001?amount=10000`
