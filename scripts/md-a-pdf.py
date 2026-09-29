#!/usr/bin/env python3
"""Convierte Markdown a PDF: python-markdown para el HTML + Google Chrome headless para el PDF.
Uso: python3 scripts/md-a-pdf.py <entrada.md> <salida.pdf> "<titulo>"
"""
import sys
import subprocess
import tempfile
import os
import markdown

CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

def main():
    entrada, salida, titulo = sys.argv[1], sys.argv[2], sys.argv[3]
    with open(entrada, encoding="utf-8") as f:
        texto = f.read()

    cuerpo = markdown.markdown(texto, extensions=["tables", "fenced_code"])
    html = f"""<!doctype html><html lang="es"><head><meta charset="utf-8">
<title>{titulo}</title>
<style>
  @page {{ margin: 1.8cm; size: A4; }}
  body {{ font-family: Helvetica, Arial, sans-serif; font-size: 10.5pt; line-height: 1.4; color: #111; }}
  h1 {{ font-size: 17pt; border-bottom: 2px solid #374151; padding-bottom: 4px; }}
  h2 {{ font-size: 13pt; margin-top: 16px; color: #1f2937; }}
  h3 {{ font-size: 11pt; }}
  code {{ background: #f3f4f6; padding: 1px 4px; border-radius: 3px; font-size: 9pt; }}
  pre {{ background: #f3f4f6; padding: 8px; border-radius: 5px; overflow-x: auto; font-size: 8.5pt; white-space: pre-wrap; }}
  table {{ border-collapse: collapse; width: 100%; font-size: 9pt; }}
  th, td {{ border: 1px solid #d1d5db; padding: 4px 6px; text-align: left; vertical-align: top; }}
  th {{ background: #f3f4f6; }}
  blockquote {{ border-left: 3px solid #9ca3af; margin-left: 0; padding-left: 10px; color: #4b5563; }}
</style></head><body>{cuerpo}</body></html>"""

    with tempfile.NamedTemporaryFile("w", suffix=".html", delete=False, encoding="utf-8") as tmp:
        tmp.write(html)
        ruta_html = tmp.name

    salida_abs = os.path.abspath(salida)
    try:
        subprocess.run(
            [CHROME, "--headless", "--disable-gpu", "--no-pdf-header-footer",
             f"--print-to-pdf={salida_abs}", f"file://{ruta_html}"],
            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True,
        )
        print(f"OK: {salida} ({os.path.getsize(salida_abs)} bytes)")
    finally:
        os.unlink(ruta_html)

if __name__ == "__main__":
    main()
