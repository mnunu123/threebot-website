"use client";

export default function MapLegend() {
  return (
    <div className="flex items-center gap-6 px-3 py-2 bg-white/95 border-t border-gray-200 rounded-b-lg">
      <span className="flex items-center gap-2 text-sm text-gray-700">
        <span className="w-3 h-3 rounded-full bg-red-500" />
        고위험
      </span>
      <span className="flex items-center gap-2 text-sm text-gray-700">
        <span className="w-3 h-3 rounded-full bg-amber-500" />
        중위험
      </span>
      <span className="flex items-center gap-2 text-sm text-gray-700">
        <span className="w-3 h-3 rounded-full bg-emerald-500" />
        저위험
      </span>
    </div>
  );
}
