# AI Workflow Builder

A professional no-code AI workflow automation platform that allows users to create, edit, and execute complex workflows through an intuitive visual interface.

**🚀 Try it now: [https://casualcanvas.duckdns.org](https://casualcanvas.duckdns.org)**

Experience the AI Workflow Builder in action with full SSL security and production-ready performance.

## 🎬 Platform Demo

![AI Workflow Builder Demo](aiwf-docs/AI_Workflow_Builder_Demo_Video-ezgif.com-optimize.gif)

*See how easy it is to build AI workflows with drag-and-drop simplicity*

## Features

- **Visual Workflow Editor**: Drag-and-drop interface for building workflows
- **Node-based Architecture**: PDF processing, AI summarization, text transformation, and more
- **Real-time Execution**: Run workflows with live progress tracking and logs
- **Professional UI**: Modern, responsive design with collapsible panels and draggable components
- **AI Integration**: OpenAI-powered summarization with configurable types and lengths
- **File Management**: PDF upload and processing capabilities

## Quick Start

### 🌟 **Production Access**
- **Live Application**: [https://casualcanvas.duckdns.org](https://casualcanvas.duckdns.org)
- **API Endpoint**: `https://casualcanvas.duckdns.org/api/`

### 🛠️ **Local Development**

1. **Start the application**:
   ```bash
   docker-compose up -d
   ```

2. **Access the platform locally**:
   - Frontend: http://localhost:3001
   - Backend API: http://localhost:8000

3. **Create your first workflow**:
   - Navigate to "Workflows"
   - Click "Create New Workflow"
   - Drag nodes from the palette to the canvas
   - Connect nodes and configure settings
   - Run your workflow

## Architecture

- **Frontend**: Next.js + React + TypeScript + Tailwind CSS
- **Backend**: FastAPI + Python
- **Database**: MongoDB
- **Message Queue**: Redis + Dramatiq
- **Vector Database**: Qdrant
- **Containerization**: Docker + Docker Compose

## Environment Setup

Create a `.env` file in the root directory:
```env
OPENAI_API_KEY=your_openai_api_key_here
MONGODB_URL=mongodb://mongodb:27017/workflow_db
REDIS_URL=redis://redis:6379
```

## Development

- **Backend**: `backend/apps/api/` - FastAPI application
- **Worker**: `backend/apps/worker/` - Background task processing
- **Frontend**: `frontend/apps/web/` - Next.js application

## 🚀 Production Deployment

The application is deployed at **[casualcanvas.duckdns.org](https://casualcanvas.duckdns.org)** with:

- ✅ **SSL/HTTPS**: Secured with Let's Encrypt certificates
- ✅ **Nginx Reverse Proxy**: Production-grade web server
- ✅ **PM2 Process Manager**: Frontend served with auto-restart
- ✅ **Docker Services**: Backend API, worker, and databases
- ✅ **Automatic SSL Renewal**: Certificates auto-renew via Certbot

### Management Scripts
```bash
# Frontend management
./pm2-frontend.sh status    # Check frontend status
./pm2-frontend.sh restart   # Restart frontend
./pm2-frontend.sh logs      # View frontend logs
./pm2-frontend.sh deploy    # Build and deploy

# Backend management
docker-compose restart api worker  # Restart backend services
docker-compose logs -f api         # View API logs
```

## Node Types

- **PDF**: Extract text from uploaded PDF files
- **AI Summarize**: Generate summaries using OpenAI (brief, detailed, bullet points)
- **Text Transform**: Process and transform text content
- **Output**: Display and export results

## License

Private project - All rights reserved. 