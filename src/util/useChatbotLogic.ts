import {
  useState,
  useRef,
  useEffect,
  type ChangeEvent,
  type FormEvent,
} from "react";
import type { FileStatus, Message } from "../types/chat";
import apiClient from "../api/axiosConfig";

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

  const uploadAndProcessFile = async (file: File) => {
    setFileStatus("uploading");
    const formData = new FormData();
    formData.append("file", file);

    try {
      setFileStatus("processing");
      const response = await apiClient.post("/query-file", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const data = response.data as { answer?: string };
      const introMessage =
        data.answer ||
        `Tôi đã đọc xong file "${file.name}". Bạn muốn hỏi gì về nội dung trong này?`;
      setMessages([{ id: "ai-intro", text: introMessage, sender: "ai" }]);
      setFileStatus("ready");
    } catch (error) {
      console.error("Error uploading or processing file:", error);
      setMessages([
        {
          id: "error-upload",
          text: "Rất tiếc, đã có lỗi xảy ra khi tải và xử lý file của bạn. Vui lòng thử lại.",
          sender: "ai",
        },
      ]);
      setFileStatus("error");
      setUploadedFile(null);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      setMessages([]);
      uploadAndProcessFile(file);
    }
  };

  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || fileStatus !== "ready" || isAiThinking) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: input,
      sender: "user",
    };
    setMessages((prev) => [...prev, userMessage]);
    const currentInput = input;
    setInput("");
    setIsAiThinking(true);

    try {
      const response = await apiClient.post("/query", {
        question: currentInput,
      });
      const data = response.data as { answer?: string };
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: data.answer || "Tôi không tìm thấy câu trả lời phù hợp.",
        sender: "ai",
      };
      setMessages((prev) => [...prev, aiResponse]);
    } catch (error) {
      console.error("Error sending message:", error);
      const errorResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: "Xin lỗi, đã có lỗi xảy ra. Tôi không thể xử lý yêu cầu của bạn lúc này.",
        sender: "ai",
      };
      setMessages((prev) => [...prev, errorResponse]);
    } finally {
      setIsAiThinking(false);
    }
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
