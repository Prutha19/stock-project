from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

import models
import schemas
from auth import create_access_token, verify_token
from database import engine, get_db
from stock_service import get_stock_price, search_stocks
from utils import hash_password, verify_password

models.Base.metadata.create_all(bind=engine)

app = FastAPI()
security = HTTPBearer()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    email = verify_token(token)
    return email


@app.post("/register")
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    if db.query(models.User).filter(models.User.email == user.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    if db.query(models.User).filter(models.User.username == user.username).first():
        raise HTTPException(status_code=400, detail="Username already taken")

    new_user = models.User(
        username=user.username,
        email=user.email,
        hashed_password=hash_password(user.password),
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {"message": "User created successfully"}


@app.post("/login")
def login(user: schemas.UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()

    if not db_user or not verify_password(user.password, db_user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token({"sub": db_user.email})

    return {
        "access_token": token,
        "token_type": "bearer",
    }


@app.get("/me")
def get_me(current_user: str = Depends(get_current_user), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == current_user).first()

    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "balance": user.balance,
    }


# ---------------- STOCK ----------------
@app.get("/stocks/{symbol}")
def get_stock(symbol: str):
    price = get_stock_price(symbol.upper())

    if price is None:
        raise HTTPException(status_code=404, detail="Stock not found")

    return {
        "symbol": symbol.upper(),
        "price": price,
    }


# ---------------- PORTFOLIO ----------------
@app.get("/portfolio")
def get_portfolio(
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user),
):
    user = db.query(models.User).filter(
        models.User.email == current_user
    ).first()

    portfolio = db.query(models.Portfolio).filter(
        models.Portfolio.user_id == user.id
    ).all()

    result = []

    for item in portfolio:

        stock_data = db.query(models.Stock).filter(
            models.Stock.symbol == item.symbol
        ).first()

        current_price = stock_data.price if stock_data else 0

        transactions = db.query(models.Transaction).filter(
            models.Transaction.user_id == user.id,
            models.Transaction.symbol == item.symbol,
            models.Transaction.type == "buy"
        ).all()

        total_bought = sum(t.quantity for t in transactions)

        total_spent = sum(
            t.quantity * t.price for t in transactions
        )

        avg_buy_price = (
            total_spent / total_bought
            if total_bought > 0 else 0
        )

        total_value = current_price * item.quantity

        invested_amount = avg_buy_price * item.quantity

        profit_loss = total_value - invested_amount

        profit_percent = (
            (profit_loss / invested_amount) * 100
            if invested_amount > 0 else 0
        )

        result.append({
            "symbol": item.symbol,
            "quantity": item.quantity,
            "avg_buy_price": round(avg_buy_price, 2),
            "current_price": round(current_price, 2),
            "total_value": round(total_value, 2),
            "profit_loss": round(profit_loss, 2),
            "profit_percent": round(profit_percent, 2),
        })

    return result


# ---------------- BUY ----------------
@app.post("/buy")
def buy_stock(
    stock: schemas.BuyStock,
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user),
):
    price = get_stock_price(stock.symbol)

    if price is None:
        raise HTTPException(status_code=404, detail="Stock not found")

    total_cost = price * stock.quantity

    user = db.query(models.User).filter(models.User.email == current_user).first()

    if user.balance < total_cost:
        raise HTTPException(status_code=400, detail="Insufficient balance")

    user.balance -= total_cost

    existing = db.query(models.Portfolio).filter(
        models.Portfolio.user_id == user.id,
        models.Portfolio.symbol == stock.symbol,
    ).first()

    if existing:
        existing.quantity += stock.quantity
    else:
        db.add(
            models.Portfolio(
                user_id=user.id,
                symbol=stock.symbol,
                quantity=stock.quantity,
            )
        )

    db.add(
        models.Transaction(
            user_id=user.id,
            symbol=stock.symbol,
            quantity=stock.quantity,
            price=price,
            type="buy",
        )
    )

    db.commit()

    return {
        "message": f"Bought {stock.quantity} shares of {stock.symbol} for Rs. {total_cost}",
        "remaining_balance": user.balance,
    }


# ---------------- SELL ----------------
@app.post("/sell")
def sell_stock(
    stock: schemas.SellStock,
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user),
):
    price = get_stock_price(stock.symbol)

    if price is None:
        raise HTTPException(status_code=404, detail="Stock not found")

    user = db.query(models.User).filter(models.User.email == current_user).first()

    existing = db.query(models.Portfolio).filter(
        models.Portfolio.user_id == user.id,
        models.Portfolio.symbol == stock.symbol,
    ).first()

    if not existing:
        raise HTTPException(status_code=400, detail="You don't own this stock")

    if stock.quantity > existing.quantity:
        raise HTTPException(status_code=400, detail="Not enough shares")

    total_value = price * stock.quantity

    existing.quantity -= stock.quantity

    if existing.quantity == 0:
        db.delete(existing)

    user.balance += total_value

    db.add(
        models.Transaction(
            user_id=user.id,
            symbol=stock.symbol,
            quantity=stock.quantity,
            price=price,
            type="sell",
        )
    )

    db.commit()

    return {
        "message": f"Sold {stock.quantity} shares of {stock.symbol} for Rs. {total_value}",
        "remaining_balance": user.balance,
    }


# ---------------- TRANSACTIONS ----------------
@app.get("/transactions", response_model=list[schemas.TransactionOut])
def get_transactions(
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user),
):
    user = db.query(models.User).filter(models.User.email == current_user).first()

    txns = db.query(models.Transaction).filter(
        models.Transaction.user_id == user.id
    ).order_by(models.Transaction.timestamp.desc()).all()

    return txns


@app.get("/search")
def search(query: str):
    return search_stocks(query)
