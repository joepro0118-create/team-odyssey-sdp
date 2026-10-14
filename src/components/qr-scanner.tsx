"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Camera, X } from "lucide-react";

export function QrScanner({ onScan }: { onScan: (token: string) => void }) {
  const readerId = `qr-reader-${useId().replaceAll(":", "")}`;
  const [active, setActive] = useState(false);
  const [error, setError] = useState("");
  const delivered = useRef(false);

  useEffect(() => {
    if (!active) return;
    delivered.current = false;
    let disposed = false;
    let scanner: import("html5-qrcode").Html5Qrcode | undefined;

    void import("html5-qrcode")
      .then(async ({ Html5Qrcode }) => {
        if (disposed) return;
        scanner = new Html5Qrcode(readerId);
        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 230, height: 230 } },
          (decodedText) => {
            if (delivered.current) return;
            delivered.current = true;
            onScan(decodedText);
            setActive(false);
          },
          () => undefined,
        );
      })
      .catch((reason) => {
        setError(
          reason instanceof Error
            ? reason.message
            : "The camera could not be opened.",
        );
        setActive(false);
      });

    return () => {
      disposed = true;
      if (scanner?.isScanning) void scanner.stop().finally(() => scanner?.clear());
      else scanner?.clear();
    };
  }, [active, onScan, readerId]);

  return (
    <div className="qr-scanner">
      {active ? (
        <>
          <div id={readerId} className="qr-reader" />
          <button className="secondary-button" onClick={() => setActive(false)}>
            <X size={17} /> Stop camera
          </button>
        </>
      ) : (
        <button className="secondary-button" onClick={() => { setError(""); setActive(true); }}>
          <Camera size={18} /> Scan QR with camera
        </button>
      )}
      {error && <p className="error-box" role="alert">{error}</p>}
    </div>
  );
}
