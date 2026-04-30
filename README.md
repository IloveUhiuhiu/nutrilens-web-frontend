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
