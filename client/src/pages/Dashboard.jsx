import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  buildApiUrl,
  clearAuthToken,
  createAuthHeaders,
  getAuthToken
} from "../services/api";

function Dashboard() {
  const [user, setUser] = useState(null);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedStock, setSelectedStock] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [price, setPrice] = useState(null);
  const [watchlist, setWatchlist] = useState([]);
  const [portfolio, setPortfolio] = useState([]);
  const [topStocks, setTopStocks] = useState([]);
  const [topStocksLoading, setTopStocksLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const navigate = useNavigate();

  const ownedStock = portfolio.find(
    (stock) => stock.symbol === selectedStock
  );

  const formatCurrency = (value) => `Rs. ${Number(value ?? 0).toFixed(2)}`;
  const formatSignedCurrency = (value) =>
    `${Number(value ?? 0) >= 0 ? "+" : "-"}Rs. ${Math.abs(
      Number(value ?? 0)
    ).toFixed(2)}`;
  const formatSignedPercent = (value) =>
    `${Number(value ?? 0) >= 0 ? "+" : "-"}${Math.abs(
      Number(value ?? 0)
    ).toFixed(2)}%`;
  const marketDateLabel = new Intl.DateTimeFormat("en-IN", {
    dateStyle: "full"
  }).format(new Date());
  const handleAuthFailure = () => {
    clearAuthToken();
    navigate("/login");
  };
  const closeSelectedStock = () => {
    setSelectedStock(null);
    setPrice(null);
    setSearch("");
    setResults([]);
    setQuantity(1);
    setIsFocused(false);
  };

  const fetchUser = async () => {
    const token = getAuthToken();

    if (!token) {
      navigate("/login");
      return;
    }

    try {
      const res = await fetch(buildApiUrl("/me"), {
        headers: createAuthHeaders(token)
      });

      const data = await res.json();

      if (!res.ok) {
        handleAuthFailure();
        return;
      }

      setUser(data);

    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch user");
    }
  };

  const fetchPortfolio = async () => {
    const token = getAuthToken();

    if (!token) {
      return;
    }

    try {
      const res = await fetch(buildApiUrl("/portfolio"), {
        headers: createAuthHeaders(token)
      });

      const data = await res.json();

      if (res.ok) {
        setPortfolio(data);
      } else if (res.status === 401) {
        handleAuthFailure();
      }

    } catch (err) {
      console.error(err);
    }
  };

  const fetchWatchlist = async () => {
    const token = getAuthToken();

    if (!token) {
      return;
    }

    try {
      const res = await fetch(buildApiUrl("/watchlist"), {
        headers: createAuthHeaders(token)
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401) {
          handleAuthFailure();
          return;
        }

        toast.error(data.detail || "Failed to fetch watchlist");
        return;
      }

      setWatchlist(data);

    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch watchlist");
    }
  };

  const fetchTopStocks = async () => {
    try {
      setTopStocksLoading(true);

      const res = await fetch(buildApiUrl("/market/top-stocks"));
      const data = await res.json();

      if (!res.ok) {
        setTopStocks([]);
        return;
      }

      setTopStocks(data);

    } catch (err) {
      console.error(err);
      setTopStocks([]);

    } finally {
      setTopStocksLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
    fetchPortfolio();
    fetchWatchlist();
    fetchTopStocks();
  }, []);

  useEffect(() => {
    const delay = setTimeout(async () => {
      if (!search) {
        setResults([]);
        return;
      }

      try {
        setLoading(true);

        const res = await fetch(
          buildApiUrl(`/search?query=${encodeURIComponent(search.trim())}`)
        );

        const data = await res.json();
        setResults(data);

      } catch (err) {
        console.error(err);

      } finally {
        setLoading(false);
      }
    }, 400);

    return () => clearTimeout(delay);
  }, [search]);

  const fetchStockPrice = async (symbol) => {
    try {
      const res = await fetch(buildApiUrl(`/stocks/${encodeURIComponent(symbol)}`));
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.detail || "Failed to fetch stock");
        return;
      }

      setSelectedStock(data.symbol);
      setPrice(data.price);

    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch stock");
    }
  };

  const addToWatchlist = async () => {
    if (!selectedStock) {
      return;
    }

    const exists = watchlist.find(
      (stock) => stock.symbol === selectedStock
    );

    if (exists) {
      toast.error("Already in watchlist");
      return;
    }

    const token = getAuthToken();

    try {
      const res = await fetch(buildApiUrl("/watchlist"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...createAuthHeaders(token)
        },
        body: JSON.stringify({
          symbol: selectedStock
        })
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401) {
          handleAuthFailure();
          return;
        }

        toast.error(data.detail || "Failed to add to watchlist");
        return;
      }

      setWatchlist((current) => [...current, data]);
      toast.success(`${selectedStock} added to watchlist`);
      closeSelectedStock();

    } catch (err) {
      console.error(err);
      toast.error("Failed to add to watchlist");
    }
  };

  const removeFromWatchlist = async (symbol) => {
    const token = getAuthToken();

    try {
      const res = await fetch(
        buildApiUrl(`/watchlist/${encodeURIComponent(symbol)}`),
        {
        method: "DELETE",
        headers: createAuthHeaders(token)
        }
      );

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401) {
          handleAuthFailure();
          return;
        }

        toast.error(data.detail || "Failed to remove from watchlist");
        return;
      }

      setWatchlist((current) =>
        current.filter((stock) => stock.symbol !== symbol)
      );
      toast.success(data.message);

    } catch (err) {
      console.error(err);
      toast.error("Failed to remove from watchlist");
    }
  };

  const handleTrade = async (type) => {
    const token = getAuthToken();

    if (!selectedStock) {
      toast.error("Select a stock first");
      return;
    }

    if (!Number.isInteger(quantity) || quantity < 1) {
      toast.error("Enter a valid quantity");
      return;
    }

    try {
      const res = await fetch(buildApiUrl(`/${type}`), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...createAuthHeaders(token)
        },
        body: JSON.stringify({
          symbol: selectedStock,
          quantity
        })
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401) {
          handleAuthFailure();
          return;
        }

        toast.error(data.detail || `${type} failed`);
        return;
      }

      toast.success(data.message);

      await fetchUser();
      await fetchPortfolio();
      closeSelectedStock();

    } catch (err) {
      console.error(err);
      toast.error(`${type} failed`);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_#0f172a,_#000)] text-white overflow-x-hidden">
      <div className="sticky top-0 z-50 backdrop-blur-xl bg-black/40 border-b border-gray-800 px-8 py-4 flex justify-between items-center shadow-lg">
        <h1 className="text-3xl font-black tracking-wide bg-gradient-to-r from-green-400 to-emerald-600 bg-clip-text text-transparent">
          Stockify
        </h1>

        <div className="flex gap-5 items-center">
          <div className="bg-black/40 px-5 py-3 rounded-xl border border-gray-800 text-right shadow-md">
            <p className="text-gray-400 text-sm">
              Hi, {user?.username}
            </p>

            <p className="text-green-400 font-bold text-lg">
              {formatCurrency(user?.balance)}
            </p>
          </div>

          <button
            onClick={() => navigate("/portfolio")}
            className="hover:text-green-400 transition"
          >
            Portfolio
          </button>

          <button
            onClick={() => {
              clearAuthToken();
              navigate("/login");
            }}
            className="bg-gradient-to-r from-red-500 to-rose-600 px-5 py-2 rounded-xl font-semibold hover:scale-105 transition-all"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="p-8 space-y-8">
        <div className="relative max-w-2xl">
          <input
            type="text"
            placeholder="Search stocks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => {
              setTimeout(() => setIsFocused(false), 150);
            }}
            className="w-full p-4 rounded-2xl bg-black/50 border border-gray-700 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/30 transition-all text-lg shadow-lg"
          />

          {isFocused && search && (
            <div className="absolute w-full bg-black/90 backdrop-blur-xl border border-gray-800 mt-3 rounded-2xl max-h-72 overflow-y-auto z-20 shadow-2xl">
              {loading ? (
                <p className="p-4 text-gray-400">
                  Searching...
                </p>
              ) : results.length > 0 ? (
                results.map((stock) => (
                  <div
                    key={stock.symbol}
                    onMouseDown={() => {
                      setSearch(stock.symbol);
                      setResults([]);
                      setIsFocused(false);
                      fetchStockPrice(stock.symbol);
                    }}
                    className="p-4 hover:bg-gray-800/70 cursor-pointer flex justify-between transition-all"
                  >
                    <span>{stock.name}</span>

                    <span className="text-gray-400">
                      {stock.symbol}
                    </span>
                  </div>
                ))
              ) : (
                <p className="p-4 text-gray-400">
                  No results
                </p>
              )}
            </div>
          )}
        </div>

        {selectedStock && (
          <div className="bg-gradient-to-br from-black/80 to-gray-900/80 p-6 rounded-3xl border border-gray-800 max-w-2xl shadow-2xl hover:border-green-500/40 transition-all duration-300">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-2xl font-bold">
                  {selectedStock}
                </p>

                <p className="text-gray-400 mt-1">
                  Live Market Price
                </p>
              </div>

              <p className="text-4xl font-black text-green-400 drop-shadow-[0_0_12px_rgba(34,197,94,0.5)]">
                {formatCurrency(price)}
              </p>
            </div>

            {ownedStock && (
              <div className="mt-4 inline-flex items-center gap-2 bg-green-500/10 border border-green-500/20 px-4 py-2 rounded-full">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>

                <p className="text-sm text-green-300">
                  You own {ownedStock.quantity} shares
                </p>
              </div>
            )}

            <div className="mt-6">
              <label className="text-gray-400 text-sm">
                Quantity
              </label>

              <input
                type="number"
                value={quantity}
                min="1"
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-full mt-2 p-4 rounded-2xl bg-black/50 border border-gray-700 text-white outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/30 transition-all"
              />
            </div>

            <div className="mt-5 bg-black/40 border border-gray-800 rounded-2xl p-4 flex justify-between items-center">
              <p className="text-gray-400">
                Estimated Total
              </p>

              <p className="text-2xl font-bold text-white">
                {price && quantity
                  ? formatCurrency(price * quantity)
                  : formatCurrency(0)}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4 mt-6">
              <button
                onClick={addToWatchlist}
                className="py-4 rounded-2xl bg-gray-800 hover:bg-gray-700 hover:scale-[1.03] transition-all duration-300 font-semibold"
              >
                Watchlist
              </button>

              <button
                onClick={() => handleTrade("buy")}
                className="py-4 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-600 hover:scale-[1.03] hover:shadow-[0_0_20px_rgba(34,197,94,0.4)] text-black font-bold transition-all duration-300"
              >
                Buy
              </button>

              {ownedStock ? (
                <button
                  onClick={() => handleTrade("sell")}
                  className="py-4 rounded-2xl bg-gradient-to-r from-red-500 to-rose-600 hover:scale-[1.03] hover:shadow-[0_0_20px_rgba(239,68,68,0.4)] text-white font-bold transition-all duration-300"
                >
                  Sell
                </button>
              ) : (
                <button
                  disabled
                  className="py-4 rounded-2xl bg-gray-800 text-gray-500 cursor-not-allowed font-semibold"
                >
                  Not Owned
                </button>
              )}
            </div>
          </div>
        )}

        <div className="bg-gradient-to-br from-black/70 to-gray-900/70 p-6 rounded-3xl border border-gray-800 max-w-4xl shadow-xl">
          <div className="flex flex-col gap-2 mb-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-xl font-bold text-green-400">
                Top 10 Stocks Today
              </h2>

              <p className="text-gray-400 text-sm mt-1">
                Ranked by daily market change for {marketDateLabel}
              </p>
            </div>

            <p className="text-gray-500 text-sm">
              Select a stock to view price and trade
            </p>
          </div>

          {topStocksLoading ? (
            <div className="text-center py-10">
              <p className="text-gray-500">
                Loading daily market leaders...
              </p>
            </div>
          ) : topStocks.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-gray-500">
                Daily top stocks are not available right now
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {topStocks.map((stock, index) => (
                <button
                  key={stock.symbol}
                  type="button"
                  onClick={() => {
                    setSearch(stock.display_symbol);
                    fetchStockPrice(stock.symbol);
                  }}
                  className="w-full p-4 bg-black/40 rounded-2xl border border-gray-800 hover:border-green-500/40 hover:translate-x-1 transition-all text-left"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-11 h-11 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-300 font-semibold shrink-0">
                        {index + 1}
                      </div>

                      <div className="min-w-0">
                        <p className="font-semibold text-white">
                          {stock.display_symbol}
                        </p>

                        <p className="text-gray-500 text-sm truncate">
                          {stock.name}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-lg font-bold text-white">
                        {formatCurrency(stock.price)}
                      </p>

                      <p
                        className={`text-sm font-semibold ${
                          stock.change >= 0
                            ? "text-green-400"
                            : "text-red-400"
                        }`}
                      >
                        {formatSignedCurrency(stock.change)} (
                        {formatSignedPercent(stock.change_percent)})
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="bg-gradient-to-br from-black/70 to-gray-900/70 p-6 rounded-3xl border border-gray-800 max-w-2xl shadow-xl">
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-xl font-bold text-green-400">
              Watchlist
            </h2>

            <p className="text-gray-400 text-sm">
              {watchlist.length} Stocks
            </p>
          </div>

          {watchlist.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-gray-500">
                No stocks added yet
              </p>
            </div>
          ) : (
            watchlist.map((stock) => (
              <div
                key={stock.symbol}
                className="flex justify-between items-center p-4 bg-black/40 rounded-2xl mb-3 border border-gray-800 hover:border-green-500/40 hover:translate-x-1 transition-all"
              >
                <div>
                  <p className="font-semibold">
                    {stock.symbol}
                  </p>

                  <p className="text-gray-500 text-sm">
                    Watching market movement
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-green-400 font-bold text-lg">
                    {formatCurrency(stock.price)}
                  </span>

                  <button
                    onClick={() => removeFromWatchlist(stock.symbol)}
                    className="px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 hover:bg-red-500/20 transition-all text-sm"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
