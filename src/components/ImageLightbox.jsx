import { useCallback, useEffect, useState } from 'react';
import { RotateCcw, X, ZoomIn, ZoomOut } from 'lucide-react';

const MIN_ZOOM = 1;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.5;

function isPreviewableImage(target) {
  if (!(target instanceof HTMLImageElement)) return false;
  if (target.dataset.noZoom === 'true') return false;
  if (!target.currentSrc && !target.src) return false;

  const interactiveParent = target.closest('button, a, label, [role="button"]');
  if (interactiveParent && target.dataset.zoomable !== 'true') return false;

  return true;
}

export default function ImageLightbox() {
  const [image, setImage] = useState(null);
  const [zoom, setZoom] = useState(MIN_ZOOM);

  const close = useCallback(() => {
    setImage(null);
    setZoom(MIN_ZOOM);
  }, []);

  useEffect(() => {
    const handleImageClick = (event) => {
      const target = event.target;
      if (!isPreviewableImage(target)) return;

      setImage({
        src: target.currentSrc || target.src,
        alt: target.alt || 'Vista ampliada'
      });
      setZoom(MIN_ZOOM);
    };

    document.addEventListener('click', handleImageClick);
    return () => document.removeEventListener('click', handleImageClick);
  }, []);

  useEffect(() => {
    if (!image) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') close();
      if (event.key === '+') setZoom((value) => Math.min(MAX_ZOOM, value + ZOOM_STEP));
      if (event.key === '-') setZoom((value) => Math.max(MIN_ZOOM, value - ZOOM_STEP));
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [image, close]);

  if (!image) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col bg-black/95 text-white"
      role="dialog"
      aria-modal="true"
      aria-label={`Imagen ampliada: ${image.alt}`}
    >
      <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3 sm:px-6">
        <div className="min-w-0">
          <p className="truncate text-sm font-black sm:text-base">{image.alt}</p>
          <p className="text-[11px] font-semibold text-white/55">Pulsa fuera de la imagen o usa la X para cerrar.</p>
        </div>

        <button
          type="button"
          onClick={close}
          className="shrink-0 rounded-2xl bg-white/10 p-3 text-white hover:bg-white/20"
          aria-label="Cerrar imagen"
        >
          <X className="h-6 w-6" />
        </button>
      </div>

      <div
        className="min-h-0 flex-1 overflow-auto p-4 sm:p-6"
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) close();
        }}
      >
        <div className="flex min-h-full min-w-full items-center justify-center">
          <img
            src={image.src}
            alt={image.alt}
            data-no-zoom="true"
            draggable="false"
            onDoubleClick={() => setZoom((value) => (value === MIN_ZOOM ? 2 : MIN_ZOOM))}
            className="select-none rounded-2xl object-contain shadow-2xl transition-[width] duration-150"
            style={{
              width: zoom === MIN_ZOOM ? 'auto' : `${zoom * 90}vw`,
              maxWidth: zoom === MIN_ZOOM ? '94vw' : 'none',
              maxHeight: zoom === MIN_ZOOM ? '78vh' : 'none',
              touchAction: 'pinch-zoom'
            }}
          />
        </div>
      </div>

      <div className="flex items-center justify-center gap-2 border-t border-white/10 bg-black/70 px-4 py-3">
        <button
          type="button"
          onClick={() => setZoom((value) => Math.max(MIN_ZOOM, value - ZOOM_STEP))}
          disabled={zoom <= MIN_ZOOM}
          className="rounded-xl bg-white/10 p-3 text-white hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-35"
          aria-label="Reducir imagen"
        >
          <ZoomOut className="h-5 w-5" />
        </button>

        <button
          type="button"
          onClick={() => setZoom(MIN_ZOOM)}
          className="inline-flex min-w-24 items-center justify-center gap-2 rounded-xl bg-white/10 px-4 py-3 text-xs font-black hover:bg-white/20"
          aria-label="Restablecer tamaño"
        >
          <RotateCcw className="h-4 w-4" />
          {Math.round(zoom * 100)}%
        </button>

        <button
          type="button"
          onClick={() => setZoom((value) => Math.min(MAX_ZOOM, value + ZOOM_STEP))}
          disabled={zoom >= MAX_ZOOM}
          className="rounded-xl bg-white/10 p-3 text-white hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-35"
          aria-label="Ampliar imagen"
        >
          <ZoomIn className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
