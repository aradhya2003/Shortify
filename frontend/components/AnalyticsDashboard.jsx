import { useState } from "react";
import dynamic from "next/dynamic";
import styles from "styles/AnalyticsDashboard.module.css";

const Heatmap = dynamic(() => import("./Heatmap"), {
  ssr: false,
  loading: () => <div className={styles.mapLoading}>Loading heatmap...</div>,
});
const countryCodeMap = {
  India: "in",
  Brazil: "br",
  Canada: "ca",
  Japan: "jp",
  Australia: "au",
  Germany: "de",
  "United Kingdom": "gb",
  "United States": "us",
  France: "fr",
  Russia: "ru",
  // Add more as needed
};

export default function AnalyticsDashboard() {
  const [urlCode, setUrlCode] = useState("");
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchAnalytics = async () => {
    if (!urlCode.trim()) return;

    try {
      setLoading(true);
      setError(null);

      // Replace with your actual API endpoint
      const response = await fetch(
        `http://localhost:8000/api/analytics/${urlCode}`
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 404) {
          setError("No analytics found for this short URL.");
        } else {
          setError(errorData.detail || "Failed to load analytics");
        }
        return;
      }
      
      const data = await response.json();

      // Process data to ensure consistent structure
      const processedData = {
        ...data,
        // Ensure locations have count property
        locations:
          data.locations?.map((loc) => ({
            ...loc,
            count: loc.count || 1,
          })) || [],
        // Clean referrer domains
        referrers:
          data.referrers?.map((ref) => ({
            ...ref,
            domain: ref.domain.replace(/^https?:\/\//, ""),
          })) || [],
      };

      setAnalytics(processedData);
    } catch (err) {
      console.error("Failed to fetch analytics:", err);
      setError(err.message || "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    fetchAnalytics();
  };

  // Format date consistently
  const formatDate = (timestamp) => {
    if (!timestamp) return "Unknown";
    try {
      return new Date(timestamp).toLocaleString();
    } catch {
      return "Invalid date";
    }
  };

  return (
    <div className={styles.dashboard}>
      <div className={styles.dashboardHeader}>
        <h1>URL Analytics Dashboard</h1>
        <form onSubmit={handleSubmit} className={styles.searchForm}>
          <input
            type="text"
            value={urlCode}
            onChange={(e) => setUrlCode(e.target.value)}
            placeholder="Enter short URL code"
            className={styles.searchFormInput}
            required
          />
          <button
            type="submit"
            disabled={loading}
            className={styles.searchFormButton}
          >
            {loading ? (
              <>
                <span className={styles.loadingSpinner} />
                Loading...
              </>
            ) : (
              "Get Analytics"
            )}
          </button>
        </form>
      </div>

      {loading && (
        <div className={styles.loadingOverlay}>
          <div className={styles.loadingSpinner} />
          <p>Fetching analytics data...</p>
        </div>
      )}

      {error && (
        <div className={styles.errorMessage}>
          <p>{error}</p>
          <button onClick={() => setError(null)} className={styles.errorButton}>
            Dismiss
          </button>
        </div>
      )}

      {analytics && (
        <div className={styles.analyticsData}>
          {/* Summary Cards */}
          <div className={styles.summaryCards}>
            <div className={styles.summaryCard}>
              <h3>Total Clicks</h3>
              <p>{analytics.total_clicks?.toLocaleString() || "0"}</p>
            </div>
            <div className={styles.summaryCard}>
              <h3>Unique Visitors</h3>
              <p>{analytics.unique_visitors?.toLocaleString() || "0"}</p>
            </div>
            <div className={styles.summaryCard}>
              <h3>Top Country</h3>
              <p>{analytics.top_country || "N/A"}</p>
            </div>
          </div>

          {/* Map Visualization */}
          <div className={styles.mapContainer}>
            <h2 className={styles.sectionTitle}>Visitor Locations</h2>
            <Heatmap locations={analytics.locations} />
          </div>

          {/* Referrers Table */}
          <div className={styles.analyticsTableContainer}>
            <h2 className={styles.sectionTitle}>Top Referrers</h2>
            <table className={styles.analyticsTable}>
              <thead>
                <tr>
                  <th className={styles.analyticsTableHeader}>Source</th>
                  <th className={styles.analyticsTableHeader}>Clicks</th>
                </tr>
              </thead>
              <tbody>
                {analytics.referrers?.map((ref, i) => (
                  <tr key={i} className={styles.analyticsTableRow}>
                    <td className={styles.analyticsTableCell}>
                      <a
                        href={`https://${ref.domain}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.link}
                      >
                        {ref.domain}
                      </a>
                    </td>
                    <td className={styles.analyticsTableCell}>
                      {ref.count?.toLocaleString() || "0"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Recent Activity */}
          <div className={styles.analyticsTableContainer}>
            <h2 className={styles.sectionTitle}>Recent Activity</h2>
            <table className={styles.analyticsTable}>
              <thead>
                <tr>
                  <th className={styles.analyticsTableHeader}>Country</th>
                  <th className={styles.analyticsTableHeader}>City</th>
                  {/* <th className={styles.analyticsTableHeader}>Time</th> */}
                </tr>
              </thead>
              <tbody>
                {analytics.locations?.slice(0, 10).map((loc, i) => (
                  <tr key={i} className={styles.analyticsTableRow}>
                    <td className={styles.analyticsTableCell}>
                      {loc.country && (
                        <>
                          <img
                            src={`https://flagcdn.com/16x12/${
                              countryCodeMap[loc.country] || "un"
                            }.png`}
                            alt={loc.country}
                            className={styles.flag}
                          />
                          {loc.country}
                        </>
                      )}
                    </td>
                    <td className={styles.analyticsTableCell}>
                      {loc.city || "Unknown"}
                    </td>
                    {/* <td className={styles.analyticsTableCell}>
                      {formatDate(loc.timestamp)}
                    </td> */}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
