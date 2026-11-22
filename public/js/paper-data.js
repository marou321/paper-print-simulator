/**
 * PeachyPrint — ISO 216 Paper Formats & Print DPI Math Engine
 */
(function (global) {
  'use strict';

  const MM_PER_INCH = 25.4;

  const PAPER_FORMATS = {
    A0: {
      key: 'A0',
      name: 'A0',
      widthMm: 841,
      heightMm: 1189,
      useCase: 'Large exhibition posters, architectural drawings, wall maps',
      tag: 'Giant Poster'
    },
    A1: {
      key: 'A1',
      name: 'A1',
      widthMm: 594,
      heightMm: 841,
      useCase: 'Gallery posters, signage, flip charts, blueprint sheets',
      tag: 'Large Poster'
    },
    A2: {
      key: 'A2',
      name: 'A2',
      widthMm: 420,
      heightMm: 594,
      useCase: 'Wall calendars, art prints, medium posters, studio layouts',
      tag: 'Medium Poster'
    },
    A3: {
      key: 'A3',
      name: 'A3',
      widthMm: 297,
      heightMm: 420,
      useCase: 'Folded menus, art posters, portfolios, double-page spreads',
      tag: 'Tabloid / Art'
    },
    A4: {
      key: 'A4',
      name: 'A4',
      widthMm: 210,
      heightMm: 297,
      useCase: 'Standard documents, flyers, stationery, magazines, certificates',
      tag: 'Standard Sheet'
    },
    A5: {
      key: 'A5',
      name: 'A5',
      widthMm: 148,
      heightMm: 210,
      useCase: 'Postcards, notebooks, sticker sheets, greeting cards, booklets',
      tag: 'Compact Card'
    }
  };

  const FORMAT_ORDER = ['A5', 'A4', 'A3', 'A2', 'A1', 'A0'];

  const QUALITY_PROFILES = {
    standard: {
      key: 'standard',
      label: 'Standard Print (150+ DPI Safe)',
      shortLabel: 'Standard Print',
      safeDpi: 150,
      idealDpi: 260,
      description: 'Ideal for everyday flyers, posters, menus, and art prints viewed at arm’s length.'
    },
    fineart: {
      key: 'fineart',
      label: 'Fine Art & Photo (240+ DPI Safe)',
      shortLabel: 'Fine Art / Photo',
      safeDpi: 240,
      idealDpi: 300,
      description: 'Strict threshold for photography, small typography, and close-up inspection.'
    },
    poster: {
      key: 'poster',
      label: 'Wall Poster (100+ DPI Safe)',
      shortLabel: 'Wall Poster',
      safeDpi: 100,
      idealDpi: 180,
      description: 'Relaxed threshold for A2–A0 posters viewed from 1–2 meters away.'
    }
  };

  function getSheetDimensionsMm(formatKey, orientation) {
    const spec = PAPER_FORMATS[formatKey] || PAPER_FORMATS.A4;
    if (orientation === 'landscape') {
      return { widthMm: spec.heightMm, heightMm: spec.widthMm };
    }
    return { widthMm: spec.widthMm, heightMm: spec.heightMm };
  }

  function mmToInches(mm) {
    return mm / MM_PER_INCH;
  }

  function pixelsAtDpi(mm, dpi) {
    return Math.round((mm / MM_PER_INCH) * dpi);
  }

  /**
   * Smoothly compute a visual border color (Green -> Warm Green -> Alert Red)
   * based on effective DPI relative to the selected quality profile.
   */
  function computeBorderVisuals(effectiveDpi, profile) {
    const safe = profile.safeDpi;
    const ideal = profile.idealDpi;

    if (effectiveDpi < safe) {
      // Unmistakable Alert Red as soon as scaling causes noticeable pixelation / low DPI
      const severity = Math.max(0, Math.min(1, (safe - effectiveDpi) / Math.max(safe * 0.5, 40)));
      const lightness = Math.round(52 - severity * 6); // 52% -> 46% crisp crimson
      return {
        status: 'pixelated',
        label: 'Pixelation Warning',
        shortBadge: 'Low DPI · Pixelated!',
        borderColor: `hsl(355, 86%, ${lightness}%)`,
        glowColor: 'rgba(239, 68, 68, 0.38)',
        badgeBg: '#FEE2E2',
        badgeBorder: '#FCA5A5',
        badgeText: '#B91C1C',
        barColor: '#EF4444'
      };
    }

    if (effectiveDpi < ideal) {
      // Safe but approaching threshold — healthy green to soft lime-green
      const t = (effectiveDpi - safe) / Math.max(ideal - safe, 1); // 0 at safe, 1 at ideal
      const hue = Math.round(108 + t * 34); // 108 (leafy green) -> 142 (emerald green)
      return {
        status: 'good',
        label: 'Safe Print Quality',
        shortBadge: 'Safe Print DPI',
        borderColor: `hsl(${hue}, 70%, 42%)`,
        glowColor: 'rgba(34, 197, 94, 0.28)',
        badgeBg: '#ECFCCB',
        badgeBorder: '#A3E635',
        badgeText: '#3F6212',
        barColor: `hsl(${hue}, 72%, 44%)`
      };
    }

    // Crisp, sharp emerald green
    return {
      status: 'sharp',
      label: 'Sharp & Print-Ready',
      shortBadge: 'Sharp · Print-Ready',
      borderColor: '#16A34A',
      glowColor: 'rgba(22, 163, 74, 0.30)',
      badgeBg: '#DCFCE7',
      badgeBorder: '#86EFAC',
      badgeText: '#166534',
      barColor: '#22C55E'
    };
  }

  /**
   * Calculates full physical size, rendered image area, effective DPI,
   * maximum safe scale, and border indicator state.
   */
  function computePrintMetrics(options) {
    const {
      imageWidth,
      imageHeight,
      sourceFormat,
      sourceOrientation,
      scalePercent,
      fitMode = 'contain',
      qualityProfileKey = 'standard'
    } = options;

    const profile = QUALITY_PROFILES[qualityProfileKey] || QUALITY_PROFILES.standard;
    const baseSheet = getSheetDimensionsMm(sourceFormat, sourceOrientation);
    const scale = Math.max(0.05, (Number(scalePercent) || 100) / 100);

    // Physical dimensions of the source sheet frame on the target sheet
    let sheetWidthMm = baseSheet.widthMm * scale;
    let sheetHeightMm = baseSheet.heightMm * scale;

    const imgW = Math.max(1, Number(imageWidth) || 1);
    const imgH = Math.max(1, Number(imageHeight) || 1);
    const imgAspect = imgW / imgH;
    const sheetAspect = sheetWidthMm / sheetHeightMm;

    // Physical dimensions of the actual rendered image pixels inside the source sheet
    let renderedImgWidthMm = sheetWidthMm;
    let renderedImgHeightMm = sheetHeightMm;

    if (fitMode === 'contain') {
      if (imgAspect > sheetAspect) {
        renderedImgWidthMm = sheetWidthMm;
        renderedImgHeightMm = sheetWidthMm / imgAspect;
      } else {
        renderedImgHeightMm = sheetHeightMm;
        renderedImgWidthMm = sheetHeightMm * imgAspect;
      }
    } else if (fitMode === 'cover') {
      if (imgAspect > sheetAspect) {
        renderedImgHeightMm = sheetHeightMm;
        renderedImgWidthMm = sheetHeightMm * imgAspect;
      } else {
        renderedImgWidthMm = sheetWidthMm;
        renderedImgHeightMm = sheetWidthMm / imgAspect;
      }
    } else if (fitMode === 'image') {
      // Keep the sheet area's height/width matched to image aspect while keeping base sheet major size
      if (imgAspect >= 1) {
        sheetHeightMm = sheetWidthMm / imgAspect;
      } else {
        sheetWidthMm = sheetHeightMm * imgAspect;
      }
      renderedImgWidthMm = sheetWidthMm;
      renderedImgHeightMm = sheetHeightMm;
    }

    const renderedWidthIn = mmToInches(renderedImgWidthMm);
    const renderedHeightIn = mmToInches(renderedImgHeightMm);

    const dpiX = imgW / Math.max(renderedWidthIn, 0.001);
    const dpiY = imgH / Math.max(renderedHeightIn, 0.001);
    const effectiveDpi = Math.min(dpiX, dpiY);

    // Scale is inversely proportional to effective DPI:
    // effectiveDpi(s) = effectiveDpi(current) * (scalePercent / s)
    const maxSafeScalePercent = Math.max(
      10,
      Math.floor((scalePercent * effectiveDpi) / profile.safeDpi)
    );
    const idealScalePercent = Math.max(
      10,
      Math.floor((scalePercent * effectiveDpi) / profile.idealDpi)
    );

    const visuals = computeBorderVisuals(effectiveDpi, profile);

    return {
      profile,
      baseSheetWidthMm: baseSheet.widthMm,
      baseSheetHeightMm: baseSheet.heightMm,
      sheetWidthMm,
      sheetHeightMm,
      sheetWidthIn: mmToInches(sheetWidthMm),
      sheetHeightIn: mmToInches(sheetHeightMm),
      renderedImgWidthMm,
      renderedImgHeightMm,
      dpiX,
      dpiY,
      effectiveDpi,
      roundedDpi: Math.round(effectiveDpi),
      maxSafeScalePercent,
      idealScalePercent,
      visuals
    };
  }

  global.PeachyPaperData = {
    MM_PER_INCH,
    PAPER_FORMATS,
    FORMAT_ORDER,
    QUALITY_PROFILES,
    getSheetDimensionsMm,
    mmToInches,
    pixelsAtDpi,
    computeBorderVisuals,
    computePrintMetrics
  };
})(typeof window !== 'undefined' ? window : globalThis);
