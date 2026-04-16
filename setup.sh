#!/bin/bash
# MoneyPet setup script

set -e

echo "🐾 Setting up MoneyPet..."

# Backend
echo "📦 Installing Python dependencies..."
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt -q

if [ ! -f .env ]; then
  cp .env.example .env
  echo "⚠️  Created backend/.env — add your LOCUS_API_KEY and OPENAI_API_KEY"
fi

cd ..

# Frontend
echo "📦 Installing Node dependencies..."
cd frontend
npm install --silent

echo ""
echo "✅ Setup complete!"
echo ""
echo "To run:"
echo "  Terminal 1: cd backend && source venv/bin/activate && python main.py"
echo "  Terminal 2: cd frontend && npm run dev"
echo ""
echo "Then open http://localhost:3000"
echo ""
echo "🔑 Don't forget to set LOCUS_API_KEY in backend/.env"
echo "   Get a free key at https://beta.paywithlocus.com (code: BETA-ACCESS-DOCS)"
