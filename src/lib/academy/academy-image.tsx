"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./academy-image.module.css";

type AcademyImageProps = { src: string; alt: string; mobileSrc?: string };

export function AcademyImage({ src, alt, mobileSrc }: AcademyImageProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const image = useRef<HTMLImageElement>(null);
  const [detailSrc, setDetailSrc] = useState(src);
  const [width, setWidth] = useState(1100);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, [open]);

  function enlarge() {
    setDetailSrc(image.current?.currentSrc || src);
    setWidth(Math.max(image.current?.naturalWidth || 1100, window.innerWidth * 2));
    dialog.current?.showModal();
    setOpen(true);
  }

  function close() {
    dialog.current?.close();
  }

  return (
    <figure className="academy-md-figure">
      <button type="button" onClick={enlarge} className={styles.trigger}
        aria-label={`View larger image: ${alt}`} title="View larger image">
        <picture>
          {mobileSrc ? <source media="(max-width: 650px)" srcSet={mobileSrc} /> : null}
          <img ref={image} src={src} alt={alt} className="h-auto w-full" />
        </picture>
      </button>
      <dialog ref={dialog} className={styles.dialog} aria-label="Enlarged lesson image"
        onClose={() => setOpen(false)}>
        <div className={styles.controls}>
          <button type="button" onClick={() => setWidth(value => Math.max(240, value / 1.5))}>Zoom out</button>
          <button type="button" onClick={() => setWidth(value => Math.min(6600, value * 1.5))}>Zoom in</button>
          <button type="button" onClick={close} autoFocus>Close</button>
        </div>
        <div className={styles.viewport} tabIndex={0} aria-label="Image detail. Scroll to see the enlarged image.">
          {open ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={detailSrc} alt={alt} className={styles.detail} style={{ width }} />
          ) : null}
        </div>
      </dialog>
    </figure>
  );
}
