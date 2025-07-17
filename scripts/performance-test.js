#!/usr/bin/env node

const { performance } = require('perf_hooks');
const fetch = require('node-fetch');

// Configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const CONCURRENT_USERS = parseInt(process.env.CONCURRENT_USERS) || 10;
const REQUESTS_PER_USER = parseInt(process.env.REQUESTS_PER_USER) || 100;
const TEST_DURATION = parseInt(process.env.TEST_DURATION) || 60; // seconds

// Test scenarios
const testScenarios = [
  {
    name: 'Health Check',
    url: '/api/healthz',
    method: 'GET',
    headers: {},
    body: null
  },
  {
    name: 'Metrics Endpoint',
    url: '/api/metrics',
    method: 'GET',
    headers: {},
    body: null
  },
  {
    name: 'PWA Manifest',
    url: '/manifest.json',
    method: 'GET',
    headers: {},
    body: null
  }
];

// Performance metrics
let totalRequests = 0;
let successfulRequests = 0;
let failedRequests = 0;
let responseTimes = [];
let startTime = performance.now();

// Generate test user data
function generateTestUser() {
  return {
    username: `testuser_${Math.random().toString(36).substr(2, 9)}`,
    email: `test_${Math.random().toString(36).substr(2, 9)}@example.com`,
    password: 'password123'
  };
}

// Make a single request
async function makeRequest(scenario, userToken = null) {
  const url = `${BASE_URL}${scenario.url}`;
  const headers = { ...scenario.headers };
  
  if (userToken) {
    headers['Authorization'] = `Bearer ${userToken}`;
  }

  const requestStart = performance.now();
  
  try {
    const response = await fetch(url, {
      method: scenario.method,
      headers,
      body: scenario.body ? JSON.stringify(scenario.body) : undefined
    });

    const requestEnd = performance.now();
    const responseTime = requestEnd - requestStart;

    responseTimes.push(responseTime);
    totalRequests++;

    if (response.ok) {
      successfulRequests++;
      return { success: true, responseTime, status: response.status };
    } else {
      failedRequests++;
      return { success: false, responseTime, status: response.status };
    }
  } catch (error) {
    const requestEnd = performance.now();
    const responseTime = requestEnd - requestStart;
    
    responseTimes.push(responseTime);
    totalRequests++;
    failedRequests++;
    
    return { success: false, responseTime, error: error.message };
  }
}

// Simulate a user session
async function simulateUser(userId) {
  const user = generateTestUser();
  let userToken = null;
  const userResults = [];

  // Register and login
  try {
    const registerResponse = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user)
    });

    if (registerResponse.ok) {
      const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: user.username,
          password: user.password
        })
      });

      if (loginResponse.ok) {
        const loginData = await loginResponse.json();
        userToken = loginData.accessToken;
      }
    }
  } catch (error) {
    console.log(`User ${userId}: Failed to authenticate - ${error.message}`);
  }

  // Make requests
  for (let i = 0; i < REQUESTS_PER_USER; i++) {
    const scenario = testScenarios[Math.floor(Math.random() * testScenarios.length)];
    const result = await makeRequest(scenario, userToken);
    userResults.push(result);
    
    // Add some delay between requests
    await new Promise(resolve => setTimeout(resolve, Math.random() * 100));
  }

  return userResults;
}

// Calculate statistics
function calculateStats() {
  const endTime = performance.now();
  const totalTime = (endTime - startTime) / 1000; // seconds
  
  const sortedTimes = responseTimes.sort((a, b) => a - b);
  const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
  const medianResponseTime = sortedTimes[Math.floor(sortedTimes.length / 2)];
  const p95ResponseTime = sortedTimes[Math.floor(sortedTimes.length * 0.95)];
  const p99ResponseTime = sortedTimes[Math.floor(sortedTimes.length * 0.99)];
  
  const requestsPerSecond = totalRequests / totalTime;
  const successRate = (successfulRequests / totalRequests) * 100;

  return {
    totalTime,
    totalRequests,
    successfulRequests,
    failedRequests,
    successRate,
    requestsPerSecond,
    avgResponseTime,
    medianResponseTime,
    p95ResponseTime,
    p99ResponseTime,
    minResponseTime: sortedTimes[0],
    maxResponseTime: sortedTimes[sortedTimes.length - 1]
  };
}

// Print results
function printResults(stats) {
  console.log('\n' + '='.repeat(60));
  console.log('PERFORMANCE TEST RESULTS');
  console.log('='.repeat(60));
  console.log(`Test Duration: ${stats.totalTime.toFixed(2)} seconds`);
  console.log(`Total Requests: ${stats.totalRequests}`);
  console.log(`Successful Requests: ${stats.successfulRequests}`);
  console.log(`Failed Requests: ${stats.failedRequests}`);
  console.log(`Success Rate: ${stats.successRate.toFixed(2)}%`);
  console.log(`Requests/Second: ${stats.requestsPerSecond.toFixed(2)}`);
  console.log('\nResponse Times (ms):');
  console.log(`  Average: ${stats.avgResponseTime.toFixed(2)}`);
  console.log(`  Median: ${stats.medianResponseTime.toFixed(2)}`);
  console.log(`  95th Percentile: ${stats.p95ResponseTime.toFixed(2)}`);
  console.log(`  99th Percentile: ${stats.p99ResponseTime.toFixed(2)}`);
  console.log(`  Min: ${stats.minResponseTime.toFixed(2)}`);
  console.log(`  Max: ${stats.maxResponseTime.toFixed(2)}`);
  console.log('='.repeat(60));

  // Performance thresholds
  const thresholds = {
    successRate: 95,
    avgResponseTime: 500,
    p95ResponseTime: 1000,
    requestsPerSecond: 10
  };

  console.log('\nPERFORMANCE THRESHOLDS:');
  console.log(`Success Rate > ${thresholds.successRate}%: ${stats.successRate >= thresholds.successRate ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Avg Response Time < ${thresholds.avgResponseTime}ms: ${stats.avgResponseTime <= thresholds.avgResponseTime ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`95th Percentile < ${thresholds.p95ResponseTime}ms: ${stats.p95ResponseTime <= thresholds.p95ResponseTime ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Requests/Second > ${thresholds.requestsPerSecond}: ${stats.requestsPerSecond >= thresholds.requestsPerSecond ? '✅ PASS' : '❌ FAIL'}`);

  const allPassed = 
    stats.successRate >= thresholds.successRate &&
    stats.avgResponseTime <= thresholds.avgResponseTime &&
    stats.p95ResponseTime <= thresholds.p95ResponseTime &&
    stats.requestsPerSecond >= thresholds.requestsPerSecond;

  console.log(`\nOverall Result: ${allPassed ? '✅ PASS' : '❌ FAIL'}`);
  
  if (!allPassed) {
    process.exit(1);
  }
}

// Main test execution
async function runPerformanceTest() {
  console.log('Starting Performance Test...');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Concurrent Users: ${CONCURRENT_USERS}`);
  console.log(`Requests per User: ${REQUESTS_PER_USER}`);
  console.log(`Expected Duration: ${TEST_DURATION} seconds`);
  console.log(`Total Expected Requests: ${CONCURRENT_USERS * REQUESTS_PER_USER}`);

  // Start concurrent user simulations
  const userPromises = Array.from({ length: CONCURRENT_USERS }, (_, i) => 
    simulateUser(i + 1)
  );

  // Wait for all users to complete
  await Promise.all(userPromises);

  // Calculate and print results
  const stats = calculateStats();
  printResults(stats);
}

// Handle command line arguments
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Performance Test Script

Usage: node performance-test.js [options]

Options:
  --base-url <url>           Base URL to test (default: http://localhost:3000)
  --users <number>           Number of concurrent users (default: 10)
  --requests <number>        Requests per user (default: 100)
  --duration <seconds>       Expected test duration (default: 60)
  --help, -h                 Show this help message

Environment Variables:
  BASE_URL                   Base URL to test
  CONCURRENT_USERS           Number of concurrent users
  REQUESTS_PER_USER          Requests per user
  TEST_DURATION              Expected test duration

Examples:
  node performance-test.js --users 20 --requests 50
  BASE_URL=https://staging.example.com node performance-test.js
    `);
    process.exit(0);
  }

  // Parse command line arguments
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--base-url':
        process.env.BASE_URL = args[++i];
        break;
      case '--users':
        process.env.CONCURRENT_USERS = args[++i];
        break;
      case '--requests':
        process.env.REQUESTS_PER_USER = args[++i];
        break;
      case '--duration':
        process.env.TEST_DURATION = args[++i];
        break;
    }
  }

  runPerformanceTest().catch(error => {
    console.error('Performance test failed:', error);
    process.exit(1);
  });
}

module.exports = { runPerformanceTest, calculateStats }; 