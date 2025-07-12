export interface Message {
  id: string;
  text: string;
  sender: "user" | "ai";
}

export type FileStatus =
  | "idle"
  | "uploading"
  | "processing"
  | "ready"
  | "error";
