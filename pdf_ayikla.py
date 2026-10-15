import sys
import fitz  # PyMuPDF

pdf_path = sys.argv[1]
out_path = sys.argv[2]

doc = fitz.open(pdf_path)
with open(out_path, "w", encoding="utf-8") as f:
    f.write(f"TOPLAM SAYFA: {doc.page_count}\n")
    for i, page in enumerate(doc, start=1):
        f.write(f"\n===== SAYFA {i} =====\n")
        text = page.get_text("text")
        f.write(text)
doc.close()
print("OK:", out_path)