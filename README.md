# SkinLens: skin lesion classifier (HAM10000)

A web app that checks a dermoscopy image against 7 skin lesion types using an EfficientNetB3 model
trained on HAM10000. The model runs **in the browser** with TensorFlow.js. The **C# ASP.NET Core 8**
backend handles accounts and scan history.

```
skin-cancer-model/
├── model.json, group1-shard*.bin   TF.js model (EfficientNetB3, 300x300 input)
├── labels.json                     classes, risk levels, decision multipliers, test metrics
├── frontend/                       React + Vite + TensorFlow.js
└── backend/SkinScan.Api/           ASP.NET Core 8 Web API (C#), no NuGet packages needed
```

## Test results (1,441 held-out images)

| Metric | Value |
|---|---|
| Accuracy | 76.5% |
| Balanced accuracy | 0.705 |
| Melanoma recall | 0.548 |
| Macro AUC | 0.935 |

## Requirements

- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
- [Node.js 20+](https://nodejs.org)

## Run locally (development)

Two terminals:

```bash
# Terminal 1: backend on http://localhost:5080
cd backend/SkinScan.Api
dotnet run
```

```bash
# Terminal 2: frontend on http://localhost:5173 (proxies /api to the backend)
cd frontend
npm install
npm run dev
```

Open http://localhost:5173. `npm run dev` copies the model files from the repo root into
`frontend/public/model` automatically.

In Visual Studio you can open `backend/SkinScan.Api/SkinScan.Api.csproj` and press F5 instead of `dotnet run`.
`SkinScan.Api.http` has ready-made requests for every endpoint.

## Run as one app (production build)

```bash
cd frontend
npm install
npm run build:api          # builds React into backend/SkinScan.Api/wwwroot (incl. model files)
cd ../backend/SkinScan.Api
dotnet publish -c Release -o ../../publish
cd ../../publish
dotnet SkinScan.Api.dll --urls http://0.0.0.0:8080
```

The backend now serves the website, the model and the API from one URL.
Deploy the `publish` folder to **Azure App Service** (.NET 8, Linux or Windows) or any server with the .NET 8 runtime.

## API

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/api/health` | no | Health check |
| GET | `/api/model-info` | no | Returns `labels.json` |
| POST | `/api/auth/register` | no | `{name, email, password}` → `{accessToken, expiresIn, ...}` |
| POST | `/api/auth/login` | no | `{email, password}` → `{accessToken, ...}` |
| GET | `/api/auth/me` | yes | Current user |
| GET | `/api/scans` | yes | Your scans, newest first |
| GET | `/api/scans/stats` | yes | Counts per class, how many need review |
| GET | `/api/scans/{id}` | yes | One scan |
| POST | `/api/scans` | yes | Save a result |
| DELETE | `/api/scans/{id}` | yes | Delete a scan |

Send `Authorization: Bearer <accessToken>` for authenticated endpoints. Tokens last 7 days.

## How the pieces work

**Prediction (frontend, `src/lib/model.js`)**
1. Load `model.json` + shards once (22 MB, cached by the browser), warm up.
2. Read the image as RGB, bilinear resize to 300×300 (half-pixel centers, same as `tf.image.resize` in training).
3. Keep pixels as float32 0–255. Normalisation is inside the model.
4. `probs = model.predict(x)`, then `adjusted[i] = probs[i] * decision_multiplier[i]`, renormalise, take the highest.

Images never leave the browser. Only the result (and an optional 160 px thumbnail, if the user ticks the box) is saved.

**Backend (`backend/SkinScan.Api`)**
- Minimal APIs on ASP.NET Core 8, using only what ships with the framework:
  built-in bearer tokens, `PasswordHasher` (PBKDF2), rate limiting (10 auth requests/min per IP), ProblemDetails errors.
- Storage is behind `IAppStore`. The default `JsonFileStore` writes `data/skinscan-db.json` atomically.
  To use SQL Server, add EF Core and write an `EfAppStore : IAppStore`; endpoints do not change.
- Each user only sees their own scans. Scan data is validated (7 probabilities summing to 1,
  predicted class must be the highest, thumbnail size limit).

## Configuration

`backend/SkinScan.Api/appsettings.json`

| Key | Default | Meaning |
|---|---|---|
| `Storage:DataDirectory` | `data` | Where the database file and token keys are stored |
| `Model:LabelsPath` | `../../labels.json` | File served by `/api/model-info` |
| `Cors:AllowedOrigins` | `http://localhost:5173` | Add your frontend URL if hosted separately |

Frontend environment variables (create `frontend/.env`):

| Variable | Default | Meaning |
|---|---|---|
| `VITE_API_URL` | same origin | Backend URL if hosted separately, e.g. `https://skinlens-api.azurewebsites.net` |
| `VITE_MODEL_URL` | `/model/model.json` | Load the model from elsewhere, e.g. `https://raw.githubusercontent.com/saravanan778/skin-cancer-model/main/model.json` |

## Limitations

- Educational tool, not a medical device. It cannot diagnose skin cancer.
- Trained on dermoscopy images. Ordinary phone photos give unreliable results.
- Knows only 7 types. Misses about 4 in 10 melanomas.
- HAM10000 is mostly lighter skin tones; accuracy on darker skin is not well measured.
