# Deploying Nectar to Vercel

Follow these simple steps to deploy your fullstack **Nectar** Next.js 16 + MongoDB application to **Vercel**:

---

## 1. Database Setup (MongoDB Atlas)
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and create a free or paid database cluster.
2. Under **Database Access**, create a user with read/write permissions.
3. Under **Network Access**, add `0.0.0.0/0` (allow access from anywhere) so Vercel serverless functions can connect.
4. Copy your connection string (`mongodb+srv://<username>:<password>@cluster.mongodb.net/foodappi?retryWrites=true&w=majority`).

---

## 2. Deploy to Vercel via Vercel Dashboard

1. Push your `next-foodappi` directory to a GitHub/GitLab repository.
2. Open [Vercel Dashboard](https://vercel.com/new).
3. Click **Import Project** and select your GitHub repository.
4. Set **Root Directory** to `next-foodappi` (or `./` if repository root is `next-foodappi`).
5. Under **Environment Variables**, add the following keys from `.env.example`:

| Key | Example Value |
| :--- | :--- |
| `MONGODB_URI` | `mongodb+srv://user:pass@cluster.mongodb.net/foodappi` |
| `JWT_SECRET` | `your_secret_jwt_key_here_minimum_32_chars` |
| `PAYSTACK_SECRET_KEY` | `sk_live_xxxx...` |
| `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` | `pk_live_xxxx...` |
| `NEXT_PUBLIC_APP_URL` | `https://your-nectar.vercel.app` |

6. Click **Deploy**. Vercel will automatically build and publish your application.

---

## 3. Deploy via Vercel CLI (Alternative)

Run the following commands in terminal:

```bash
cd next-foodappi
npx vercel
```

Follow the CLI prompts to complete deployment.
