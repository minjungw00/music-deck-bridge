'use strict';
(function (root) {
  function create({ element, request, translate }) {
    const fit = element('linkedArtworkFit');
    const horizontalGap = element('linkedGapHorizontal');
    const verticalGap = element('linkedGapVertical');
    const error = element('linkedGapError');
    let receiving = false, gapDirty = false;

    function receive({ linkedArtworkFit, linkedArtworkGap }) {
      receiving = true;
      try {
        fit.value = linkedArtworkFit === 'width' ? 'width' : 'height';
        if (!gapDirty) {
          horizontalGap.value = String(linkedArtworkGap?.horizontal ?? 0);
          verticalGap.value = String(linkedArtworkGap?.vertical ?? 0);
        }
      } finally {
        receiving = false;
      }
    }

    fit.addEventListener('valuechange', () => {
      if (!receiving) void request('set-linked-fit', { fit: fit.value });
    });
    for (const input of [horizontalGap, verticalGap]) {
      input.addEventListener('valuechange', () => {
        if (receiving) return;
        gapDirty = true;
        error.classList.add('hidden');
      });
    }
    element('applyLinkedGap').addEventListener('click', () => {
      const horizontal = Number(horizontalGap.value || 0);
      const vertical = Number(verticalGap.value || 0);
      if ([horizontal, vertical].some(gap => !Number.isInteger(gap) || gap < 0 || gap > 100)) {
        error.textContent = translate('linkedGapInvalid');
        error.classList.remove('hidden');
        return;
      }
      gapDirty = false;
      void request('set-linked-gap', { gap: { horizontal, vertical } });
    });
    return { receive };
  }
  root.MusicDeckLinkedArtworkEditor = Object.freeze({ create });
})(globalThis);
