# Nacos Configs

Each file here maps to a Nacos dataId. Use group `DEFAULT_GROUP` and namespace `public`.

- common.yaml (shared config, loaded by all services)
- gateway.yaml (Spring Cloud Gateway config)
- loan-app.yaml
- loan-user.yaml
- loan-risk.yaml
- loan-credit.yaml
- loan-order.yaml
- loan-fund.yaml
- loan-notify.yaml
- loan-report.yaml

Sentinel rule files:
- flow-<service>.json
- degrade-<service>.json
- gw-flow-gateway.json

Import rule JSONs into Nacos as separate dataIds with data-type `json`.
