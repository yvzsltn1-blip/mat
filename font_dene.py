# -*- coding: utf-8 -*-
"""CFF charset + TTF cmap incelemesi (v2)."""
import io
import fitz
from fontTools.cffLib import CFFFontSet
from fontTools.agl import toUnicode as agl2uni

PDF = r"C:\Users\YAVUZ\Documents\Game\matematik\Kitaplar\matematik7-1.pdf"
doc = fitz.open(PDF)

for xref in (36866, 36954, 37058):
    name, ext, ftype, content = doc.extract_font(xref)
    print("---- xref", xref, name, ext, "boyut:", len(content))
    if ext == "cff":
        cff = CFFFontSet()
        cff.decompile(io.BytesIO(content), None)
        font = cff[cff.fontNames[0]]
        cs = font.CharStrings  # isim -> T2CharString objesi
        names = list(cs.keys())
        print("  CharStrings glif sayısı:", len(names))
        print("  ilk 60 glif:", names[:60])
        uni = "".join(agl2uni(n) for n in names)
        print("  AGL çözümlenen:", sum(1 for n in names if agl2uni(n)), "/", len(names))
        print("  birleşik unicode örneği:", uni[:150])
    else:
        from fontTools.ttLib import TTFont
        f = TTFont(io.BytesIO(content))
        cmap = f.getBestCmap()
        print("  cmap girişleri:", len(cmap), "örnek:", dict(list(cmap.items())[:8]))
doc.close()