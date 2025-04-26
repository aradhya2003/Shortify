import { useEffect, useRef } from 'react';

export default function QRCode({ url, className }: { url: string; className?: string }) {
  const qrRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    import('qrcode').then((QRCode) => {
      QRCode.toCanvas(url, { width: 150 }, (err, canvas) => {
        if (err || !qrRef.current) return;
        qrRef.current.innerHTML = '';
        qrRef.current.appendChild(canvas);
      });
    });
  }, [url]);

return <div ref={qrRef} className={className} />;
}