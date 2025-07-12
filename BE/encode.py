import os
import fitz  # PyMuPDF để đọc PDF
import qrcode
from PIL import Image
import cv2
import json
import logging
from docx import Document
from sentence_transformers import SentenceTransformer
import faiss

# --------------------------
# 🧱 Cấu hình hệ thống
# --------------------------
logging.basicConfig(level=logging.INFO, format='[%(levelname)s] %(message)s')

INPUT_DIR = "input_docs"
FRAME_DIR = "qr_frames"
VIDEO_PATH = "video/memvid_memory.mp4"
INDEX_PATH = "index/faiss.index"
METADATA_PATH = "index/index.json"
STATS_PATH = "index/stat.json"

# --------------------------
# 📁 Tạo thư mục cần thiết
# --------------------------
os.makedirs(FRAME_DIR, exist_ok=True)
os.makedirs("video", exist_ok=True)
os.makedirs("index", exist_ok=True)

# Xoá QR cũ
for f in os.listdir(FRAME_DIR):
    os.remove(os.path.join(FRAME_DIR, f))

# --------------------------
# 📄 Đọc nội dung file
# --------------------------
def extract_text(file_path):
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
    return ""

# --------------------------
# ✂️ Chia nhỏ nội dung
# --------------------------
def split_text(text, max_bytes=1050):
    chunks = []
    current = ""
    for word in text.split():
        test = current + " " + word if current else word
        if len(test.encode("utf-8")) > max_bytes:
            if current:
                chunks.append(current.strip())
            current = word
        else:
            current = test
    if current:
        chunks.append(current.strip())
    return chunks

# --------------------------
# 📷 Tạo ảnh QR từ đoạn văn
# --------------------------
def generate_qr(text, idx, source="unknown"):
    payload = f"[{source}|{idx}]\n{text}"
    if len(payload.encode("utf-8")) > 1200:
        logging.warning(f"⛔ Chunk {idx} quá dài, bỏ qua ({len(payload.encode('utf-8'))} bytes).")
        return False
    qr = qrcode.QRCode(
        version=40,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(payload)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    img.save(f"{FRAME_DIR}/frame_{idx:05}.png")
    return True

# --------------------------
# 🎞️ Tạo video từ các frame QR
# --------------------------
def build_video():
    images = sorted(os.listdir(FRAME_DIR))
    if not images:
        logging.error("❌ Không có ảnh QR nào để tạo video.")
        return
    sample = Image.open(os.path.join(FRAME_DIR, images[0]))
    size = sample.size[::-1]  # PIL trả (width, height), OpenCV cần (height, width)
    out = cv2.VideoWriter(VIDEO_PATH, cv2.VideoWriter_fourcc(*'mp4v'), 1, size)
    for img_name in images:
        img_path = os.path.join(FRAME_DIR, img_name)
        frame = cv2.imread(img_path)
        out.write(frame)
    out.release()
    logging.info(f"📼 Video QR đã tạo: {VIDEO_PATH}")

# --------------------------
# 🧠 Tạo FAISS index
# --------------------------
def build_index(chunks):
    model = SentenceTransformer("all-MiniLM-L6-v2")
    embeddings = model.encode(chunks)
    if len(embeddings.shape) < 2:
        raise ValueError("❌ Không có embedding nào — kiểm tra lại file đầu vào!")
    index = faiss.IndexFlatL2(embeddings.shape[1])
    index.add(embeddings)
    faiss.write_index(index, INDEX_PATH)
    with open(METADATA_PATH, "w", encoding="utf-8") as f:
        json.dump({i: {"text": chunk} for i, chunk in enumerate(chunks)}, f, ensure_ascii=False, indent=2)
    logging.info("🧠 FAISS index & metadata đã lưu.")

# --------------------------
# 📊 Ghi lại thống kê
# --------------------------
def save_stats(total_chunks, files_used):
    stats = {
        "total_chunks": total_chunks,
        "video_path": VIDEO_PATH,
        "index_path": INDEX_PATH,
        "metadata_path": METADATA_PATH,
        "files": files_used
    }
    with open(STATS_PATH, "w", encoding="utf-8") as f:
        json.dump(stats, f, ensure_ascii=False, indent=2)

# --------------------------
# 🚀 Chạy toàn bộ quá trình
# --------------------------
if __name__ == "__main__":
    all_chunks = []
    files_processed = []
    idx = 0

    for filename in os.listdir(INPUT_DIR):
        if filename.endswith((".pdf", ".docx", ".txt")):
            path = os.path.join(INPUT_DIR, filename)
            text = extract_text(path)
            chunks = split_text(text, max_bytes=1050)
            for chunk in chunks:
                if generate_qr(chunk, idx, source=filename):
                    all_chunks.append(chunk)
                    idx += 1
            files_processed.append(filename)
            logging.info(f"✅ Xử lý xong {filename} — {len(chunks)} đoạn.")

    build_video()
    build_index(all_chunks)
    save_stats(len(all_chunks), files_processed)
    logging.info(f"🏁 Hoàn tất encode {len(all_chunks)} đoạn từ {len(files_processed)} file.")
