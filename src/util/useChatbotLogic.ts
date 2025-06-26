import {
  useState,
  useRef,
  useEffect,
  type ChangeEvent,
  type FormEvent,
} from "react";
import type { FileStatus, Message } from "../types/chat";

export const useChatbotLogic = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [fileStatus, setFileStatus] = useState<FileStatus>("idle");
  const [isAiThinking, setIsAiThinking] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const mockFileUploadAndProcess = (file: File) => {
    setFileStatus("uploading");
    setTimeout(() => {
      setFileStatus("processing");
      setTimeout(() => {
        setFileStatus("ready");
        setMessages([
          {
            id: "ai-intro",
            text: `Tôi đã đọc xong file "${file.name}". Bạn muốn hỏi gì về nội dung trong này?`,
            sender: "ai",
          },
        ]);
      }, 2500);
    }, 1500);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      setMessages([]);
      mockFileUploadAndProcess(file);
    }
  };

  const handleSendMessage = (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || fileStatus !== "ready" || isAiThinking) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: input,
      sender: "user",
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsAiThinking(true);

    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: `Dựa trên tài liệu bạn cung cấp, tôi tìm thấy thông tin liên quan đến "${input}". [Đây là câu trả lời được tạo ra từ nội dung file]`,
        sender: "ai",
      };
      setMessages((prev) => [...prev, aiResponse]);
      setIsAiThinking(false);
    }, 2000);
  };

  return {
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
  };
};
