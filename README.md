# UM Drive Frontend

Modern React + TypeScript frontend for the UM Drive cloud file storage system.

## Features

- 🔐 **Authentication**: Login, register, and JWT token management
- 📁 **File Management**: Upload, download, list, and delete files
- 📊 **Real-Time Metrics**: Prometheus integration with auto-scaler monitoring
- 🎨 **Modern UI**: TailwindCSS with responsive design
- ⚡ **Fast Development**: Vite with HMR and TypeScript

## Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **TailwindCSS** - Styling
- **React Query** - Data fetching and caching
- **React Router** - Client-side routing
- **Axios** - HTTP client
- **Recharts** - Metrics visualization
- **Lucide React** - Icon library

## Getting Started

### Development

```bash
# Install dependencies
npm install

# Start dev server (http://localhost:3000)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Docker Deployment

```bash
# Build the Docker image
docker build -t umdrive-frontend .

# Run the container
docker run -p 3000:80 umdrive-frontend
```

## Environment Configuration

The frontend connects to the backend APIs via proxy configuration in `vite.config.ts`:

- `/auth` → Authentication service (port 30000)
- `/api` → File service via Traefik (port 80, Host: files.localhost)

For production deployment, update the nginx configuration in `nginx.conf` to point to the correct backend services.

## Project Structure

```
src/
├── components/
│   ├── Navbar.tsx          # Navigation bar with logout
│   └── ProtectedRoute.tsx  # Route guard for authenticated routes
├── pages/
│   ├── Login.tsx           # Login page
│   ├── Register.tsx        # Registration page
│   ├── Dashboard.tsx       # Main dashboard
│   ├── Files.tsx           # File management interface
│   └── Metrics.tsx         # Prometheus metrics dashboard
├── lib/
│   ├── api.ts              # Axios instance with interceptors
│   ├── auth.ts             # Authentication service
│   └── files.ts            # File service
├── App.tsx                 # Main app component with routing
├── main.tsx                # App entry point
└── index.css               # TailwindCSS imports and global styles
```

## Features Overview

### Authentication
- Login with username/password
- Register new account
- JWT token stored in localStorage
- Automatic redirect on 401 responses
- Logout functionality

### File Management
- Upload files (drag & drop or file picker)
- List all uploaded files with metadata
- Download files
- Delete files with confirmation
- Real-time file list updates

### Metrics Dashboard
- Active container count
- CPU usage percentage
- Requests per second (RPS)
- Auto-scaler status and thresholds
- Service health indicators
- Auto-refresh every 5 seconds

## Backend Integration

The frontend expects the following backend endpoints:

**Authentication (port 30000):**
- `POST /authenticate` - Login
- `POST /register` - Register
- `PUT /change-password` - Change password

**File Service (port 80, Host: files.localhost):**
- `GET /api/v1/files` - List files
- `POST /api/v1/files` - Upload file
- `GET /api/v1/files/{id}` - Download file
- `DELETE /api/v1/files/{id}` - Delete file

**Prometheus (port 9090):**
- `GET /api/v1/query` - Query metrics

## Notes

- Prometheus metrics require direct access to port 9090 or SSH tunnel setup
- All API requests include JWT token in Authorization header
- File service requires "Host: files.localhost" header (handled by proxy)
- Supports Portuguese locale for date/time formatting

## License

ITI 2025-26 Course Project - University of Minho
