# -*- coding: utf-8 -*-
"""
MEB PDF'indeki ToUnicode'suz fontlara glif adlarından ToUnicode CMap ekler.
Kullanım: py pdf_tounicode_ekle.py <girdi.pdf> <çıktı.pdf>
"""
import io
import sys
import pikepdf
from fontTools.cffLib import CFFFontSet
from fontTools.ttLib import TTFont
from fontTools.agl import toUnicode as agl2uni


def winansi_table():
    """cp1252 byte -> unicode tablosu (WinAnsiEncoding)."""
    return {b: bytes([b]).decode("cp1252", errors="replace") for b in range(256)}


def stdenc_table():
    """PDF StandardEncoding yaklaşık karşılığı (cp1252 fallback + Bilinen farklar)."""
    # Bu kitapta WinAnsi baskın; StandardEncoding için cp1252 yeterli yaklaşım.
    return winansi_table()


def simple_font_code_map(font):
    """Basit font için byte -> unicode haritası."""
    base = winansi_table()
    enc = font.get("/Encoding")
    if enc is None:
        return base
    if isinstance(enc, pikepdf.Name):
        n = str(enc)
        if "Standard" in n:
            base = stdenc_table()
        return base
    # /Encoding bir sözlük
    if "/BaseEncoding" in enc:
        n = str(enc["/BaseEncoding"])
        if "Standard" in n:
            base = stdenc_table()
    if "/Differences" in enc:
        diffs = enc["/Differences"]
        code = 0
        for item in diffs:
            if isinstance(item, (int, float)):
                code = int(item)
            elif isinstance(item, pikepdf.Name):
                u = agl2uni(str(item))
                if u:
                    base[code] = u
                code += 1
    return base


def cff_gid_unicode(content):
    """Sade CFF veya CIDFontType0C içerikten GID -> unicode haritası."""
    cff = CFFFontSet()
    cff.decompile(io.BytesIO(content), None)
    result = {}
    for fname in cff.fontNames:
        font = cff[fname]
        charset = font.charset  # GID 1..n glif adları
        for gid, name in enumerate([".notdef"] + list(charset)):
            u = agl2uni(name)
            if u and gid not in result:
                result[gid] = u
    return result


def ttf_gid_unicode(content):
    """TTF içerikten GID -> unicode haritası (cmap ters çevirme)."""
    f = TTFont(io.BytesIO(content))
    result = {}
    cmap = f.getBestCmap() if "cmap" in f else {}
    for uni, name in cmap.items():
        result[f.getGlyphID(name)] = chr(uni)
    # cmap'te olmayanlar için post adları (format 2)
    if "post" in f and f["post"].formatType == 2.0:
        names = f.getGlyphOrder()
        for gid, name in enumerate(names):
            if gid not in result:
                u = agl2uni(name)
                if u:
                    result[gid] = u
    return result


def composite_font_cid_map(font):
    """Type0 font için CID -> unicode haritası (Identity-H varsayımı)."""
    desc = font["/DescendantFonts"][0]
    fd = desc["/FontDescriptor"]
    if "/FontFile2" in fd:  # TrueType
        content = fd["/FontFile2"].read_bytes()
        return ttf_gid_unicode(content)
    if "/FontFile3" in fd:
        stream = fd["/FontFile3"]
        content = stream.read_bytes()
        subtype = stream.get("/Subtype")
        # Type1C sade CFF olabilir; CIDFontType0C de CFF'dir
        return cff_gid_unicode(content)
    return {}


def build_tounicode(cmap, two_byte):
    """code->unicode haritasından ToUnicode CMap baytları üretir."""
    space = "<0000> <FFFF>" if two_byte else "<00> <FF>"
    lines = [
        "/CIDInit /ProcSet findresource begin",
        "12 dict begin",
        "begincmap",
        "/CIDSystemInfo << /Registry (Adobe) /Ordering (UCS) /Supplement 0 >> def",
        "/CMapName /Adobe-Identity-UCS def",
        "/CMapType 2 def",
        "1 begincodespacerange",
        space,
        "endcodespacerange",
    ]
    items = sorted((c, u) for c, u in cmap.items() if u and c > 0)
    CHUNK = 100
    for i in range(0, len(items), CHUNK):
        chunk = items[i:i + CHUNK]
        lines.append(f"{len(chunk)} beginbfchar")
        for code, u in chunk:
            src = f"{code:04X}" if two_byte else f"{code:02X}"
            dst = u.encode("utf-16-be").hex().upper()
            lines.append(f"<{src}> <{dst}>")
        lines.append("endbfchar")
    lines += [
        "endcmap",
        "CMapName currentdict /CMap defineresource pop",
        "end",
        "end",
    ]
    return ("\n".join(lines) + "\n").encode("latin-1")


def main(src, dst):
    pdf = pikepdf.open(src)
    patched = skipped = failed = 0
    seen = set()
    for page in pdf.pages:
        try:
            res = pikepdf.Page(page).resources
        except Exception:
            res = page.get("/Resources")
        fonts = res.get("/Font") if res is not None else None
        if fonts is None:
            continue
        for fkey, fontref in fonts.items():
            try:
                font = fontref
                objgen = font.unparsed_objgen if hasattr(font, "unparsed_objgen") else id(font)
                if objgen in seen:
                    continue
                seen.add(objgen)
                if font.get("/Type") != pikepdf.Name("/Font"):
                    continue
                if "/ToUnicode" in font:
                    skipped += 1
                    continue
                subtype = str(font.get("/Subtype", ""))
                if subtype == "/Type0":
                    cmap = composite_font_cid_map(font)
                    if not cmap:
                        failed += 1
                        continue
                    data = build_tounicode(cmap, two_byte=True)
                elif subtype in ("/Type1", "/TrueType", "/MMType1", "/Type3"):
                    if subtype == "/Type3":
                        failed += 1
                        continue
                    cmap = simple_font_code_map(font)
                    data = build_tounicode(cmap, two_byte=False)
                else:
                    failed += 1
                    continue
                font["/ToUnicode"] = pdf.make_stream(data)
                patched += 1
            except Exception as e:
                failed += 1
                print("HATA font:", e)
    pdf.save(dst)
    print(f"TOUNICODE eklendi: {patched}, zaten var: {skipped}, atlanan/hatalı: {failed}")


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])