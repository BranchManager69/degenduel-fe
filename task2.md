# RPC Benchmark System Frontend Implementation Guide

This document provides comprehensive instructions for implementing the frontend components that interact with the RPC Benchmark System API. This system allows administrators to view and trigger performance benchmarks for various RPC providers.

## Target Audience

- Frontend developers implementing admin and superadmin dashboard components
- UI/UX designers planning dashboard layouts
- QA engineers testing the benchmark system

## Component Placement

The RPC benchmark system should be integrated in two places:

1. **Admin Dashboard**: Add a section called "RPC Performance" in the admin dashboard that displays benchmark results in a detailed format.

2. **Superadmin Dashboard**: Add the same section with additional controls for triggering new benchmark tests.

3. **Footer Component (Admin & Superadmin Only)**: Add a compact version in the footer when the user is authenticated as an admin or superadmin.

## API Endpoints

The RPC benchmark system exposes the following endpoints:

### 1. Get Latest Benchmark Results

```
GET /admin/metrics/rpc-benchmarks/latest
```

**Authentication Required**: Yes (Admin or Superadmin)

**Request Parameters**: None

**Response Format**:

```json
{
  "success": true,
  "test_run_id": "string",
  "timestamp": "2025-04-01T12:34:56.789Z",
  "methods": {
    "getLatestBlockhash": {
      "providers": [
        {
          "provider": "BranchRPC",
          "median_latency": 45.2,
          "avg_latency": 48.7,
          "min_latency": 38.1,
          "max_latency": 68.3,
          "success_count": 50,
          "failure_count": 0
        },
        {
          "provider": "Helius",
          "median_latency": 52.8,
          "avg_latency": 55.3,
          "min_latency": 42.5,
          "max_latency": 72.1,
          "success_count": 49,
          "failure_count": 1,
          "percent_slower": 16.8
        }
      ]
    },
    "getBalance": {
      "providers": [
        // Similar structure for each method
      ]
    }
    // Other methods...
  },
  "overall_fastest_provider": "BranchRPC",
  "performance_advantage": [
    {
      "method": "getLatestBlockhash",
      "vs_second_place": 16.8,
      "vs_third_place": 30.2,
      "second_place_provider": "Helius",
      "third_place_provider": "SolanaGPT"
    }
    // Additional advantage metrics...
  ]
}
```

**Error Responses**:
- 404: No benchmark data found
- 500: Error retrieving RPC benchmark results

### 2. Trigger New Benchmark Test

```
POST /admin/metrics/rpc-benchmarks/trigger
```

**Authentication Required**: Yes (Superadmin only)

**Request Parameters**: None

**Response Format**:

```json
{
  "success": true,
  "message": "RPC benchmark test triggered successfully. Results will be available shortly."
}
```

**Error Responses**:
- 403: Not authorized (non-superadmin)
- 500: Error triggering RPC benchmark

## Frontend Implementation Details

### 1. Admin Dashboard Component

Create a component for the admin dashboard with the following features:

```jsx
// RPCBenchmarkDashboard.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Card, CardContent, Typography, Table, 
  TableBody, TableCell, TableHead, TableRow,
  CircularProgress, Alert
} from '@mui/material'; // Use your UI framework of choice

const RPCBenchmarkDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get('/admin/metrics/rpc-benchmarks/latest');
        setData(response.data);
        setError(null);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load benchmark data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
    
    // Refresh every 5 minutes
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);
  
  if (loading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!data) return <Alert severity="info">No benchmark data available</Alert>;
  
  return (
    <Card>
      <CardContent>
        <Typography variant="h5">RPC Performance Benchmark</Typography>
        <Typography variant="body2" color="textSecondary">
          Last updated: {new Date(data.timestamp).toLocaleString()}
        </Typography>
        
        <Typography variant="h6" sx={{ mt: 2 }}>
          Overall Fastest Provider: {data.overall_fastest_provider}
        </Typography>
        
        {/* Performance advantage section */}
        {data.performance_advantage.length > 0 && (
          <>
            <Typography variant="h6" sx={{ mt: 2 }}>Performance Advantage</Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Method</TableCell>
                  <TableCell>vs 2nd Place</TableCell>
                  <TableCell>vs 3rd Place</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.performance_advantage.map((advantage) => (
                  <TableRow key={advantage.method}>
                    <TableCell>{advantage.method}</TableCell>
                    <TableCell>
                      {advantage.vs_second_place.toFixed(1)}% faster than {advantage.second_place_provider}
                    </TableCell>
                    <TableCell>
                      {advantage.vs_third_place 
                        ? `${advantage.vs_third_place.toFixed(1)}% faster than ${advantage.third_place_provider}`
                        : 'N/A'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </>
        )}
        
        {/* Method details section */}
        <Typography variant="h6" sx={{ mt: 2 }}>Method Details</Typography>
        {Object.entries(data.methods).map(([method, details]) => (
          <div key={method}>
            <Typography variant="subtitle1" sx={{ mt: 1 }}>{method}</Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Provider</TableCell>
                  <TableCell>Median (ms)</TableCell>
                  <TableCell>Avg (ms)</TableCell>
                  <TableCell>Min (ms)</TableCell>
                  <TableCell>Max (ms)</TableCell>
                  <TableCell>Success Rate</TableCell>
                  <TableCell>Comparison</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {details.providers.map((provider, idx) => (
                  <TableRow 
                    key={provider.provider}
                    sx={{ 
                      backgroundColor: idx === 0 ? 'rgba(46, 125, 50, 0.1)' : 'inherit' 
                    }}
                  >
                    <TableCell>{provider.provider}</TableCell>
                    <TableCell>{provider.median_latency.toFixed(1)}</TableCell>
                    <TableCell>{provider.avg_latency.toFixed(1)}</TableCell>
                    <TableCell>{provider.min_latency.toFixed(1)}</TableCell>
                    <TableCell>{provider.max_latency.toFixed(1)}</TableCell>
                    <TableCell>
                      {(provider.success_count / (provider.success_count + provider.failure_count) * 100).toFixed(1)}%
                    </TableCell>
                    <TableCell>
                      {provider.percent_slower 
                        ? `${provider.percent_slower.toFixed(1)}% slower` 
                        : (idx === 0 ? 'Fastest' : 'N/A')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default RPCBenchmarkDashboard;
```

### 2. Superadmin Dashboard Component

Extend the admin component to include triggering capability:

```jsx
// RPCBenchmarkSuperAdminDashboard.jsx
import React from 'react';
import RPCBenchmarkDashboard from './RPCBenchmarkDashboard';
import axios from 'axios';
import { Button, Snackbar, Alert } from '@mui/material';

const RPCBenchmarkSuperAdminDashboard = () => {
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'info'
  });
  
  const triggerBenchmark = async () => {
    setLoading(true);
    try {
      const response = await axios.post('/admin/metrics/rpc-benchmarks/trigger');
      setNotification({
        open: true,
        message: response.data.message,
        severity: 'success'
      });
    } catch (error) {
      setNotification({
        open: true,
        message: error.response?.data?.message || 'Failed to trigger benchmark',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleCloseNotification = () => {
    setNotification({ ...notification, open: false });
  };

  return (
    <>
      <Button 
        variant="contained" 
        color="primary" 
        onClick={triggerBenchmark}
        disabled={loading}
        sx={{ mb: 2 }}
      >
        {loading ? 'Triggering...' : 'Trigger New Benchmark'}
      </Button>
      
      <RPCBenchmarkDashboard />
      
      <Snackbar 
        open={notification.open} 
        autoHideDuration={6000} 
        onClose={handleCloseNotification}
      >
        <Alert onClose={handleCloseNotification} severity={notification.severity}>
          {notification.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default RPCBenchmarkSuperAdminDashboard;
```

### 3. Footer Component (Admin & Superadmin Only)

Create a simplified footer component that shows a summary of RPC provider performance:

```jsx
// RPCBenchmarkFooter.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Stack, Chip, Tooltip, CircularProgress } from '@mui/material';

const RPCBenchmarkFooter = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get('/admin/metrics/rpc-benchmarks/latest');
        setData(response.data);
      } catch (err) {
        console.error('Failed to load RPC data for footer:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
    // Refresh every 10 minutes
    const interval = setInterval(fetchData, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);
  
  if (loading) return <CircularProgress size={20} />;
  if (!data) return null;
  
  // Get unique providers
  const providers = new Set();
  Object.values(data.methods).forEach(method => {
    method.providers.forEach(provider => {
      providers.add(provider.provider);
    });
  });
  
  // Calculate average latency for each provider across all methods
  const providerStats = {};
  providers.forEach(provider => {
    let totalLatency = 0;
    let count = 0;
    
    Object.values(data.methods).forEach(method => {
      const providerData = method.providers.find(p => p.provider === provider);
      if (providerData) {
        totalLatency += providerData.median_latency;
        count++;
      }
    });
    
    providerStats[provider] = {
      avgLatency: count > 0 ? (totalLatency / count).toFixed(1) : 'N/A',
      isFastest: provider === data.overall_fastest_provider
    };
  });
  
  return (
    <Stack direction="row" spacing={1} sx={{ p: 1 }}>
      <Tooltip title="RPC Performance">
        <Chip label="RPC:" size="small" />
      </Tooltip>
      
      {Object.entries(providerStats).map(([provider, stats]) => (
        <Tooltip 
          key={provider}
          title={`${provider}: Avg ${stats.avgLatency}ms across all methods`}
        >
          <Chip
            label={`${provider} ${stats.avgLatency}ms`}
            size="small"
            color={stats.isFastest ? "success" : "default"}
            variant={stats.isFastest ? "filled" : "outlined"}
          />
        </Tooltip>
      ))}
    </Stack>
  );
};

export default RPCBenchmarkFooter;
```

## Integration Instructions

1. **Add to Admin Dashboard**:
   ```jsx
   // In your admin dashboard layout
   import RPCBenchmarkDashboard from './components/RPCBenchmarkDashboard';
   
   // Inside your dashboard component:
   <section>
     <h2>System Metrics</h2>
     <RPCBenchmarkDashboard />
   </section>
   ```

2. **Add to Superadmin Dashboard**:
   ```jsx
   // In your superadmin dashboard layout
   import RPCBenchmarkSuperAdminDashboard from './components/RPCBenchmarkSuperAdminDashboard';
   
   // Inside your dashboard component:
   <section>
     <h2>System Metrics</h2>
     <RPCBenchmarkSuperAdminDashboard />
   </section>
   ```

3. **Add to Footer Component (conditional on admin/superadmin role)**:
   ```jsx
   // In your app layout component
   import RPCBenchmarkFooter from './components/RPCBenchmarkFooter';
   
   // Inside your app layout component:
   const AppLayout = ({ children, user }) => {
     const isAdmin = user && (user.role === 'admin' || user.role === 'superadmin');
   
     return (
       <div className="app-container">
         <header>...</header>
         <main>{children}</main>
         <footer>
           {isAdmin && <RPCBenchmarkFooter />}
           {/* Rest of footer */}
         </footer>
       </div>
     );
   };
   ```

## Visualization Guidelines

1. **Colors**:
   - Use green highlights for the fastest provider in each category
   - Use a neutral color for other providers
   - Use red highlights for providers with error rates > 5%

2. **Charts**:
   - Consider adding bar charts to visually compare latencies
   - Add trend charts if historical data becomes available
   - Use consistent scaling across charts for accurate visual comparison

3. **Responsive Design**:
   - Implement responsive tables that collapse into cards on mobile
   - For the footer, consider hiding some providers on smaller screens
   - Enable horizontal scrolling for tables on mobile

## Testing Requirements

1. Test the components with various data states:
   - Empty data state
   - Single provider state
   - Multiple providers state
   - Error state

2. Test the superadmin trigger functionality:
   - Successful trigger
   - Error handling
   - UI feedback during trigger process

3. Test on different screen sizes to ensure responsiveness.

## Accessibility Considerations

1. Ensure proper color contrast for all text and UI elements
2. Add proper ARIA labels for interactive elements
3. Ensure keyboard navigation support throughout the components
4. Include screen reader friendly descriptions for charts and tables

## Conclusion

This implementation guide provides a comprehensive blueprint for integrating the RPC Benchmark System into the DegenDuel admin and superadmin dashboards. By following these instructions, the frontend team can create a seamless user experience that allows administrators to monitor RPC performance and make informed decisions about provider selection.

For any questions or clarifications, please contact the backend team.