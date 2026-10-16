"use client";

import { useEffect, useId, useRef, useState } from "react";
import {
  Camera,
  CheckCircle2,
  QrCode,
  ScanLine,
  SwitchCamera,
  X,
  Zap,
  ZapOff,
} from "lucide-react";

export function QrScanner({ onScan }: { onScan: (token: string) => void }) {
  const readerId = `qr-reader-${useId().replaceAll(":", "")}`;
  // Automatically open camera on phone
  const [active, setActive] = useState(true);
  const [cameraReady, setCameraReady] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [error, setError] = useState("");
  const [cameras, setCameras] = useState<Array<{ id: string; label: string }>>([]);
  const [currentCameraIdx, setCurrentCameraIdx] = useState(0);
  const [torchOn, setTorchOn] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);

  const delivered = useRef(false);
  const scannerRef = useRef<import("html5-qrcode").Html5Qrcode | null>(null);

  // Initialize and run the scanner
  useEffect(() => {
    if (!active) {
      setCameraReady(false);
      setTorchOn(false);
      return;
    }

    delivered.current = false;
    let disposed = false;
    let scannerInstance: import("html5-qrcode").Html5Qrcode | undefined;

    void import("html5-qrcode")
      .then(async ({ Html5Qrcode }) => {
        if (disposed) return;
        scannerInstance = new Html5Qrcode(readerId);
        scannerRef.current = scannerInstance;

        // Query available camera devices for switching on phone
        const availableCameras = await Html5Qrcode.getCameras().catch(() => []);
        if (disposed) return;
        setCameras(availableCameras);

        // Success handler with tactile vibration & feedback
        const onScanSuccess = (decodedText: string) => {
          if (delivered.current) return;
          delivered.current = true;

          // Haptic feedback on phone
          if (typeof navigator !== "undefined" && navigator.vibrate) {
            try {
              navigator.vibrate(120);
            } catch {
              // Ignore if unsupported
            }
          }

          setScanned(true);

          // Brief delay so user sees the verified state
          setTimeout(() => {
            onScan(decodedText);
            setActive(false);
          }, 450);
        };

        // Determine camera target (prefer back/environment camera initially)
        let cameraTarget: string | MediaTrackConstraints = {
          facingMode: "environment",
        };

        if (availableCameras.length > 0) {
          const validIdx = currentCameraIdx % availableCameras.length;
          // If first time and rear camera exists, choose rear camera
          if (currentCameraIdx === 0) {
            const rearIdx = availableCameras.findIndex((c) =>
              /back|rear|environment/i.test(c.label),
            );
            if (rearIdx !== -1) {
              setCurrentCameraIdx(rearIdx);
              cameraTarget = availableCameras[rearIdx].id;
            } else {
              cameraTarget = availableCameras[0].id;
            }
          } else {
            cameraTarget = availableCameras[validIdx].id;
          }
        }

        // Start video stream
        await scannerInstance.start(
          cameraTarget,
          {
            fps: 15,
            qrbox: { width: 220, height: 220 },
            aspectRatio: 1.0,
          },
          onScanSuccess,
          () => undefined,
        );

        if (!disposed) {
          setCameraReady(true);

          // Check if torch / flashlight is supported on this track
          try {
            const videoElem = document.querySelector(
              `#${readerId} video`,
            ) as HTMLVideoElement | null;
            const stream = videoElem?.srcObject as MediaStream | null;
            const track = stream?.getVideoTracks()[0];
            const capabilities = (track as any)?.getCapabilities?.();
            if (capabilities && "torch" in capabilities) {
              setTorchSupported(true);
            }
          } catch {
            setTorchSupported(false);
          }
        }
      })
      .catch((reason) => {
        setError(
          reason instanceof Error
            ? reason.message
            : "Camera permission denied or camera not available.",
        );
        setActive(false);
        setCameraReady(false);
      });

    return () => {
      disposed = true;
      if (scannerInstance?.isScanning) {
        void scannerInstance.stop().finally(() => scannerInstance?.clear());
      } else {
        scannerInstance?.clear();
      }
      scannerRef.current = null;
    };
  }, [active, onScan, readerId, currentCameraIdx]);

  // Toggle phone flashlight/torch
  const handleToggleTorch = async () => {
    try {
      const videoElem = document.querySelector(
        `#${readerId} video`,
      ) as HTMLVideoElement | null;
      const stream = videoElem?.srcObject as MediaStream | null;
      const track = stream?.getVideoTracks()[0];
      if (track) {
        const nextTorch = !torchOn;
        await (track as any).applyConstraints({
          advanced: [{ torch: nextTorch }],
        });
        setTorchOn(nextTorch);
      }
    } catch {
      setTorchOn(false);
    }
  };

  // Switch between front/back phone cameras
  const handleSwitchCamera = () => {
    if (cameras.length < 2) return;
    setCameraReady(false);
    setCurrentCameraIdx((prev) => (prev + 1) % cameras.length);
  };

  return (
    <div className="phone-qr-scanner" role="region" aria-label="QR Code Scanner">
      {active ? (
        <div className="phone-viewfinder-card">
          {/* Main camera viewport */}
          <div className="phone-camera-viewport">
            {/* Underlying html5-qrcode injected camera container */}
            <div id={readerId} className="phone-camera-feed" />

            {/* Loading state before camera renders */}
            {!cameraReady && !error && (
              <div className="phone-camera-loading">
                <Camera size={32} className="animate-pulse text-[#ffc72c]" />
                <span className="font-bold text-xs text-stone-200">
                  Opening camera...
                </span>
                <span className="text-[10px] text-stone-400">
                  Align QR code in view
                </span>
              </div>
            )}

            {/* Active overlay HUD when camera is live */}
            {cameraReady && (
              <>
                {/* Top overlay controls bar */}
                <div className="phone-hud-top-bar">
                  <div className="phone-live-indicator">
                    <span className="phone-pulse-dot" />
                    <span>Ready</span>
                  </div>

                  <div className="phone-hud-actions">
                    {/* Torch Toggle */}
                    {torchSupported && (
                      <button
                        type="button"
                        className={`phone-hud-icon-btn ${torchOn ? "active" : ""}`}
                        onClick={() => void handleToggleTorch()}
                        aria-label={torchOn ? "Turn off torch" : "Turn on torch"}
                        title={torchOn ? "Torch on" : "Torch off"}
                      >
                        {torchOn ? <Zap size={16} /> : <ZapOff size={16} />}
                      </button>
                    )}

                    {/* Camera Flip */}
                    {cameras.length > 1 && (
                      <button
                        type="button"
                        className="phone-hud-icon-btn"
                        onClick={handleSwitchCamera}
                        aria-label="Switch camera"
                        title="Flip camera"
                      >
                        <SwitchCamera size={16} />
                      </button>
                    )}

                    {/* Close / Pause Camera */}
                    <button
                      type="button"
                      className="phone-hud-icon-btn"
                      onClick={() => setActive(false)}
                      aria-label="Pause camera"
                      title="Pause"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>

                {/* Center scan target frame with semi-transparent mask outside */}
                <div className="phone-scan-frame-wrapper">
                  <div className="phone-scan-target-box">
                    {/* Laser scan line */}
                    {!scanned && <div className="phone-laser-line" />}

                    {/* Reticle corner brackets */}
                    <span className="phone-reticle-corner top-left" />
                    <span className="phone-reticle-corner top-right" />
                    <span className="phone-reticle-corner bottom-left" />
                    <span className="phone-reticle-corner bottom-right" />

                    {/* Successful scan flash */}
                    {scanned && (
                      <div className="phone-scan-success-anim">
                        <CheckCircle2 size={48} className="text-emerald-400" />
                        <span className="text-xs font-bold text-white mt-1">
                          Verified!
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom guidance pill */}
                <div className="phone-hud-bottom-bar">
                  <div className="phone-guidance-pill">
                    <ScanLine size={13} className="text-[#ffc72c]" />
                    <span>Point at helper’s QR code</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      ) : (
        /* Inactive / Paused State */
        <div className="phone-paused-card">
          <div className="phone-paused-icon">
            <QrCode size={36} className="text-stone-400" />
          </div>
          <div className="text-center">
            <div className="font-bold text-stone-900 text-sm">
              Camera is paused
            </div>
            <div className="text-xs text-stone-500 mt-0.5">
              Tap below to scan with your phone’s camera
            </div>
          </div>
          <button
            type="button"
            className="sdp-btn-gradient full-width"
            onClick={() => {
              setError("");
              setActive(true);
            }}
          >
            <Camera size={18} /> Resume camera scanner
          </button>
        </div>
      )}

      {/* Permission or device error banner */}
      {error && (
        <div
          className="sdp-error-banner flex items-center justify-between gap-2 text-xs"
          role="alert"
        >
          <span>{error}</span>
          <button
            type="button"
            className="underline font-bold text-red-700"
            onClick={() => {
              setError("");
              setActive(true);
            }}
          >
            Retry camera
          </button>
        </div>
      )}
    </div>
  );
}
