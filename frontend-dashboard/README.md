# Frontend Dashboard

A modern React-based dashboard for monitoring the Realtime Reconciliation System, providing real-time transaction visibility and system health monitoring.

## Overview

The frontend dashboard is a single-page application built with React and Vite that provides:

- **Real-time Transaction Monitoring**: Live transaction feed with reconciliation status
- **System Health Dashboard**: Metrics and alerts for system components
- **Interactive Charts**: Visual representation of transaction volumes and reconciliation rates
- **Timeline View**: Chronological transaction flow visualization
- **Alert Management**: Real-time alerts and notifications

## Technology Stack

- **React 18**: Modern React with hooks and functional components
- **Vite**: Fast build tool and development server
- **TypeScript**: Type-safe JavaScript development
- **Tailwind CSS**: Utility-first CSS framework
- **shadcn/ui**: Modern UI component library
- **WebSocket**: Real-time data streaming
- **Axios**: HTTP client for API calls

## Architecture

### Components Structure

```
src/
├── components/
│   ├── AlertsTicker.jsx      # Real-time alerts display
│   ├── Charts.jsx           # Data visualization components
│   ├── TimelineView.jsx     # Transaction timeline
│   └── TransactionsTable.jsx # Transaction data table
├── pages/
│   └── Dashboard.jsx        # Main dashboard page
├── services/
│   ├── api.js              # REST API client
│   └── websocket.js        # WebSocket connection manager
├── styles/
│   └── ...                 # Global styles
├── App.jsx                 # Main application component
└── main.jsx               # Application entry point
```

### Data Flow

```
WebSocket Server → WebSocket Service → Components → UI Updates
REST API → API Service → Components → UI Updates
```

## Features

### Real-time Monitoring

- **Live Transaction Feed**: Instant updates as transactions are processed
- **Reconciliation Status**: Color-coded status indicators (Matched/Mismatched/Missing)
- **Alert Notifications**: Real-time alerts for system issues
- **Connection Status**: WebSocket connection health monitoring

### Dashboard Views

- **Transaction Table**: Paginated, sortable transaction list with filtering
- **Charts & Metrics**: Visual charts for transaction volumes and success rates
- **Timeline View**: Chronological visualization of transaction flows
- **System Health**: Component status and performance metrics

### Interactive Features

- **Search & Filter**: Advanced filtering by status, severity, date ranges
- **Pagination**: Efficient handling of large transaction datasets
- **Responsive Design**: Mobile-friendly interface
- **Dark/Light Theme**: Theme switching capability

## Configuration

### Environment Variables

Create a `.env` file in the project root:

```env
# API Configuration
VITE_API_BASE_URL=http://localhost:3001
VITE_WS_BASE_URL=ws://localhost:8080

# Application Settings
VITE_APP_TITLE=Realtime Reconciliation Dashboard
VITE_REFRESH_INTERVAL=30000  # 30 seconds
```

### Build Configuration

The application uses Vite for building and development. Configuration is in `vite.config.js`:

```javascript
export default defineConfig({
  server: {
    port: 8080,
    host: true
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
})
```

## API Integration

### REST API Endpoints

The dashboard connects to the reconciliation engine API:

```javascript
// Recent transactions
GET /api/transactions/recent?limit=50

// Transaction details
GET /api/transactions/:id

// System metrics
GET /api/metrics

// Search transactions
GET /api/transactions/search?status=matched&limit=100

// Statistics for charts
GET /api/transactions/stats
```

### WebSocket Events

Real-time updates via WebSocket connection:

```javascript
// Transaction reconciliation events
{
  type: 'reconciliation-event',
  transactionId: 'TXN_20231201_001',
  classification: 'MATCHED',
  severity: 'LOW',
  summary: 'Transaction successfully reconciled'
}

// System statistics
{
  type: 'stats',
  data: {
    activeConnections: 5,
    timestamp: '2023-12-01T10:30:30.000Z'
  }
}
```

## Development

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Development Scripts

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0"
  }
}
```

### Code Structure

#### Components

**AlertsTicker.jsx**
- Displays real-time alerts
- Auto-scrolling ticker
- Severity-based color coding

**Charts.jsx**
- Transaction volume charts
- Success rate visualizations
- Real-time data updates

**TimelineView.jsx**
- Chronological transaction display
- Interactive timeline controls
- Status-based filtering

**TransactionsTable.jsx**
- Paginated transaction list
- Sortable columns
- Advanced filtering

#### Services

**api.js**
```javascript
// REST API client with error handling
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 10000
});

// Request/response interceptors
api.interceptors.response.use(
  response => response,
  error => handleApiError(error)
);
```

**websocket.js**
```javascript
// WebSocket connection manager
class WebSocketService {
  connect() {
    this.ws = new WebSocket(import.meta.env.VITE_WS_BASE_URL);
    this.ws.onmessage = this.handleMessage.bind(this);
    this.ws.onclose = this.handleReconnect.bind(this);
  }

  handleMessage(event) {
    const data = JSON.parse(event.data);
    this.emit(data.type, data);
  }
}
```

## UI Components

### Design System

The application uses shadcn/ui components with Tailwind CSS:

- **Buttons**: Primary, secondary, and danger variants
- **Tables**: Sortable, paginated data tables
- **Charts**: Recharts-based visualizations
- **Alerts**: Toast notifications and status alerts
- **Cards**: Information display containers

### Responsive Design

- **Mobile-first approach**: Optimized for mobile devices
- **Breakpoint system**: sm/md/lg/xl responsive classes
- **Flexible layouts**: Grid and flexbox-based layouts

## Performance Optimization

### Code Splitting

- **Route-based splitting**: Lazy loading of page components
- **Component splitting**: Large components loaded on demand

### Caching Strategy

- **API response caching**: React Query for server state management
- **WebSocket buffering**: Message queuing during reconnection
- **Static asset caching**: Vite build optimization

### Memory Management

- **Component cleanup**: Proper WebSocket cleanup on unmount
- **Event listener management**: Remove listeners to prevent memory leaks
- **Data pagination**: Limit DOM nodes for large datasets

## Testing

### Testing Setup

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

### Test Structure

```
src/
├── __tests__/
│   ├── components/
│   ├── services/
│   └── utils/
└── test/
    ├── setup.ts
    └── utils.ts
```

## Deployment

### Docker Configuration

```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
```

### Build Process

```bash
# Production build
npm run build

# Serve static files
npm run preview
```

### Environment Configuration

- **Development**: Local API endpoints, debug logging
- **Staging**: Remote API endpoints, error reporting
- **Production**: Optimized builds, CDN assets

## Monitoring & Analytics

### Error Tracking

- **Console logging**: Development error logging
- **Error boundaries**: React error boundary components
- **User feedback**: Error reporting forms

### Performance Monitoring

- **Web Vitals**: Core Web Vitals tracking
- **API latency**: Request/response time monitoring
- **WebSocket health**: Connection status and reconnection metrics

## Troubleshooting

### Common Issues

**WebSocket connection fails:**
- Check WebSocket server is running on port 8080
- Verify CORS configuration
- Check network connectivity

**API requests fail:**
- Verify API server is running on port 3001
- Check CORS headers
- Validate API endpoints

**Slow performance:**
- Check browser developer tools for bottlenecks
- Verify data pagination is working
- Monitor WebSocket message frequency

**Build failures:**
- Clear node_modules and reinstall
- Check Node.js version compatibility
- Verify environment variables

### Debug Mode

Enable debug logging in development:

```javascript
// In console
localStorage.setItem('debug', 'dashboard:*');

// Or in code
if (import.meta.env.DEV) {
  console.log('Debug mode enabled');
}
```

## Contributing

### Code Style

- **ESLint**: Code linting with React rules
- **Prettier**: Automatic code formatting
- **TypeScript**: Strict type checking
- **Husky**: Pre-commit hooks

### Development Workflow

1. Create feature branch
2. Make changes with tests
3. Run linting and tests
4. Submit pull request
5. Code review and merge

## API Reference

### Component Props

#### TransactionsTable Props

```typescript
interface TransactionsTableProps {
  transactions: Transaction[];
  loading: boolean;
  onPageChange: (page: number) => void;
  onSort: (column: string, direction: 'asc' | 'desc') => void;
  filters: FilterOptions;
}
```

#### AlertTicker Props

```typescript
interface AlertTickerProps {
  alerts: Alert[];
  maxItems?: number;
  autoScroll?: boolean;
}
```

### Custom Hooks

```typescript
// WebSocket connection hook
const useWebSocket = (url: string) => {
  // Connection logic
};

// API data fetching hook
const useTransactions = (filters: FilterOptions) => {
  // Data fetching logic
};
```

## Browser Support

- **Chrome**: Latest 2 versions
- **Firefox**: Latest 2 versions
- **Safari**: Latest 2 versions
- **Edge**: Latest 2 versions

## Security Considerations

- **HTTPS**: Always serve over HTTPS in production
- **CORS**: Proper CORS configuration for API access
- **Input validation**: Sanitize all user inputs
- **WebSocket security**: Validate WebSocket origins
