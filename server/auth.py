import os
from datetime import datetime, timedelta, timezone

from jose import jwt, JWTError
from fastapi import HTTPException

SECRET_KEY = os.getenv(
    "STOCKIFY_SECRET_KEY",
    "development-secret-key-change-me",
)
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(
    os.getenv("STOCKIFY_ACCESS_TOKEN_EXPIRE_MINUTES", "60")
)


def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=ACCESS_TOKEN_EXPIRE_MINUTES
    )
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def verify_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")

        if email is None:
            raise HTTPException(status_code=401, detail="Invalid token")

        return email

    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
