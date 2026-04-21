// Lark Emoji & Icon Maker
(function () {
  'use strict';

  // --- 状態管理 ---
  const state = {
    mode: 'text', // 'text' | 'image'
    outputWidth: 96,
    outputHeight: 96,
    autoWidth: false, // 横長モード（幅自動計算）
    maxKB: 100,
    uploadedImage: null,
  };

  // --- DOM要素 ---
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  const canvas = $('#previewCanvas');
  const ctx = canvas.getContext('2d');

  // タブ
  const tabs = $$('.tab');
  const textPanel = $('#textPanel');
  const imagePanel = $('#imagePanel');

  // テキスト設定
  const emojiText = $('#emojiText');
  const fontFamily = $('#fontFamily');
  const fontWeight = $('#fontWeight');
  const textColor = $('#textColor');
  const textColorHex = $('#textColorHex');
  const bgColor = $('#bgColor');
  const bgColorHex = $('#bgColorHex');
  const bgTransparent = $('#bgTransparent');
  const textAlign = $('#textAlign');
  const paddingSlider = $('#paddingSlider');
  const paddingValueEl = $('#paddingValue');

  // 画像設定
  const dropZone = $('#dropZone');
  const imageInput = $('#imageInput');
  const fitMode = $('#fitMode');
  const imgBgColor = $('#imgBgColor');
  const imgBgTransparent = $('#imgBgTransparent');
  const borderRadius = $('#borderRadius');
  const borderRadiusValue = $('#borderRadiusValue');

  // プリセット
  const presetButtons = $$('.preset');
  const customSizeDiv = $('.custom-size');
  const customWidth = $('#customWidth');
  const customHeight = $('#customHeight');

  // プレビュー
  const previewSize = $('#previewSize');
  const previewFileSize = $('#previewFileSize');
  const downloadBtn = $('#downloadBtn');
  const sampleCanvases = $$('.sample-canvas');

  // --- タブ切替 ---
  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      tabs.forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      state.mode = tab.dataset.mode;

      textPanel.classList.toggle('hidden', state.mode !== 'text');
      imagePanel.classList.toggle('hidden', state.mode !== 'image');
      render();
    });
  });

  // --- サイズプリセット ---
  presetButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      presetButtons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');

      const dw = btn.dataset.w;
      const dh = btn.dataset.h;
      state.maxKB = parseInt(btn.dataset.maxkb) || 0;

      if (dw === 'custom') {
        // カスタム
        customSizeDiv.classList.remove('hidden');
        state.autoWidth = false;
        state.outputWidth = parseInt(customWidth.value) || 96;
        state.outputHeight = parseInt(customHeight.value) || 96;
      } else if (dw === '0') {
        // 横長モード（幅自動）
        customSizeDiv.classList.add('hidden');
        state.autoWidth = true;
        state.outputHeight = parseInt(dh);
        // 幅はテキスト/画像に応じて自動計算 → renderで処理
      } else {
        // 固定サイズ
        customSizeDiv.classList.add('hidden');
        state.autoWidth = false;
        state.outputWidth = parseInt(dw);
        state.outputHeight = parseInt(dh);
      }

      updateCanvasSize();
      render();
    });
  });

  customWidth.addEventListener('input', () => {
    state.outputWidth = parseInt(customWidth.value) || 96;
    updateCanvasSize();
    render();
  });

  customHeight.addEventListener('input', () => {
    state.outputHeight = parseInt(customHeight.value) || 96;
    updateCanvasSize();
    render();
  });

  function updateCanvasSize() {
    canvas.width = state.outputWidth;
    canvas.height = state.outputHeight;
    previewSize.textContent = `${state.outputWidth} × ${state.outputHeight}`;
  }

  // --- カラー同期 ---
  textColor.addEventListener('input', () => {
    textColorHex.value = textColor.value;
    render();
  });
  textColorHex.addEventListener('input', () => {
    if (/^#[0-9a-f]{6}$/i.test(textColorHex.value)) {
      textColor.value = textColorHex.value;
      render();
    }
  });

  bgColor.addEventListener('input', () => {
    bgColorHex.value = bgColor.value;
    render();
  });
  bgColorHex.addEventListener('input', () => {
    if (/^#[0-9a-f]{6}$/i.test(bgColorHex.value)) {
      bgColor.value = bgColorHex.value;
      render();
    }
  });

  bgTransparent.addEventListener('change', render);

  // カラープリセット
  $$('.color-swatch').forEach((swatch) => {
    swatch.addEventListener('click', () => {
      textColor.value = swatch.dataset.color;
      textColorHex.value = swatch.dataset.color;
      render();
    });
  });

  // 余白スライダー
  paddingSlider.addEventListener('input', () => {
    paddingValueEl.textContent = `${paddingSlider.value}%`;
    render();
  });

  // テキスト設定の変更を監視
  [emojiText, fontFamily, fontWeight, textAlign].forEach((el) => {
    el.addEventListener('input', render);
    el.addEventListener('change', render);
  });

  // --- 画像アップロード ---
  dropZone.addEventListener('click', () => imageInput.click());

  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('drag-over');
  });

  dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('drag-over');
  });

  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      loadImage(file);
    }
  });

  imageInput.addEventListener('change', () => {
    const file = imageInput.files[0];
    if (file) loadImage(file);
  });

  function loadImage(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        state.uploadedImage = img;
        // ドロップゾーンにプレビュー表示
        dropZone.classList.add('has-image');
        dropZone.innerHTML = '';
        const preview = document.createElement('img');
        preview.src = e.target.result;
        dropZone.appendChild(preview);
        const changeText = document.createElement('p');
        changeText.textContent = 'クリックで画像を変更';
        changeText.style.cssText = 'font-size:0.75rem; color:#636e72; margin-top:6px';
        dropZone.appendChild(changeText);
        render();
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  // 画像設定の変更を監視
  [fitMode, imgBgColor, imgBgTransparent, borderRadius].forEach((el) => {
    el.addEventListener('input', render);
    el.addEventListener('change', render);
  });

  borderRadius.addEventListener('input', () => {
    borderRadiusValue.textContent = `${borderRadius.value}%`;
  });

  // --- 横長モード: テキストから必要な幅を計算 ---
  function calcAutoWidth() {
    const h = state.outputHeight;
    const text = emojiText.value;
    if (!text.trim()) return h; // テキストなしなら正方形

    const lines = text.split('\n');
    const font = fontFamily.value;
    const weight = fontWeight.value;
    const padPct = parseInt(paddingSlider.value) / 100;
    const padY = h * padPct;
    const maxH = h - padY * 2;

    const fontSize = Math.floor(maxH / lines.length);
    ctx.font = `${weight} ${fontSize}px ${font}`;

    // 最も幅の広い行を基準に幅を決定
    let maxTextWidth = 0;
    for (const line of lines) {
      const w = ctx.measureText(line).width;
      if (w > maxTextWidth) maxTextWidth = w;
    }

    // パディング加算
    const padX = h * padPct;
    let totalWidth = Math.ceil(maxTextWidth + padX * 2);

    // Lark制限: 96〜464px
    totalWidth = Math.max(96, Math.min(464, totalWidth));

    return totalWidth;
  }

  // --- 横長モード: 画像から必要な幅を計算 ---
  function calcAutoWidthForImage() {
    const h = state.outputHeight;
    const img = state.uploadedImage;
    if (!img) return h;

    // 画像のアスペクト比に基づく
    const aspectRatio = img.width / img.height;
    let w = Math.round(h * aspectRatio);

    // Lark制限: 96〜464px
    w = Math.max(96, Math.min(464, w));

    return w;
  }

  // --- レンダリング ---
  function render() {
    // 横長モードの場合、幅を自動計算
    if (state.autoWidth) {
      if (state.mode === 'text') {
        // 仮キャンバスでテキスト幅を計測
        canvas.width = 464; // 最大幅で一時計測
        canvas.height = state.outputHeight;
        state.outputWidth = calcAutoWidth();
      } else {
        state.outputWidth = calcAutoWidthForImage();
      }
    }

    const w = state.outputWidth;
    const h = state.outputHeight;

    canvas.width = w;
    canvas.height = h;
    previewSize.textContent = `${w} × ${h}`;

    ctx.clearRect(0, 0, w, h);

    if (state.mode === 'text') {
      renderText(w, h);
    } else {
      renderImage(w, h);
    }

    updateSamples();
    updateFileSize();
  }

  function renderText(w, h) {
    // 背景
    if (!bgTransparent.checked) {
      ctx.fillStyle = bgColor.value;
      ctx.fillRect(0, 0, w, h);
    }

    const text = emojiText.value;
    if (!text.trim()) return;

    const lines = text.split('\n');
    const font = fontFamily.value;
    const weight = fontWeight.value;
    const color = textColor.value;
    const align = textAlign.value;

    ctx.fillStyle = color;
    ctx.textBaseline = 'middle';

    // パディング（スライダーで調整、デフォルト4%）
    const padPct = parseInt(paddingSlider.value) / 100;
    const padX = w * padPct;
    const padY = h * padPct;
    const maxW = w - padX * 2;
    const maxH = h - padY * 2;

    // 自動フィット: テキストがキャンバスいっぱいに収まる最大サイズ
    let fontSize = Math.floor(maxH / lines.length);
    let fits = false;
    while (fontSize > 4 && !fits) {
      ctx.font = `${weight} ${fontSize}px ${font}`;
      fits = true;
      for (const line of lines) {
        if (ctx.measureText(line).width > maxW) {
          fits = false;
          break;
        }
      }
      if (!fits) fontSize--;
    }

    ctx.font = `${weight} ${fontSize}px ${font}`;

    // 行間
    const lineHeight = fontSize * 1.15;
    const totalHeight = lineHeight * lines.length;
    const startY = (h - totalHeight) / 2 + lineHeight / 2;

    // テキスト配置
    ctx.textAlign = align;
    let x;
    if (align === 'left') x = padX;
    else if (align === 'right') x = w - padX;
    else x = w / 2;

    for (let i = 0; i < lines.length; i++) {
      ctx.fillText(lines[i], x, startY + i * lineHeight);
    }
  }

  function renderImage(w, h) {
    const img = state.uploadedImage;

    // 丸角のクリッピング
    const radius = (borderRadius.value / 100) * (Math.min(w, h) / 2);
    if (radius > 0) {
      roundedRect(ctx, 0, 0, w, h, radius);
      ctx.clip();
    }

    // 背景
    if (!imgBgTransparent.checked) {
      ctx.fillStyle = imgBgColor.value;
      ctx.fillRect(0, 0, w, h);
    }

    if (!img) {
      // プレースホルダー
      ctx.fillStyle = '#dfe6e9';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#b2bec3';
      ctx.font = `700 ${Math.floor(Math.min(w, h) * 0.15)}px 'Noto Sans JP', sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('画像を選択', w / 2, h / 2);
      return;
    }

    const mode = fitMode.value;
    let sx = 0, sy = 0, sw = img.width, sh = img.height;
    let dx = 0, dy = 0, dw = w, dh = h;

    if (mode === 'cover') {
      const scale = Math.max(w / img.width, h / img.height);
      sw = w / scale;
      sh = h / scale;
      sx = (img.width - sw) / 2;
      sy = (img.height - sh) / 2;
    } else if (mode === 'contain') {
      const scale = Math.min(w / img.width, h / img.height);
      dw = img.width * scale;
      dh = img.height * scale;
      dx = (w - dw) / 2;
      dy = (h - dh) / 2;
      if (!imgBgTransparent.checked) {
        ctx.fillStyle = imgBgColor.value;
        ctx.fillRect(0, 0, w, h);
      }
    } else if (mode === 'fill') {
      const scale = Math.min(w / img.width, h / img.height);
      dw = img.width * scale;
      dh = img.height * scale;
      dx = (w - dw) / 2;
      dy = (h - dh) / 2;
      if (!imgBgTransparent.checked) {
        ctx.fillStyle = imgBgColor.value;
        ctx.fillRect(0, 0, w, h);
      }
    }
    // stretch: デフォルトの dx,dy,dw,dh をそのまま使う

    ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
  }

  function roundedRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  // --- サンプル表示 ---
  function updateSamples() {
    const w = state.outputWidth;
    const h = state.outputHeight;
    const aspectRatio = w / h;

    sampleCanvases.forEach((sc) => {
      const displayH = parseInt(sc.dataset.display);
      const displayW = Math.round(displayH * aspectRatio);
      sc.width = displayW;
      sc.height = displayH;
      sc.style.width = displayW + 'px';
      sc.style.height = displayH + 'px';

      const sctx = sc.getContext('2d');
      sctx.clearRect(0, 0, displayW, displayH);
      sctx.drawImage(canvas, 0, 0, displayW, displayH);
    });
  }

  // --- ファイルサイズ表示 ---
  function updateFileSize() {
    canvas.toBlob((blob) => {
      if (!blob) return;
      const kb = (blob.size / 1024).toFixed(1);
      previewFileSize.textContent = `${kb} KB`;

      // サイズ警告
      if (state.maxKB > 0 && blob.size / 1024 > state.maxKB) {
        previewFileSize.style.color = '#e74c3c';
        previewFileSize.textContent += ` (${state.maxKB}KB超過!)`;
      } else {
        previewFileSize.style.color = '#636e72';
      }
    }, 'image/png');
  }

  // --- ダウンロード ---
  downloadBtn.addEventListener('click', () => {
    const activePreset = document.querySelector('.preset.active');
    const label = activePreset ? activePreset.dataset.label : 'custom';
    const name = state.mode === 'text'
      ? (emojiText.value.replace(/\n/g, '_').replace(/[\\/:*?"<>|]/g, '').substring(0, 20) || 'emoji')
      : 'image';
    const filename = `${name}_${state.outputWidth}x${state.outputHeight}_${label}.png`;

    canvas.toBlob((blob) => {
      if (!blob) return;

      // http/https ならBlob URL + <a download> が動作する
      if (location.protocol.startsWith('http')) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.download = filename;
        a.href = url;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }, 500);
      } else {
        // file:// プロトコルの場合: 新しいタブで画像を表示
        const dataUrl = canvas.toDataURL('image/png');
        const w = window.open('');
        if (w) {
          w.document.write(
            '<html><head><title>' + filename + '</title></head><body style="margin:0;display:flex;justify-content:center;align-items:center;min-height:100vh;background:#f0f0f0;flex-direction:column;font-family:sans-serif">'
            + '<p style="margin-bottom:16px;color:#333">右クリック → 「名前を付けて画像を保存」で保存してください</p>'
            + '<img src="' + dataUrl + '" style="max-width:90vw;image-rendering:pixelated;border:1px solid #ccc;background:white" />'
            + '<p style="margin-top:12px;color:#999;font-size:13px">' + filename + ' (' + state.outputWidth + '×' + state.outputHeight + ')</p>'
            + '</body></html>'
          );
          w.document.close();
        }
      }
    }, 'image/png');
  });

  // --- 初期レンダリング ---
  if (document.fonts) {
    document.fonts.ready.then(() => {
      render();
    });
  } else {
    setTimeout(render, 500);
  }

  render();
})();
