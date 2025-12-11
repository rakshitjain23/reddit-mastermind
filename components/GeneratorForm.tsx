"use client";

import { useState } from "react";
import { Plus, Trash2, Loader2, Link as LinkIcon, UserCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { GeneratorFormData, Persona } from "@/lib/types";

interface GeneratorFormProps {
  onGenerate: (data: GeneratorFormData) => void;
  isLoading: boolean;
}

export function GeneratorForm({ onGenerate, isLoading }: GeneratorFormProps) {
  const [formData, setFormData] = useState<GeneratorFormData>({
    companyInfo: "",
    companyWebsite: "",
    personas: [{ username: "", bio: "" }],
    subreddits: [""],
    topics: [""],
    postsPerWeek: 3,
  });

  // Handle generic string arrays (subreddits, topics)
  const handleStringArrayChange = (
    field: "subreddits" | "topics",
    index: number,
    value: string
  ) => {
    const newArray = [...formData[field]];
    newArray[index] = value;
    setFormData({ ...formData, [field]: newArray });
  };

  // Handle Persona object array
  const handlePersonaChange = (
    index: number,
    field: keyof Persona,
    value: string
  ) => {
    const newPersonas = [...formData.personas];
    newPersonas[index] = { ...newPersonas[index], [field]: value };
    setFormData({ ...formData, personas: newPersonas });
  };

  const addItem = (field: "personas" | "subreddits" | "topics") => {
    if (field === "personas") {
      setFormData({
        ...formData,
        personas: [...formData.personas, { username: "", bio: "" }],
      });
    } else {
      setFormData({ 
        ...formData, 
        [field]: [...formData[field], ""] 
      });
    }
  };

  const removeItem = (
    field: "personas" | "subreddits" | "topics",
    index: number
  ) => {
    if (formData[field].length === 1) return;
    
    if (field === "personas") {
      const newPersonas = formData.personas.filter((_, i) => i !== index);
      setFormData({ ...formData, personas: newPersonas });
    } else {
      const newArray = (formData[field] as string[]).filter((_, i) => i !== index);
      setFormData({ ...formData, [field]: newArray });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanedData: GeneratorFormData = {
      ...formData,
      personas: formData.personas.filter((p) => p.username.trim() && p.bio.trim()),
      subreddits: formData.subreddits.filter((s) => s.trim()),
      topics: formData.topics.filter((t) => t.trim()),
    };
    onGenerate(cleanedData);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="relative z-10 max-w-3xl mx-auto p-8 space-y-8 bg-black/40 dark:bg-black/60 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl animate-in fade-in slide-in-from-bottom-8 duration-700"
    >
      <div className="space-y-2 text-center">
        <h2 className="text-3xl font-bold tracking-tighter bg-linear-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
          Strategy Configuration
        </h2>
        <p className="text-zinc-400 font-light">
          Craft your digital persona and target audience.
        </p>
      </div>

      {/* Company Info Section */}
      <div className="space-y-4">
        <div className="space-y-2">
            <label className="block text-sm font-medium text-zinc-300">Target Company Profile</label>
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-linear-to-r from-blue-500 to-purple-600 rounded-xl opacity-20 group-hover:opacity-60 transition duration-500 blur"></div>
              <textarea
                required
                className="relative w-full min-h-[120px] p-4 rounded-xl bg-zinc-900/80 border border-white/10 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all resize-y"
                placeholder="Describe the company, product, and value prop..."
                value={formData.companyInfo}
                onChange={(e) =>
                  setFormData({ ...formData, companyInfo: e.target.value })
                }
              />
            </div>
        </div>

        <div className="space-y-2">
            <label className="block text-sm font-medium text-zinc-300">Website / Social URL</label>
            <div className="relative group">
               <div className="absolute left-3 top-3 text-zinc-500">
                  <LinkIcon size={18} />
               </div>
               <input 
                  type="url"
                  className="w-full p-3 pl-10 rounded-xl bg-zinc-900/50 border border-white/10 text-zinc-100 focus:bg-zinc-900 focus:border-blue-500/50 focus:outline-none transition-all placeholder-zinc-600"
                  placeholder="https://example.com"
                  value={formData.companyWebsite}
                  onChange={(e) => setFormData({ ...formData, companyWebsite: e.target.value })}
               />
            </div>
        </div>
      </div>

      {/* Structured Personas Section */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-zinc-300">Personas</label>
        {formData.personas.map((persona, index) => (
            <div key={index} className="p-4 rounded-xl bg-zinc-900/30 border border-white/5 space-y-3 group hover:border-white/10 transition-colors">
                <div className="flex gap-3">
                    <div className="flex-1 space-y-3">
                        <div className="relative">
                            <UserCircle className="absolute left-3 top-3 text-zinc-500" size={18} />
                            <input
                                required
                                className="w-full p-3 pl-10 rounded-lg bg-zinc-900/50 border border-white/10 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-purple-500/50"
                                placeholder="Reddit Username (e.g. SysAdmin_Guru)"
                                value={persona.username}
                                onChange={(e) => handlePersonaChange(index, "username", e.target.value)}
                            />
                        </div>
                        <textarea 
                            required
                            className="w-full p-3 rounded-lg bg-zinc-900/50 border border-white/10 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-purple-500/50 min-h-[80px] resize-y"
                            placeholder="Persona Bio: Age, occupation, tone, beliefs..."
                            value={persona.bio}
                            onChange={(e) => handlePersonaChange(index, "bio", e.target.value)}
                        />
                    </div>
                    
                    <button
                      type="button"
                      onClick={() => removeItem("personas", index)}
                      className="self-start p-3 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 hover:border-red-500/50 transition-all opacity-60 hover:opacity-100"
                      disabled={formData.personas.length === 1}
                    >
                      <Trash2 size={20} />
                    </button>
                </div>
            </div>
        ))}
        <button
            type="button"
            onClick={() => addItem("personas")}
            className="group flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors"
          >
            <div className="p-1 rounded-full bg-white/10 group-hover:bg-blue-500 transition-colors">
               <Plus size={14} className="text-white" />
            </div>
            <span>Add another persona</span>
        </button>
      </div>

      {/* Simple Arrays (Subreddits, Topics) */}
      {(
        [
          { key: "subreddits", label: "Target Subreddits", placeholder: "e.g., r/sysadmin" },
          { key: "topics", label: "Topic Themes", placeholder: "e.g., printer issues" },
        ] as const
      ).map((section) => (
        <div key={section.key} className="space-y-3">
          <label className="block text-sm font-medium text-zinc-300 capitalize">
            {section.label}
          </label>
          {formData[section.key].map(
            (item, index) => (
              <div key={index} className="flex gap-2 group">
                 <div className="relative flex-1">
                    <input
                      required
                      className="w-full p-3 rounded-xl bg-zinc-900/50 border border-white/10 text-zinc-100 focus:bg-zinc-900 focus:border-blue-500/50 focus:outline-none transition-all placeholder-zinc-600"
                      placeholder={section.placeholder}
                      value={item}
                      onChange={(e) =>
                        handleStringArrayChange(
                          section.key,
                          index,
                          e.target.value
                        )
                      }
                    />
                 </div>
                <button
                  type="button"
                  onClick={() => removeItem(section.key, index)}
                  className="p-3 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 hover:border-red-500/50 transition-all opacity-60 hover:opacity-100"
                  disabled={formData[section.key].length === 1}
                >
                  <Trash2 size={20} />
                </button>
              </div>
            )
          )}
          <button
            type="button"
            onClick={() => addItem(section.key)}
            className="group flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors"
          >
            <div className="p-1 rounded-full bg-white/10 group-hover:bg-blue-500 transition-colors">
               <Plus size={14} className="text-white" />
            </div>
            <span>Add another {section.label.toLowerCase().slice(0, -1)}</span>
          </button>
        </div>
      ))}

      <div className="space-y-4">
        <label className="block text-sm font-medium text-zinc-300">Weekly Post Volume</label>
        <div className="relative">
          <input
            type="number"
            min={1}
            max={10}
            className="w-full p-3 rounded-xl bg-zinc-900/50 border border-white/10 text-zinc-100 focus:border-blue-500/50 focus:outline-none transition-all"
            value={formData.postsPerWeek}
            onChange={(e) =>
              setFormData({
                ...formData,
                postsPerWeek: parseInt(e.target.value) || 0,
              })
            }
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className={cn(
          "relative w-full py-4 px-6 rounded-xl font-bold text-white shadow-lg overflow-hidden group transition-all",
          isLoading
            ? "cursor-not-allowed opacity-70"
            : "hover:scale-[1.02] active:scale-[0.98]"
        )}
      >
        <div className={cn(
            "absolute inset-0 bg-linear-to-r from-blue-600 via-purple-600 to-pink-600 transition-transform duration-500",
            isLoading ? "opacity-50" : "group-hover:scale-105"
        )} />
        <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        <span className="relative flex items-center justify-center gap-2 text-lg">
          {isLoading ? (
            <>
              <Loader2 className="animate-spin" size={24} /> 
              <span className="animate-pulse">Forging Content...</span>
            </>
          ) : (
            "Generate Strategy"
          )}
        </span>
      </button>
    </form>
  );
}
