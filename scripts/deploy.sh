#!/bin/bash

# AI Health Companion Deployment Script
# This script handles local testing and manual deployments

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

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

# Check if required tools are installed
check_dependencies() {
    print_status "Checking dependencies..."
    
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed"
        exit 1
    fi
    
    if ! command -v pnpm &> /dev/null; then
        print_warning "pnpm is not installed, using npm instead"
        PNPM_CMD="npm run"
    else
        PNPM_CMD="pnpm"
    fi
    
    if ! command -v docker &> /dev/null; then
        print_warning "Docker is not installed - some features may not work"
    fi
    
    print_status "Dependencies check passed"
}

# Run tests
run_tests() {
    print_status "Running tests..."
    
    # Unit tests
    print_status "Running unit tests..."
    $PNPM_CMD test:unit
    
    # API tests
    print_status "Running API tests..."
    $PNPM_CMD test:api
    
    # UI tests
    print_status "Running UI tests..."
    $PNPM_CMD test:ui
    
    # Database tests
    print_status "Running database tests..."
    $PNPM_CMD test:db
    
    print_status "All tests passed!"
}

# Build application
build_app() {
    print_status "Building application..."
    
    # Clean previous build
    rm -rf .next
    
    # Install dependencies
    npm install --frozen-lockfile
    
    # Build
    npm run build
    
    print_status "Build completed successfully!"
}

# Run E2E tests
run_e2e_tests() {
    print_status "Running E2E tests..."
    
    # Install Playwright browsers if not already installed
    npx playwright install --with-deps
    
    # Run E2E tests
    $PNPM_CMD test:e2e
    
    print_status "E2E tests completed!"
}

# Run Lighthouse audit
run_lighthouse() {
    print_status "Running Lighthouse audit..."
    
    # Start the application
    npm start &
    SERVER_PID=$!
    
    # Wait for server to start
    sleep 30
    
    # Run Lighthouse
    npm run lighthouse
    
    # Stop the server
    kill $SERVER_PID
    
    print_status "Lighthouse audit completed!"
}

# Deploy to staging
deploy_staging() {
    print_status "Deploying to staging..."
    
    # Check if Vercel CLI is installed
    if ! command -v vercel &> /dev/null; then
        print_error "Vercel CLI is not installed. Install with: npm i -g vercel"
        exit 1
    fi
    
    # Deploy to Vercel
    vercel --prod --env DATABASE_URL=$STAGING_DATABASE_URL \
           --env JWT_SECRET=$STAGING_JWT_SECRET \
           --env JWT_REFRESH_SECRET=$STAGING_JWT_REFRESH_SECRET
    
    print_status "Staging deployment completed!"
}

# Deploy to production
deploy_production() {
    print_status "Deploying to production..."
    
    # Check if Vercel CLI is installed
    if ! command -v vercel &> /dev/null; then
        print_error "Vercel CLI is not installed. Install with: npm i -g vercel"
        exit 1
    fi
    
    # Deploy to Vercel
    vercel --prod --env DATABASE_URL=$PRODUCTION_DATABASE_URL \
           --env JWT_SECRET=$PRODUCTION_JWT_SECRET \
           --env JWT_REFRESH_SECRET=$PRODUCTION_JWT_REFRESH_SECRET
    
    print_status "Production deployment completed!"
}

# Main function
main() {
    case "${1:-}" in
        "test")
            check_dependencies
            run_tests
            ;;
        "build")
            check_dependencies
            build_app
            ;;
        "e2e")
            check_dependencies
            build_app
            run_e2e_tests
            ;;
        "lighthouse")
            check_dependencies
            build_app
            run_lighthouse
            ;;
        "staging")
            check_dependencies
            run_tests
            build_app
            run_e2e_tests
            run_lighthouse
            deploy_staging
            ;;
        "production")
            check_dependencies
            run_tests
            build_app
            run_e2e_tests
            run_lighthouse
            deploy_production
            ;;
        "full")
            check_dependencies
            run_tests
            build_app
            run_e2e_tests
            run_lighthouse
            ;;
        *)
            echo "Usage: $0 {test|build|e2e|lighthouse|staging|production|full}"
            echo ""
            echo "Commands:"
            echo "  test        - Run all tests"
            echo "  build       - Build the application"
            echo "  e2e         - Run E2E tests"
            echo "  lighthouse  - Run Lighthouse audit"
            echo "  staging     - Deploy to staging"
            echo "  production  - Deploy to production"
            echo "  full        - Run full CI pipeline locally"
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@" 