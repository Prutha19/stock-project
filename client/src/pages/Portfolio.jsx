import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  buildApiUrl,
  clearAuthToken,
  createAuthHeaders,
  getAuthToken
} from "../services/api";

function Portfolio() {
  const [stocks, setStocks] = useState([]);
  const [totalValue, setTotalValue] = useState(0);
  const [totalProfit, setTotalProfit] = useState(0);
  const [sellModal, setSellModal] = useState(null);
  const [sellQuantity, setSellQuantity] = useState(1);

  const navigate = useNavigate();

  const formatCurrency = (value) => `Rs. ${Number(value ?? 0).toFixed(2)}`;

  const handleAuthFailure = (message = "Please login first") => {
    clearAuthToken();
    toast.error(message);
    navigate("/login");
  };

  const fetchPortfolio = async () => {
    const token = getAuthToken();

    if (!token) {
      handleAuthFailure();
      return;
    }

    try {
      const response = await fetch(buildApiUrl("/portfolio"), {
        headers: createAuthHeaders(token)
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          handleAuthFailure("Session expired");
          return;
        }

        toast.error(data.detail || "Failed to fetch portfolio");
        return;
      }

      setStocks(data);

      let totalVal = 0;
      let totalPL = 0;

      data.forEach((stock) => {
        totalVal += stock.total_value;
        totalPL += stock.profit_loss;
      });

      setTotalValue(totalVal);
      setTotalProfit(totalPL);

    } catch (error) {
      console.error(error);
      toast.error("Server error");
    }
  };

  useEffect(() => {
    fetchPortfolio();
  }, []);

  const confirmSell = async () => {
    const token = getAuthToken();

    if (!sellModal) {
      return;
    }

    if (
      !Number.isInteger(sellQuantity) ||
      sellQuantity < 1 ||
      sellQuantity > sellModal.quantity
    ) {
      toast.error("Enter a valid sell quantity");
      return;
    }

    try {
      const response = await fetch(buildApiUrl("/sell"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...createAuthHeaders(token)
        },
        body: JSON.stringify({
          symbol: sellModal.symbol,
          quantity: sellQuantity
        })
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          handleAuthFailure("Session expired");
          return;
        }

        toast.error(data.detail || "Sell failed");
        return;
      }

      toast.success(data.message);
      await fetchPortfolio();
      setSellModal(null);

    } catch (error) {
      console.error(error);
      toast.error("Sell failed");
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_#0f172a,_#000)] text-white overflow-x-hidden p-6">
      <div className="absolute w-[500px] h-[500px] bg-green-500/10 blur-3xl rounded-full top-[-100px] left-[-100px]" />
      <div className="absolute w-[400px] h-[400px] bg-emerald-500/10 blur-3xl rounded-full bottom-[-100px] right-[-100px]" />

      <div className="relative z-10 flex justify-between items-center mb-5">
        <div>
          <h1 className="text-xl font-bold tracking-wide bg-gradient-to-r from-green-400 to-emerald-600 bg-clip-text text-transparent">
            Portfolio
          </h1>

          <p className="text-gray-500 text-sm mt-1">
            Track your investments and profits
          </p>
        </div>

        <button
          onClick={() => navigate("/dashboard")}
          className="px-4 py-2 rounded-2xl bg-black/40 border border-gray-800 hover:border-green-500 hover:text-green-400 transition-all text-sm"
        >
          Back to Dashboard
        </button>
      </div>

      <div className="relative z-10 grid md:grid-cols-2 gap-4 mb-5 max-w-4xl">
        <div className="bg-black/40 backdrop-blur-xl border border-gray-800 rounded-2xl p-4 shadow-xl">
          <p className="text-gray-400 text-sm mb-1">
            Total Portfolio Value
          </p>

          <h2 className="text-2xl font-bold text-white">
            {formatCurrency(totalValue)}
          </h2>
        </div>

        <div className="bg-black/40 backdrop-blur-xl border border-gray-800 rounded-2xl p-4 shadow-xl">
          <p className="text-gray-400 text-sm mb-1">
            Total Profit / Loss
          </p>

          <h2
            className={`text-2xl font-bold ${
              totalProfit >= 0
                ? "text-green-400"
                : "text-red-400"
            }`}
          >
            {formatCurrency(totalProfit)}
          </h2>
        </div>
      </div>

      {stocks.length === 0 ? (
        <div className="relative z-10 bg-black/40 border border-gray-800 rounded-2xl p-8 text-center max-w-3xl">
          <p className="text-gray-500">
            No stocks in portfolio
          </p>
        </div>
      ) : (
        <div className="relative z-10 grid gap-4 max-w-4xl">
          {stocks.map((stock) => (
            <div
              key={stock.symbol}
              className="bg-black/40 backdrop-blur-xl border border-gray-800 rounded-2xl p-4 hover:border-green-500/40 transition-all duration-300 shadow-xl"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-lg font-semibold">
                    {stock.symbol}
                  </h2>

                  <p className="text-gray-500 text-sm mt-1">
                    {stock.quantity} Shares Owned
                  </p>
                </div>

                <div className="text-right">
                  <p
                    className={`text-lg font-bold ${
                      stock.profit_loss >= 0
                        ? "text-green-400"
                        : "text-red-400"
                    }`}
                  >
                    {formatCurrency(stock.profit_loss)}
                  </p>

                  <p
                    className={`text-sm ${
                      stock.profit_loss >= 0
                        ? "text-green-400"
                        : "text-red-400"
                    }`}
                  >
                    {stock.profit_percent.toFixed(2)}%
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                <div className="bg-black/30 rounded-2xl p-3 border border-gray-800">
                  <p className="text-gray-500 text-xs">
                    Avg Price
                  </p>

                  <p className="text-base font-semibold mt-1">
                    {formatCurrency(stock.avg_buy_price)}
                  </p>
                </div>

                <div className="bg-black/30 rounded-2xl p-3 border border-gray-800">
                  <p className="text-gray-500 text-xs">
                    Current Price
                  </p>

                  <p className="text-base font-semibold mt-1">
                    {formatCurrency(stock.current_price)}
                  </p>
                </div>

                <div className="bg-black/30 rounded-2xl p-3 border border-gray-800">
                  <p className="text-gray-500 text-xs">
                    Total Value
                  </p>

                  <p className="text-base font-semibold mt-1">
                    {formatCurrency(stock.total_value)}
                  </p>
                </div>

                <div className="bg-black/30 rounded-2xl p-3 border border-gray-800">
                  <p className="text-gray-500 text-xs">
                    Quantity
                  </p>

                  <p className="text-base font-semibold mt-1">
                    {stock.quantity}
                  </p>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => {
                    setSellModal(stock);
                    setSellQuantity(1);
                  }}
                  className="px-5 py-3 rounded-2xl bg-gradient-to-r from-red-500 to-rose-600 hover:scale-[1.03] hover:shadow-[0_0_20px_rgba(239,68,68,0.4)] transition-all duration-300 font-semibold"
                >
                  Sell Stock
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {sellModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[#0f172a] border border-gray-800 rounded-3xl p-6 w-[90%] max-w-md shadow-2xl">
            <h2 className="text-xl font-bold mb-2">
              Sell {sellModal.symbol}
            </h2>

            <p className="text-gray-400 text-sm mb-5">
              You own {sellModal.quantity} shares
            </p>

            <div>
              <label className="text-sm text-gray-400">
                Quantity to Sell
              </label>

              <input
                type="number"
                min="1"
                max={sellModal.quantity}
                value={sellQuantity}
                onChange={(e) =>
                  setSellQuantity(Number(e.target.value))
                }
                className="w-full mt-2 px-4 py-3 rounded-2xl bg-black/50 border border-gray-700 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/30 transition-all"
              />
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setSellModal(null)}
                className="flex-1 py-3 rounded-2xl bg-gray-800 hover:bg-gray-700 transition"
              >
                Cancel
              </button>

              <button
                onClick={confirmSell}
                className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-red-500 to-rose-600 hover:scale-[1.02] transition-all font-semibold"
              >
                Confirm Sell
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Portfolio;
