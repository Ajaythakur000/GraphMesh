"use client";

export default function Sidebar({
  mode,
  setMode,
  currentRadius,
  setCurrentRadius,
  currentMaterial,
  setCurrentMaterial,
  currentBand,
  setCurrentBand,
  routers,
  walls,
  onClearAll,
  isComputing,
  onRun,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onDownload,
}) {
  return (
    <div className="w-80 bg-[#09090b]/90 backdrop-blur-xl p-6 border-r border-zinc-800/80 flex flex-col gap-4 z-10 relative overflow-y-auto font-mono shadow-[4px_0_24px_rgba(0,0,0,0.5)] text-zinc-300">
      <div>
        <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">GraphMesh</h1>
        <p className="text-xs text-zinc-500 mt-1">RF Channel Allocation Engine</p>
      </div>

      <div className="flex gap-2 mt-2">
        <button
          onClick={() => setMode("router")}
          className={`flex-1 py-2 rounded text-xs font-bold transition-colors border ${
            mode === "router" ? "bg-zinc-800 border-zinc-600 text-white shadow-sm" : "bg-transparent border-zinc-800 text-zinc-500 hover:text-zinc-400 hover:bg-zinc-900/50"
          }`}
        >
          + ROUTER
        </button>
        <button
          onClick={() => setMode("wall")}
          className={`flex-1 py-2 rounded text-xs font-bold transition-colors border ${
            mode === "wall" ? "bg-zinc-800 border-zinc-600 text-white shadow-sm" : "bg-transparent border-zinc-800 text-zinc-500 hover:text-zinc-400 hover:bg-zinc-900/50"
          }`}
        >
          + WALL
        </button>
        <button
          onClick={() => setMode("select")}
          className={`flex-1 py-2 rounded text-xs font-bold transition-colors border ${
            mode === "select" ? "bg-zinc-800 border-zinc-600 text-white shadow-sm" : "bg-transparent border-zinc-800 text-zinc-500 hover:text-zinc-400 hover:bg-zinc-900/50"
          }`}
        >
          POINTER
        </button>
      </div>

      <div className="flex gap-2">
        <button
          onClick={onUndo}
          disabled={!canUndo}
          title="Undo"
          className={`flex-1 py-1.5 rounded text-xs font-bold border transition-colors flex items-center justify-center gap-1.5 ${
            canUndo
              ? "border-zinc-700 text-zinc-300 hover:border-zinc-400 hover:text-white hover:bg-zinc-800/50"
              : "border-zinc-900 text-zinc-700 cursor-not-allowed"
          }`}
        >
          ↺ UNDO
        </button>
        <button
          onClick={onRedo}
          disabled={!canRedo}
          title="Redo"
          className={`flex-1 py-1.5 rounded text-xs font-bold border transition-colors flex items-center justify-center gap-1.5 ${
            canRedo
              ? "border-zinc-700 text-zinc-300 hover:border-zinc-400 hover:text-white hover:bg-zinc-800/50"
              : "border-zinc-900 text-zinc-700 cursor-not-allowed"
          }`}
        >
          REDO ↻
        </button>
      </div>

      <div className="bg-zinc-900/50 p-4 rounded-lg border border-zinc-800/80 min-h-[80px] shadow-inner">
        {mode === "router" ? (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">Frequency Band</label>
              <div className="flex gap-1 bg-zinc-950 p-1 rounded border border-zinc-800">
                <button
                  onClick={() => setCurrentBand(1)}
                  className={`flex-1 py-1 text-xs rounded transition-colors ${currentBand === 1 ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-300"}`}
                >
                  2.4 GHz
                </button>
                <button
                  onClick={() => setCurrentBand(2)}
                  className={`flex-1 py-1 text-xs rounded transition-colors ${currentBand === 2 ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-300"}`}
                >
                  5 GHz
                </button>
              </div>
            </div>
            
            <div className="flex flex-col gap-2">
              <label className="text-[10px] text-zinc-400 flex justify-between uppercase tracking-wider font-semibold">
                <span>Transmit Range</span>
                <span className="text-zinc-200">{(currentRadius / 50).toFixed(1)}m</span>
              </label>
              <input
                type="range"
                min="50"
                max="300"
                step="10"
                value={currentRadius}
                onChange={(e) => setCurrentRadius(parseInt(e.target.value))}
                className="w-full accent-white"
              />
            </div>
          </div>
        ) : mode === "wall" ? (
          <div className="flex flex-col gap-3">
            <label className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">Material Properties</label>
            <select
              value={currentMaterial}
              onChange={(e) => setCurrentMaterial(parseInt(e.target.value))}
              className="w-full bg-zinc-950 text-zinc-200 text-xs p-2.5 rounded border border-zinc-700 outline-none focus:border-zinc-400 transition-colors"
            >
              <option value={1}>Concrete (High Attenuation)</option>
              <option value={2}>Wood (Medium Attenuation)</option>
              <option value={3}>Glass (Low Attenuation)</option>
            </select>
          </div>
        ) : (
          <p className="text-[11px] text-zinc-500 leading-relaxed">
            Drag routers or walls to reposition. Click a wall to resize its ends or delete. 
            Run the engine to compute RF interference and channel allocation.
          </p>
        )}
      </div>

      <div className="text-xs text-zinc-500 flex justify-between border-y border-zinc-800/80 py-3 uppercase tracking-wider font-semibold">
        <span>
          STATUS:{" "}
          <span className={isComputing ? "text-amber-400 animate-pulse" : "text-emerald-400"}>
            {isComputing ? "COMPUTING" : "READY"}
          </span>
        </span>
        <span>
          R:{routers.length} W:{walls.length}
        </span>
      </div>

      <button
        onClick={onRun}
        disabled={isComputing || routers.length === 0}
        className={`font-bold py-3 px-4 rounded-lg transition-all text-sm mt-auto shadow-sm ${
          isComputing || routers.length === 0
            ? "bg-zinc-900 text-zinc-700 cursor-not-allowed border border-zinc-800"
            : "bg-white hover:bg-zinc-200 text-black active:scale-[0.98]"
        }`}
      >
        {isComputing ? "RUNNING ENGINE..." : "COMPUTE ALLOCATION"}
      </button>

      <div className="flex gap-2">
        <button
          onClick={onClearAll}
          className="flex-1 bg-zinc-900/40 hover:bg-zinc-800/60 text-zinc-400 hover:text-white py-2 rounded text-[10px] uppercase font-bold tracking-wider border border-zinc-800 transition-colors"
        >
          CLEAR
        </button>
        
        <button
          onClick={onDownload}
          className="flex-1 bg-zinc-900/40 hover:bg-zinc-800/60 text-zinc-400 hover:text-white py-2 rounded text-[10px] uppercase font-bold tracking-wider border border-zinc-800 transition-colors"
        >
          EXPORT PNG
        </button>
      </div>
    </div>
  );
}