#!/bin/bash

# PM2 Frontend Management Script for AI Workflow Builder

FRONTEND_DIR="/home/tutorbuddy/htdocs/tutorbuddy.co/cc/frontend/apps/web"
APP_NAME="aiwf-frontend"

case "$1" in
    start)
        echo "🚀 Starting frontend with PM2..."
        cd $FRONTEND_DIR
        pm2 start ecosystem.config.js
        ;;
    stop)
        echo "⏹️  Stopping frontend..."
        pm2 stop $APP_NAME
        ;;
    restart)
        echo "🔄 Restarting frontend..."
        pm2 restart $APP_NAME
        ;;
    reload)
        echo "♻️  Reloading frontend (zero-downtime)..."
        pm2 reload $APP_NAME
        ;;
    status)
        echo "📊 Frontend status:"
        pm2 status $APP_NAME
        ;;
    logs)
        echo "📋 Frontend logs (Ctrl+C to exit):"
        pm2 logs $APP_NAME
        ;;
    monitor)
        echo "📈 Opening PM2 monitor..."
        pm2 monit
        ;;
    build)
        echo "🔨 Building frontend..."
        cd $FRONTEND_DIR
        npm run build
        ;;
    deploy)
        echo "🚀 Building and deploying frontend..."
        cd $FRONTEND_DIR
        npm run build
        pm2 restart $APP_NAME
        ;;
    *)
        echo "🤖 AI Workflow Builder - Frontend PM2 Manager"
        echo ""
        echo "Usage: $0 {start|stop|restart|reload|status|logs|monitor|build|deploy}"
        echo ""
        echo "Commands:"
        echo "  start   - Start the frontend with PM2"
        echo "  stop    - Stop the frontend"
        echo "  restart - Restart the frontend"
        echo "  reload  - Zero-downtime reload"
        echo "  status  - Show frontend status"
        echo "  logs    - Show frontend logs"
        echo "  monitor - Open PM2 monitor"
        echo "  build   - Build the frontend"
        echo "  deploy  - Build and restart frontend"
        echo ""
        exit 1
        ;;
esac

exit 0 