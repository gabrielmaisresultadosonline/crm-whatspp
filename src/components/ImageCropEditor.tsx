import { useState, useRef, useEffect, useCallback } from "react";
import { Download, Upload, RotateCcw, ZoomIn, ZoomOut, Move } from "lucide-react";
import { toast } from "sonner";

type Format = "stories" | "feed";

const FORMATS: Record<Format, { w: number; h: number; label: string }> = {
  stories: { w: 1080, h: 1920, label: "Stories (9:16)" },
  feed: { w: 1080, h: 1080, label: "Feed (1:1)" },
};

type ResizeHandle = "tl" | "tr" | "bl" | "br" | "t" | "b" | "l" | "r" | null;

const ImageCropEditor = () => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [format, setFormat] = useState<Format>("stories");
  const [imgNatural, setImgNatural] = useState({ w: 0, h: 0 });

  // Image rect in preview-space: x, y, w, h
  const [imgRect, setImgRect] = useState({ x: 0, y: 0, w: 0, h: 0 });

  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ mx: 0, my: 0, rect: { x: 0, y: 0, w: 0, h: 0 } });
  const [resizeHandle, setResizeHandle] = useState<ResizeHandle>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const fmt = FORMATS[format];
  const aspect = fmt.w / fmt.h;
  const imgAspect = imgNatural.w > 0 && imgNatural.h > 0 ? imgNatural.w / imgNatural.h : 1;

  const getPreviewSize = useCallback(() => {
    if (!containerRef.current) return { pw: 300, ph: 300 };
    const cw = containerRef.current.clientWidth;
    const ch = containerRef.current.clientHeight;
    if (cw / ch > aspect) {
      return { pw: ch * aspect, ph: ch };
    }
    return { pw: cw, ph: cw / aspect };
  }, [aspect]);

  const loadImage = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Arquivo não é uma imagem");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      setImageSrc(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  }, []);

  // Paste handler
  useEffect(() => {
    const handler = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of Array.from(items)) {
        if (item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) loadImage(file);
          e.preventDefault();
          break;
        }
      }
    };
    document.addEventListener("paste", handler);
    return () => document.removeEventListener("paste", handler);
  }, [loadImage]);

  // Load natural dimensions & auto-fit
  useEffect(() => {
    if (!imageSrc) return;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      setImgNatural({ w: img.naturalWidth, h: img.naturalHeight });
      imgRef.current = img;

      const { pw, ph } = getPreviewSize();
      const natAspect = img.naturalWidth / img.naturalHeight;
      // Cover proporcional: preenche o canvas e corta cantos quando necessário (sem distorcer)
      let drawW: number, drawH: number;
      if (natAspect > pw / ph) {
        drawH = ph;
        drawW = ph * natAspect;
      } else {
        drawW = pw;
        drawH = pw / natAspect;
      }
      setImgRect({
        x: (pw - drawW) / 2,
        y: (ph - drawH) / 2,
        w: drawW,
        h: drawH,
      });
    };
    img.src = imageSrc;
  }, [imageSrc, format, getPreviewSize]);

  // Detect which handle is under cursor
  const getHandle = (mx: number, my: number): ResizeHandle => {
    const handleSize = 14;
    const r = imgRect;
    const edges = {
      left: Math.abs(mx - r.x) < handleSize,
      right: Math.abs(mx - (r.x + r.w)) < handleSize,
      top: Math.abs(my - r.y) < handleSize,
      bottom: Math.abs(my - (r.y + r.h)) < handleSize,
    };
    const inH = my > r.y - handleSize && my < r.y + r.h + handleSize;
    const inW = mx > r.x - handleSize && mx < r.x + r.w + handleSize;

    if (edges.top && edges.left) return "tl";
    if (edges.top && edges.right) return "tr";
    if (edges.bottom && edges.left) return "bl";
    if (edges.bottom && edges.right) return "br";
    if (edges.top && inW) return "t";
    if (edges.bottom && inW) return "b";
    if (edges.left && inH) return "l";
    if (edges.right && inH) return "r";
    return null;
  };

  const getCursorStyle = (handle: ResizeHandle) => {
    switch (handle) {
      case "tl": case "br": return "nwse-resize";
      case "tr": case "bl": return "nesw-resize";
      case "t": case "b": return "ns-resize";
      case "l": case "r": return "ew-resize";
      default: return "grab";
    }
  };

  const [hoverHandle, setHoverHandle] = useState<ResizeHandle>(null);

  const onPointerDown = (e: React.PointerEvent) => {
    if (!imageSrc) return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const { pw, ph } = getPreviewSize();
    const offsetX = (rect.width - pw) / 2;
    const offsetY = (rect.height - ph) / 2;
    const mx = e.clientX - rect.left - offsetX;
    const my = e.clientY - rect.top - offsetY;

    const handle = getHandle(mx, my);
    setResizeHandle(handle);
    setDragging(true);
    setDragStart({ mx: e.clientX, my: e.clientY, rect: { ...imgRect } });
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const { pw, ph } = getPreviewSize();
    const offsetX = (rect.width - pw) / 2;
    const offsetY = (rect.height - ph) / 2;
    const mx = e.clientX - rect.left - offsetX;
    const my = e.clientY - rect.top - offsetY;

    if (!dragging) {
      setHoverHandle(imageSrc ? getHandle(mx, my) : null);
      return;
    }

    const dx = e.clientX - dragStart.mx;
    const dy = e.clientY - dragStart.my;
    const orig = dragStart.rect;

    if (!resizeHandle) {
      // Just dragging/moving
      setImgRect({ ...orig, x: orig.x + dx, y: orig.y + dy });
      return;
    }

    // Resize while keeping aspect ratio
    let newW = orig.w;
    let newH = orig.h;
    let newX = orig.x;
    let newY = orig.y;

    const ar = imgAspect;
    const minSize = 50;

    switch (resizeHandle) {
      case "br": {
        newW = Math.max(minSize, orig.w + dx);
        newH = newW / ar;
        break;
      }
      case "bl": {
        newW = Math.max(minSize, orig.w - dx);
        newH = newW / ar;
        newX = orig.x + orig.w - newW;
        break;
      }
      case "tr": {
        newW = Math.max(minSize, orig.w + dx);
        newH = newW / ar;
        newY = orig.y + orig.h - newH;
        break;
      }
      case "tl": {
        newW = Math.max(minSize, orig.w - dx);
        newH = newW / ar;
        newX = orig.x + orig.w - newW;
        newY = orig.y + orig.h - newH;
        break;
      }
      case "r": {
        newW = Math.max(minSize, orig.w + dx);
        newH = newW / ar;
        const cy = orig.y + orig.h / 2;
        newY = cy - newH / 2;
        break;
      }
      case "l": {
        newW = Math.max(minSize, orig.w - dx);
        newH = newW / ar;
        newX = orig.x + orig.w - newW;
        const cy2 = orig.y + orig.h / 2;
        newY = cy2 - newH / 2;
        break;
      }
      case "b": {
        newH = Math.max(minSize, orig.h + dy);
        newW = newH * ar;
        const cx = orig.x + orig.w / 2;
        newX = cx - newW / 2;
        break;
      }
      case "t": {
        newH = Math.max(minSize, orig.h - dy);
        newW = newH * ar;
        newX = orig.x + orig.w / 2 - newW / 2;
        newY = orig.y + orig.h - newH;
        break;
      }
    }

    setImgRect({ x: newX, y: newY, w: newW, h: newH });
  };

  const onPointerUp = () => {
    setDragging(false);
    setResizeHandle(null);
  };

  // Wheel zoom (uniform, centered)
  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY > 0 ? 0.95 : 1.05;
    setImgRect((prev) => {
      const cx = prev.x + prev.w / 2;
      const cy = prev.y + prev.h / 2;
      const nw = Math.max(50, prev.w * factor);
      const nh = nw / imgAspect;
      return { x: cx - nw / 2, y: cy - nh / 2, w: nw, h: nh };
    });
  };

  // Zoom buttons
  const zoomBy = (factor: number) => {
    setImgRect((prev) => {
      const cx = prev.x + prev.w / 2;
      const cy = prev.y + prev.h / 2;
      const nw = Math.max(50, prev.w * factor);
      const nh = nw / imgAspect;
      return { x: cx - nw / 2, y: cy - nh / 2, w: nw, h: nh };
    });
  };

  // Download
  const handleDownload = () => {
    if (!imgRef.current) return;
    const { pw } = getPreviewSize();
    const scale = fmt.w / pw;

    const canvas = document.createElement("canvas");
    canvas.width = fmt.w;
    canvas.height = fmt.h;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, fmt.w, fmt.h);

    const dx = imgRect.x * scale;
    const dy = imgRect.y * scale;
    const dw = imgRect.w * scale;
    const dh = imgRect.h * scale;

    ctx.drawImage(imgRef.current, dx, dy, dw, dh);

    const link = document.createElement("a");
    link.download = `foto-${format}-${Date.now()}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
    toast.success("Imagem baixada!");
  };

  const { pw: previewW, ph: previewH } = getPreviewSize();
  const scalePercent = imgNatural.w > 0 ? Math.round((imgRect.w / previewW) * 100) : 100;

  // Handle visual indicators
  const handleDots = imageSrc ? [
    { key: "tl", x: imgRect.x, y: imgRect.y },
    { key: "tr", x: imgRect.x + imgRect.w, y: imgRect.y },
    { key: "bl", x: imgRect.x, y: imgRect.y + imgRect.h },
    { key: "br", x: imgRect.x + imgRect.w, y: imgRect.y + imgRect.h },
    { key: "t", x: imgRect.x + imgRect.w / 2, y: imgRect.y },
    { key: "b", x: imgRect.x + imgRect.w / 2, y: imgRect.y + imgRect.h },
    { key: "l", x: imgRect.x, y: imgRect.y + imgRect.h / 2 },
    { key: "r", x: imgRect.x + imgRect.w, y: imgRect.y + imgRect.h / 2 },
  ] : [];

  return (
    <div className="space-y-4">
      {/* Format selector */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-sm text-gray-400">Formato:</span>
        {(Object.keys(FORMATS) as Format[]).map((f) => (
          <button
            key={f}
            onClick={() => setFormat(f)}
            className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
              format === f
                ? "bg-purple-600 text-white"
                : "bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:border-purple-500/30"
            }`}
          >
            {FORMATS[f].label}
          </button>
        ))}
      </div>

      {/* Canvas area */}
      <div
        ref={containerRef}
        className="relative w-full bg-black/40 border-2 border-dashed border-white/10 rounded-2xl overflow-hidden flex items-center justify-center"
        style={{
          height: format === "stories" ? "70vh" : "50vh",
          cursor: imageSrc ? (dragging ? (resizeHandle ? getCursorStyle(resizeHandle) : "grabbing") : getCursorStyle(hoverHandle)) : "default",
        }}
        onWheel={onWheel}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onDrop={(e) => {
          e.preventDefault();
          if (e.dataTransfer.files?.[0]) loadImage(e.dataTransfer.files[0]);
        }}
        onDragOver={(e) => e.preventDefault()}
      >
        {!imageSrc ? (
          <div className="text-center p-8">
            <Upload className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 mb-2 text-sm">
              Arraste uma imagem, cole com <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-xs">Ctrl+V</kbd> ou clique para enviar
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 font-medium text-sm transition-all"
            >
              Escolher Arquivo
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.[0]) loadImage(e.target.files[0]);
              }}
            />
          </div>
        ) : (
          <div
            className="relative"
            style={{
              width: previewW,
              height: previewH,
              overflow: "hidden",
              background: "#000",
            }}
          >
            <img
              src={imageSrc}
              alt="Preview"
              draggable={false}
              style={{
                position: "absolute",
                left: imgRect.x,
                top: imgRect.y,
                width: imgRect.w,
                height: imgRect.h,
                maxWidth: "none",
                maxHeight: "none",
                pointerEvents: "none",
                userSelect: "none",
              }}
            />
            {/* Grid overlay */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundImage: `
                  linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)
                `,
                backgroundSize: `${previewW / 3}px ${previewH / 3}px`,
              }}
            />
            {/* Resize handles */}
            {handleDots.map((dot) => (
              <div
                key={dot.key}
                className="absolute pointer-events-none"
                style={{
                  left: dot.x - 5,
                  top: dot.y - 5,
                  width: 10,
                  height: 10,
                  borderRadius: dot.key.length === 2 ? "50%" : "2px",
                  background: hoverHandle === dot.key || resizeHandle === dot.key ? "#a855f7" : "rgba(255,255,255,0.6)",
                  border: "2px solid rgba(255,255,255,0.9)",
                  transition: "background 0.15s",
                }}
              />
            ))}
            {/* Border outline around image */}
            <div
              className="absolute pointer-events-none border border-white/30"
              style={{
                left: imgRect.x,
                top: imgRect.y,
                width: imgRect.w,
                height: imgRect.h,
              }}
            />
          </div>
        )}
      </div>

      {/* Controls */}
      {imageSrc && (
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2">
            <button onClick={() => zoomBy(0.9)} className="p-1 hover:text-purple-400 transition-colors">
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-xs text-gray-400 w-12 text-center">{scalePercent}%</span>
            <button onClick={() => zoomBy(1.1)} className="p-1 hover:text-purple-400 transition-colors">
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-gray-500 px-3 py-2">
            <Move className="w-3.5 h-3.5" /> Arraste para mover · Puxe os cantos para redimensionar
          </div>

          <button
            onClick={() => {
              setImageSrc(null);
              setImgRect({ x: 0, y: 0, w: 0, h: 0 });
            }}
            className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-gray-400 hover:text-white hover:border-red-500/30 transition-colors flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" /> Nova imagem
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-gray-400 hover:text-white hover:border-purple-500/30 transition-colors flex items-center gap-2"
          >
            <Upload className="w-4 h-4" /> Trocar
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.[0]) loadImage(e.target.files[0]);
            }}
          />

          <button
            onClick={handleDownload}
            className="ml-auto px-6 py-3 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 font-bold text-sm flex items-center gap-2 transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-green-600/25"
          >
            <Download className="w-4 h-4" /> Baixar {FORMATS[format].label}
          </button>
        </div>
      )}
    </div>
  );
};

export default ImageCropEditor;
