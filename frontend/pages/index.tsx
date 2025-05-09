import { useState } from 'react';
import Head from 'next/head';
import UrlShortener from 'components/UrlShortener';
import AnalyticsDashboard from 'components/AnalyticsDashboard';
import styles from 'styles/UrlShortener.module.css';
export default function Home() {
  const [activeTab, setActiveTab] = useState('shortener');

  return (
    <>
      <Head>
        <title>Shortify | URL Management</title>
        <meta name="description" content="URL shortener and analytics" />
      </Head>

      <div className={styles.appContainer}>
        <header className={styles.header}>
          <h1>Shortify</h1>
          <p>Enterprise-grade URL management</p>
        </header>

        <nav className={styles.tabContainer}>
          <button
            className={`${styles.tab} ${activeTab === 'shortener' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('shortener')}
          >
            URL Shortener
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'analytics' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('analytics')}
          >
            Analytics
          </button>
        </nav>

        <main className={styles.mainContent}>
          {activeTab === 'shortener' ? <UrlShortener /> : <AnalyticsDashboard />}
        </main>

        <footer className={styles.footer}>
          <p>Need advanced analytics? <a href="#">Upgrade to Business</a></p>
        </footer>
      </div>
    </>
  );
}
