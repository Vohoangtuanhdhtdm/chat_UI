import {
  ArrowPathIcon,
  DocumentTextIcon,
  PaperClipIcon,
} from "@heroicons/react/24/outline";

import React from "react";
import type { FileStatus } from "../../../types/chat";

interface Props {
  fileStatus: FileStatus;
  uploadedFile: File | null;
  onClickUpload: () => void;
}

export const FileStatusButton: React.FC<Props> = ({
  fileStatus,
  uploadedFile,
  onClickUpload,
}) => {
  switch (fileStatus) {
    case "uploading":
    case "processing":
      return (
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <ArrowPathIcon className="w-4 h-4 animate-spin" />
          <span>
            {fileStatus === "uploading" ? "Đang tải lên..." : "Đang xử lý..."}
          </span>
          <span className="text-slate-500 truncate max-w-48">
            {uploadedFile?.name}
          </span>
        </div>
      );
    case "ready":
      return (
        <div className="flex items-center gap-2 text-sm text-green-400">
          <DocumentTextIcon className="w-4 h-4" />
          <span>Sẵn sàng trò chuyện về file:</span>
          <span className="font-medium text-green-300 truncate max-w-48">
            {uploadedFile?.name}
          </span>
        </div>
      );
    case "error":
      return (
        <div className="text-sm text-red-400">
          Lỗi khi tải file. Vui lòng thử lại.
        </div>
      );
    default:
      return (
        <button
          onClick={onClickUpload}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors rounded-md bg-slate-600 text-slate-300 hover:bg-slate-500"
        >
          <PaperClipIcon className="w-4 h-4" />
          <span>Tải lên tài liệu (.pdf, .txt, .docx)</span>
        </button>
      );
  }
};
