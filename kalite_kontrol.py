# -*- coding: utf-8 -*-
"""Çıkarım kalite kontrolü."""
import sys

data = open(r"C:\Users\YAVUZ\Documents\Game\matematik\kitap7-ayiklama-metni.txt", encoding="utf-8").read()
print("FFFD sayısı:", data.count("\ufffd"))
pages = data.split("===== SAYFA ")
for p in pages:
    if p.startswith("16 "):
        print("--- SAYFA 16 ---")
        sys.stdout.buffer.write(p[:700].encode("utf-8"))
        print()
        break