# -*- coding: utf-8 -*-
"""Yapısal işaretçileri sayfa numaralarıyla bul."""
import re

data = open(r"C:\Users\YAVUZ\Documents\Game\matematik\kitap7-ayiklama-metni.txt", encoding="utf-8").read()
pages = data.split("===== SAYFA ")

patterns = [
    r"TEMA[:\s]", r"İçindekiler", r"Hazır mıyız", r"Başlayalım", r"Performans Görevi",
    r"Ölçme ve Değerlendirme", r"Zihin Haritası", r"İzleme Testi", r"Akran Değerlendirme",
    r"Öğrenme Günlüğü", r"Kontrol Listesi", r"Öz Değerlendirme", r"Sözlük", r"E-İçerik",
    r"Kazanımlar", r"Kavramlar", r"etkinlik", r"Kültür", r"kültür",
]
out = []
for p in pages[1:]:
    m = re.match(r"(\d+) ", p)
    if not m:
        continue
    pno = int(m.group(1))
    for pat in patterns:
        for line in p.splitlines():
            if re.search(pat, line, flags=re.I):
                ln = line.strip()[:90]
                out.append(f"s.{pno}: {ln}")
with open(r"C:\Users\YAVUZ\Documents\Game\matematik\yapi.out.txt", "w", encoding="utf-8") as f:
    f.write("\n".join(out))
print("yazıldı:", len(out), "satır")