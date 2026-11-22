/**
 * PeachyPrint — Interactive Paper Format & Print DPI Simulator Controller
 */
(function () {
  'use strict';

  const Data = window.PeachyPaperData;
  const Samples = window.PeachySamples;
  const PdfExport = window.PeachyPdfExport;

  // Mobile nav toggle (shared across pages)
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');
  if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => {
      const open = navLinks.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', String(open));
    });
  }

  // Only initialize simulator if on homepage
  const targetSheetEl = document.getElementById('targetSheet');
  if (!targetSheetEl || !Data || !Samples) return;

  // DOM References
  const els = {
    dropzone: document.getElementById('dropzone'),
    fileInput: document.getElementById('fileInput'),
    loadedFileName: document.getElementById('loadedFileName'),
    loadedFileDims: document.getElementById('loadedFileDims'),
    sampleGrid: document.getElementById('sampleGrid'),

    sourceFormatPills: document.getElementById('sourceFormatPills'),
    targetFormatPills: document.getElementById('targetFormatPills'),
    sourceDimLabel: document.getElementById('sourceDimLabel'),
    targetDimLabel: document.getElementById('targetDimLabel'),
    sourceOrientSeg: document.getElementById('sourceOrientSeg'),
    targetOrientSeg: document.getElementById('targetOrientSeg'),
    fitModeSeg: document.getElementById('fitModeSeg'),

    scaleSlider: document.getElementById('scaleSlider'),
    scaleNumberBadge: document.getElementById('scaleNumberBadge'),
    scaleDownBtn: document.getElementById('scaleDownBtn'),
    scaleUpBtn: document.getElementById('scaleUpBtn'),
    btnReset100: document.getElementById('btnReset100'),
    btnFitTarget: document.getElementById('btnFitTarget'),
    btnMaxSafe: document.getElementById('btnMaxSafe'),
    btnCenterSheet: document.getElementById('btnCenterSheet'),
    qualitySelect: document.getElementById('qualitySelect'),
    togglePixelation: document.getElementById('togglePixelation'),
    toggleRulers: document.getElementById('toggleRulers'),
    toggleLoupe: document.getElementById('toggleLoupe'),

    exportFormatSelect: document.getElementById('exportFormatSelect'),
    exportDpiSelect: document.getElementById('exportDpiSelect'),
    exportCropMarks: document.getElementById('exportCropMarks'),
    btnExport: document.getElementById('btnExport'),

    statusBanner: document.getElementById('statusBanner'),
    statusIcon: document.getElementById('statusIcon'),
    statusHeading: document.getElementById('statusHeading'),
    statusDesc: document.getElementById('statusDesc'),
    dpiValue: document.getElementById('dpiValue'),
    dpiThresholdText: document.getElementById('dpiThresholdText'),
    dpiBarFill: document.getElementById('dpiBarFill'),
    snapSafeBtn: document.getElementById('snapSafeBtn'),

    metricPrintedSize: document.getElementById('metricPrintedSize'),
    metricPrintedIn: document.getElementById('metricPrintedIn'),
    metricSourcePx: document.getElementById('metricSourcePx'),
    metricMaxSafe: document.getElementById('metricMaxSafe'),

    workspaceCard: document.getElementById('workspaceCard'),
    workspaceSummary: document.getElementById('workspaceSummary'),
    stageViewport: document.getElementById('stageViewport'),
    targetSheet: targetSheetEl,
    rulerTop: document.getElementById('rulerTop'),
    rulerLeft: document.getElementById('rulerLeft'),
    targetCornerLabel: document.getElementById('targetCornerLabel'),
    snapGuideV: document.getElementById('snapGuideV'),
    snapGuideH: document.getElementById('snapGuideH'),

    sourceSheet: document.getElementById('sourceSheet'),
    sourceCanvas: document.getElementById('sourceCanvas'),
    sheetStatusPill: document.getElementById('sheetStatusPill'),
    sheetSizePill: document.getElementById('sheetSizePill'),

    loupeLens: document.getElementById('loupeLens'),
    loupeCanvas: document.getElementById('loupeCanvas'),
    loupeTag: document.getElementById('loupeTag'),

    toast: document.getElementById('toast'),
    isoSelectedInfo: document.getElementById('isoSelectedInfo'),
    isoUseSourceBtn: document.getElementById('isoUseSourceBtn'),
    isoUseTargetBtn: document.getElementById('isoUseTargetBtn')
  };

  // Application State (Default: A4 Source inside A2 Target!)
  const state = {
    sourceFormat: 'A4',
    sourceOrientation: 'portrait',
    targetFormat: 'A2',
    targetOrientation: 'portrait',
    fitMode: 'contain',
    scalePercent: 100,
    offsetXMm: 0,
    offsetYMm: 0,
    qualityProfileKey: 'standard',
    showPixelation: true,
    showRulers: true,
    showLoupe: false,
    activeSampleId: 'botanical-a4',
    image: null, // HTMLCanvasElement | HTMLImageElement
    imageWidth: 2480,
    imageHeight: 3508,
    imageName: 'Peach Blossom Print (300 DPI)',
    pxPerMm: 1,
    targetDisplayW: 400,
    targetDisplayH: 560,
    lastMetrics: null,
    selectedGuideFormat: 'A4'
  };

  let toastTimer = null;
  function showToast(msg) {
    if (!els.toast) return;
    els.toast.textContent = msg;
    els.toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      els.toast.classList.remove('show');
    }, 3200);
  }

  function clampScale(val) {
    return Math.max(10, Math.min(400, Math.round(val)));
  }

  function getTargetDimsMm() {
    return Data.getSheetDimensionsMm(state.targetFormat, state.targetOrientation);
  }

  function getCurrentMetrics() {
    return Data.computePrintMetrics({
      imageWidth: state.imageWidth,
      imageHeight: state.imageHeight,
      sourceFormat: state.sourceFormat,
      sourceOrientation: state.sourceOrientation,
      scalePercent: state.scalePercent,
      fitMode: state.fitMode,
      qualityProfileKey: state.qualityProfileKey
    });
  }

  function centerSourceSheet() {
    const target = getTargetDimsMm();
    const metrics = getCurrentMetrics();
    state.offsetXMm = (target.widthMm - metrics.sheetWidthMm) / 2;
    state.offsetYMm = (target.heightMm - metrics.sheetHeightMm) / 2;
  }

  function fitSourceToTarget() {
    const target = getTargetDimsMm();
    const metrics100 = Data.computePrintMetrics({
      imageWidth: state.imageWidth,
      imageHeight: state.imageHeight,
      sourceFormat: state.sourceFormat,
      sourceOrientation: state.sourceOrientation,
      scalePercent: 100,
      fitMode: state.fitMode,
      qualityProfileKey: state.qualityProfileKey
    });
    const ratioW = target.widthMm / metrics100.sheetWidthMm;
    const ratioH = target.heightMm / metrics100.sheetHeightMm;
    const bestScale = clampScale(Math.min(ratioW, ratioH) * 100);
    state.scalePercent = bestScale;
    centerSourceSheet();
    renderAll();
  }

  function snapToMaxSafeScale() {
    const metrics = getCurrentMetrics();
    const safeScale = clampScale(metrics.maxSafeScalePercent);
    const prevW = metrics.sheetWidthMm;
    const prevH = metrics.sheetHeightMm;
    state.scalePercent = safeScale;
    const next = getCurrentMetrics();
    // Keep center point stable while snapping
    state.offsetXMm += (prevW - next.sheetWidthMm) / 2;
    state.offsetYMm += (prevH - next.sheetHeightMm) / 2;
    renderAll();
    showToast(`Snapped to ${safeScale}% — crisp & print-ready!`);
  }

  function renderRulers(targetWidthMm, targetHeightMm, displayW, displayH) {
    // Choose a clean tick interval in mm based on paper size
    const stepMm = targetWidthMm > 600 ? 100 : targetWidthMm > 300 ? 50 : 25;

    let topSvg = `<svg width="${displayW}" height="20" viewBox="0 0 ${displayW} 20" xmlns="http://www.w3.org/2000/svg">`;
    topSvg += `<line x1="0" y1="19" x2="${displayW}" y2="19" stroke="#f0b6cc" stroke-width="1"/>`;
    for (let mm = 0; mm <= targetWidthMm; mm += stepMm) {
      const x = (mm / targetWidthMm) * displayW;
      topSvg += `<line x1="${x.toFixed(1)}" y1="11" x2="${x.toFixed(1)}" y2="19" stroke="#c88aa3" stroke-width="1"/>`;
      if (mm < targetWidthMm - stepMm * 0.3) {
        topSvg += `<text x="${(x + 3).toFixed(1)}" y="10" font-size="9" font-family="JetBrains Mono, monospace" fill="#8f6b7e">${mm}</text>`;
      }
    }
    topSvg += '</svg>';
    els.rulerTop.innerHTML = topSvg;

    let leftSvg = `<svg width="26" height="${displayH}" viewBox="0 0 26 ${displayH}" xmlns="http://www.w3.org/2000/svg">`;
    leftSvg += `<line x1="25" y1="0" x2="25" y2="${displayH}" stroke="#f0b6cc" stroke-width="1"/>`;
    for (let mm = 0; mm <= targetHeightMm; mm += stepMm) {
      const y = (mm / targetHeightMm) * displayH;
      leftSvg += `<line x1="17" y1="${y.toFixed(1)}" x2="25" y2="${y.toFixed(1)}" stroke="#c88aa3" stroke-width="1"/>`;
      if (mm > 0 && mm < targetHeightMm - stepMm * 0.3) {
        leftSvg += `<text x="15" y="${(y + 3).toFixed(1)}" text-anchor="end" font-size="8.5" font-family="JetBrains Mono, monospace" fill="#8f6b7e">${mm}</text>`;
      }
    }
    leftSvg += '</svg>';
    els.rulerLeft.innerHTML = leftSvg;
  }

  function drawArtworkToCanvas(canvas, drawW, drawH, metrics, allowPixelSim) {
    if (!state.image) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const isLowDpi = allowPixelSim && state.showPixelation && metrics.effectiveDpi < metrics.profile.safeDpi;

    let bufW;
    let bufH;

    if (isLowDpi) {
      // Simulate real-world visible pixelation proportional to printed DPI shortfall
      const shortfall = Math.max(0.18, metrics.effectiveDpi / metrics.profile.safeDpi);
      const simulatedDensity = Math.max(18, Math.round(metrics.sheetWidthIn * metrics.effectiveDpi * 0.45 * shortfall));
      bufW = Math.max(24, Math.min(Math.round(drawW), simulatedDensity));
      bufH = Math.max(24, Math.round(bufW * (drawH / Math.max(drawW, 1))));
      canvas.classList.add('pixelated-render');
    } else {
      bufW = Math.max(40, Math.round(drawW * dpr));
      bufH = Math.max(40, Math.round(drawH * dpr));
      canvas.classList.remove('pixelated-render');
    }

    if (canvas.width !== bufW || canvas.height !== bufH) {
      canvas.width = bufW;
      canvas.height = bufH;
    }

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, bufW, bufH);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, bufW, bufH);

    ctx.imageSmoothingEnabled = !isLowDpi;
    if (!isLowDpi) {
      ctx.imageSmoothingQuality = 'high';
    }

    drawImageWithFit(ctx, state.image, state.imageWidth, state.imageHeight, 0, 0, bufW, bufH, state.fitMode);
  }

  function drawImageWithFit(ctx, img, imgW, imgH, x, y, boxW, boxH, fitMode) {
    const imgRatio = imgW / imgH;
    const boxRatio = boxW / boxH;

    let dx = x;
    let dy = y;
    let dw = boxW;
    let dh = boxH;

    if (fitMode === 'contain') {
      if (imgRatio > boxRatio) {
        dw = boxW;
        dh = boxW / imgRatio;
        dy = y + (boxH - dh) / 2;
      } else {
        dh = boxH;
        dw = boxH * imgRatio;
        dx = x + (boxW - dw) / 2;
      }
      ctx.drawImage(img, dx, dy, dw, dh);
    } else if (fitMode === 'cover') {
      ctx.save();
      ctx.beginPath();
      ctx.rect(x, y, boxW, boxH);
      ctx.clip();
      if (imgRatio > boxRatio) {
        dh = boxH;
        dw = boxH * imgRatio;
        dx = x + (boxW - dw) / 2;
      } else {
        dw = boxW;
        dh = boxW / imgRatio;
        dy = y + (boxH - dh) / 2;
      }
      ctx.drawImage(img, dx, dy, dw, dh);
      ctx.restore();
    } else {
      ctx.drawImage(img, x, y, boxW, boxH);
    }
  }

  function renderAll() {
    const target = getTargetDimsMm();
    const metrics = getCurrentMetrics();
    state.lastMetrics = metrics;

    // 1. Fit Target Sheet proportionally inside stage viewport
    const availW = Math.max(260, els.stageViewport.clientWidth - 76);
    const availH = Math.max(340, Math.min(600, window.innerHeight * 0.62));
    const scaleX = availW / target.widthMm;
    const scaleY = availH / target.heightMm;
    const pxPerMm = Math.min(scaleX, scaleY);

    const targetDisplayW = Math.round(target.widthMm * pxPerMm);
    const targetDisplayH = Math.round(target.heightMm * pxPerMm);
    state.pxPerMm = pxPerMm;
    state.targetDisplayW = targetDisplayW;
    state.targetDisplayH = targetDisplayH;

    els.targetSheet.style.width = `${targetDisplayW}px`;
    els.targetSheet.style.height = `${targetDisplayH}px`;
    els.targetCornerLabel.textContent = `Target: ${state.targetFormat} · ${target.widthMm} × ${target.heightMm} mm`;
    els.workspaceSummary.innerHTML = `Placing <code>${state.sourceFormat}</code> inside <code>${state.targetFormat}</code> · Scale <code>${state.scalePercent}%</code>`;

    if (state.showRulers) {
      els.workspaceCard.classList.remove('rulers-hidden');
      renderRulers(target.widthMm, target.heightMm, targetDisplayW, targetDisplayH);
    } else {
      els.workspaceCard.classList.add('rulers-hidden');
    }

    // 2. Position & Size Source Sheet inside Target Sheet
    const srcDisplayW = Math.max(24, metrics.sheetWidthMm * pxPerMm);
    const srcDisplayH = Math.max(24, metrics.sheetHeightMm * pxPerMm);
    const leftPx = state.offsetXMm * pxPerMm;
    const topPx = state.offsetYMm * pxPerMm;

    const v = metrics.visuals;
    els.sourceSheet.style.width = `${srcDisplayW.toFixed(1)}px`;
    els.sourceSheet.style.height = `${srcDisplayH.toFixed(1)}px`;
    els.sourceSheet.style.left = `${leftPx.toFixed(1)}px`;
    els.sourceSheet.style.top = `${topPx.toFixed(1)}px`;

    // Apply Dynamic Green-to-Red Border tokens
    els.sourceSheet.style.setProperty('--sheet-border-color', v.borderColor);
    els.sourceSheet.style.setProperty('--sheet-glow-color', v.glowColor);
    els.sourceSheet.style.setProperty('--badge-bg', v.badgeBg);
    els.sourceSheet.style.setProperty('--badge-border', v.badgeBorder);
    els.sourceSheet.style.setProperty('--badge-text', v.badgeText);
    els.sourceSheet.classList.toggle('is-pixelated', v.status === 'pixelated');

    els.sheetStatusPill.textContent =
      v.status === 'pixelated'
        ? `⚠ ${metrics.roundedDpi} DPI · Pixelated!`
        : `✓ ${metrics.roundedDpi} DPI · ${v.status === 'sharp' ? 'Sharp' : 'Safe'}`;
    els.sheetSizePill.textContent = `${state.sourceFormat} · ${Math.round(metrics.sheetWidthMm)}×${Math.round(metrics.sheetHeightMm)} mm (${state.scalePercent}%)`;

    // 3. Draw artwork onto canvas (with optional live pixelation simulation)
    drawArtworkToCanvas(els.sourceCanvas, srcDisplayW, srcDisplayH, metrics, true);

    // 4. Update Live Status Banner & DPI Meter
    els.statusBanner.classList.remove('is-sharp', 'is-good', 'is-pixelated');
    els.statusBanner.classList.add(`is-${v.status}`);
    els.dpiValue.textContent = `${metrics.roundedDpi} DPI`;
    els.dpiValue.style.color = v.status === 'pixelated' ? '#dc2626' : '#15803d';
    els.dpiThresholdText.textContent = `Safe ≥ ${metrics.profile.safeDpi} DPI`;

    const barPct = Math.max(4, Math.min(100, (metrics.effectiveDpi / 320) * 100));
    els.dpiBarFill.style.width = `${barPct.toFixed(1)}%`;
    els.dpiBarFill.style.background = v.barColor;

    if (v.status === 'sharp') {
      els.statusIcon.textContent = '✓';
      els.statusHeading.textContent = 'Sharp & Print-Ready — Green Border';
      els.statusDesc.textContent = `Crisp detail with zero noticeable pixelation on ${state.targetFormat}. Safe to enlarge up to ${metrics.maxSafeScalePercent}%.`;
    } else if (v.status === 'good') {
      els.statusIcon.textContent = '✓';
      els.statusHeading.textContent = 'Good Print Resolution — Safe Threshold';
      els.statusDesc.textContent = `Within safe print threshold (${metrics.profile.safeDpi}+ DPI). Scaling above ${metrics.maxSafeScalePercent}% will trigger pixelation warnings.`;
    } else {
      els.statusIcon.textContent = '!';
      els.statusHeading.textContent = 'Pixelation Warning — Low Effective DPI!';
      els.statusDesc.textContent = `Enlarged beyond ${metrics.profile.safeDpi} DPI! Reduce scale to ≤ ${metrics.maxSafeScalePercent}% or upload a higher-resolution image.`;
      els.snapSafeBtn.textContent = `Snap to ${metrics.maxSafeScalePercent}% (Green)`;
    }

    // 5. Update Metrics Strip & Control Readouts
    els.metricPrintedSize.textContent = `${Math.round(metrics.sheetWidthMm)} × ${Math.round(metrics.sheetHeightMm)} mm`;
    els.metricPrintedIn.textContent = `${metrics.sheetWidthIn.toFixed(1)} × ${metrics.sheetHeightIn.toFixed(1)} in`;
    els.metricSourcePx.textContent = `${state.imageWidth} × ${state.imageHeight} px`;
    els.metricMaxSafe.textContent = `${metrics.maxSafeScalePercent}% max`;

    const srcBase = Data.getSheetDimensionsMm(state.sourceFormat, state.sourceOrientation);
    els.sourceDimLabel.textContent = `${srcBase.widthMm} × ${srcBase.heightMm} mm`;
    els.targetDimLabel.textContent = `${target.widthMm} × ${target.heightMm} mm`;

    els.scaleSlider.value = String(state.scalePercent);
    els.scaleNumberBadge.textContent = `${state.scalePercent}%`;
    els.loadedFileName.textContent = state.imageName;
    els.loadedFileDims.textContent = `${state.imageWidth} × ${state.imageHeight} px`;

    syncControlActiveStates();
  }

  function syncControlActiveStates() {
    els.sourceFormatPills.querySelectorAll('button').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.format === state.sourceFormat);
    });
    els.targetFormatPills.querySelectorAll('button').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.format === state.targetFormat);
    });
    els.sourceOrientSeg.querySelectorAll('button').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.orient === state.sourceOrientation);
    });
    els.targetOrientSeg.querySelectorAll('button').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.orient === state.targetOrientation);
    });
    els.fitModeSeg.querySelectorAll('button').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.fit === state.fitMode);
    });
    els.sampleGrid.querySelectorAll('button').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.sample === state.activeSampleId);
    });
  }

  // =========================================================================
  // Direct Canvas Manipulation: Drag-to-Move & 4-Corner Proportional Resize
  // =========================================================================
  let interaction = null;

  els.sourceSheet.addEventListener('pointerdown', (e) => {
    const handleEl = e.target.closest('.resize-handle');
    e.preventDefault();
    els.sourceSheet.focus();

    const metrics = getCurrentMetrics();
    const handle = handleEl ? handleEl.dataset.handle : null;

    interaction = {
      mode: handle ? 'resize' : 'drag',
      handle,
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      startOffsetXMm: state.offsetXMm,
      startOffsetYMm: state.offsetYMm,
      startScale: state.scalePercent,
      startWidthMm: metrics.sheetWidthMm,
      startHeightMm: metrics.sheetHeightMm
    };

    els.sourceSheet.setPointerCapture(e.pointerId);
  });

  els.sourceSheet.addEventListener('pointermove', (e) => {
    // Update print loupe when hovering (and not actively dragging)
    if (!interaction && state.showLoupe) {
      updateLoupe(e);
    }

    if (!interaction || e.pointerId !== interaction.pointerId) return;

    const dxMm = (e.clientX - interaction.startX) / state.pxPerMm;
    const dyMm = (e.clientY - interaction.startY) / state.pxPerMm;
    const target = getTargetDimsMm();

    if (interaction.mode === 'drag') {
      let nextX = interaction.startOffsetXMm + dxMm;
      let nextY = interaction.startOffsetYMm + dyMm;

      // Magnetic snap to horizontal & vertical center (within ±5mm)
      const centerX = (target.widthMm - interaction.startWidthMm) / 2;
      const centerY = (target.heightMm - interaction.startHeightMm) / 2;
      const snapTol = Math.max(4, target.widthMm * 0.015);

      const snappedX = Math.abs(nextX - centerX) <= snapTol;
      const snappedY = Math.abs(nextY - centerY) <= snapTol;
      if (snappedX) nextX = centerX;
      if (snappedY) nextY = centerY;

      els.snapGuideV.classList.toggle('visible', snappedX);
      els.snapGuideH.classList.toggle('visible', snappedY);

      state.offsetXMm = nextX;
      state.offsetYMm = nextY;
      renderAll();
    } else if (interaction.mode === 'resize') {
      // Proportional scaling anchored on the opposite corner!
      const h = interaction.handle;
      const signX = h.includes('e') ? 1 : -1;
      const signY = h.includes('s') ? 1 : -1;

      const deltaRatioW = (interaction.startWidthMm + signX * dxMm) / interaction.startWidthMm;
      const deltaRatioH = (interaction.startHeightMm + signY * dyMm) / interaction.startHeightMm;
      // Blend drag axes smoothly so diagonal drags feel super natural
      const factor = Math.max(0.05, (deltaRatioW + deltaRatioH) / 2);

      const nextScale = clampScale(interaction.startScale * factor);
      if (nextScale === state.scalePercent) return;

      const actualRatio = nextScale / interaction.startScale;
      const nextWidthMm = interaction.startWidthMm * actualRatio;
      const nextHeightMm = interaction.startHeightMm * actualRatio;

      state.scalePercent = nextScale;
      // Anchor opposite corner
      if (h.includes('w')) {
        state.offsetXMm = interaction.startOffsetXMm + (interaction.startWidthMm - nextWidthMm);
      } else {
        state.offsetXMm = interaction.startOffsetXMm;
      }
      if (h.includes('n')) {
        state.offsetYMm = interaction.startOffsetYMm + (interaction.startHeightMm - nextHeightMm);
      } else {
        state.offsetYMm = interaction.startOffsetYMm;
      }

      renderAll();
    }
  });

  function endInteraction(e) {
    if (!interaction || e.pointerId !== interaction.pointerId) return;
    try {
      els.sourceSheet.releasePointerCapture(e.pointerId);
    } catch {
      // ignore if already released
    }
    interaction = null;
    els.snapGuideV.classList.remove('visible');
    els.snapGuideH.classList.remove('visible');
  }

  els.sourceSheet.addEventListener('pointerup', endInteraction);
  els.sourceSheet.addEventListener('pointercancel', endInteraction);

  // Hover Loupe handlers
  function updateLoupe(e) {
    if (!state.showLoupe || !state.image || !state.lastMetrics) {
      els.loupeLens.classList.remove('visible');
      return;
    }
    const rect = els.sourceSheet.getBoundingClientRect();
    const relX = (e.clientX - rect.left) / rect.width;
    const relY = (e.clientY - rect.top) / rect.height;
    if (relX < 0 || relX > 1 || relY < 0 || relY > 1) {
      els.loupeLens.classList.remove('visible');
      return;
    }

    const stageRect = els.workspaceCard.getBoundingClientRect();
    const lensSize = 144;
    const lx = e.clientX - stageRect.left - lensSize / 2;
    const ly = e.clientY - stageRect.top - lensSize - 18;
    els.loupeLens.style.left = `${Math.max(8, Math.min(stageRect.width - lensSize - 8, lx))}px`;
    els.loupeLens.style.top = `${Math.max(8, ly)}px`;
    els.loupeLens.classList.add('visible');

    const lctx = els.loupeCanvas.getContext('2d');
    const lw = els.loupeCanvas.width;
    const lh = els.loupeCanvas.height;
    lctx.clearRect(0, 0, lw, lh);
    lctx.fillStyle = '#FFFFFF';
    lctx.fillRect(0, 0, lw, lh);
    lctx.imageSmoothingEnabled = false;

    // Crop small window from source canvas proportional to 3x zoom
    const srcC = els.sourceCanvas;
    const cropW = Math.max(12, srcC.width / 3.5);
    const cropH = Math.max(12, srcC.height / 3.5);
    const sx = Math.max(0, Math.min(srcC.width - cropW, relX * srcC.width - cropW / 2));
    const sy = Math.max(0, Math.min(srcC.height - cropH, relY * srcC.height - cropH / 2));

    lctx.drawImage(srcC, sx, sy, cropW, cropH, 0, 0, lw, lh);
    els.loupeTag.textContent = `3× Print Zoom · ${state.lastMetrics.roundedDpi} DPI`;
  }

  els.sourceSheet.addEventListener('pointerleave', () => {
    els.loupeLens.classList.remove('visible');
  });

  // Keyboard Accessibility for Nudging & Scaling
  els.sourceSheet.addEventListener('keydown', (e) => {
    const step = e.shiftKey ? 10 : 2;
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      state.offsetXMm -= step;
      renderAll();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      state.offsetXMm += step;
      renderAll();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      state.offsetYMm -= step;
      renderAll();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      state.offsetYMm += step;
      renderAll();
    } else if (e.key === '+' || e.key === '=') {
      e.preventDefault();
      updateScaleKeepingCenter(state.scalePercent + 5);
    } else if (e.key === '-' || e.key === '_') {
      e.preventDefault();
      updateScaleKeepingCenter(state.scalePercent - 5);
    }
  });

  function updateScaleKeepingCenter(newScale) {
    const clamped = clampScale(newScale);
    const before = getCurrentMetrics();
    state.scalePercent = clamped;
    const after = getCurrentMetrics();
    state.offsetXMm += (before.sheetWidthMm - after.sheetWidthMm) / 2;
    state.offsetYMm += (before.sheetHeightMm - after.sheetHeightMm) / 2;
    renderAll();
  }

  // =========================================================================
  // Image Upload (File Picker, Drag & Drop, Clipboard Paste)
  // =========================================================================
  function loadUploadedFile(file) {
    if (!file || !file.type.startsWith('image/')) {
      showToast('Please choose an image file (PNG, JPG, WebP, or SVG).');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        state.image = img;
        state.imageWidth = img.naturalWidth || img.width || 1000;
        state.imageHeight = img.naturalHeight || img.height || 1000;
        state.imageName = file.name;
        state.activeSampleId = null;

        // Auto-match source orientation to uploaded image
        state.sourceOrientation = state.imageWidth > state.imageHeight ? 'landscape' : 'portrait';
        state.scalePercent = 100;
        centerSourceSheet();
        renderAll();
        showToast(`Loaded "${file.name}" (${state.imageWidth}×${state.imageHeight} px)`);
      };
      img.onerror = () => {
        showToast('Could not decode that image file. Try PNG, JPEG, or WebP.');
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  }

  els.fileInput.addEventListener('change', (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) loadUploadedFile(file);
    e.target.value = '';
  });

  ['dragenter', 'dragover'].forEach((evt) => {
    els.dropzone.addEventListener(evt, (e) => {
      e.preventDefault();
      els.dropzone.classList.add('drag-over');
    });
  });

  ['dragleave', 'drop'].forEach((evt) => {
    els.dropzone.addEventListener(evt, (e) => {
      e.preventDefault();
      els.dropzone.classList.remove('drag-over');
    });
  });

  els.dropzone.addEventListener('drop', (e) => {
    const file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
    if (file) loadUploadedFile(file);
  });

  window.addEventListener('paste', (e) => {
    const items = e.clipboardData && e.clipboardData.items;
    if (!items) return;
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) loadUploadedFile(file);
        break;
      }
    }
  });

  // =========================================================================
  // Sample Gallery Initialization
  // =========================================================================
  function buildSampleGallery() {
    els.sampleGrid.innerHTML = '';
    Samples.SAMPLE_SPECS.forEach((spec) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'sample-btn';
      btn.dataset.sample = spec.id;
      btn.title = `${spec.title} — ${spec.subtitle} (${spec.width}×${spec.height} px)`;

      const img = document.createElement('img');
      img.className = 'sample-thumb';
      img.alt = spec.title;
      img.src = Samples.getSampleThumbnailUrl(spec);

      const tag = document.createElement('span');
      tag.className = `sample-tag ${spec.badgeType}`;
      tag.textContent = spec.badge;

      btn.appendChild(img);
      btn.appendChild(tag);
      btn.addEventListener('click', () => loadSample(spec.id, true));
      els.sampleGrid.appendChild(btn);
    });
  }

  async function loadSample(sampleId, announce = false) {
    const sample = await Samples.getSampleImage(sampleId);
    state.activeSampleId = sample.spec.id;
    state.image = sample.canvas;
    state.imageWidth = sample.width;
    state.imageHeight = sample.height;
    state.imageName = sample.name;
    state.sourceFormat = sample.spec.defaultSource;
    state.sourceOrientation = sample.spec.orientation;
    state.scalePercent = 100;
    centerSourceSheet();
    renderAll();
    if (announce) {
      showToast(`Loaded sample: ${sample.spec.title} (${sample.spec.badge})`);
    }
  }

  // =========================================================================
  // Control Bindings
  // =========================================================================
  function buildFormatButtons(container, kind) {
    container.innerHTML = '';
    Data.FORMAT_ORDER.forEach((fmt) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = kind === 'target' ? 'pill-btn pill-btn-yellow' : 'pill-btn';
      btn.dataset.format = fmt;
      btn.textContent = fmt;
      btn.addEventListener('click', () => {
        if (kind === 'source') {
          state.sourceFormat = fmt;
        } else {
          state.targetFormat = fmt;
        }
        centerSourceSheet();
        renderAll();
      });
      container.appendChild(btn);
    });
  }

  buildFormatButtons(els.sourceFormatPills, 'source');
  buildFormatButtons(els.targetFormatPills, 'target');

  els.sourceOrientSeg.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-orient]');
    if (!btn) return;
    state.sourceOrientation = btn.dataset.orient;
    centerSourceSheet();
    renderAll();
  });

  els.targetOrientSeg.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-orient]');
    if (!btn) return;
    state.targetOrientation = btn.dataset.orient;
    centerSourceSheet();
    renderAll();
  });

  els.fitModeSeg.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-fit]');
    if (!btn) return;
    state.fitMode = btn.dataset.fit;
    centerSourceSheet();
    renderAll();
  });

  els.scaleSlider.addEventListener('input', (e) => {
    updateScaleKeepingCenter(Number(e.target.value));
  });

  els.scaleDownBtn.addEventListener('click', () => updateScaleKeepingCenter(state.scalePercent - 10));
  els.scaleUpBtn.addEventListener('click', () => updateScaleKeepingCenter(state.scalePercent + 10));
  els.btnReset100.addEventListener('click', () => {
    state.scalePercent = 100;
    centerSourceSheet();
    renderAll();
  });
  els.btnFitTarget.addEventListener('click', fitSourceToTarget);
  els.btnMaxSafe.addEventListener('click', snapToMaxSafeScale);
  els.snapSafeBtn.addEventListener('click', snapToMaxSafeScale);
  els.btnCenterSheet.addEventListener('click', () => {
    centerSourceSheet();
    renderAll();
  });

  els.qualitySelect.addEventListener('change', (e) => {
    state.qualityProfileKey = e.target.value;
    renderAll();
  });

  els.togglePixelation.addEventListener('change', (e) => {
    state.showPixelation = e.target.checked;
    renderAll();
  });

  els.toggleRulers.addEventListener('change', (e) => {
    state.showRulers = e.target.checked;
    renderAll();
  });

  els.toggleLoupe.addEventListener('change', (e) => {
    state.showLoupe = e.target.checked;
    if (!state.showLoupe) els.loupeLens.classList.remove('visible');
  });

  // =========================================================================
  // Export Engine (PNG, JPEG, and True ISO Size PDF)
  // =========================================================================
  function drawCropMarks(ctx, x, y, w, h, pxPerMm) {
    const len = Math.max(10, 6 * pxPerMm);
    const gap = Math.max(4, 2.5 * pxPerMm);
    ctx.save();
    ctx.strokeStyle = '#3c2633';
    ctx.lineWidth = Math.max(1, 0.35 * pxPerMm);

    const corners = [
      [x, y, -1, -1],
      [x + w, y, 1, -1],
      [x, y + h, -1, 1],
      [x + w, y + h, 1, 1]
    ];
    corners.forEach(([cx, cy, sx, sy]) => {
      ctx.beginPath();
      ctx.moveTo(cx + sx * gap, cy);
      ctx.lineTo(cx + sx * (gap + len), cy);
      ctx.moveTo(cx, cy + sy * gap);
      ctx.lineTo(cx, cy + sy * (gap + len));
      ctx.stroke();
    });
    ctx.restore();
  }

  function triggerDownload(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  }

  els.btnExport.addEventListener('click', () => {
    if (!state.image) return;

    const format = els.exportFormatSelect.value; // png | pdf | jpeg
    const requestedDpi = Number(els.exportDpiSelect.value) || 150;
    const includeCropMarks = els.exportCropMarks.checked;

    els.btnExport.disabled = true;
    const originalText = els.btnExport.textContent;
    els.btnExport.textContent = 'Preparing print file...';

    setTimeout(() => {
      try {
        const target = getTargetDimsMm();
        const metrics = getCurrentMetrics();

        // Compute export pixel size, safely capped for browser canvas memory limits (especially on A0/A1)
        const MAX_CANVAS_SIDE = 6200;
        let outW = Data.pixelsAtDpi(target.widthMm, requestedDpi);
        let outH = Data.pixelsAtDpi(target.heightMm, requestedDpi);
        let actualDpi = requestedDpi;

        const maxSide = Math.max(outW, outH);
        if (maxSide > MAX_CANVAS_SIDE) {
          const clampRatio = MAX_CANVAS_SIDE / maxSide;
          outW = Math.round(outW * clampRatio);
          outH = Math.round(outH * clampRatio);
          actualDpi = Math.round(requestedDpi * clampRatio);
        }

        const outCanvas = document.createElement('canvas');
        outCanvas.width = outW;
        outCanvas.height = outH;
        const ctx = outCanvas.getContext('2d');

        // Crisp white target paper background
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, outW, outH);

        const pxPerMm = outW / target.widthMm;
        const dx = state.offsetXMm * pxPerMm;
        const dy = state.offsetYMm * pxPerMm;
        const dw = metrics.sheetWidthMm * pxPerMm;
        const dh = metrics.sheetHeightMm * pxPerMm;

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        drawImageWithFit(ctx, state.image, state.imageWidth, state.imageHeight, dx, dy, dw, dh, state.fitMode);

        if (includeCropMarks) {
          drawCropMarks(ctx, dx, dy, dw, dh, pxPerMm);
        }

        const baseName = `peachyprint-${state.sourceFormat}-on-${state.targetFormat}-${state.scalePercent}pct`;

        if (format === 'pdf') {
          const pdfBlob = PdfExport.exportCanvasToPdfBlob(outCanvas, target.widthMm, target.heightMm, 0.94);
          triggerDownload(pdfBlob, `${baseName}.pdf`);
          showToast(`Saved true-size ${state.targetFormat} PDF (${target.widthMm}×${target.heightMm} mm · ${actualDpi} DPI)`);
        } else if (format === 'jpeg') {
          outCanvas.toBlob(
            (blob) => {
              if (blob) {
                triggerDownload(blob, `${baseName}.jpg`);
                showToast(`Saved ${state.targetFormat} JPEG (${outW}×${outH} px · ${actualDpi} DPI)`);
              }
            },
            'image/jpeg',
            0.95
          );
        } else {
          outCanvas.toBlob((blob) => {
            if (blob) {
              triggerDownload(blob, `${baseName}.png`);
              showToast(`Saved ${state.targetFormat} PNG (${outW}×${outH} px · ${actualDpi} DPI)`);
            }
          }, 'image/png');
        }
      } catch (err) {
        console.error('Export error:', err);
        showToast('Export failed — try 150 DPI for very large sheets.');
      } finally {
        els.btnExport.disabled = false;
        els.btnExport.textContent = originalText;
      }
    }, 30);
  });

  // =========================================================================
  // Interactive ISO 216 Educational Diagram Hook
  // =========================================================================
  const isoZones = document.querySelectorAll('.iso-zone[data-iso]');
  function updateGuideSelection(fmt) {
    const spec = Data.PAPER_FORMATS[fmt];
    if (!spec || !els.isoSelectedInfo) return;
    state.selectedGuideFormat = fmt;
    const px300W = Data.pixelsAtDpi(spec.widthMm, 300);
    const px300H = Data.pixelsAtDpi(spec.heightMm, 300);
    els.isoSelectedInfo.innerHTML =
      `<strong>${spec.name}</strong> (${spec.widthMm} × ${spec.heightMm} mm) · 300 DPI needs <code>${px300W} × ${px300H} px</code> — ${spec.useCase}.`;
  }

  isoZones.forEach((zone) => {
    zone.addEventListener('click', () => {
      updateGuideSelection(zone.dataset.iso);
    });
  });

  if (els.isoUseSourceBtn) {
    els.isoUseSourceBtn.addEventListener('click', () => {
      state.sourceFormat = state.selectedGuideFormat;
      centerSourceSheet();
      renderAll();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      showToast(`Source sheet set to ${state.sourceFormat}`);
    });
  }

  if (els.isoUseTargetBtn) {
    els.isoUseTargetBtn.addEventListener('click', () => {
      state.targetFormat = state.selectedGuideFormat;
      centerSourceSheet();
      renderAll();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      showToast(`Target sheet set to ${state.targetFormat}`);
    });
  }

  // Responsive reflow
  let resizeRaf = null;
  window.addEventListener('resize', () => {
    cancelAnimationFrame(resizeRaf);
    resizeRaf = requestAnimationFrame(renderAll);
  });

  // Boot!
  buildSampleGallery();
  updateGuideSelection('A4');
  loadSample('botanical-a4', false);
})();
