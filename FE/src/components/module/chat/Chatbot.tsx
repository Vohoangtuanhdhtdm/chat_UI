import { SparklesIcon } from "@heroicons/react/24/outline";
import { useChatbotLogic } from "../../../util/useChatbotLogic";
import { FileStatusButton } from "./FileStatusButton";
import { MessageList } from "./MessageList";
import { ChatInput } from "./ChatInput";

export const Chatbot = () => {
  const {
    messages,
    input,
    uploadedFile,
    fileStatus,
    isAiThinking,
    fileInputRef,
    messagesEndRef,
    setInput,
    handleSendMessage,
    handleFileChange,
  } = useChatbotLogic();

  return (
    <div className="flex flex-col w-full max-w-2xl mx-auto h-[90vh] bg-slate-800 text-white shadow-2xl rounded-lg border border-slate-700">
      {/* Header */}
      <div className="p-4 border-b border-slate-700 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <SparklesIcon className="w-6 h-6 text-indigo-400" />
          <h1 className="text-xl font-bold text-slate-100">AI Document Chat</h1>
        </div>
        <div>
          <FileStatusButton
            fileStatus={fileStatus}
            uploadedFile={uploadedFile}
            onClickUpload={() => fileInputRef.current?.click()}
          />
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept=".pdf,.txt,.docx"
          />
        </div>
      </div>

      <MessageList
        messages={messages}
        isAiThinking={isAiThinking}
        messagesEndRef={messagesEndRef}
      />

      <div className="p-4 border-t border-slate-700">
        <ChatInput
          input={input}
          setInput={setInput}
          onSubmit={handleSendMessage}
          disabled={fileStatus !== "ready" || isAiThinking}
          placeholder={
            fileStatus !== "ready"
              ? "Vui lòng tải lên một tài liệu để bắt đầu..."
              : "Hỏi bất cứ điều gì về tài liệu của bạn..."
          }
        />
      </div>
    </div>
  );
};
