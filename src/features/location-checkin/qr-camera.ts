export interface QrCamera {
  start(onDecode: (text: string) => void): Promise<void>;
  stop(): Promise<void>;
  clear(): void;
}

interface QrCameraCallbacks {
  parse: (text: string) => string | null;
  onScan: (tableId: string) => void;
  onReady: () => void;
  onInvalid: () => void;
  onError: (error: unknown) => void;
}

/** Serialize startup, decoding and shutdown, including cancellation during permission prompts. */
export function runQrCamera(createCamera: () => Promise<QrCamera>, callbacks: QrCameraCallbacks) {
  let camera: QrCamera | null = null;
  let disposed = false;
  let accepted = false;
  let release: Promise<void> | null = null;

  const startup = Promise.resolve().then(async () => {
    if (disposed) return;
    camera = await createCamera();
    if (disposed) return;
    await camera.start((text) => {
      if (disposed || accepted) return;
      const tableId = callbacks.parse(text);
      if (!tableId) {
        callbacks.onInvalid();
        return;
      }
      accepted = true;
      void cleanup().then(() => {
        if (!disposed) callbacks.onScan(tableId);
      }).catch((error: unknown) => {
        if (!disposed) callbacks.onError(error);
      });
    });
    if (!disposed && !accepted) callbacks.onReady();
  });

  function cleanup(): Promise<void> {
    release ??= startup.catch(() => {}).then(async () => {
      if (!camera) return;
      try {
        await camera.stop();
      } finally {
        camera.clear();
        camera = null;
      }
    });
    return release;
  }

  void startup.catch(async (error: unknown) => {
    try {
      await cleanup();
    } finally {
      if (!disposed) callbacks.onError(error);
    }
  }).catch(() => {});

  return {
    stop(): Promise<void> {
      disposed = true;
      return cleanup();
    },
  };
}
