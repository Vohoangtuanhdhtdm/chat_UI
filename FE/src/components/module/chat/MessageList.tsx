import { ArrowPathIcon } from "@heroicons/react/24/outline";
import type { Message } from "../../../types/chat";

interface Props {
  messages: Message[];
  isAiThinking: boolean;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
}

export const MessageList = ({
  messages,
  isAiThinking,
  messagesEndRef,
}: Props) => {
  return (
    <div className="flex-1 p-4 overflow-y-auto space-y-4">
      {messages.map((msg) => (
        <div
          key={msg.id}
          className={`flex gap-3 ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
        >
          {msg.sender === "ai" && (
            <div className="w-8 h-8 rounded-full bg-slate-600 flex-shrink-0"></div>
          )}
          <div
            className={`max-w-md px-4 py-2 rounded-lg ${
              msg.sender === "user"
                ? "bg-indigo-600 text-white"
                : "bg-slate-700 text-slate-200"
            }`}
          >
            <p className="text-sm">{msg.text}</p>
          </div>
        </div>
      ))}
      {isAiThinking && (
        <div className="flex gap-3 justify-start">
          <div className="w-8 h-8 rounded-full bg-slate-600 flex-shrink-0"></div>
          <div className="max-w-md px-4 py-2 rounded-lg bg-slate-700 text-slate-200">
            <ArrowPathIcon className="w-4 h-4 animate-spin" />
          </div>
        </div>
      )}
      <div ref={messagesEndRef} />
    </div>
  );
};
