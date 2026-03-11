import React, { useEffect, useRef, useState } from 'react';
import { Download, Copy, Check } from 'lucide-react';
import { useBuilderStore } from '../hooks/useBuilderStore';

const QRCodeGenerator: React.FC = () => {
  const { siteData, profileUsername } = useBuilderStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [copied, setCopied] = useState(false);
  const [qrAvailable, setQrAvailable] = useState(false);
  const [color, setColor] = useState('#000000');
  const [bgColor, setBgColor] = useState('#ffffff');

  const profileUrl = `https://tap.bio/${profileUsername || siteData.name.toLowerCase().replace(/\s/g, '')}`;

  useEffect(() => {
    let cancelled = false;
    // @ts-ignore - qrcode is an optional dependency
    import('qrcode')
      .then((QRCode: any) => {
        if (cancelled) return;
        setQrAvailable(true);
        if (canvasRef.current) {
          QRCode.toCanvas(canvasRef.current, profileUrl, {
            width: 200,
            margin: 2,
            color: { dark: color, light: bgColor },
          });
        }
      })
      .catch(() => {
        setQrAvailable(false);
      });
    return () => { cancelled = true; };
  }, [profileUrl, color, bgColor]);

  const handleDownload = () => {
    if (!canvasRef.current) return;
    const link = document.createElement('a');
    link.download = `${siteData.name || 'tap'}-qr.png`;
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
  };

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(profileUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">QR Code</h3>

      <div className="flex flex-col items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
        {qrAvailable ? (
          <canvas ref={canvasRef} className="rounded-lg" role="img" aria-label={`QR code for ${profileUrl}`} />
        ) : (
          <div className="w-[200px] h-[200px] bg-white rounded-lg border-2 border-dashed border-slate-200 flex items-center justify-center">
            <div className="text-center px-4">
              <p className="text-xs text-slate-400 mb-1">QR code is not available yet.</p>
              <p className="text-[10px] text-slate-400">You can still copy and share your link below.</p>
            </div>
          </div>
        )}

        <div className="text-xs text-slate-500 font-mono text-center break-all">{profileUrl}</div>

        {/* Color customization */}
        {qrAvailable && (
          <div className="flex gap-4 w-full">
            <div className="flex-1">
              <label htmlFor="qr-fg-color" className="block text-[10px] font-medium text-slate-500 mb-1">QR Color</label>
              <input id="qr-fg-color" type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-full h-8 rounded cursor-pointer border border-slate-200" />
            </div>
            <div className="flex-1">
              <label htmlFor="qr-bg-color" className="block text-[10px] font-medium text-slate-500 mb-1">Background</label>
              <input id="qr-bg-color" type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="w-full h-8 rounded cursor-pointer border border-slate-200" />
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 w-full">
          {qrAvailable && (
            <button onClick={handleDownload} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-ink text-white rounded-lg text-xs font-medium hover:bg-ink/90">
              <Download size={12} /> Download PNG
            </button>
          )}
          <button onClick={handleCopyLink} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50">
            {copied ? <><Check size={12} /> <span aria-live="polite">Copied!</span></> : <><Copy size={12} /> Copy Link</>}
          </button>
        </div>
      </div>
    </div>
  );
};

export default QRCodeGenerator;
