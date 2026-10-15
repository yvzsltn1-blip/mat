# -*- coding: utf-8 -*-
"""Belirtilen sayfaların metnini UTF-8 dosyaya yaz."""
import sys

data = open(r"C:\Users\YAVUZ\Documents\Game\matematik\kitap7-ayiklama-metni.txt", encoding="utf-8").read()
pages = {}
for p in data.split("===== SAYFA ")[1:]:
    m = p.split(" ", 1)
    if m and m[0].isdigit():
        pages[int(m[0])] = m[1] if len(m) > 1 else ""

nums = [int(x) for x in sys.argv[1:]]
out = []
for n in nums:
    out.append(f"########## SAYFA {n} ##########\n{pages.get(n, 'YOK')}")
with open(r"C:\Users\YAVUZ\Documents\Game\matematik\sayfa.out.txt", "w", encoding="utf-8") as f:
    f.write("\n".join(out))
print("OK")