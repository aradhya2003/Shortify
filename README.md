# Shortify | Enterprise URL Shortener

**Shortify** is an enterprise-grade URL shortener built for performance, scalability, and insights. It empowers users to shorten links, generate custom aliases and QR codes, and track detailed user analytics—including a real-time heatmap based on geographic activity.

---

## 🚀 Features

- **URL Shortening**: Instantly shorten long URLs into compact, shareable links.
- **Custom Alias**: Optionally assign a custom alias to personalize your short URL.
- **QR Code Generation**: Automatically generate downloadable QR codes for any shortened link.
- **Clipboard Support**: One-click copy for easy sharing.
- **Analytics Dashboard**:
  - Total Clicks
  - Unique Visitors
  - Top Countries
  - Referrer Tracking
  - Device Type, Browser, OS
  - ASN, ISP, Organization
  - **Geolocation Heatmap (Lat/Lng based)**
- **Enterprise-Grade Design**: Scalable, secure, and responsive—ideal for production use cases.

---

## 🧱 Tech Stack

- **Frontend**: [Next.js](https://nextjs.org/) (React)
- **Backend**: Next.js API Routes + FastAPI for redirection analytics
- **Database**: [Supabase](https://supabase.io/)
- **Caching**: Redis (for URL lookup and performance)
- **QR Code Generation**: `qrcode.react`
- **Deployment**: [Vercel](https://vercel.com/)

---

## 🔧 Installation

### Prerequisites

Make sure the following tools are installed:

- Node.js (v14 or later)
- npm (or yarn)
- Supabase account & Redis database

### Local Setup

1. **Clone the repository**:

    ```bash
    git clone https://github.com/aradhya2003/Shortify.git
    ```

2. **Navigate to the frontend directory**:

    ```bash
    cd Shortify/frontend
    ```

3. **Install dependencies**:

    ```bash
    npm install
    ```

4. **Configure environment variables**:

    Create a `.env.local` file:

    ```env
    NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
    NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
    NEXT_PUBLIC_SUPABASE_KEY=<your-supabase-api-key>
    REDIS_URL=<your-redis-url>
    ```

    Replace the placeholders with your actual credentials.

5. **Start the development server**:

    ```bash
    npm run dev
    ```

6. Visit [http://localhost:3000](http://localhost:3000) to launch the application.

---

## 🧑‍💻 Usage

1. **Paste a long URL** into the input box.
2. *(Optional)* **Set a custom alias** if desired.
3. Click **Shorten URL** to generate a new link.
4. Use the **copy** button to copy the shortened URL.
5. Click **Download QR** to get the QR code.
6. Access the **Analytics Dashboard** to see:
   - Click statistics
   - Referrers
   - Device, OS, browser stats
   - **Geolocation Heatmap** showing user activity on a map

---

## 📊 Analytics

Shortify tracks detailed link activity, including:

- **Total Clicks & Unique Visitors**
- **Country and City-level Traffic**
- **Browser & OS Versions**
- **Device Type (Desktop, Mobile, Tablet)**
- **IP, ASN, ISP, Organization**
- **Timezone and Postal Code**
- **Referring Source**
- **🗺 Heatmap**: Based on latitude and longitude data, a live heatmap shows the density of user traffic geographically.

All analytics data is stored securely in Supabase and captured during redirection via the backend API.

---

## 🤝 Contributing

We welcome all contributions!

### Steps:
1. Fork the repo
2. Clone your fork:

    ```bash
    git clone <your-fork-url>
    ```

3. Create a feature branch:

    ```bash
    git checkout -b feature/your-feature-name
    ```

4. Make changes and push:

    ```bash
    git commit -am "Your commit message"
    git push origin feature/your-feature-name
    ```

5. Open a Pull Request

---

## 📄 License

MIT License — feel free to use, modify, and distribute!

---

## 🙏 Acknowledgements

- **Next.js** — for powerful frontend and API routing
- **Supabase** — for real-time database and authentication
- **Redis** — for fast and scalable caching
- **QRCode.react** — for generating QR codes
- **Leaflet.js / Mapbox (optional)** — for heatmap rendering (if used)

---

> 🔥 Built with a focus on performance, privacy, and professional-grade analytics. Ideal for developers, marketers, and enterprises alike.
