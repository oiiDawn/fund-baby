export function isBrowserDocumentReady(): boolean {
  return typeof document !== 'undefined' && !!document.body;
}

export function loadBrowserScript(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!isBrowserDocumentReady()) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = url;
    script.async = true;

    function cleanup() {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    }

    script.onload = () => {
      cleanup();
      resolve();
    };

    script.onerror = () => {
      cleanup();
      reject(new Error('数据加载失败'));
    };

    document.body.appendChild(script);
  });
}
