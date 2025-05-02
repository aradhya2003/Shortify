# LinkifyPro | Enterprise URL Shortener

LinkifyPro is an enterprise-grade URL shortener designed to provide high-performance link management. It allows users to shorten URLs, generate custom aliases, and track the performance of shortened links with built-in analytics. The application uses a responsive UI, QR code generation, and an easy-to-use dashboard for quick link management.

---

## Features
- **URL Shortening**: Shorten any long URL into a compact version.
- **Custom Alias**: Optionally create custom aliases for your URLs.
- **QR Code Generation**: Generate QR codes for your shortened links.
- **Clipboard Support**: Easy copy-to-clipboard functionality for shortened URLs.
- **Analytics Preview**: Display a preview of analytics (clicks, unique visitors, and countries).
- **Enterprise-Grade**: Designed for business use with future-proof scalability.

## Tech Stack
- **Frontend**: Next.js (React-based)
- **Backend**: API routes in Next.js (for URL shortening and analytics)
- **Database**: Supabase for storing URLs and analytics data
- **Caching**: Redis for fast data retrieval
- **QR Code Generation**: qrcode.react
- **Deployment**: Vercel for deployment

## Installation

### Prerequisites

Before you begin, ensure you have the following installed on your machine:

- Node.js (v14 or later)
- npm or yarn (npm recommended)

### Steps to Install Locally

1. Clone the repository:

    ```bash
    git clone https://github.com/aradhya2003/Shortify.git
    ```

2. Navigate to the `frontend` directory:

    ```bash
    cd Shortify/frontend
    ```

3. Install the dependencies:

    ```bash
    npm install
    ```

4. Set up environment variables. Create a `.env.local` file and add the following:

    ```env
    NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
    NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
    NEXT_PUBLIC_SUPABASE_KEY=<your-supabase-api-key>
    REDIS_URL=<your-redis-url>
    ```

    Replace the `<your-supabase-url>`, `<your-supabase-api-key>`, and `<your-redis-url>` with your actual credentials.

5. Run the app locally:

    ```bash
    npm run dev
    ```

6. Visit `http://localhost:3000` to see the application in action.

## Usage

1. **Enter a URL**: Paste a long URL into the input box.
2. **Custom Alias (Optional)**: Add a custom alias for your shortened link (optional).
3. **Shorten**: Click the "Shorten URL" button to get your shortened URL.
4. **Copy to Clipboard**: Use the copy button next to the shortened URL to copy it.
5. **Download QR Code**: Download the QR code associated with the shortened URL.
6. **View Analytics**: View the preview of total clicks, unique visitors, and countries for the shortened link.

## Analytics

The project also includes basic **click tracking** functionality (like total clicks, unique visitors, and countries). This data is stored in **Supabase** and can be accessed for detailed analytics on your URLs.

---

## Contributing

If you'd like to contribute to this project, feel free to fork the repository, make changes, and submit a pull request.

### Steps:
1. Fork the repo
2. Clone your fork:
    ```bash
    git clone <your-fork-url>
    ```
3. Create a new branch:
    ```bash
    git checkout -b feature/your-feature-name
    ```
4. Make changes, commit, and push to your branch
5. Submit a pull request

---

## License

This project is open-source and available under the MIT License.

---

## Acknowledgements

- **Next.js**: For building the frontend and API routes.
- **Supabase**: For handling the database and authentication.
- **Redis**: For caching data to improve performance.
- **QRCode.react**: For easy generation of QR codes.
