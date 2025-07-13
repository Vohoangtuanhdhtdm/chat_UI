from flask import Flask, request, jsonify, Response
from flask_cors import CORS
from sentence_transformers import SentenceTransformer
import faiss
import json
import os
import fitz  # PyMuPDF
from docx import Document
from ollama import Client
import traceback

# -----------------------
# 📁 Cấu hình đường dẫn
# -----------------------
INDEX_PATH = "index/faiss.index"
METADATA_PATH = "index/index.json"
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# -----------------------
# 🔍 Load FAISS index + model
# -----------------------
model = SentenceTransformer("all-MiniLM-L6-v2")

if not os.path.exists(INDEX_PATH) or not os.path.exists(METADATA_PATH):
    raise FileNotFoundError("❌ Chưa có index hoặc metadata. Hãy chạy encode.py trước!")

index = faiss.read_index(INDEX_PATH)
with open(METADATA_PATH, "r", encoding="utf-8") as f:
    metadata = json.load(f)

# -----------------------
# 🚀 Khởi động Flask
# -----------------------
app = Flask(__name__)
CORS(app)

@app.route("/")
def home():
    return "✅ MemvidX API is running."


# -----------------------
# 🔍 Truy vấn văn bản người dùng + Ollama
# -----------------------
@app.route("/query", methods=["POST"])
def query():
    query_text = request.json.get("q", "")
    if not query_text:
        return jsonify({"error": "Missing query"}), 400

    query_embedding = model.encode([query_text])
    D, I = index.search(query_embedding, k=5)

    chunks = []
    for idx in I[0]:
        chunk = metadata.get(str(idx)) or metadata.get(idx)
        if chunk:
            chunks.append(chunk["text"])

    if not chunks:
        return jsonify({"answer": "Không tìm thấy nội dung phù hợp."})

    answer = summarize_results(query_text, chunks)
    return jsonify({"answer": answer})


# -----------------------
# 📤 Truy vấn từ file (lấy đoạn liên quan nhất)
# -----------------------
@app.route("/query-file", methods=["POST"])
def query_file():
    if "file" not in request.files:
        return jsonify({"error": "Missing file"}), 400
    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "Empty filename"}), 400

    save_path = os.path.join(UPLOAD_DIR, file.filename)
    file.save(save_path)

    text = extract_text(save_path)
    if not text.strip():
        return jsonify({"error": "Không đọc được nội dung file."}), 400

    
    query_embedding = model.encode([text])
    D, I = index.search(query_embedding, k=5)

    chunks = []
    for idx in I[0]:
        chunk = metadata.get(str(idx)) or metadata.get(idx)
        if chunk:
            chunks.append(chunk["text"])

    if not chunks:
        return jsonify({"answer": "Không tìm thấy nội dung phù hợp."})

    answer = summarize_results(text, chunks)
    return jsonify({"answer": answer})



# -----------------------
# 🧠 Tóm tắt toàn bộ nội dung file
# -----------------------
@app.route("/summarize-file", methods=["POST"])
def summarize_file():
    if "file" not in request.files:
        return jsonify({"error": "Missing file"}), 400
    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "Empty filename"}), 400

    save_path = os.path.join(UPLOAD_DIR, file.filename)
    file.save(save_path)

    text = extract_text(save_path)
    if not text.strip():
        return jsonify({"error": "Không đọc được nội dung file."}), 400

    summary = summarize_whole_document(text)
    return jsonify({"summary": summary})


# -----------------------
# 🧠 Gọi Ollama để tóm tắt tài liệu
# -----------------------
def summarize_whole_document(content: str, model_name: str = "gemma3:1b") -> str:
    prompt = (
        "Bạn là một trợ lý AI. Hãy tóm tắt nội dung văn bản sau bằng tiếng Việt rõ ràng, dễ hiểu. "
        "Tóm tắt nên ngắn gọn, súc tích, làm nổi bật các ý chính và tránh lặp lại.\n\n"
        "Nội dung văn bản:\n\n" + content
    )
    try:
        client = Client(host="http://localhost:11434")
        response = client.chat(
            model=model_name,
            messages=[{"role": "user", "content": prompt}]
        )
        return response['message']['content']
    except Exception:
        traceback.print_exc()
        return "⚠️ Lỗi khi gọi mô hình AI để tóm tắt."


# -----------------------
# 🧠 Gọi Ollama để tổng hợp câu trả lời từ các đoạn ngữ nghĩa
# -----------------------
def summarize_results(query_text: str, chunks: list[str], model_name: str = "gemma3:1b") -> str:
    prompt = (
        "Bạn là một trợ lý AI thông minh, có nhiệm vụ trả lời truy vấn của người dùng "
        "dựa trên những đoạn thông tin đã cung cấp. Những đoạn này là kết quả tìm kiếm ngữ nghĩa từ cơ sở dữ liệu văn bản.\n\n"
        "Trước khi trả lời:\n"
        "- Đọc kỹ tất cả các đoạn thông tin.\n"
        "- Xác định nội dung liên quan nhất đến câu hỏi.\n"
        "- Tổng hợp, diễn giải lại bằng ngôn ngữ rõ ràng, súc tích, mạch lạc.\n\n"
        "Hướng dẫn khi trả lời:\n"
        "- Chỉ sử dụng thông tin từ các đoạn văn đã cho.\n"
        "- Tránh suy đoán hoặc thêm thông tin không có trong nguồn.\n"
        "- Nếu không thể trả lời từ thông tin hiện có, hãy nói rõ là không tìm thấy dữ liệu phù hợp.\n\n"
        "Đảm bảo trả lời bằng tiếng Việt chuẩn, dễ hiểu và chính xác nhất có thể.\n\n"
        "Bây giờ, hãy đọc các đoạn sau và trả lời câu hỏi của người dùng."
    )
    sources_text = "\n\n".join([f"{i+1}. {chunk}" for i, chunk in enumerate(chunks)])
    user_message = f"Các đoạn liên quan:\n\n{sources_text}\n\nCâu hỏi: {query_text}"

    try:
        client = Client(host="http://localhost:11434")
        response = client.chat(
            model=model_name,
            messages=[
                {"role": "system", "content": prompt},
                {"role": "user", "content": user_message}
            ]
        )
        return response['message']['content']
    except Exception:
        traceback.print_exc()
        return "⚠️ Lỗi khi gọi mô hình AI."


# -----------------------
# 📄 Trích nội dung từ file
# -----------------------
def extract_text(file_path):
    try:
        if file_path.endswith(".pdf"):
            doc = fitz.open(file_path)
            text = "\n".join([page.get_text() for page in doc])
            doc.close()
            return text
        elif file_path.endswith(".docx"):
            doc = Document(file_path)
            return "\n".join([p.text for p in doc.paragraphs])
        elif file_path.endswith(".txt"):
            with open(file_path, "r", encoding="utf-8") as f:
                return f.read()
    except:
        return ""
    return ""


# -----------------------
# 🚀 Chạy server Flask
# -----------------------
if __name__ == "__main__":
    app.run(debug=True)
