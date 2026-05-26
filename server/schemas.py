from pydantic import BaseModel, ConfigDict, EmailStr
from datetime import datetime

class UserBase(BaseModel):
    username: str
    email: EmailStr


class UserCreate(UserBase):
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(UserBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

class StockOut(BaseModel):
    symbol: str
    price: float

class PortfolioOut(BaseModel):
    symbol: str
    quantity: int
    current_price: float
    total_value: float

class BuyStock(BaseModel):
    symbol: str
    quantity: int        

class SellStock(BaseModel):
    symbol: str
    quantity: int

class TransactionOut(BaseModel):
    symbol: str
    quantity: int
    price: float
    type: str
    timestamp: datetime

class PortfolioOut(BaseModel):
    symbol: str
    quantity: int
    avg_buy_price: float
    current_price: float
    total_value: float
    profit_loss: float
    profit_percent: float
    status: str

class WatchlistCreate(BaseModel):
    symbol: str

class WatchlistOut(BaseModel):
    symbol: str

    model_config = ConfigDict(from_attributes=True)
