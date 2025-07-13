import { useEffect, useRef, useState } from "react";
import { SendHorizonal } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

function ChatPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isBillyTyping, setIsBillyTyping] = useState(false);
  const bottomRef = useRef(null);

  const location = useLocation();
  const navigate = useNavigate();
  const file_id = location.state?.file_id || localStorage.getItem("file_id");

   useEffect(() => {
    if (!file_id) {
      console.error("No file uploaded. Redirecting...");
      navigate("/");
    }
  }, [file_id, navigate]);

  // Clear localStorage after use

  useEffect(() => {
  localStorage.removeItem("file_id");
}, []);

  const sendMessage = async () => {
    if (!input || isBillyTyping) return;

    const timestamp = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    const userMessage = {
      role: "user",
      text: input,
      timestamp,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsBillyTyping(true);

    try {
      const res = await fetch("http://localhost:8000/ask_stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ file_id, question: input }),
      });

      if (!res.ok || !res.body) {
        throw new Error("Stream failed");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let billyText = "";
      let currentIndex = messages.length + 1;

      setMessages((prev) => [
        ...prev,
        {
          role: "billy",
          text: "",
          timestamp,
        },
      ]);

      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop();

        for (let line of lines) {
          if (line.startsWith("data:")) {
            try {
              const json = JSON.parse(line.replace(/^data:\s*/, ""));
              if (json.chunk !== undefined) {
                billyText += json.chunk;
                setMessages((prev) =>
                  prev.map((msg, idx) =>
                    idx === currentIndex ? { ...msg, text: billyText } : msg
                  )
                );
              } else if (json.done) {
                setIsBillyTyping(false);
                return;
              }
            } catch (err) {
              console.warn("Error parsing JSON chunk", err);
              setIsBillyTyping(false);
            }
          }
        }
      }
    } catch (error) {
      console.error("API call failed:", error);
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            role: "billy",
            text: "Oi! Can't connect to the bloody server right now, mate. Got your API keys?",
            timestamp,
          },
        ]);
        setIsBillyTyping(false);
      }, 2000);
    }
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex flex-col h-screen w-full max-w-4xl mx-auto p-2 sm:p-4 text-white font-mono text-xs sm:text-sm lg:text-base">
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #4f4f4f;
          border-radius: 20px;
          border: 3px solid transparent;
          background-clip: content-box;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: #6f6f6f;
        }
      `}</style>

      <div className="text-center mb-2 sm:mb-3 border-b border-slate-700 pb-2 sm:pb-3">
        <h1 className="text-base sm:text-lg lg:text-xl font-black text-white tracking-tight mb-1 drop-shadow-2xl shadow-black bg-black/40 backdrop-blur-sm px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg border border-red-500/30">
          <span className="text-transparent bg-clip-text bg-gradient-to-r bg-gray-400">THE BOYS CHAT</span>
        </h1>
      </div>

      <div className="custom-scrollbar flex-grow border-2 border-slate-700/50 rounded-xl p-2 sm:p-4 overflow-y-auto space-y-2 sm:space-y-4 bg-gradient-to-br from-slate-900/80 via-slate-800/60 to-black/80 backdrop-blur-sm shadow-2xl">
        {messages.map((msg, idx) => (
          <div key={idx} className="flex items-start gap-2 sm:gap-3">
            <div className="shrink-0">
              {msg.role === "billy" ? (
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center border-2 border-red-500/50 shadow-lg">
                  <span className="text-white font-bold text-xs sm:text-sm">B</span>
                </div>
              ) : (
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center border-2 border-gray-500/50 shadow-lg">
                  <span className="text-white font-bold text-xs sm:text-sm">Y</span>
                </div>
              )}
            </div>
            <div className="flex flex-col w-full max-w-full sm:max-w-2xl lg:max-w-3xl">
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={`text-xs sm:text-sm font-bold px-2 sm:px-3 py-0.5 sm:py-1 rounded-full ${
                    msg.role === "billy"
                      ? "text-red-300 bg-red-900/30 border border-red-700/50"
                      : "text-gray-300 bg-gray-900/30 border border-gray-700/50"
                  }`}
                >
                  {msg.role === "billy" ? "Billy Butcher" : "You"}
                </span>
                <span className="text-xs text-slate-400 font-medium hidden sm:inline">{msg.timestamp}</span>
              </div>
              <div
                className={`text-xs sm:text-sm lg:text-base leading-relaxed py-2 sm:py-3 px-3 sm:px-4 rounded-lg break-words ${
                  msg.role === "billy" 
                    ? "text-red-100 bg-red-950/20 border border-red-800/30" 
                    : "text-gray-100 bg-gray-950/20 border border-gray-800/30"
                }`}
              >
                {msg.text}
              </div>
              <span className="text-xs text-slate-500 mt-1 ml-2 sm:ml-3">Delivered</span>
            </div>
          </div>
        ))}

        {isBillyTyping && (
          <div className="flex items-center gap-2 text-slate-400 text-xs sm:text-sm italic animate-pulse pl-1">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center border-2 border-red-500/50 shadow-lg">
              <span className="text-white font-bold text-xs sm:text-sm">B</span>
            </div>
            <span className="hidden sm:inline">Billy's judging your life choices...</span>
            <span className="sm:hidden">Billy's typing...</span>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <div className="flex gap-2 mt-2 sm:mt-3">
        <input
          type="text"
          className="flex-grow bg-slate-900/80 border-2 border-slate-700 rounded-lg px-3 py-2.5 sm:py-3 text-white text-xs sm:text-sm lg:text-base placeholder-slate-400 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 shadow-lg"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Ask Billy something diabolical..."
          disabled={isBillyTyping}
        />
        <button
          onClick={sendMessage}
          className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg disabled:from-red-800 disabled:to-red-900 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
          disabled={!input || isBillyTyping}
        >
          <SendHorizonal className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      </div>
    </div>
  );
}

export default ChatPage;