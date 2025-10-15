# Alerting and Monitoring

> **Proactive notifications when things go wrong**

This guide covers alert configuration, rules, and best practices for monitoring your application.

## 📚 Table of Contents

- [Overview](#overview)
- [Alert Rules](#alert-rules)
- [Severity Levels](#severity-levels)
- [Notification Channels](#notification-channels)
- [Alert Management](#alert-management)
- [Common Alerts](#common-alerts)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Overview

Alerting provides proactive notifications when:

- **Performance degrades** - High latency, error rates
- **Resources are exhausted** - Memory, CPU, disk
- **Services go down** - Database, cache, queue
- **Business metrics anomaly** - Unusual patterns

### Alert Flow

```
┌─────────────────────────────────────────────────────┐
│           Prometheus                                 │
│  - Evaluates alert rules every 30s                  │
│  - Checks if conditions are met                     │
│  - Manages alert state                              │
└────────────────┬────────────────────────────────────┘
                 │
                 │ Alert triggered
                 ▼
┌─────────────────────────────────────────────────────┐
│           Alertmanager                               │
│  - Groups similar alerts                            │
│  - Deduplicates alerts                              │
│  - Routes to channels                               │
│  - Manages silences                                 │
└────────────────┬────────────────────────────────────┘
                 │
                 │ Notification
                 ▼
┌─────────────────────────────────────────────────────┐
│           Notification Channels                      │
│  - Email                                            │
│  - Slack                                            │
│  - PagerDuty                                        │
│  - Webhook                                          │
└─────────────────────────────────────────────────────┘
```

### Alert States

```
┌─────────┐
│ Inactive│ ─── Condition not met
└────┬────┘
     │
     │ Condition met
     ▼
┌─────────┐
│ Pending │ ─── Waiting for 'for' duration
└────┬────┘
     │
     │ Duration exceeded
     ▼
┌─────────┐
│ Firing  │ ─── Alert triggered, notification sent
└────┬────┘
     │
     │ Condition resolved
     ▼
┌─────────┐
│ Resolved│ ─── Alert cleared
└─────────┘
```

## Alert Rules

### Configuration File

File: `alerts.yml`

```yaml
groups:
  - name: application_alerts
    interval: 30s # Evaluate every 30 seconds
    rules:
      - alert: HighErrorRate
        expr: |
          sum(rate(http_requests_total{status_code=~"5.."}[5m])) /
          sum(rate(http_requests_total[5m])) * 100 > 5
        for: 5m
        labels:
          severity: critical
          component: api
        annotations:
          summary: 'High error rate detected'
          description: 'Error rate is {{ $value | humanizePercentage }} (threshold: 5%)'
          runbook_url: 'https://wiki.example.com/runbooks/high-error-rate'
```

### Alert Rule Structure

```yaml
alert: AlertName # Unique alert name
expr: | # PromQL expression (must return boolean)
  metric > threshold
for: 5m # How long condition must be true
labels: # Labels for routing and grouping
  severity: critical
  team: backend
annotations: # Human-readable information
  summary: 'Brief description'
  description: 'Detailed description with {{ $value }}'
  runbook_url: 'Link to runbook'
```

## Severity Levels

### Level Definitions

```yaml
# Critical - Immediate action required (page on-call)
labels:
  severity: critical
# Examples: Service down, data loss, security breach

# Warning - Action required soon (ticket + notification)
labels:
  severity: warning
# Examples: High latency, high resource usage, degraded service

# Info - Informational (logging, metrics)
labels:
  severity: info
# Examples: Configuration change, deployment, maintenance
```

### Severity Guidelines

| Severity     | Response Time       | Examples                                      |
| ------------ | ------------------- | --------------------------------------------- |
| **Critical** | Immediate (< 5 min) | Service down, data loss, security breach      |
| **Warning**  | Within hours        | High error rate, high latency, disk 80% full  |
| **Info**     | No action needed    | Deployment, config change, cache miss rate up |

## Notification Channels

### Email Notifications

```yaml
# alertmanager.yml
receivers:
  - name: 'email-team'
    email_configs:
      - to: 'team@example.com'
        from: 'alerts@example.com'
        smarthost: 'smtp.gmail.com:587'
        auth_username: 'alerts@example.com'
        auth_password: 'password'
        headers:
          Subject: '[{{ .Status }}] {{ .GroupLabels.alertname }}'
```

### Slack Notifications

```yaml
receivers:
  - name: 'slack-alerts'
    slack_configs:
      - api_url: 'https://hooks.slack.com/services/YOUR/WEBHOOK/URL'
        channel: '#alerts'
        title: '{{ .GroupLabels.alertname }}'
        text: |
          {{ range .Alerts }}
            *Alert:* {{ .Annotations.summary }}
            *Description:* {{ .Annotations.description }}
            *Severity:* {{ .Labels.severity }}
            *Runbook:* {{ .Annotations.runbook_url }}
          {{ end }}
        color: |
          {{ if eq .Status "firing" }}
            {{ if eq .CommonLabels.severity "critical" }}danger{{ else }}warning{{ end }}
          {{ else }}good{{ end }}
```

### PagerDuty Integration

```yaml
receivers:
  - name: 'pagerduty-critical'
    pagerduty_configs:
      - service_key: 'YOUR_PAGERDUTY_SERVICE_KEY'
        severity: |
          {{ .CommonLabels.severity }}
        description: '{{ .GroupLabels.alertname }}: {{ .Annotations.summary }}'
        details:
          firing: '{{ .Alerts.Firing | len }}'
          resolved: '{{ .Alerts.Resolved | len }}'
```

### Webhook Notifications

```yaml
receivers:
  - name: 'webhook-custom'
    webhook_configs:
      - url: 'https://your-webhook-endpoint.com/alerts'
        send_resolved: true
```

## Alert Management

### Routing Rules

```yaml
# alertmanager.yml
route:
  receiver: 'default-receiver'
  group_by: ['alertname', 'cluster', 'service']
  group_wait: 30s
  group_interval: 5m
  repeat_interval: 4h

  routes:
    # Critical alerts to PagerDuty
    - match:
        severity: critical
      receiver: 'pagerduty-critical'
      group_wait: 10s
      repeat_interval: 1h

    # Warning alerts to Slack
    - match:
        severity: warning
      receiver: 'slack-alerts'
      group_wait: 30s
      repeat_interval: 4h

    # Info alerts to email (no repeat)
    - match:
        severity: info
      receiver: 'email-team'
      repeat_interval: 0
```

### Silencing Alerts

```bash
# Silence an alert for 2 hours
amtool silence add \
  alertname=HighMemoryUsage \
  --duration=2h \
  --comment="Planned maintenance"

# List active silences
amtool silence query

# Expire a silence
amtool silence expire <silence-id>
```

Via Grafana:

1. Go to Alerting → Silences
2. Click "New Silence"
3. Set matchers and duration
4. Add comment

## Common Alerts

### 1. High Error Rate

```yaml
- alert: HighErrorRate
  expr: |
    sum(rate(http_requests_total{status_code=~"5.."}[5m])) /
    sum(rate(http_requests_total[5m])) * 100 > 5
  for: 5m
  labels:
    severity: critical
  annotations:
    summary: 'High error rate on {{ $labels.instance }}'
    description: 'Error rate is {{ $value | humanizePercentage }}'
```

### 2. High Latency

```yaml
- alert: HighLatency
  expr: |
    histogram_quantile(0.95,
      rate(http_request_duration_seconds_bucket[5m])
    ) > 1
  for: 10m
  labels:
    severity: warning
  annotations:
    summary: 'High latency detected'
    description: 'P95 latency is {{ $value }}s (threshold: 1s)'
```

### 3. High Memory Usage

```yaml
- alert: HighMemoryUsage
  expr: |
    nodejs_heap_size_used_bytes /
    nodejs_heap_size_total_bytes * 100 > 90
  for: 5m
  labels:
    severity: warning
  annotations:
    summary: 'High memory usage on {{ $labels.instance }}'
    description: 'Memory usage is {{ $value | humanizePercentage }}'
```

### 4. Service Down

```yaml
- alert: ServiceDown
  expr: up{job="backend"} == 0
  for: 1m
  labels:
    severity: critical
  annotations:
    summary: 'Service {{ $labels.job }} is down'
    description: '{{ $labels.instance }} has been down for more than 1 minute'
```

### 5. Database Connection Issues

```yaml
- alert: DatabaseConnectionFailure
  expr: |
    rate(db_connection_errors_total[5m]) > 0
  for: 2m
  labels:
    severity: critical
  annotations:
    summary: 'Database connection failures detected'
    description: '{{ $value }} connection errors per second'
```

### 6. Queue Backlog

```yaml
- alert: QueueBacklog
  expr: |
    queue_jobs_waiting > 1000
  for: 10m
  labels:
    severity: warning
  annotations:
    summary: 'Queue {{ $labels.queue }} has backlog'
    description: '{{ $value }} jobs waiting in queue'
```

### 7. High Disk Usage

```yaml
- alert: HighDiskUsage
  expr: |
    (node_filesystem_avail_bytes /
     node_filesystem_size_bytes) * 100 < 10
  for: 5m
  labels:
    severity: warning
  annotations:
    summary: 'Disk space low on {{ $labels.instance }}'
    description: 'Only {{ $value | humanizePercentage }} disk space remaining'
```

### 8. SSL Certificate Expiring

```yaml
- alert: SSLCertificateExpiring
  expr: |
    (probe_ssl_earliest_cert_expiry - time()) / 86400 < 30
  for: 1h
  labels:
    severity: warning
  annotations:
    summary: 'SSL certificate expiring soon'
    description: 'Certificate expires in {{ $value }} days'
```

### 9. Cache Hit Rate Low

```yaml
- alert: LowCacheHitRate
  expr: |
    sum(rate(cache_operations_total{status="hit"}[5m])) /
    sum(rate(cache_operations_total[5m])) * 100 < 50
  for: 15m
  labels:
    severity: warning
  annotations:
    summary: 'Cache hit rate is low'
    description: 'Hit rate is {{ $value | humanizePercentage }} (threshold: 50%)'
```

### 10. Event Loop Lag

```yaml
- alert: HighEventLoopLag
  expr: nodejs_eventloop_lag_seconds > 0.1
  for: 5m
  labels:
    severity: warning
  annotations:
    summary: 'High event loop lag on {{ $labels.instance }}'
    description: 'Event loop lag is {{ $value }}s (threshold: 0.1s)'
```

## Best Practices

### 1. Actionable Alerts

```yaml
# ✅ Good - Clear action needed
- alert: DatabaseDown
  annotations:
    summary: 'Database is down'
    description: 'Check database service and restart if needed'
    runbook_url: 'https://wiki/runbooks/database-down'

# ❌ Bad - Not actionable
- alert: SomethingWrong
  annotations:
    summary: 'Something is wrong'
```

### 2. Appropriate Thresholds

```yaml
# ✅ Good - Reasonable threshold
expr: error_rate > 5  # 5% errors

# ❌ Bad - Too sensitive
expr: error_rate > 0  # Any error triggers alert
```

### 3. Appropriate Duration

```yaml
# ✅ Good - Wait for sustained issue
for: 5m  # High error rate for 5 minutes

# ❌ Bad - Too quick to alert
for: 30s  # May be temporary spike
```

### 4. Include Context

```yaml
annotations:
  summary: 'High latency on {{ $labels.endpoint }}'
  description: |
    P95 latency is {{ $value }}s
    Endpoint: {{ $labels.endpoint }}
    Instance: {{ $labels.instance }}
    Check: https://grafana.example.com/d/dashboard?var-endpoint={{ $labels.endpoint }}
```

### 5. Use Runbooks

```yaml
annotations:
  runbook_url: 'https://wiki.example.com/runbooks/high-error-rate'
```

Runbook should include:

- Description of the alert
- Common causes
- Investigation steps
- Resolution steps
- Escalation path

### 6. Alert Grouping

```yaml
route:
  # Group related alerts together
  group_by: ['alertname', 'service', 'cluster']
  group_wait: 30s
  group_interval: 5m
```

### 7. Avoid Alert Fatigue

```yaml
# ✅ Good - Reasonable repeat interval
repeat_interval: 4h

# ❌ Bad - Too frequent
repeat_interval: 5m
```

### 8. Test Alerts

```bash
# Test alert rule
promtool check rules alerts.yml

# Test with amtool
amtool check-config alertmanager.yml
```

## Alert Testing

### Manual Testing

```bash
# Trigger a test alert
curl -X POST http://localhost:9093/api/v1/alerts \
  -H 'Content-Type: application/json' \
  -d '[{
    "labels": {
      "alertname": "TestAlert",
      "severity": "warning"
    },
    "annotations": {
      "summary": "This is a test alert"
    }
  }]'
```

### Unit Testing Alert Rules

```bash
# Create test file: alerts.test.yml
rule_files:
  - alerts.yml

evaluation_interval: 1m

tests:
  - interval: 1m
    input_series:
      - series: 'http_requests_total{status_code="500"}'
        values: '0+10x10'
      - series: 'http_requests_total{status_code="200"}'
        values: '0+90x10'
    alert_rule_test:
      - eval_time: 5m
        alertname: HighErrorRate
        exp_alerts:
          - exp_labels:
              severity: critical
            exp_annotations:
              summary: "High error rate detected"

# Run tests
promtool test rules alerts.test.yml
```

## Alertmanager Configuration

### Complete Configuration

File: `alertmanager.yml`

```yaml
global:
  resolve_timeout: 5m
  smtp_smarthost: 'smtp.gmail.com:587'
  smtp_from: 'alerts@example.com'
  smtp_auth_username: 'alerts@example.com'
  smtp_auth_password: 'password'

templates:
  - '/etc/alertmanager/templates/*.tmpl'

route:
  receiver: 'default-receiver'
  group_by: ['alertname', 'cluster', 'service']
  group_wait: 30s
  group_interval: 5m
  repeat_interval: 4h

  routes:
    - match:
        severity: critical
      receiver: 'pagerduty-critical'
      continue: true

    - match:
        severity: critical
      receiver: 'slack-critical'

    - match:
        severity: warning
      receiver: 'slack-warnings'

    - match:
        severity: info
      receiver: 'email-team'

receivers:
  - name: 'default-receiver'
    email_configs:
      - to: 'team@example.com'

  - name: 'pagerduty-critical'
    pagerduty_configs:
      - service_key: 'YOUR_SERVICE_KEY'

  - name: 'slack-critical'
    slack_configs:
      - api_url: 'https://hooks.slack.com/services/YOUR/WEBHOOK'
        channel: '#critical-alerts'
        title: '🔥 {{ .GroupLabels.alertname }}'

  - name: 'slack-warnings'
    slack_configs:
      - api_url: 'https://hooks.slack.com/services/YOUR/WEBHOOK'
        channel: '#warnings'
        title: '⚠️ {{ .GroupLabels.alertname }}'

  - name: 'email-team'
    email_configs:
      - to: 'team@example.com'

inhibit_rules:
  - source_match:
      severity: 'critical'
    target_match:
      severity: 'warning'
    equal: ['alertname', 'cluster', 'service']
```

## Troubleshooting

### Alerts Not Firing

1. Check alert rule syntax:

```bash
promtool check rules alerts.yml
```

2. Test the PromQL expression:

```bash
# In Prometheus UI
http://localhost:9090/graph
```

3. Check alert state:

```
http://localhost:9090/alerts
```

### Notifications Not Sent

1. Check Alertmanager logs:

```bash
docker-compose logs alertmanager
```

2. Verify receiver configuration:

```bash
amtool check-config alertmanager.yml
```

3. Test notification channel directly

### Too Many Alerts

Solutions:

- Increase thresholds
- Increase 'for' duration
- Group related alerts
- Silence during maintenance
- Use inhibit rules

### False Positives

Solutions:

- Adjust thresholds based on historical data
- Use rate() over longer periods
- Add 'for' duration to wait for sustained issues
- Use better metrics

## Alert Dashboard

### Grafana Alert Dashboard

Create a dashboard to visualize alerts:

```json
{
  "dashboard": {
    "title": "Alerts Overview",
    "panels": [
      {
        "title": "Active Alerts",
        "targets": [
          {
            "expr": "ALERTS{alertstate=\"firing\"}"
          }
        ]
      },
      {
        "title": "Alert Trends",
        "targets": [
          {
            "expr": "sum by (alertname) (ALERTS)"
          }
        ]
      }
    ]
  }
}
```

## Related Documentation

- **[Observability Overview](README.md)** - Complete observability stack
- **[Metrics Guide](METRICS.md)** - Prometheus metrics
- **[Logging Guide](LOGGING.md)** - Winston and Loki
- **[Tracing Guide](TRACING.md)** - OpenTelemetry and Tempo

## External Resources

- [Prometheus Alerting](https://prometheus.io/docs/alerting/latest/overview/)
- [Alertmanager](https://prometheus.io/docs/alerting/latest/alertmanager/)
- [PromQL for Alerting](https://prometheus.io/docs/prometheus/latest/querying/basics/)
- [Runbook Examples](https://github.com/kubernetes-monitoring/kubernetes-mixin/tree/master/runbook.md)

---

**Next Steps**:

1. Review and customize alert rules
2. Configure notification channels
3. Create runbooks for each alert
4. Test alerts regularly

Need help? Check the [Troubleshooting Guide](../guides/TROUBLESHOOTING.md).
