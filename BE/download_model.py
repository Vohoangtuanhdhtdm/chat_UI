from sentence_transformers import SentenceTransformer
import os

# Đường dẫn muốn lưu model
output_dir = os.path.join(os.getcwd(), "models", "all-MiniLM-L6-v2")
os.makedirs(output_dir, exist_ok=True)

# Tải và lưu model
model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")
model.save(output_dir)

print(f"Đã lưu model vào: {output_dir}")
