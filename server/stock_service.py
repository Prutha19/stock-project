from concurrent.futures import ThreadPoolExecutor
import json
from typing import Dict, Optional, Union
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

YAHOO_HEADERS = {"User-Agent": "Mozilla/5.0"}
TOP_STOCK_UNIVERSE = [
    ("RELIANCE.NS", "Reliance Industries"),
    ("TCS.NS", "Tata Consultancy Services"),
    ("HDFCBANK.NS", "HDFC Bank"),
    ("ICICIBANK.NS", "ICICI Bank"),
    ("BHARTIARTL.NS", "Bharti Airtel"),
    ("INFY.NS", "Infosys"),
    ("SBIN.NS", "State Bank of India"),
    ("LT.NS", "Larsen & Toubro"),
    ("ITC.NS", "ITC"),
    ("HINDUNILVR.NS", "Hindustan Unilever"),
    ("AXISBANK.NS", "Axis Bank"),
    ("KOTAKBANK.NS", "Kotak Mahindra Bank"),
    ("BAJFINANCE.NS", "Bajaj Finance"),
    ("ASIANPAINT.NS", "Asian Paints"),
    ("MARUTI.NS", "Maruti Suzuki"),
    ("SUNPHARMA.NS", "Sun Pharmaceutical"),
    ("TITAN.NS", "Titan Company"),
    ("NTPC.NS", "NTPC"),
    ("POWERGRID.NS", "Power Grid Corporation"),
    ("TATAMOTORS.NS", "Tata Motors"),
]
TOP_STOCK_NAME_MAP = {
    symbol: name for symbol, name in TOP_STOCK_UNIVERSE
}


def _fetch_json(
    url: str, params: Optional[Dict[str, Union[str, int]]] = None
) -> dict:
    if params:
        url = f"{url}?{urlencode(params)}"

    request = Request(url, headers=YAHOO_HEADERS)

    with urlopen(request, timeout=10) as response:
        payload = response.read().decode("utf-8")

    return json.loads(payload)


def get_stock_price(symbol: str):
    try:
        data = _fetch_json(
            f"https://query1.finance.yahoo.com/v8/finance/chart/{symbol}",
            {"interval": "1d", "range": "1d"},
        )

        results = data.get("chart", {}).get("result") or []
        if not results:
            return None

        result = results[0]
        price = result.get("meta", {}).get("regularMarketPrice")

        if price is None:
            closes = (
                result.get("indicators", {})
                .get("quote", [{}])[0]
                .get("close", [])
            )
            price = next((value for value in reversed(closes) if value is not None), None)

        return float(price) if price is not None else None

    except (HTTPError, URLError, TimeoutError, ValueError, TypeError, json.JSONDecodeError):
        return None


def _get_top_stock_snapshot(stock: tuple[str, str]):
    symbol, fallback_name = stock

    try:
        data = _fetch_json(
            f"https://query1.finance.yahoo.com/v8/finance/chart/{symbol}",
            {"interval": "1d", "range": "5d"},
        )

        results = data.get("chart", {}).get("result") or []
        if not results:
            return None

        result = results[0]
        meta = result.get("meta", {})
        closes = (
            result.get("indicators", {})
            .get("quote", [{}])[0]
            .get("close", [])
        )

        latest_close = next(
            (value for value in reversed(closes) if value is not None),
            meta.get("regularMarketPrice"),
        )

        if latest_close is None:
            latest_close = meta.get("regularMarketPrice")

        if latest_close is None:
            return None

        previous_close = meta.get("chartPreviousClose")

        if previous_close is None:
            non_null_closes = [value for value in closes if value is not None]
            if len(non_null_closes) > 1:
                previous_close = non_null_closes[-2]

        if previous_close in (None, 0):
            return None

        change = float(latest_close) - float(previous_close)
        change_percent = (change / float(previous_close)) * 100

        return {
            "symbol": symbol,
            "display_symbol": symbol.replace(".NS", ""),
            "name": (
                meta.get("shortName")
                or meta.get("longName")
                or TOP_STOCK_NAME_MAP.get(symbol)
                or fallback_name
            ),
            "price": round(float(latest_close), 2),
            "change": round(change, 2),
            "change_percent": round(change_percent, 2),
        }

    except (HTTPError, URLError, TimeoutError, ValueError, TypeError, json.JSONDecodeError):
        return None


def get_top_stocks(limit: int = 10):
    with ThreadPoolExecutor(
        max_workers=min(8, len(TOP_STOCK_UNIVERSE))
    ) as executor:
        results = [
            stock
            for stock in executor.map(
                _get_top_stock_snapshot,
                TOP_STOCK_UNIVERSE,
            )
            if stock
        ]

    results.sort(
        key=lambda stock: stock["change_percent"],
        reverse=True,
    )

    return results[: max(limit, 0)]


def search_stocks(query: str):
    query = query.strip()

    if not query:
        return []

    try:
        data = _fetch_json(
            "https://query1.finance.yahoo.com/v1/finance/search",
            {"q": query, "quotesCount": 15, "newsCount": 0},
        )

        results = []
        query_lower = query.lower()

        for item in data.get("quotes", []):
            symbol = item.get("symbol")
            name = item.get("shortname") or item.get("longname")
            quote_type = item.get("quoteType")

            if not symbol or not name or quote_type != "EQUITY":
                continue

            score = 0

            if symbol.lower().startswith(query_lower):
                score += 3
            elif query_lower in symbol.lower():
                score += 2

            if name.lower().startswith(query_lower):
                score += 3
            elif query_lower in name.lower():
                score += 1

            if score > 0:
                results.append({
                    "symbol": symbol,
                    "name": name,
                    "score": score,
                })

        results.sort(key=lambda item: item["score"], reverse=True)
        return [{"symbol": item["symbol"], "name": item["name"]} for item in results[:10]]

    except (HTTPError, URLError, TimeoutError, ValueError, TypeError, json.JSONDecodeError):
        return []
