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

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/analytics/${urlCode}`
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

      // Clean referrers domains and ensure count exists
      const cleanedReferrers = (data.by_referrer || []).map((ref) => ({
        domain: ref.referrer ? ref.referrer.replace(/^https?:\/\//, "") : "Direct",
        count: ref.count || 1,
      }));

      setAnalytics({
        ...data,
        referrers: cleanedReferrers,
      });
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
        <h1>Analytics Dashboard</h1>
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
              <p>{analytics.by_country?.[0]?.country || "N/A"}</p>
            </div>
          </div>

          {/* Map Visualization */}
          <div className={styles.mapContainer}>
            <h2 className={styles.sectionTitle}>Visitor Locations</h2>
            <Heatmap locations={analytics.by_city || []} />
          </div>

          {/* Device Types */}
          <div className={styles.analyticsTableContainer}>
            <h2 className={styles.sectionTitle}>Device Types</h2>
            <table className={styles.analyticsTable}>
              <thead>
                <tr>
                  <th>Device Type</th>
                  <th>Count</th>
                </tr>
              </thead>
              <tbody>
                {analytics.by_device_type?.map((d, i) => (
                  <tr key={i}>
                    <td>{d.device_type}</td>
                    <td>{d.count.toLocaleString()}</td>
                  </tr>
                )) || (
                  <tr><td colSpan={2}>No data</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* OS */}
          <div className={styles.analyticsTableContainer}>
            <h2 className={styles.sectionTitle}>Operating Systems</h2>
            <table className={styles.analyticsTable}>
              <thead>
                <tr>
                  <th>OS Name</th>
                  <th>Version</th>
                  <th>Count</th>
                </tr>
              </thead>
              <tbody>
                {analytics.by_os?.map((os, i) => (
                  <tr key={i}>
                    <td>{os.os_name}</td>
                    <td>{os.os_version}</td>
                    <td>{os.count.toLocaleString()}</td>
                  </tr>
                )) || (
                  <tr><td colSpan={3}>No data</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Browsers */}
          <div className={styles.analyticsTableContainer}>
            <h2 className={styles.sectionTitle}>Browsers</h2>
            <table className={styles.analyticsTable}>
              <thead>
                <tr>
                  <th>Browser</th>
                  <th>Version</th>
                  <th>Count</th>
                </tr>
              </thead>
              <tbody>
                {analytics.by_browser?.map((b, i) => (
                  <tr key={i}>
                    <td>{b.browser_name}</td>
                    <td>{b.browser_version}</td>
                    <td>{b.count.toLocaleString()}</td>
                  </tr>
                )) || (
                  <tr><td colSpan={3}>No data</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* ASN */}
          <div className={styles.analyticsTableContainer}>
            <h2 className={styles.sectionTitle}>ASN</h2>
            <table className={styles.analyticsTable}>
              <thead>
                <tr>
                  <th>ASN</th>
                  <th>Count</th>
                </tr>
              </thead>
              <tbody>
                {analytics.by_asn?.map((asn, i) => (
                  <tr key={i}>
                    <td>{asn.asn}</td>
                    <td>{asn.count.toLocaleString()}</td>
                  </tr>
                )) || (
                  <tr><td colSpan={2}>No data</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* ISP */}
          <div className={styles.analyticsTableContainer}>
            <h2 className={styles.sectionTitle}>Internet Service Providers (ISP)</h2>
            <table className={styles.analyticsTable}>
              <thead>
                <tr>
                  <th>ISP</th>
                  <th>Count</th>
                </tr>
              </thead>
              <tbody>
                {analytics.by_isp?.map((isp, i) => (
                  <tr key={i}>
                    <td>{isp.isp}</td>
                    <td>{isp.count.toLocaleString()}</td>
                  </tr>
                )) || (
                  <tr><td colSpan={2}>No data</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Organizations */}
          <div className={styles.analyticsTableContainer}>
            <h2 className={styles.sectionTitle}>Organizations</h2>
            <table className={styles.analyticsTable}>
              <thead>
                <tr>
                  <th>Organization</th>
                  <th>Count</th>
                </tr>
              </thead>
              <tbody>
                {analytics.by_organization?.map((org, i) => (
                  <tr key={i}>
                    <td>{org.organization}</td>
                    <td>{org.count.toLocaleString()}</td>
                  </tr>
                )) || (
                  <tr><td colSpan={2}>No data</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Timezones */}
          <div className={styles.analyticsTableContainer}>
            <h2 className={styles.sectionTitle}>Timezones</h2>
            <table className={styles.analyticsTable}>
              <thead>
                <tr>
                  <th>Timezone</th>
                  <th>Count</th>
                </tr>
              </thead>
              <tbody>
                {analytics.by_timezone?.map((tz, i) => (
                  <tr key={i}>
                    <td>{tz.timezone}</td>
                    <td>{tz.count.toLocaleString()}</td>
                  </tr>
                )) || (
                  <tr><td colSpan={2}>No data</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Postal Codes */}
          <div className={styles.analyticsTableContainer}>
            <h2 className={styles.sectionTitle}>Postal Codes</h2>
            <table className={styles.analyticsTable}>
              <thead>
                <tr>
                  <th>Postal Code</th>
                  <th>Count</th>
                  <th>Latitude</th>
                  <th>Longitude</th>
                </tr>
              </thead>
              <tbody>
                {analytics.by_postal_code?.map((pc, i) => (
                  <tr key={i}>
                    <td>{pc.postal_code}</td>
                    <td>{pc.count.toLocaleString()}</td>
                    <td>{pc.latitude}</td>
                    <td>{pc.longitude}</td>
                  </tr>
                )) || (
                  <tr><td colSpan={4}>No data</td></tr>
                )}
              </tbody>
            </table>
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
                      {ref.domain === "Direct" ? (
                        "Direct / None"
                      ) : (
                        <a
                          href={`https://${ref.domain}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.link}
                        >
                          {ref.domain}
                        </a>
                      )}
                    </td>
                    <td className={styles.analyticsTableCell}>
                      {ref.count?.toLocaleString() || "0"}
                    </td>
                  </tr>
                )) || (
                  <tr>
                    <td colSpan={2}>No referrer data</td>
                  </tr>
                )}
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
                  <th className={styles.analyticsTableHeader}>Time</th>
                </tr>
              </thead>
              <tbody>
                {analytics.recent_activity?.slice(0, 10).map((loc, i) => (
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
                    <td className={styles.analyticsTableCell}>
                      {formatDate(loc.timestamp)}
                    </td>
                  </tr>
                )) || (
                  <tr>
                    <td colSpan={3}>No recent activity data</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
