import { useState, useRef, useEffect } from 'react';
import Head from 'next/head';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import { Copy, Download, Link2, BarChart2 } from 'react-feather';
import styles from '../styles/UrlShortener.module.css';

// ✅ Correct dynamic import for QRCodeCanvas
const QRCode = dynamic(() => import('qrcode.react').then(mod => mod.QRCodeCanvas), {
  ssr: false,
  loading: () => <div className={styles.qrPlaceholder}>Loading QR Code...</div>,
});

export default function Home() {
  const [url, setUrl] = useState('');
  const [shortUrl, setShortUrl] = useState('');
  const [customAlias, setCustomAlias] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const qrContainerRef = useRef<HTMLDivElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/shorten', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ longUrl: url, customAlias }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to shorten URL');

      setShortUrl(data.shortUrl);
      setCopied(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!shortUrl) return;
    navigator.clipboard.writeText(shortUrl)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => setError('Failed to copy to clipboard'));
  };

  const downloadQRCode = () => {
    if (!shortUrl) {
      setError('No shortened URL available');
      return;
    }

    const qrContainer = qrContainerRef.current;
    if (!qrContainer) {
      setError('QR Code container not found');
      return;
    }

    const canvas = qrContainer.querySelector('canvas');
    if (!canvas) {
      setError('QR Code not rendered yet. Please try again in a moment.');
      return;
    }

    try {
      const link = document.createElement('a');
      const filename = `didit-qr-${shortUrl.split('/').pop() || 'link'}.png`;

      link.download = filename;
      link.href = canvas.toDataURL('image/png');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      setError('Failed to generate download. Try right-clicking the QR code instead.');
      console.error('Download error:', err);
    }
  };

  return (
    <>
      <Head>
        <title>DIDITLIV | Enterprise URL Shortener</title>
        <meta name="description" content="High-performance link management" />
      </Head>

      <div className={styles.container}>
        <header className={styles.header}>
          <h1>DIDITLIV</h1>
          <p>Enterprise-grade URL management</p>
        </header>

        <main className={styles.mainCard}>
          {error && (
            <div className={styles.errorCard}>
              <div className={styles.errorIcon}>!</div>
              <p>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.inputGroup}>
              <label htmlFor="url">
                <Link2 size={18} />
                <span>Enter your long URL</span>
              </label>
              <input
                type="url"
                id="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com/very-long-url"
                required
              />
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="customAlias">
                <span>Custom alias (optional)</span>
              </label>
              <div className={styles.prefixedInput}>
                <span className={styles.prefix}>short.ly/</span>
                <input
                  type="text"
                  id="customAlias"
                  value={customAlias}
                  onChange={(e) => setCustomAlias(e.target.value)}
                  placeholder="your-brand"
                  pattern="[a-zA-Z0-9-]+"
                  title="Only letters, numbers and hyphens"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={styles.submitButton}
            >
              {isLoading ? <div className={styles.loadingSpinner}></div> : null}
              Shorten URL
            </button>
          </form>

          {shortUrl && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className={styles.resultCard}
            >
              <h3>
                <BarChart2 size={18} />
                <span>Your Shortened URL</span>
              </h3>

              <div className={styles.resultUrl}>
                <a href={shortUrl} target="_blank" rel="noopener noreferrer">
                  {shortUrl}
                </a>
                <button
                  onClick={copyToClipboard}
                  className={styles.copyButton}
                  aria-label="Copy to clipboard"
                >
                  <Copy size={16} />
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>

              <div className={styles.qrSection} ref={qrContainerRef}>
                <QRCode
                  value={shortUrl}
                  size={128}
                  level="H"
                  includeMargin
                />
                <button
                  onClick={downloadQRCode}
                  className={styles.qrButton}
                  disabled={!shortUrl}
                >
                  <Download size={16} />
                  Download QR Code
                </button>
              </div>

              <div className={styles.analyticsPreview}>
                <div className={styles.analyticsItem}>
                  <strong>0</strong>
                  <span>Total Clicks</span>
                </div>
                <div className={styles.analyticsItem}>
                  <strong>0</strong>
                  <span>Unique Visitors</span>
                </div>
                <div className={styles.analyticsItem}>
                  <strong>0</strong>
                  <span>Countries</span>
                </div>
              </div>
            </motion.div>
          )}
        </main>

        <footer className={styles.footer}>
          <p>Need advanced analytics? <a href="#">Upgrade to Business</a></p>
        </footer>
      </div>
    </>
  );
}
