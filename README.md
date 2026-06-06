# NutriLens Admin Web

React admin dashboard for NutriLens, built with Vite, TypeScript, Tailwind CSS, React Router, TanStack Query, Axios and a small shadcn-style internal component system.

## Design Notes

The admin UI is adapted from `nutrilens_health_nutrition_prototype.html` rather than copied directly from the mobile layout.

Extracted tokens from the mobile prototype:

- Font: Manrope
- Primary: `#006d36`
- Primary container: `#50c878`
- Background/surface: `#faf9f4`, `#ffffff`, `#efeee9`
- Text: `#1b1c19`, muted `#5d685e`
- Outline/border: `#d8ded4`
- Radius: 8-24px, translated to 12-16px admin panels and controls
- Icon style: clean filled/outlined product icons, implemented with `lucide-react`

Desktop adaptation:

- Real dashboard is the first authenticated screen.
- Persistent sidebar, dense data tables, action dialogs and detail pages.
- Green is used as the primary health color; amber is reserved for nutrition/energy and warnings.
- No decorative landing page or heavy gradients.

Figma access was not available in this environment. The local HTML prototype was used as the source of design tokens and visual direction.

## Backend Contract

Default API base:

```bash
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

The frontend expects the backend envelope used in `core/api.py`:

```json
{
  "status_code": 200,
  "message": "OK",
  "data": {},
  "errors": null
}
```

Auth:

- Login: `POST /accounts/login/`
- Refresh: `POST /accounts/token/refresh/`
- Profile: `GET /accounts/profile/`
- Logout: `POST /accounts/logout/`

Admin modules implemented:

- Dashboard: `/admin/reports/users/`, `/nutrition/`, `/inference/`, `/system-usage/`
- Accounts: list/detail/status/role/reset, activity levels CRUD, quota update
- Nutrition: foods, ingredients, advice rules, packaged foods CRUD
- Inference: jobs list/detail, metrics, feedback review
- Analysis: meals list/detail, logs list/detail

Note: backend currently exposes quota as `PUT /admin/accounts/quota/` only. There is no GET quota endpoint, so the Settings page avoids reading quota by sending a PUT on mount.

## Setup

```bash
cp .env.example .env
npm install
npm run dev
```

## Scripts

```bash
npm run lint
npm run build
npm run preview
```

## Environment

Create `.env`:

```bash
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

The backend root from this workspace is expected at:

```bash
/home/dngphclng/Code/nutrilens-backend
```

## CI/CD to EC2

The GitHub Actions workflow at `.github/workflows/deploy.yml` deploys the frontend in the same style as the backend: SSH into EC2, sync the `main` branch, install dependencies, and build the Vite app on the server.

### One-time EC2 setup

```bash
sudo apt update
sudo apt install -y nginx git curl

curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

mkdir -p ~/nutrilens-web-frontend
```

Create `~/nutrilens-web-frontend/.env` manually on EC2:

```bash
VITE_API_BASE_URL=https://api.yourdomain.com/api/v1
```

Create `/etc/nginx/sites-available/nutrilens-web-frontend`:

```nginx
server {
    listen 80;
    server_name YOUR_DOMAIN_OR_EC2_PUBLIC_IP;

    root /home/ubuntu/nutrilens-web-frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/nutrilens-web-frontend /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

### GitHub repository secrets

Add these in GitHub: `Settings` -> `Secrets and variables` -> `Actions`.

```text
SERVER_HOST=YOUR_EC2_PUBLIC_IP_OR_DOMAIN
SERVER_USER=ubuntu
SSH_PRIVATE_KEY=private key that can SSH to EC2
```

The workflow runs automatically on pushes to `main`.
