#!/bin/bash

echo "🚀 Starting Eventful Fullstack Application..."
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
echo "📋 Checking prerequisites..."

if ! command_exists docker; then
    echo -e "${RED}❌ Docker is not installed${NC}"
    echo "Please install Docker Desktop: https://www.docker.com/products/docker-desktop/"
    exit 1
fi

if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running${NC}"
    echo "Please start Docker Desktop and try again"
    exit 1
fi

echo -e "${GREEN}✅ Docker is installed and running${NC}"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}📝 Creating .env file from template...${NC}"
    if [ -f .env.docker ]; then
        cp .env.docker .env
    elif [ -f .env.example ]; then
        cp .env.example .env
    fi
    echo -e "${GREEN}✅ .env file created${NC}"
    echo -e "${YELLOW}⚠️  Please edit .env with your credentials (especially Paystack keys)${NC}"
    echo ""
fi

# Stop any existing containers
echo "🛑 Stopping any existing containers..."
docker-compose down 2>/dev/null

# Start services
echo ""
echo "🐳 Starting Docker containers..."
docker-compose up -d

# Wait for services to be ready
echo ""
echo "⏳ Waiting for services to be ready..."
sleep 10

# Check service health
echo ""
echo "🏥 Checking service health..."

# Check backend
if curl -s http://localhost:3000/health > /dev/null; then
    echo -e "${GREEN}✅ Backend is healthy${NC}"
else
    echo -e "${RED}❌ Backend is not responding${NC}"
    echo "Check logs with: docker-compose logs backend"
fi

# Check frontend
if curl -s http://localhost:3001 > /dev/null; then
    echo -e "${GREEN}✅ Frontend is accessible${NC}"
else
    echo -e "${RED}❌ Frontend is not responding${NC}"
    echo "Check logs with: docker-compose logs frontend"
fi

# Check postgres
if docker-compose exec -T postgres pg_isready -U eventful > /dev/null 2>&1; then
    echo -e "${GREEN}✅ PostgreSQL is ready${NC}"
else
    echo -e "${RED}❌ PostgreSQL is not ready${NC}"
    echo "Check logs with: docker-compose logs postgres"
fi

# Check redis
if docker-compose exec -T redis redis-cli ping | grep -q PONG; then
    echo -e "${GREEN}✅ Redis is ready${NC}"
else
    echo -e "${RED}❌ Redis is not ready${NC}"
    echo "Check logs with: docker-compose logs redis"
fi

# Display service status
echo ""
echo "📊 Service Status:"
docker-compose ps

echo ""
echo -e "${GREEN}✨ Eventful Fullstack Application is now running!${NC}"
echo ""
echo "📱 Access Points:"
echo -e "   ${GREEN}Frontend:${NC}    http://localhost:3001"
echo -e "   ${GREEN}Backend API:${NC} http://localhost:3000"
echo -e "   ${GREEN}API Docs:${NC}    http://localhost:3000/api-docs"
echo ""
echo "📚 Useful Commands:"
echo "   View logs:        docker-compose logs -f"
echo "   Stop services:    docker-compose down"
echo "   Restart:          docker-compose restart"
echo "   Seed database:    docker-compose exec backend npm run seed"
echo "   Backend shell:    docker-compose exec backend sh"
echo "   Database shell:   docker-compose exec postgres psql -U eventful -d eventful"
echo ""
echo "🎯 Next Steps:"
echo "   1. Visit http://localhost:3001"
echo "   2. Click 'Get Started' to register"
echo "   3. Choose 'Creator' to create events or 'Eventee' to attend"
echo "   4. Start exploring!"
echo ""
echo -e "${YELLOW}💡 Tip: Run 'docker-compose logs -f' to see live logs${NC}"
echo ""
