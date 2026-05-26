import json
from typing import Dict, Optional, Union
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

YAHOO_HEADERS = {"User-Agent": "Mozilla/5.0"}


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


def search_stocks(query: str):
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
