#!/bin/bash

# Docker Build Script for AI Health Companion
# This script builds and tests the Docker image

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
IMAGE_NAME="ai-health-companion"
TAG=${1:-latest}
REGISTRY=${2:-""}

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is installed
check_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed"
        exit 1
    fi
    
    if ! docker info &> /dev/null; then
        print_error "Docker daemon is not running"
        exit 1
    fi
    
    print_status "Docker check passed"
}

# Build the Docker image
build_image() {
    print_status "Building Docker image..."
    
    # Build production image
    docker build -t ${IMAGE_NAME}:${TAG} -f Dockerfile .
    
    # Build development image
    docker build -t ${IMAGE_NAME}:${TAG}-dev -f Dockerfile.dev .
    
    print_status "Docker images built successfully"
}

# Test the Docker image
test_image() {
    print_status "Testing Docker image..."
    
    # Create a test container
    CONTAINER_ID=$(docker run -d -p 3001:3000 \
        -e DATABASE_URL="postgresql://test:test@localhost:5432/test" \
        -e JWT_SECRET="test-secret" \
        -e JWT_REFRESH_SECRET="test-refresh-secret" \
        ${IMAGE_NAME}:${TAG})
    
    # Wait for container to start
    sleep 30
    
    # Test health endpoint
    if curl -f http://localhost:3001/api/healthz; then
        print_status "Health check passed"
    else
        print_error "Health check failed"
        docker logs $CONTAINER_ID
        docker stop $CONTAINER_ID
        docker rm $CONTAINER_ID
        exit 1
    fi
    
    # Stop and remove test container
    docker stop $CONTAINER_ID
    docker rm $CONTAINER_ID
    
    print_status "Docker image test passed"
}

# Run the application with Docker Compose
run_compose() {
    print_status "Starting application with Docker Compose..."
    
    # Start the services
    docker-compose up -d
    
    # Wait for services to be ready
    print_status "Waiting for services to be ready..."
    sleep 60
    
    # Test the application
    if curl -f http://localhost:3000/api/healthz; then
        print_status "Application is running successfully"
    else
        print_error "Application failed to start"
        docker-compose logs
        docker-compose down
        exit 1
    fi
    
    print_status "Docker Compose test passed"
}

# Push image to registry
push_image() {
    if [ -n "$REGISTRY" ]; then
        print_status "Pushing image to registry..."
        
        # Tag image for registry
        docker tag ${IMAGE_NAME}:${TAG} ${REGISTRY}/${IMAGE_NAME}:${TAG}
        
        # Push image
        docker push ${REGISTRY}/${IMAGE_NAME}:${TAG}
        
        print_status "Image pushed to registry successfully"
    else
        print_warning "No registry specified, skipping push"
    fi
}

# Clean up
cleanup() {
    print_status "Cleaning up..."
    
    # Stop and remove containers
    docker-compose down
    
    # Remove unused images
    docker image prune -f
    
    print_status "Cleanup completed"
}

# Main function
main() {
    case "${1:-}" in
        "build")
            check_docker
            build_image
            ;;
        "test")
            check_docker
            build_image
            test_image
            ;;
        "compose")
            check_docker
            build_image
            run_compose
            ;;
        "push")
            check_docker
            build_image
            test_image
            push_image
            ;;
        "full")
            check_docker
            build_image
            test_image
            run_compose
            push_image
            cleanup
            ;;
        *)
            echo "Usage: $0 {build|test|compose|push|full} [tag] [registry]"
            echo ""
            echo "Commands:"
            echo "  build       - Build Docker images"
            echo "  test        - Build and test Docker image"
            echo "  compose     - Build and run with Docker Compose"
            echo "  push        - Build, test, and push to registry"
            echo "  full        - Complete build, test, and deployment cycle"
            echo ""
            echo "Arguments:"
            echo "  tag         - Docker image tag (default: latest)"
            echo "  registry    - Docker registry URL (optional)"
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@" 