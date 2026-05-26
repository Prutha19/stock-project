# Stock Exchange Simulation System

Full-stack stock exchange simulation built with FastAPI, SQLite, SQLAlchemy, JWT authentication, and React.

## Features

- User registration and login with JWT authentication
- Simulated live stock price updates with seeded market data
- Buy and sell stock orders against current simulated prices
- Portfolio holdings, cash balance, realized and unrealized profit/loss
- Transaction history for every trade
- Portfolio performance chart and stock price chart
- Clean backend structure with routers, services, models, schemas, and dependencies

## Project Structure

```text
stock-project/
├── client/                # React + Vite frontend
└── server/                # FastAPI backend
    └── app/
        ├── api/
        ├── core/
        ├── data/
        ├── db/
        ├── dependencies/
        ├── models/
        ├── schemas/
        └── services/
```

## Backend Setup

From [server](/d:/GitProjects/stock/stock-project/server):

```bash
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Backend URLs:

- `http://127.0.0.1:8000/docs`
- `http://127.0.0.1:8000/api/auth/register`
- `http://127.0.0.1:8000/api/auth/login`

The backend uses a fresh SQLite file named `stock_exchange_simulation.db` by default so it does not conflict with the older leftover database in this repo.

## Frontend Setup

From [client](/d:/GitProjects/stock/stock-project/client):

```bash
npm install
npm run dev
```

Frontend URL:

- `http://127.0.0.1:5173`

If needed, copy `client/.env.example` and point `VITE_API_BASE_URL` to your backend.

## Main API Endpoints

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/market/stocks`
- `GET /api/market/stocks/{symbol}`
- `GET /api/market/stocks/{symbol}/history`
- `GET /api/market/overview`
- `POST /api/market/refresh`
- `GET /api/portfolio`
- `GET /api/portfolio/performance`
- `POST /api/trades`
- `GET /api/transactions`

## Example Register Payload

```json
{
  "email": "demo@example.com",
  "username": "demo_trader",
  "full_name": "Demo Trader",
  "password": "secret123"
}
```

## Example Trade Payload

```json
{
  "symbol": "AAPL",
  "side": "BUY",
  "quantity": 5
}
```
