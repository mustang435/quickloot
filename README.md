# ⚡ QuickLoot.net - Price Comparison Website

> Compare prices from Canadian online stores. Find the best deals!

![QuickLoot](https://img.shields.io/badge/Next.js-14-black) ![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green) ![Vercel](https://img.shields.io/badge/Deploy-Vercel-blue)

## 🇨🇦 Features

- **Price Comparison** - Compare prices from Amazon.ca, Walmart, EB Games, Staples, Best Buy
- **Bilingual** - English & French (Quebec)
- **Auto Updates** - Vercel Cron Jobs every 3 hours
- **Admin Panel** - Easy product & price management
- **Secure** - JWT authentication, rate limiting, brute force protection

## 🚀 Quick Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/quickloot)

## 📋 Requirements

- MongoDB Atlas account (free tier works)
- Vercel account (free tier works)
- GitHub account

## 🔧 Setup

1. **Fork this repository**
2. **Create MongoDB Atlas database** (free)
3. **Deploy to Vercel**
4. **Add environment variables:**

```env
MONGO_URL=mongodb+srv://...
DB_NAME=quickloot
JWT_SECRET=your-secret-key
ADMIN_SESSION_HOURS=24
CRON_SECRET=your-cron-secret
```

5. **Access admin panel:** `your-site.vercel.app/admin/login`
6. **Default password:** `quickloot_strong_password_123!`

## 📖 Detailed Guide

See [KURULUM.md](./KURULUM.md) for step-by-step Turkish instructions.

## 🏗 Tech Stack

- **Frontend:** Next.js 14, React, Tailwind CSS
- **Backend:** Next.js API Routes
- **Database:** MongoDB Atlas
- **Hosting:** Vercel
- **Cron:** Vercel Cron Jobs

## 📁 Project Structure

```
/app
├── app/
│   ├── api/           # API routes
│   │   ├── cron/      # Vercel cron endpoint
│   │   └── [[...path]]/ # Catch-all API
│   ├── admin/         # Admin panel
│   ├── product/       # Product pages
│   └── page.js        # Homepage
├── components/        # React components
├── lib/
│   ├── auth.js        # Authentication
│   ├── db.js          # Database connection
│   └── scraper.js     # Price scraping
├── messages/          # i18n translations
└── vercel.json        # Cron configuration
```

## 🔐 Security Features

- JWT token authentication
- bcrypt password hashing
- Rate limiting (API & login)
- Brute force protection (3 attempts → 15 min lockout)
- Security headers (XSS, CSRF, Clickjacking)
- GDPR cookie consent

## 🛒 Supported Stores

- Amazon.ca
- Walmart Canada
- EB Games
- Staples Canada
- Best Buy Canada
- Newegg Canada
- Canada Computers
- Memory Express

## 📝 License

MIT

---

Made with ❤️ for Canadian shoppers
