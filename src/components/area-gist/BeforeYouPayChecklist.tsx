"use client";

import React, { useState, useEffect } from "react";
import { 
  CheckSquare, 
  Square, 
  AlertCircle, 
  Sparkles, 
  Plus, 
  RotateCcw, 
  Copy, 
  Check, 
  ListChecks,
  Info
} from "lucide-react";
import { AreaGistData } from "./types";

interface BeforeYouPayChecklistProps {
  checklist: AreaGistData["checklist"];
  locationName: string;
  locationKey: string;
}

export function BeforeYouPayChecklist({
  checklist,
  locationName,
  locationKey,
}: BeforeYouPayChecklistProps) {
  const [completedItems, setCompletedItems] = useState<Record<string, boolean>>({});
  const [customItems, setCustomItems] = useState<Array<{ id: string; task: string; reason: string }>>([]);
  const [newCustomTask, setNewCustomTask] = useState("");
  const [copied, setCopied] = useState(false);

  // Load from localStorage
  useEffect(() => {
    try {
      const savedChecked = localStorage.getItem(`BT_CHECKLIST_CHECKED_${locationKey}`);
      if (savedChecked) setCompletedItems(JSON.parse(savedChecked));

      const savedCustom = localStorage.getItem(`BT_CHECKLIST_CUSTOM_${locationKey}`);
      if (savedCustom) setCustomItems(JSON.parse(savedCustom));
    } catch {}
  }, [locationKey]);

  // Persist checked states
  const toggleItem = (taskId: string) => {
    setCompletedItems((prev) => {
      const next = { ...prev, [taskId]: !prev[taskId] };
      try {
        localStorage.setItem(`BT_CHECKLIST_CHECKED_${locationKey}`, JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  // Add custom item
  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomTask.trim()) return;

    const newItem = {
      id: `custom_${Date.now()}`,
      task: newCustomTask.trim(),
      reason: "Custom inspection note added by you",
    };
    const updated = [...customItems, newItem];
    setCustomItems(updated);
    setNewCustomTask("");
    try {
      localStorage.setItem(`BT_CHECKLIST_CUSTOM_${locationKey}`, JSON.stringify(updated));
    } catch {}
  };

  // Reset checklist
  const handleReset = () => {
    if (confirm("Reset all checkmarks for this area?")) {
      setCompletedItems({});
      try {
        localStorage.removeItem(`BT_CHECKLIST_CHECKED_${locationKey}`);
      } catch {}
    }
  };

  // Copy checklist to clipboard
  const handleCopy = () => {
    const text = [
      `📋 Physical Inspection Checklist for ${locationName} (via Beta Tenant Area Gist)`,
      "",
      ...checklist.map((item, idx) => {
        const isDone = completedItems[item.task] ? "[x]" : "[ ]";
        return `${isDone} ${item.task} (${item.priority.toUpperCase()})\n   Why: ${item.reason}`;
      }),
      ...customItems.map((item) => {
        const isDone = completedItems[item.id] ? "[x]" : "[ ]";
        return `${isDone} ${item.task}\n   Why: ${item.reason}`;
      }),
    ].join("\n\n");

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const totalTasks = checklist.length + customItems.length;
  const completedCount = Object.values(completedItems).filter(Boolean).length;
  const percentComplete = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "critical":
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-200">
            Critical
          </span>
        );
      case "recommended":
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200">
            Recommended
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider bg-gray-100 text-gray-700">
            Optional
          </span>
        );
    }
  };

  return (
    <section id="inspection-checklist" className="py-10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-100">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-bt-primary mb-1">
                <ListChecks className="w-4 h-4 text-bt-secondary" />
                Physical Inspection Guide
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-gray-950">
                Before You Pay: Essential Checklist for {locationName}
              </h2>
              <p className="text-xs sm:text-sm text-gray-600 mt-1 font-normal">
                Do not sign or transfer caution fees until you physically verify these items. Real estate agents rarely point these out.
              </p>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors cursor-pointer"
                title="Copy checklist to paste in WhatsApp"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? "Copied!" : "Copy"}</span>
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
                title="Reset checkmarks"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="py-5 border-b border-gray-100">
            <div className="flex items-center justify-between text-xs font-semibold text-gray-700 mb-2">
              <span>Inspection Progress</span>
              <span>
                {completedCount} of {totalTasks} completed ({percentComplete}%)
              </span>
            </div>
            <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                style={{ width: `${percentComplete}%` }}
              />
            </div>
          </div>

          {/* Checklist Items */}
          <div className="divide-y divide-gray-100 mt-2">
            {checklist.map((item, idx) => {
              const isChecked = !!completedItems[item.task];
              return (
                <div
                  key={idx}
                  onClick={() => toggleItem(item.task)}
                  className={`py-4 flex items-start gap-3.5 cursor-pointer rounded-xl px-2 transition-colors ${
                    isChecked ? "bg-emerald-50/40 opacity-75" : "hover:bg-gray-50/80"
                  }`}
                >
                  <div className="mt-0.5 text-bt-primary shrink-0">
                    {isChecked ? (
                      <CheckSquare className="w-5 h-5 text-emerald-600" />
                    ) : (
                      <Square className="w-5 h-5 text-gray-300 hover:text-bt-primary" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className={`text-sm font-bold ${isChecked ? "line-through text-gray-400" : "text-gray-950"}`}>
                        {item.task}
                      </span>
                      {getPriorityBadge(item.priority)}
                    </div>
                    <p className={`text-xs ${isChecked ? "text-gray-400" : "text-gray-600"} font-normal`}>
                      <span className="font-semibold text-gray-500">Why it matters: </span>
                      {item.reason}
                    </p>
                  </div>
                </div>
              );
            })}

            {/* Custom User Added Items */}
            {customItems.map((item) => {
              const isChecked = !!completedItems[item.id];
              return (
                <div
                  key={item.id}
                  onClick={() => toggleItem(item.id)}
                  className={`py-4 flex items-start gap-3.5 cursor-pointer rounded-xl px-2 transition-colors ${
                    isChecked ? "bg-emerald-50/40 opacity-75" : "hover:bg-gray-50/80"
                  }`}
                >
                  <div className="mt-0.5 text-bt-primary shrink-0">
                    {isChecked ? (
                      <CheckSquare className="w-5 h-5 text-emerald-600" />
                    ) : (
                      <Square className="w-5 h-5 text-gray-300" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className={`text-sm font-bold ${isChecked ? "line-through text-gray-400" : "text-gray-950"}`}>
                        {item.task}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider bg-blue-100 text-blue-800">
                        Custom Note
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 font-normal">{item.reason}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Add custom item form */}
          <form onSubmit={handleAddCustom} className="mt-5 pt-4 border-t border-gray-100 flex items-center gap-2">
            <input
              type="text"
              value={newCustomTask}
              onChange={(e) => setNewCustomTask(e.target.value)}
              placeholder="Add your own question (e.g. Test generator sound level from bedroom)..."
              className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-bt-primary"
            />
            <button
              type="submit"
              disabled={!newCustomTask.trim()}
              className="inline-flex items-center gap-1 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-white bg-bt-primary hover:bg-bt-primary-light disabled:opacity-50 transition-colors cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" /> Add
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
