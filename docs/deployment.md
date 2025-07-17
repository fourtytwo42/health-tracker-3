# Deployment Guide

This document covers deployment procedures for the AI Health Companion application.

## Table of Contents

1. [Local Development](#local-development)
2. [Docker Deployment](#docker-deployment)
3. [Kubernetes Deployment](#kubernetes-deployment)
4. [Scaling & Rollback](#scaling--rollback)
5. [Disaster Recovery](#disaster-recovery)
6. [Environment Configuration](#environment-configuration)

## Local Development

### Prerequisites

- Node.js 20+
- pnpm or npm
- Docker and Docker Compose
- PostgreSQL 16
- Minio (S3-compatible storage)

### Quick Start

```bash
# Clone the repository
git clone <repository-url>
cd healthTracker

# Install dependencies
npm install

# Set up environment variables
cp env.example .env.local
# Edit .env.local with your configuration

# Start development environment
npm run setup  # Starts Docker services and runs migrations
npm run dev    # Starts Next.js development server
```

### Development with Docker

```bash
# Start development environment with Docker Compose
docker-compose -f docker-compose.dev.yml up -d

# View logs
docker-compose -f docker-compose.dev.yml logs -f app-dev

# Stop development environment
docker-compose -f docker-compose.dev.yml down
```

## Docker Deployment

### Production Build

```bash
# Build production image
./scripts/docker-build.sh build

# Test the image
./scripts/docker-build.sh test

# Run with Docker Compose
./scripts/docker-build.sh compose
```

### Docker Compose Production

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f app

# Scale the application
docker-compose up -d --scale app=3

# Stop all services
docker-compose down
```

### Environment Variables

Create a `.env` file for production:

```env
# Database
DATABASE_URL=postgresql://user:password@host:5432/database

# JWT Secrets
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-super-secret-refresh-key

# Minio Configuration
MINIO_ENDPOINT=minio:9000
MINIO_ACCESS_KEY=your-access-key
MINIO_SECRET_KEY=your-secret-key

# LLM Providers
OPENAI_API_KEY=your-openai-key
GROQ_API_KEY=your-groq-key
ANTHROPIC_API_KEY=your-anthropic-key

# Monitoring
SENTRY_DSN=your-sentry-dsn
```

## Kubernetes Deployment

### Prerequisites

- Kubernetes cluster (1.20+)
- kubectl configured
- Helm (optional)

### Deploy to Kubernetes

```bash
# Create namespace
kubectl create namespace ai-health-companion

# Apply secrets (update with your values)
kubectl apply -f k8s/secrets.yaml

# Deploy the application
kubectl apply -f k8s/deployment.yaml

# Check deployment status
kubectl get pods -n ai-health-companion
kubectl get services -n ai-health-companion
```

### Using Helm (Optional)

```bash
# Add Helm repository (if using a chart)
helm repo add ai-health-companion <chart-repo>

# Install the application
helm install ai-health-companion ./helm-chart \
  --namespace ai-health-companion \
  --set image.tag=latest \
  --set replicaCount=3
```

### Scaling

```bash
# Scale horizontally
kubectl scale deployment ai-health-companion --replicas=5

# Scale vertically (update resource limits)
kubectl patch deployment ai-health-companion -p '{
  "spec": {
    "template": {
      "spec": {
        "containers": [{
          "name": "app",
          "resources": {
            "requests": {"memory": "512Mi", "cpu": "500m"},
            "limits": {"memory": "1Gi", "cpu": "1000m"}
          }
        }]
      }
    }
  }
}'
```

## Scaling & Rollback

### Horizontal Pod Autoscaler

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: ai-health-companion-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: ai-health-companion
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

### Rollback Procedures

```bash
# Rollback to previous version
kubectl rollout undo deployment/ai-health-companion

# Rollback to specific version
kubectl rollout undo deployment/ai-health-companion --to-revision=2

# Check rollout status
kubectl rollout status deployment/ai-health-companion

# View rollout history
kubectl rollout history deployment/ai-health-companion
```

### Blue-Green Deployment

```bash
# Deploy new version with different labels
kubectl apply -f k8s/deployment-green.yaml

# Wait for new deployment to be ready
kubectl rollout status deployment/ai-health-companion-green

# Switch traffic to new deployment
kubectl patch service ai-health-companion-service -p '{
  "spec": {
    "selector": {
      "app": "ai-health-companion-green"
    }
  }
}'

# Remove old deployment
kubectl delete deployment ai-health-companion
```

## Disaster Recovery

### Backup Procedures

#### Database Backup

```bash
# Create database backup
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

# Automated backup script
#!/bin/bash
BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump $DATABASE_URL > $BACKUP_DIR/backup_$DATE.sql
gzip $BACKUP_DIR/backup_$DATE.sql

# Keep only last 7 days of backups
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +7 -delete
```

#### File Storage Backup

```bash
# Backup Minio data
mc mirror minio/health-tracker /backups/minio/

# Restore Minio data
mc mirror /backups/minio/ minio/health-tracker
```

### Recovery Procedures

#### Database Recovery

```bash
# Restore from backup
psql $DATABASE_URL < backup_20240101_120000.sql

# Point-in-time recovery (if using WAL archiving)
pg_restore --clean --if-exists $DATABASE_URL backup_file.sql
```

#### Application Recovery

```bash
# Deploy from backup image
kubectl set image deployment/ai-health-companion \
  app=ai-health-companion:backup-tag

# Restore from snapshot
kubectl apply -f k8s/backup-deployment.yaml
```

### Monitoring & Alerts

```yaml
# Prometheus alerting rules
groups:
- name: ai-health-companion
  rules:
  - alert: HighCPUUsage
    expr: container_cpu_usage_seconds_total{container="app"} > 0.8
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: High CPU usage detected

  - alert: HighMemoryUsage
    expr: container_memory_usage_bytes{container="app"} > 0.8
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: High memory usage detected

  - alert: PodDown
    expr: up{job="ai-health-companion"} == 0
    for: 1m
    labels:
      severity: critical
    annotations:
      summary: Pod is down
```

## Environment Configuration

### Development Environment

```env
NODE_ENV=development
DATABASE_URL=postgresql://health_user:health_password@localhost:5432/health_tracker
JWT_SECRET=dev-secret
JWT_REFRESH_SECRET=dev-refresh-secret
MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin123
```

### Staging Environment

```env
NODE_ENV=staging
DATABASE_URL=postgresql://staging_user:staging_pass@staging-db:5432/health_tracker_staging
JWT_SECRET=staging-secret
JWT_REFRESH_SECRET=staging-refresh-secret
MINIO_ENDPOINT=staging-minio:9000
MINIO_ACCESS_KEY=staging-access-key
MINIO_SECRET_KEY=staging-secret-key
```

### Production Environment

```env
NODE_ENV=production
DATABASE_URL=postgresql://prod_user:prod_pass@prod-db:5432/health_tracker_prod
JWT_SECRET=production-super-secret-key
JWT_REFRESH_SECRET=production-super-secret-refresh-key
MINIO_ENDPOINT=prod-minio:9000
MINIO_ACCESS_KEY=prod-access-key
MINIO_SECRET_KEY=prod-secret-key
SENTRY_DSN=https://your-sentry-dsn
```

### Security Considerations

1. **Secrets Management**: Use Kubernetes secrets or external secret managers
2. **Network Security**: Implement network policies and ingress controllers
3. **TLS/SSL**: Configure HTTPS with valid certificates
4. **Access Control**: Use RBAC for Kubernetes and database access
5. **Monitoring**: Implement comprehensive logging and monitoring
6. **Backup**: Regular automated backups with off-site storage
7. **Updates**: Regular security updates and dependency management

### Performance Optimization

1. **Caching**: Implement Redis for session and data caching
2. **CDN**: Use CDN for static assets
3. **Database**: Optimize queries and use connection pooling
4. **Load Balancing**: Use proper load balancers and health checks
5. **Resource Limits**: Set appropriate CPU and memory limits
6. **Horizontal Scaling**: Use HPA for automatic scaling 