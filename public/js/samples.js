/**
 * PeachyPrint — Programmatic Sample Sheet Generator
 * Creates realistic print designs at authentic resolutions (72 DPI to 300 DPI)
 * so users can test crisp vs. pixelated scaling immediately without uploading.
 */
(function (global) {
  'use strict';

  const SAMPLE_SPECS = [
    {
      id: 'botanical-a4',
      title: 'Peach Blossom Print',
      subtitle: 'Crisp 300 DPI · A4',
      badge: '300 DPI',
      badgeType: 'sharp',
      defaultSource: 'A4',
      orientation: 'portrait',
      width: 2480,
      height: 3508,
      accent: '#FF8FAB'
    },
    {
      id: 'mochi-menu',
      title: 'Mochi Café Menu',
      subtitle: 'Standard 180 DPI · A4',
      badge: '180 DPI',
      badgeType: 'good',
      defaultSource: 'A4',
      orientation: 'portrait',
      width: 1488,
      height: 2104,
      accent: '#FFD166'
    },
    {
      id: 'sticker-a5',
      title: 'Kawaii Sticker Sheet',
      subtitle: 'Crisp 300 DPI · A5',
      badge: '300 DPI',
      badgeType: 'sharp',
      defaultSource: 'A5',
      orientation: 'portrait',
      width: 1748,
      height: 2480,
      accent: '#FFA6C1'
    },
    {
      id: 'web-flyer-low',
      title: 'Web Flyer (Low-Res)',
      subtitle: 'Screen 72 DPI · A4',
      badge: '72 DPI',
      badgeType: 'low',
      defaultSource: 'A4',
      orientation: 'portrait',
      width: 595,
      height: 842,
      accent: '#FB7185'
    },
    {
      id: 'studio-chart',
      title: 'Print Test Chart',
      subtitle: 'Ultra 300 DPI · A3',
      badge: '300 DPI',
      badgeType: 'sharp',
      defaultSource: 'A3',
      orientation: 'portrait',
      width: 3508,
      height: 4961,
      accent: '#F59E0B'
    }
  ];

  const sampleCache = new Map();

  function drawRoundedRect(ctx, x, y, w, h, r) {
    const radius = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + w, y, x + w, y + h, radius);
    ctx.arcTo(x + w, y + h, x, y + h, radius);
    ctx.arcTo(x, y + h, x, y, radius);
    ctx.arcTo(x, y, x + w, y, radius);
    ctx.closePath();
  }

  function drawFlower(ctx, cx, cy, petalRadius, petalColor, centerColor) {
    ctx.save();
    ctx.translate(cx, cy);
    for (let i = 0; i < 5; i++) {
      ctx.save();
      ctx.rotate((i * Math.PI * 2) / 5);
      ctx.fillStyle = petalColor;
      ctx.beginPath();
      ctx.ellipse(0, -petalRadius * 0.9, petalRadius * 0.62, petalRadius * 0.85, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    ctx.fillStyle = centerColor;
    ctx.beginPath();
    ctx.arc(0, 0, petalRadius * 0.45, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawStar(ctx, cx, cy, spikes, outerR, innerR, color) {
    ctx.save();
    ctx.beginPath();
    let rot = (Math.PI / 2) * 3;
    const step = Math.PI / spikes;
    ctx.moveTo(cx, cy - outerR);
    for (let i = 0; i < spikes; i++) {
      ctx.lineTo(cx + Math.cos(rot) * outerR, cy + Math.sin(rot) * outerR);
      rot += step;
      ctx.lineTo(cx + Math.cos(rot) * innerR, cy + Math.sin(rot) * innerR);
      rot += step;
    }
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    ctx.restore();
  }

  function renderBotanicalPoster(ctx, w, h) {
    // Soft warm cream paper background
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, '#FFF6F8');
    grad.addColorStop(0.55, '#FFFDF5');
    grad.addColorStop(1, '#FFF1F6');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Subtle pastel geometric sun arch
    ctx.fillStyle = '#FFE9A8';
    ctx.beginPath();
    ctx.arc(w * 0.5, h * 0.36, w * 0.31, 0, Math.PI * 2);
    ctx.fill();

    // Inner decorative border frame
    const pad = w * 0.065;
    ctx.strokeStyle = '#F7A8C0';
    ctx.lineWidth = w * 0.0045;
    drawRoundedRect(ctx, pad, pad, w - pad * 2, h - pad * 2, w * 0.03);
    ctx.stroke();

    ctx.strokeStyle = '#FCD34D';
    ctx.lineWidth = w * 0.002;
    drawRoundedRect(ctx, pad * 1.25, pad * 1.25, w - pad * 2.5, h - pad * 2.5, w * 0.022);
    ctx.stroke();

    // Soft rose hills at bottom
    ctx.fillStyle = '#FFD6E4';
    ctx.beginPath();
    ctx.moveTo(pad * 1.4, h * 0.72);
    ctx.quadraticCurveTo(w * 0.32, h * 0.61, w * 0.58, h * 0.69);
    ctx.quadraticCurveTo(w * 0.78, h * 0.75, w - pad * 1.4, h * 0.65);
    ctx.lineTo(w - pad * 1.4, h - pad * 1.4);
    ctx.lineTo(pad * 1.4, h - pad * 1.4);
    ctx.closePath();
    ctx.fill();

    // Botanical stems & sage leaves
    ctx.strokeStyle = '#6B9080';
    ctx.lineWidth = w * 0.008;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(w * 0.49, h * 0.72);
    ctx.quadraticCurveTo(w * 0.42, h * 0.50, w * 0.50, h * 0.28);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(w * 0.49, h * 0.66);
    ctx.quadraticCurveTo(w * 0.64, h * 0.54, w * 0.66, h * 0.36);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(w * 0.48, h * 0.62);
    ctx.quadraticCurveTo(w * 0.30, h * 0.52, w * 0.32, h * 0.38);
    ctx.stroke();

    // Leaves
    const leaves = [
      [0.41, 0.55, -0.7, 0.055],
      [0.54, 0.53, 0.75, 0.052],
      [0.37, 0.45, -0.9, 0.048],
      [0.61, 0.46, 0.65, 0.046],
      [0.44, 0.38, -0.5, 0.042]
    ];
    leaves.forEach(([lx, ly, angle, size]) => {
      ctx.save();
      ctx.translate(w * lx, h * ly);
      ctx.rotate(angle);
      ctx.fillStyle = '#84A98C';
      ctx.beginPath();
      ctx.ellipse(0, 0, w * size, w * size * 0.42, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // Blossoms
    drawFlower(ctx, w * 0.50, h * 0.27, w * 0.068, '#FF8FAB', '#FFD166');
    drawFlower(ctx, w * 0.66, h * 0.35, w * 0.052, '#FFB3C6', '#FBBF24');
    drawFlower(ctx, w * 0.32, h * 0.37, w * 0.054, '#FF9EBB', '#FDE047');
    drawFlower(ctx, w * 0.57, h * 0.45, w * 0.038, '#FFFFFF', '#FF7AA2');

    // Sparkles
    drawStar(ctx, w * 0.25, h * 0.22, 4, w * 0.025, w * 0.008, '#FBBF24');
    drawStar(ctx, w * 0.76, h * 0.24, 4, w * 0.022, w * 0.007, '#FF7AA2');
    drawStar(ctx, w * 0.73, h * 0.54, 4, w * 0.018, w * 0.006, '#FFFFFF');

    // Crisp editorial typography
    ctx.textAlign = 'center';
    ctx.fillStyle = '#8A4F65';
    ctx.font = `600 ${Math.round(w * 0.024)}px "Nunito", "Segoe UI", sans-serif`;
    ctx.fillText('PEACHY STUDIO  ·  EDITION N° 04', w * 0.5, h * 0.125);

    ctx.fillStyle = '#3D2835';
    ctx.font = `700 ${Math.round(w * 0.088)}px "Fredoka", "Georgia", serif`;
    ctx.fillText('Spring Blossom', w * 0.5, h * 0.815);

    ctx.fillStyle = '#7A5568';
    ctx.font = `500 ${Math.round(w * 0.028)}px "Nunito", "Segoe UI", sans-serif`;
    ctx.fillText('Botanical Fine Art Poster · 300 DPI Native A4', w * 0.5, h * 0.865);

    ctx.fillStyle = '#9E7385';
    ctx.font = `500 ${Math.round(w * 0.019)}px "JetBrains Mono", monospace`;
    ctx.fillText('210 × 297 mm  |  2480 × 3508 px  |  ISO 216', w * 0.5, h * 0.905);
  }

  function renderMochiMenu(ctx, w, h) {
    ctx.fillStyle = '#FFFDF5';
    ctx.fillRect(0, 0, w, h);

    // Header pastel banner
    ctx.fillStyle = '#FFE3EC';
    drawRoundedRect(ctx, w * 0.07, h * 0.055, w * 0.86, h * 0.175, w * 0.045);
    ctx.fill();

    ctx.strokeStyle = '#FF9EBB';
    ctx.lineWidth = w * 0.005;
    drawRoundedRect(ctx, w * 0.07, h * 0.055, w * 0.86, h * 0.175, w * 0.045);
    ctx.stroke();

    // Cute header text
    ctx.textAlign = 'center';
    ctx.fillStyle = '#D94F7A';
    ctx.font = `700 ${Math.round(w * 0.026)}px "Nunito", sans-serif`;
    ctx.fillText('★  HANDCRAFTED DAILY  ★', w * 0.5, h * 0.105);

    ctx.fillStyle = '#3D2835';
    ctx.font = `700 ${Math.round(w * 0.074)}px "Fredoka", "Segoe UI", sans-serif`;
    ctx.fillText('Mochi & Honey Café', w * 0.5, h * 0.172);

    ctx.fillStyle = '#7A5568';
    ctx.font = `600 ${Math.round(w * 0.025)}px "Nunito", sans-serif`;
    ctx.fillText('Seasonal Pastel Sweets & Iced Lattes', w * 0.5, h * 0.21);

    // Cute illustrated mochi trio
    const mochiY = h * 0.305;
    const mochis = [
      { x: 0.28, color: '#FFB3C6', cheek: '#FF6B94', label: 'Strawberry' },
      { x: 0.50, color: '#FFE680', cheek: '#F59E0B', label: 'Yuzu Honey' },
      { x: 0.72, color: '#C7F0BD', cheek: '#68B684', label: 'Matcha' }
    ];

    mochis.forEach((m) => {
      const cx = w * m.x;
      ctx.fillStyle = m.color;
      ctx.beginPath();
      ctx.ellipse(cx, mochiY, w * 0.078, w * 0.058, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#3D2835';
      ctx.lineWidth = w * 0.004;
      ctx.stroke();

      // Cute eyes & smile
      ctx.fillStyle = '#3D2835';
      ctx.beginPath();
      ctx.arc(cx - w * 0.022, mochiY - w * 0.006, w * 0.006, 0, Math.PI * 2);
      ctx.arc(cx + w * 0.022, mochiY - w * 0.006, w * 0.006, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = m.cheek;
      ctx.globalAlpha = 0.55;
      ctx.beginPath();
      ctx.arc(cx - w * 0.036, mochiY + w * 0.008, w * 0.009, 0, Math.PI * 2);
      ctx.arc(cx + w * 0.036, mochiY + w * 0.008, w * 0.009, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;

      ctx.beginPath();
      ctx.arc(cx, mochiY + w * 0.004, w * 0.011, 0.15 * Math.PI, 0.85 * Math.PI);
      ctx.stroke();

      ctx.fillStyle = '#5D4052';
      ctx.font = `700 ${Math.round(w * 0.022)}px "Nunito", sans-serif`;
      ctx.fillText(m.label, cx, mochiY + w * 0.092);
    });

    // Menu section box
    ctx.fillStyle = '#FFFFFF';
    drawRoundedRect(ctx, w * 0.08, h * 0.39, w * 0.84, h * 0.47, w * 0.04);
    ctx.fill();
    ctx.strokeStyle = '#FDE68A';
    ctx.lineWidth = w * 0.006;
    ctx.stroke();

    const items = [
      ['Peach Cream Daifuku', 'Fresh white peach & whipped mascarpone', '$5.50'],
      ['Honey Lemon Tartlet', 'Toasted meringue & citrus curd', '$6.25'],
      ['Strawberry Cloud Latte', 'Oat milk, berry purée & vanilla foam', '$5.75'],
      ['Sakura Matcha Parfait', 'Uji matcha jelly & crispy wafer', '$7.50'],
      ['Buttercream Macaron Box', 'Assorted 6-piece pastel gift set', '$14.00']
    ];

    let rowY = h * 0.455;
    items.forEach(([name, desc, price], idx) => {
      ctx.textAlign = 'left';
      ctx.fillStyle = '#3D2835';
      ctx.font = `700 ${Math.round(w * 0.031)}px "Fredoka", sans-serif`;
      ctx.fillText(name, w * 0.13, rowY);

      ctx.fillStyle = '#856576';
      ctx.font = `500 ${Math.round(w * 0.021)}px "Nunito", sans-serif`;
      ctx.fillText(desc, w * 0.13, rowY + h * 0.028);

      ctx.textAlign = 'right';
      ctx.fillStyle = '#E85583';
      ctx.font = `700 ${Math.round(w * 0.032)}px "JetBrains Mono", monospace`;
      ctx.fillText(price, w * 0.87, rowY + h * 0.008);

      if (idx < items.length - 1) {
        ctx.strokeStyle = '#FCE7F3';
        ctx.lineWidth = w * 0.0025;
        ctx.beginPath();
        ctx.moveTo(w * 0.13, rowY + h * 0.05);
        ctx.lineTo(w * 0.87, rowY + h * 0.05);
        ctx.stroke();
      }
      rowY += h * 0.082;
    });

    // Footer bar
    ctx.textAlign = 'center';
    ctx.fillStyle = '#7A5568';
    ctx.font = `600 ${Math.round(w * 0.021)}px "Nunito", sans-serif`;
    ctx.fillText('180 DPI A4 Menu Sample · Enlarge on A2 to see the Red DPI Warning!', w * 0.5, h * 0.915);
    ctx.fillStyle = '#B0859B';
    ctx.font = `500 ${Math.round(w * 0.018)}px "JetBrains Mono", monospace`;
    ctx.fillText('1488 × 2104 px · Open Tue–Sun 9:00–19:00', w * 0.5, h * 0.945);
  }

  function renderStickerSheet(ctx, w, h) {
    // Pastel butter-yellow dotted sheet background
    ctx.fillStyle = '#FFFCEB';
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = '#FDE68A';
    const spacing = w * 0.06;
    for (let y = spacing; y < h; y += spacing) {
      for (let x = spacing; x < w; x += spacing) {
        ctx.beginPath();
        ctx.arc(x, y, w * 0.0055, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Header pill
    ctx.fillStyle = '#FF8FAB';
    drawRoundedRect(ctx, w * 0.16, h * 0.05, w * 0.68, h * 0.085, h * 0.042);
    ctx.fill();
    ctx.textAlign = 'center';
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `700 ${Math.round(w * 0.048)}px "Fredoka", sans-serif`;
    ctx.fillText('PEACHY STICKER PACK', w * 0.5, h * 0.105);

    // Grid of 6 cute die-cut stickers
    const stickers = [
      { col: 0, row: 0, bg: '#FFD6E5', title: 'Happy Peach', kind: 'peach' },
      { col: 1, row: 0, bg: '#FFF2B2', title: 'Sunny Star', kind: 'star' },
      { col: 0, row: 1, bg: '#E0F2FE', title: 'Fluffy Cloud', kind: 'cloud' },
      { col: 1, row: 1, bg: '#DCFCE7', title: 'Crisp 300 DPI', kind: 'badge' },
      { col: 0, row: 2, bg: '#FCE7F3', title: 'Sweet Heart', kind: 'heart' },
      { col: 1, row: 2, bg: '#FEF3C7', title: 'Honey Daisy', kind: 'flower' }
    ];

    stickers.forEach((s) => {
      const cx = w * (s.col === 0 ? 0.28 : 0.72);
      const cy = h * (0.28 + s.row * 0.255);
      const r = w * 0.185;

      // White die-cut sticker border + dashed cut guide
      ctx.save();
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.setLineDash([w * 0.012, w * 0.01]);
      ctx.strokeStyle = '#F4A2B8';
      ctx.lineWidth = w * 0.005;
      ctx.stroke();
      ctx.restore();

      // Inner pastel circle
      ctx.fillStyle = s.bg;
      ctx.beginPath();
      ctx.arc(cx, cy, r * 0.84, 0, Math.PI * 2);
      ctx.fill();

      // Draw sticker icon
      if (s.kind === 'peach') {
        ctx.fillStyle = '#FF9EBB';
        ctx.beginPath();
        ctx.arc(cx - r * 0.12, cy + r * 0.05, r * 0.34, 0, Math.PI * 2);
        ctx.arc(cx + r * 0.12, cy + r * 0.05, r * 0.34, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#68B684';
        ctx.beginPath();
        ctx.ellipse(cx + r * 0.12, cy - r * 0.34, r * 0.18, r * 0.09, -0.5, 0, Math.PI * 2);
        ctx.fill();
      } else if (s.kind === 'star') {
        drawStar(ctx, cx, cy - r * 0.02, 5, r * 0.48, r * 0.24, '#FBBF24');
      } else if (s.kind === 'cloud') {
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(cx - r * 0.2, cy + r * 0.05, r * 0.22, 0, Math.PI * 2);
        ctx.arc(cx, cy - r * 0.08, r * 0.28, 0, Math.PI * 2);
        ctx.arc(cx + r * 0.22, cy + r * 0.05, r * 0.22, 0, Math.PI * 2);
        ctx.fill();
      } else if (s.kind === 'badge') {
        ctx.fillStyle = '#22C55E';
        ctx.beginPath();
        ctx.arc(cx, cy - r * 0.04, r * 0.42, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = r * 0.1;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(cx - r * 0.18, cy - r * 0.02);
        ctx.lineTo(cx - r * 0.03, cy + r * 0.13);
        ctx.lineTo(cx + r * 0.21, cy - r * 0.16);
        ctx.stroke();
      } else if (s.kind === 'heart') {
        ctx.fillStyle = '#FF7AA2';
        ctx.beginPath();
        ctx.moveTo(cx, cy + r * 0.34);
        ctx.bezierCurveTo(cx - r * 0.55, cy - r * 0.05, cx - r * 0.3, cy - r * 0.48, cx, cy - r * 0.16);
        ctx.bezierCurveTo(cx + r * 0.3, cy - r * 0.48, cx + r * 0.55, cy - r * 0.05, cx, cy + r * 0.34);
        ctx.fill();
      } else if (s.kind === 'flower') {
        drawFlower(ctx, cx, cy - r * 0.04, r * 0.26, '#FFFFFF', '#FBBF24');
      }

      // Cute kawaii eyes on non-badge stickers
      if (s.kind !== 'badge') {
        ctx.fillStyle = '#3D2835';
        ctx.beginPath();
        ctx.arc(cx - r * 0.12, cy + r * 0.03, r * 0.042, 0, Math.PI * 2);
        ctx.arc(cx + r * 0.12, cy + r * 0.03, r * 0.042, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#3D2835';
        ctx.lineWidth = r * 0.03;
        ctx.beginPath();
        ctx.arc(cx, cy + r * 0.08, r * 0.075, 0.15 * Math.PI, 0.85 * Math.PI);
        ctx.stroke();
      }

      // Sticker caption
      ctx.fillStyle = '#4B3242';
      ctx.font = `700 ${Math.round(w * 0.028)}px "Nunito", sans-serif`;
      ctx.fillText(s.title, cx, cy + r * 0.66);
    });

    ctx.fillStyle = '#7A5D6E';
    ctx.font = `600 ${Math.round(w * 0.024)}px "JetBrains Mono", monospace`;
    ctx.fillText('A5 SHEET · 148 × 210 mm · 1748 × 2480 px (300 DPI)', w * 0.5, h * 0.955);
  }

  function renderWebFlyerLowRes(ctx, w, h) {
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#FFE4EE');
    grad.addColorStop(1, '#FFF3C4');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Decorative diagonal stripes
    ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
    drawRoundedRect(ctx, w * 0.08, h * 0.08, w * 0.84, h * 0.84, w * 0.06);
    ctx.fill();

    // Cute warning stamp
    ctx.fillStyle = '#FEE2E2';
    drawRoundedRect(ctx, w * 0.2, h * 0.15, w * 0.6, h * 0.075, h * 0.035);
    ctx.fill();
    ctx.strokeStyle = '#F87171';
    ctx.lineWidth = Math.max(2, w * 0.006);
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.fillStyle = '#B91C1C';
    ctx.font = `700 ${Math.round(w * 0.036)}px "Nunito", sans-serif`;
    ctx.fillText('72 DPI SCREEN GRAPHIC', w * 0.5, h * 0.197);

    // Big bold headline
    ctx.fillStyle = '#3D2835';
    ctx.font = `700 ${Math.round(w * 0.11)}px "Fredoka", sans-serif`;
    ctx.fillText('SUMMER', w * 0.5, h * 0.36);
    ctx.fillStyle = '#E85583';
    ctx.fillText('POP-UP!', w * 0.5, h * 0.45);

    // Cute pastel sun icon
    ctx.fillStyle = '#FBBF24';
    ctx.beginPath();
    ctx.arc(w * 0.5, h * 0.61, w * 0.15, 0, Math.PI * 2);
    ctx.fill();
    drawFlower(ctx, w * 0.27, h * 0.60, w * 0.06, '#FF8FAB', '#FFF2B2');
    drawFlower(ctx, w * 0.73, h * 0.60, w * 0.06, '#FF8FAB', '#FFF2B2');

    ctx.fillStyle = '#5D4052';
    ctx.font = `600 ${Math.round(w * 0.036)}px "Nunito", sans-serif`;
    ctx.fillText('Great for Instagram & Web,', w * 0.5, h * 0.78);
    ctx.fillText('but too low-res for A4 / A2 print!', w * 0.5, h * 0.825);

    ctx.fillStyle = '#9E7385';
    ctx.font = `600 ${Math.round(w * 0.028)}px "JetBrains Mono", monospace`;
    ctx.fillText('595 × 842 px (72 DPI on A4)', w * 0.5, h * 0.885);
  }

  function renderStudioTestChart(ctx, w, h) {
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, w, h);

    // Soft pastel engineering grid
    ctx.strokeStyle = '#FCE7F3';
    ctx.lineWidth = Math.max(1, w * 0.0008);
    const step = w / 20;
    for (let x = step; x < w; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = step; y < h; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Outer registration border
    const m = w * 0.05;
    ctx.strokeStyle = '#3D2835';
    ctx.lineWidth = w * 0.003;
    ctx.strokeRect(m, m, w - m * 2, h - m * 2);

    // Header strip
    ctx.fillStyle = '#FFF0F5';
    ctx.fillRect(m, m, w - m * 2, h * 0.11);
    ctx.textAlign = 'left';
    ctx.fillStyle = '#3D2835';
    ctx.font = `700 ${Math.round(w * 0.044)}px "Fredoka", sans-serif`;
    ctx.fillText('PEACHYPRINT STUDIO TEST CHART', m * 1.6, m + h * 0.052);
    ctx.fillStyle = '#7A5568';
    ctx.font = `600 ${Math.round(w * 0.02)}px "JetBrains Mono", monospace`;
    ctx.fillText('ISO A3 NATIVE · 297 × 420 mm · 3508 × 4961 px · 300 DPI', m * 1.6, m + h * 0.088);

    // Resolution Siemens Star (radial test target)
    const cx = w * 0.5;
    const cy = h * 0.37;
    const starR = w * 0.25;
    const rays = 36;
    for (let i = 0; i < rays; i++) {
      const a0 = (i * 2 * Math.PI) / rays;
      const a1 = a0 + Math.PI / rays;
      ctx.fillStyle = i % 2 === 0 ? '#FF7AA2' : '#3D2835';
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, starR, a0, a1);
      ctx.closePath();
      ctx.fill();
    }
    ctx.fillStyle = '#FFFDF5';
    ctx.beginPath();
    ctx.arc(cx, cy, starR * 0.16, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#3D2835';
    ctx.textAlign = 'center';
    ctx.font = `700 ${Math.round(w * 0.022)}px "JetBrains Mono", monospace`;
    ctx.fillText('300', cx, cy + w * 0.008);

    // Color swatches bar (pastel + CMYK calibration)
    const swatches = ['#FF7AA2', '#FFB3C6', '#FFD166', '#FFF2B2', '#22C55E', '#38BDF8', '#A78BFA', '#3D2835'];
    const swW = (w - m * 3.2) / swatches.length;
    const swY = h * 0.60;
    swatches.forEach((col, i) => {
      ctx.fillStyle = col;
      drawRoundedRect(ctx, m * 1.6 + i * swW, swY, swW - w * 0.01, h * 0.065, w * 0.01);
      ctx.fill();
    });

    // Typography sharpness ladder
    const sizes = [
      [0.036, '24pt — Crisp Display Print Quality Check'],
      [0.026, '18pt — Editorial Subheading & Poster Copy Clarity'],
      [0.019, '12pt — Standard Body Paragraph Readability on A3 / A2'],
      [0.014, '9pt — Fine Caption Text · Watch for Blur Below 150 DPI'],
      [0.010, '6pt — Micro Legal & Footnote Hairline Sharpness Test · 0123456789']
    ];
    let ty = h * 0.725;
    ctx.textAlign = 'left';
    ctx.fillStyle = '#3D2835';
    sizes.forEach(([ratio, text]) => {
      ctx.font = `600 ${Math.round(w * ratio)}px "Nunito", sans-serif`;
      ctx.fillText(text, m * 1.6, ty);
      ty += h * 0.044;
    });
  }

  function generateSampleCanvas(spec, customWidth, customHeight) {
    const w = customWidth || spec.width;
    const h = customHeight || spec.height;
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');

    if (spec.id === 'botanical-a4') {
      renderBotanicalPoster(ctx, w, h);
    } else if (spec.id === 'mochi-menu') {
      renderMochiMenu(ctx, w, h);
    } else if (spec.id === 'sticker-a5') {
      renderStickerSheet(ctx, w, h);
    } else if (spec.id === 'web-flyer-low') {
      renderWebFlyerLowRes(ctx, w, h);
    } else {
      renderStudioTestChart(ctx, w, h);
    }
    return canvas;
  }

  function getSampleThumbnailUrl(spec) {
    const thumbW = 140;
    const thumbH = Math.round((spec.height / spec.width) * thumbW);
    const canvas = generateSampleCanvas(spec, thumbW, thumbH);
    return canvas.toDataURL('image/png');
  }

  function getSampleImage(sampleId) {
    const spec = SAMPLE_SPECS.find((s) => s.id === sampleId) || SAMPLE_SPECS[0];
    if (sampleCache.has(spec.id)) {
      return Promise.resolve(sampleCache.get(spec.id));
    }

    return new Promise((resolve) => {
      // Generate authentic high-res canvas asynchronously so UI stays silky smooth
      requestAnimationFrame(() => {
        const canvas = generateSampleCanvas(spec);
        const result = {
          spec,
          canvas,
          width: spec.width,
          height: spec.height,
          name: `${spec.title} (${spec.badge})`
        };
        sampleCache.set(spec.id, result);
        resolve(result);
      });
    });
  }

  global.PeachySamples = {
    SAMPLE_SPECS,
    getSampleThumbnailUrl,
    getSampleImage
  };
})(typeof window !== 'undefined' ? window : globalThis);
