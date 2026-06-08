from datetime import datetime
from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

class UserBase(BaseModel):
    username: str = Field(min_length=3, max_length=50)
    email: EmailStr

    @field_validator("username")
    @classmethod
    def normalize_username(cls, value: str):
        normalized_value = value.strip()

        if not normalized_value:
            raise ValueError("Username cannot be empty")

        return normalized_value


class UserCreate(UserBase):
    password: str = Field(min_length=8, max_length=72)

    @field_validator("password")
    @classmethod
    def validate_password(cls, value: str):
        if not value.strip():
            raise ValueError("Password cannot be empty")

        return value


class UserLogin(BaseModel):
    email: EmailStr
    password: str

    @field_validator("password")
    @classmethod
    def require_password(cls, value: str):
        if not value.strip():
            raise ValueError("Password cannot be empty")

        return value


class UserOut(UserBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

class StockOut(BaseModel):
    symbol: str
    price: float


class TopStockOut(BaseModel):
    symbol: str
    display_symbol: str
    name: str
    price: float
    change: float
    change_percent: float


class BuyStock(BaseModel):
    symbol: str = Field(min_length=1, max_length=20)
    quantity: int = Field(ge=1)

    @field_validator("symbol")
    @classmethod
    def normalize_symbol(cls, value: str):
        normalized_value = value.strip().upper()

        if not normalized_value:
            raise ValueError("Symbol cannot be empty")

        return normalized_value

class SellStock(BaseModel):
    symbol: str = Field(min_length=1, max_length=20)
    quantity: int = Field(ge=1)

    @field_validator("symbol")
    @classmethod
    def normalize_symbol(cls, value: str):
        normalized_value = value.strip().upper()

        if not normalized_value:
            raise ValueError("Symbol cannot be empty")

        return normalized_value

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

class WatchlistCreate(BaseModel):
    symbol: str = Field(min_length=1, max_length=20)

    @field_validator("symbol")
    @classmethod
    def normalize_symbol(cls, value: str):
        normalized_value = value.strip().upper()

        if not normalized_value:
            raise ValueError("Symbol cannot be empty")

        return normalized_value

class WatchlistOut(BaseModel):
    symbol: str
    price: float

    model_config = ConfigDict(from_attributes=True)
