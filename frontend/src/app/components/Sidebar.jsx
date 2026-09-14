"use client";

export default function Sidebar({
  mode,
  setMode,
  currentRadius,
  setCurrentRadius,
  currentMaterial,
  setCurrentMaterial,
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
    <div className="w-80 bg-[#05050a]/80 backdrop-blur-md p-6 border-r border-cyan-900/40 flex flex-col gap-4 z-10 relative overflow-y-auto font-mono shadow-[4px_0_24px_rgba(8,145,178,0.15)]">
      <div>
        <h1 className="text-2xl font-bold text-cyan-400 tracking-tight">GraphMesh</h1>
        <p className="text-xs text-cyan-700 mt-1"> wi-fi channel allocation engine</p>
      </div>

      <div className="flex gap-2 mt-2">
        <button
          onClick={() => setMode("router")}
          className={`flex-1 py-2 rounded text-xs font-bold transition-colors border ${
            mode === "router" ? "bg-cyan-950 border-cyan-500 text-cyan-300" : "bg-transparent border-gray-800 text-gray-500"
          }`}
        >
          + ROUTER
        </button>
        <button
          onClick={() => setMode("wall")}
          className={`flex-1 py-2 rounded text-xs font-bold transition-colors border ${
            mode === "wall" ? "bg-cyan-950 border-cyan-500 text-cyan-300" : "bg-transparent border-gray-800 text-gray-500"
          }`}
        >
          + WALL
        </button>
        <button
          onClick={() => setMode("select")}
          className={`flex-1 py-2 rounded text-xs font-bold transition-colors border ${
            mode === "select" ? "bg-cyan-950 border-cyan-500 text-cyan-300" : "bg-transparent border-gray-800 text-gray-500"
          }`}
        >
          POINTER
        </button>
      </div>

      {/* Undo / Redo */}
      <div className="flex gap-2">
        <button
          onClick={onUndo}
          disabled={!canUndo}
          title="Undo"
          className={`flex-1 py-1.5 rounded text-xs font-bold border transition-colors flex items-center justify-center gap-1.5 ${
            canUndo
              ? "border-gray-700 text-gray-300 hover:border-cyan-500 hover:text-cyan-300"
              : "border-gray-900 text-gray-700 cursor-not-allowed"
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
              ? "border-gray-700 text-gray-300 hover:border-cyan-500 hover:text-cyan-300"
              : "border-gray-900 text-gray-700 cursor-not-allowed"
          }`}
        >
          REDO ↻
        </button>
      </div>

      <div className="bg-black/40 p-3 rounded border border-gray-800 min-h-[80px]">
        {mode === "router" ? (
          <div className="flex flex-col gap-2">
            <label className="text-[10px] text-gray-500 flex justify-between uppercase tracking-wider">
              <span>Range</span>
              {/* Yahan par change kiya hai */}
              <span className="text-cyan-400">{(currentRadius / 50).toFixed(1)}m</span>
            </label>
            <input
              type="range"
              min="50"
              max="300"
              step="10"
              value={currentRadius}
              onChange={(e) => setCurrentRadius(parseInt(e.target.value))}
              className="w-full accent-cyan-500"
            />
          </div>
        ) : mode === "wall" ? (
          <div className="flex flex-col gap-2">
            <label className="text-[10px] text-gray-500 uppercase tracking-wider">Material</label>
            <select
              value={currentMaterial}
              onChange={(e) => setCurrentMaterial(parseInt(e.target.value))}
              className="w-full bg-black text-cyan-300 text-xs p-2 rounded border border-gray-800 outline-none focus:border-cyan-500"
            >
              <option value={1}>Concrete — High Attenuation (blocks)</option>
              <option value={2}>Wood — Medium Attenuation</option>
              <option value={3}>Glass — Low Attenuation</option>
            </select>
          </div>
        ) : (
          <p className="text-[11px] text-gray-500 leading-relaxed">
            Drag routers or walls to move them. Click a wall to resize its ends or delete it.
            Run the algorithm to automatically see every interfering or blocked link.
          </p>
        )}
      </div>

      <div className="text-xs text-gray-500 flex justify-between border-y border-gray-800 py-2">
        <span>
          STATUS:{" "}
          <span className={isComputing ? "text-yellow-400 animate-pulse" : "text-green-400"}>
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
        className={`font-bold py-3 px-4 rounded transition-colors text-sm mt-auto ${
          isComputing || routers.length === 0
            ? "bg-gray-900 text-gray-700 cursor-not-allowed border border-gray-800"
            : "bg-cyan-600 hover:bg-cyan-500 text-black"
        }`}
      >
        {isComputing ? "RUNNING ENGINE..." : "RUN ALGORITHM"}
      </button>

      <div className="flex gap-2">
        <button
          onClick={onClearAll}
          className="flex-1 bg-red-950/40 hover:bg-red-900/60 text-red-400 py-2 rounded text-xs border border-red-900/50 transition-colors"
        >
          CLEAR CANVAS
        </button>
        
        <button
          onClick={onDownload}
          className="flex-1 bg-purple-950/40 hover:bg-purple-900/60 text-purple-400 py-2 rounded text-xs border border-purple-900/50 transition-colors"
        >
          ↓ EXPORT PNG
        </button>
      </div>
    </div>
  );
}