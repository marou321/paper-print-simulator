/**
 * PeachyPrint — True-Size ISO PDF 1.4 Exporter (Zero External Dependencies)
 * Embeds a rendered HTML5 Canvas (JPEG stream) onto a single PDF page with exact
 * physical dimensions in PostScript points (1 inch = 72 pt, 1 mm = 72/25.4 pt).
 */
(function (global) {
  'use strict';

  const PT_PER_MM = 72 / 25.4;

  function asciiToBytes(str) {
    const out = new Uint8Array(str.length);
    for (let i = 0; i < str.length; i++) {
      out[i] = str.charCodeAt(i) & 0xff;
    }
    return out;
  }

  function dataUrlToBytes(dataUrl) {
    const base64 = dataUrl.split(',')[1];
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }

  function concatByteChunks(chunks) {
    let totalLength = 0;
    for (const c of chunks) totalLength += c.length;
    const merged = new Uint8Array(totalLength);
    let offset = 0;
    for (const c of chunks) {
      merged.set(c, offset);
      offset += c.length;
    }
    return merged;
  }

  /**
   * Build a valid PDF 1.4 Uint8Array from raw JPEG bytes and target ISO dimensions.
   */
  function buildPdfFromJpegBytes(jpegBytes, imgWidthPx, imgHeightPx, pageWidthMm, pageHeightMm) {
    const pageW = (pageWidthMm * PT_PER_MM).toFixed(3);
    const pageH = (pageHeightMm * PT_PER_MM).toFixed(3);

    const chunks = [];
    const offsets = [0]; // object 0 is the free head entry
    let byteCursor = 0;

    function pushBytes(bytes) {
      chunks.push(bytes);
      byteCursor += bytes.length;
    }

    function pushAscii(str) {
      pushBytes(asciiToBytes(str));
    }

    // PDF Header + binary marker comment
    pushAscii('%PDF-1.4\n');
    pushBytes(new Uint8Array([0x25, 0xe2, 0xe3, 0xcf, 0xd3, 0x0a]));

    // Object 1: Catalog
    offsets.push(byteCursor);
    pushAscii('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');

    // Object 2: Pages
    offsets.push(byteCursor);
    pushAscii('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n');

    // Object 3: Page
    offsets.push(byteCursor);
    pushAscii(
      `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageW} ${pageH}] ` +
      `/Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>\nendobj\n`
    );

    // Object 4: JPEG Image XObject
    offsets.push(byteCursor);
    pushAscii(
      `4 0 obj\n<< /Type /XObject /Subtype /Image /Width ${imgWidthPx} /Height ${imgHeightPx} ` +
      `/ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpegBytes.length} >>\nstream\n`
    );
    pushBytes(jpegBytes);
    pushAscii('\nendstream\nendobj\n');

    // Object 5: Page Content Stream (draws image across full physical page)
    const contentStream = `q\n${pageW} 0 0 ${pageH} 0 0 cm\n/Im0 Do\nQ\n`;
    offsets.push(byteCursor);
    pushAscii(`5 0 obj\n<< /Length ${contentStream.length} >>\nstream\n${contentStream}endstream\nendobj\n`);

    // Cross-reference table
    const xrefOffset = byteCursor;
    pushAscii(`xref\n0 ${offsets.length}\n`);
    pushAscii('0000000000 65535 f \n');
    for (let i = 1; i < offsets.length; i++) {
      const padded = String(offsets[i]).padStart(10, '0');
      pushAscii(`${padded} 00000 n \n`);
    }

    // Trailer
    pushAscii(
      `trailer\n<< /Size ${offsets.length} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`
    );

    return concatByteChunks(chunks);
  }

  function exportCanvasToPdfBlob(canvas, pageWidthMm, pageHeightMm, jpegQuality = 0.94) {
    const jpegDataUrl = canvas.toDataURL('image/jpeg', jpegQuality);
    const jpegBytes = dataUrlToBytes(jpegDataUrl);
    const pdfBytes = buildPdfFromJpegBytes(
      jpegBytes,
      canvas.width,
      canvas.height,
      pageWidthMm,
      pageHeightMm
    );
    return new Blob([pdfBytes], { type: 'application/pdf' });
  }

  global.PeachyPdfExport = {
    buildPdfFromJpegBytes,
    exportCanvasToPdfBlob
  };
})(typeof window !== 'undefined' ? window : globalThis);
