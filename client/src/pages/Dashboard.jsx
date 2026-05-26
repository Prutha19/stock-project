import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

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

  const [isFocused, setIsFocused] = useState(false);

  const navigate = useNavigate();

  // 🔍 OWNERSHIP CHECK
  const ownedStock = portfolio.find(
    (stock) => stock.symbol === selectedStock
  );

  // 🔐 FETCH USER
  const fetchUser = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login");
      return;
    }

    try {
      const res = await fetch("http://127.0.0.1:8000/me", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await res.json();

      if (!res.ok) {
        localStorage.removeItem("token");
        navigate("/login");
        return;
      }

      setUser(data);

    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch user");
    }
  };

  // 📦 FETCH PORTFOLIO
  const fetchPortfolio = async () => {
    const token = localStorage.getItem("token");

    try {
      const res = await fetch("http://127.0.0.1:8000/portfolio", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await res.json();

      if (res.ok) {
        setPortfolio(data);
      }

    } catch (err) {
      console.error(err);
    }
  };

  // 🚀 INITIAL LOAD
  useEffect(() => {
    fetchUser();
    fetchPortfolio();
  }, []);

  // 🔍 SEARCH STOCKS
  useEffect(() => {
    const delay = setTimeout(async () => {

      if (!search) {
        setResults([]);
        return;
      }

      try {
        setLoading(true);

        const res = await fetch(
          `http://127.0.0.1:8000/search?query=${search}`
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

  // 📈 FETCH STOCK PRICE
  const fetchStockPrice = async (symbol) => {
    try {
      const res = await fetch(
        `http://127.0.0.1:8000/stocks/${symbol}`
      );

      const data = await res.json();

      setSelectedStock(symbol);
      setPrice(data.price);

    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch stock");
    }
  };

  // ⭐ WATCHLIST
  const addToWatchlist = () => {
    if (!selectedStock) return;

    const exists = watchlist.find(
      (s) => s.symbol === selectedStock
    );

    if (exists) {
      toast.error("Already in watchlist");
      return;
    }

    setWatchlist([
      ...watchlist,
      {
        symbol: selectedStock,
        price
      }
    ]);

    toast.success(`${selectedStock} added to watchlist`);
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_#0f172a,_#000)] text-white overflow-x-hidden">

      {/* NAVBAR */}
      <div className="sticky top-0 z-50 backdrop-blur-xl bg-black/40 border-b border-gray-800 px-8 py-4 flex justify-between items-center shadow-lg">

        {/* LOGO */}
        <h1 className="text-3xl font-black tracking-wide bg-gradient-to-r from-green-400 to-emerald-600 bg-clip-text text-transparent">
          Stockify
        </h1>

        <div className="flex gap-5 items-center">

          {/* USER */}
          <div className="bg-black/40 px-5 py-3 rounded-xl border border-gray-800 text-right shadow-md">

            <p className="text-gray-400 text-sm">
              Hi, {user?.username}
            </p>

            <p className="text-green-400 font-bold text-lg">
              ₹{user?.balance?.toFixed(2)}
            </p>

          </div>

          {/* PORTFOLIO */}
          <button
            onClick={() => navigate("/portfolio")}
            className="hover:text-green-400 transition"
          >
            Portfolio
          </button>

          {/* LOGOUT */}
          <button
            onClick={() => {
              localStorage.removeItem("token");
              navigate("/login");
            }}
            className="bg-gradient-to-r from-red-500 to-rose-600 px-5 py-2 rounded-xl font-semibold hover:scale-105 transition-all"
          >
            Logout
          </button>

        </div>
      </div>

      <div className="p-8 space-y-8">

        {/* SEARCH */}
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

          {/* DROPDOWN */}
          {isFocused && search && (
            <div className="absolute w-full bg-black/90 backdrop-blur-xl border border-gray-800 mt-3 rounded-2xl max-h-72 overflow-y-auto z-20 shadow-2xl">

              {loading ? (
                <p className="p-4 text-gray-400">
                  Searching...
                </p>

              ) : results.length > 0 ? (

                results.map((stock, i) => (
                  <div
                    key={i}
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

        {/* SELECTED STOCK */}
        {selectedStock && (
          <div className="bg-gradient-to-br from-black/80 to-gray-900/80 p-6 rounded-3xl border border-gray-800 max-w-2xl shadow-2xl hover:border-green-500/40 transition-all duration-300">

            {/* HEADER */}
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
                ₹{price}
              </p>

            </div>

            {/* OWNED */}
            {ownedStock && (
              <div className="mt-4 inline-flex items-center gap-2 bg-green-500/10 border border-green-500/20 px-4 py-2 rounded-full">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>

                <p className="text-sm text-green-300">
                  You own {ownedStock.quantity} shares
                </p>
              </div>
            )}

            {/* QUANTITY */}
            <div className="mt-6">

              <label className="text-gray-400 text-sm">
                Quantity
              </label>

              <input
                type="number"
                value={quantity}
                min="1"
                onChange={(e) =>
                  setQuantity(Number(e.target.value))
                }
                className="w-full mt-2 p-4 rounded-2xl bg-black/50 border border-gray-700 text-white outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/30 transition-all"
              />

            </div>

            {/* TOTAL */}
            <div className="mt-5 bg-black/40 border border-gray-800 rounded-2xl p-4 flex justify-between items-center">

              <p className="text-gray-400">
                Estimated Total
              </p>

              <p className="text-2xl font-bold text-white">
                ₹
                {price && quantity
                  ? (price * quantity).toFixed(2)
                  : 0}
              </p>

            </div>

            {/* BUTTONS */}
            <div className="grid grid-cols-3 gap-4 mt-6">

              {/* WATCHLIST */}
              <button
                onClick={addToWatchlist}
                className="py-4 rounded-2xl bg-gray-800 hover:bg-gray-700 hover:scale-[1.03] transition-all duration-300 font-semibold"
              >
                Watchlist
              </button>

              {/* BUY */}
              <button
                onClick={async () => {
                  const token = localStorage.getItem("token");

                  try {
                    const res = await fetch(
                      "http://127.0.0.1:8000/buy",
                      {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                          Authorization: `Bearer ${token}`
                        },
                        body: JSON.stringify({
                          symbol: selectedStock,
                          quantity: quantity
                        })
                      }
                    );

                    const data = await res.json();

                    if (!res.ok) {
                      toast.error(data.detail);
                      return;
                    }

                    toast.success(data.message);

                    await fetchUser();
                    await fetchPortfolio();

                    setSelectedStock(null);
                    setSearch("");
                    setQuantity(1);

                  } catch (err) {
                    console.error(err);
                    toast.error("Buy failed");
                  }
                }}
                className="py-4 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-600 hover:scale-[1.03] hover:shadow-[0_0_20px_rgba(34,197,94,0.4)] text-black font-bold transition-all duration-300"
              >
                Buy
              </button>

              {/* SELL */}
              {ownedStock ? (
                <button
                  onClick={async () => {
                    const token = localStorage.getItem("token");

                    try {
                      const res = await fetch(
                        "http://127.0.0.1:8000/sell",
                        {
                          method: "POST",
                          headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${token}`
                          },
                          body: JSON.stringify({
                            symbol: selectedStock,
                            quantity: quantity
                          })
                        }
                      );

                      const data = await res.json();

                      if (!res.ok) {
                        toast.error(data.detail);
                        return;
                      }

                      toast.success(data.message);

                      await fetchUser();
                      await fetchPortfolio();

                      setSelectedStock(null);
                      setSearch("");
                      setQuantity(1);

                    } catch (err) {
                      console.error(err);
                      toast.error("Sell failed");
                    }
                  }}
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

        {/* WATCHLIST */}
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
            watchlist.map((stock, i) => (
              <div
                key={i}
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

                <span className="text-green-400 font-bold text-lg">
                  ₹{stock.price}
                </span>

              </div>
            ))
          )}

        </div>

      </div>
    </div>
  );
}

export default Dashboard;