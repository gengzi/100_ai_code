# Components

This document explains how each component is used and why the configuration choices were made.

## Nacos (Config + Discovery)

Usage:
- All services register to Nacos for discovery.
- Service configs are stored in Nacos as `{appName}.yaml`.
- Shared config is stored in `common.yaml` and loaded by all services.

Why:
- Central config enables consistent changes without redeploy.
- Discovery removes hardcoded host lists and supports scaling.

Key config (bootstrap.yaml):
- `spring.cloud.nacos.discovery.server-addr`
- `spring.cloud.nacos.config.server-addr`
- `spring.cloud.nacos.config.shared-configs`

## Gateway

Usage:
- Routes are defined for each microservice using `lb://`.
- Gateway integrates with Sentinel for rate limiting and circuit breaking.

Why:
- Consolidates edge concerns (auth, routing, traffic control).
- Simplifies client integrations.

Key config (Nacos gateway.yaml):
- `spring.cloud.gateway.routes` with `StripPrefix=1`
- `spring.cloud.sentinel.scg.enabled=true`

## Sentinel

Usage:
- Each service connects to Sentinel dashboard.
- Flow and degrade rules are stored in Nacos as JSON.
- Gateway uses separate gateway flow rules.

Why:
- Protects against overload and cascaded failures.
- Centralized rule management via Nacos.

Key config:
- `spring.cloud.sentinel.transport.dashboard`
- `spring.cloud.sentinel.datasource.*` pointing to Nacos rule dataIds

## Dubbo

Usage:
- Internal high-QPS calls use Dubbo.
- Interfaces live in `loan-api` and are consumed by services.
- Registry uses Nacos.

Why:
- Binary RPC with strict contracts and better performance.
- Easy to govern with service-level metadata.

Key config:
- `dubbo.registry.address=nacos://localhost:8848`
- `dubbo.protocol.name=dubbo`
- `dubbo.consumer.check=false`

## OpenFeign

Usage:
- REST calls between services for simple query-style APIs.
- Sentinel integration for fallback and rate limiting.

Why:
- Faster to integrate for REST endpoints.
- Compatible with HTTP tooling and API gateways.

Key config:
- `feign.sentinel.enabled=true`

## SkyWalking

Usage:
- Java agent attached at startup.
- Service name set via environment variable.
- Collector points to SkyWalking OAP.

Why:
- Full distributed tracing without code changes.
- Built-in service topology and latency metrics.

Key config:
- `SW_AGENT_NAME` per service
- `SW_AGENT_COLLECTOR_BACKEND_SERVICES=localhost:11800`

## Business flow example

- Client calls `/api/app/submit/{userId}?amount=10000` via gateway.
- loan-app orchestrates: user -> risk -> credit -> order -> fund -> notify -> report.
- See `docs/modules.md` for module-level logic and rationale.
