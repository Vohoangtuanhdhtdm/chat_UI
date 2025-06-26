import { PaperAirplaneIcon } from "@heroicons/react/24/outline";
import React from "react";

interface Props {
  input: string;
  setInput: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  disabled: boolean;
  placeholder: string;
}

export const ChatInput: React.FC<Props> = ({
  input,
  setInput,
  onSubmit,
  disabled,
  placeholder,
}) => {
  return (
    <form onSubmit={onSubmit} className="relative">
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full py-3 pl-4 pr-20 text-sm bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
      />
      <button
        type="submit"
        disabled={disabled || !input.trim()}
        className="absolute inset-y-0 right-0 flex items-center justify-center w-16 text-slate-400 hover:text-indigo-400 disabled:hover:text-slate-400 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <PaperAirplaneIcon className="w-5 h-5" />
      </button>
    </form>
  );
};
