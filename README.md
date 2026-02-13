## SKIFF Admin

Internal moderation UI for listing and insurance reviews.

## Default dev login

When the API is seeded with `php artisan db:seed`, these credentials are created by `TestingUserSeeder` (unless overridden in API `.env`):

- Email: `admin@skiff.test`
- Password: `password`

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3001](http://localhost:3001) if you are using Docker Compose from the SKIFF hub repo.

You can also run directly in this repo and open [http://localhost:3000](http://localhost:3000).

## Docker (recommended with full infra)

From `/Users/raarevalo96/dev/skiff/infra/docker`:

```bash
docker compose up -d
```

This starts API + DB + Redis + Mailpit + Admin.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
