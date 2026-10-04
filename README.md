# PLANTIX

PLANTIX is a mobile-first plant-health web app with a React/Vite frontend and a FastAPI backend. It provides single-image upload or browser-camera capture, locally persisted scan reports, a dashboard, multilingual UI, and PDF downloads.

## Important model status

The included API defaults to an **explicit demo provider** so the complete interface can be exercised. Its example Tomato / Early blight output is fixed demonstration content; it does not classify the uploaded photo and must not be used to make crop-treatment decisions. Every demo result is labelled in the UI and in the API response.

To connect real inference, implement validated `PlantDetector` and `DiseaseClassifier` adapters in `backend/services/`, then run with `PLANTIX_PROVIDER=model`. Until both adapters are configured, model mode returns an explicit HTTP 503 instead of presenting example output as a real prediction. No trained model or dataset is bundled. Consequently, PLANTIX makes no claims about model accuracy, supported crop classes, dataset licensing, or training methodology.

## Requirements

- Node.js 20.19+ or 22.12+
- Python 3.10+
- A modern browser; camera access requires HTTPS or localhost and user permission

## Install and run on Windows PowerShell

From the project root:

```powershell
npm install
py -3.11 -m venv backend\.venv
backend\.venv\Scripts\python.exe -m pip install -r backend\requirements.txt
```

Start the API in one terminal:

```powershell
backend\.venv\Scripts\python.exe -m uvicorn main:app --app-dir backend --reload --host 127.0.0.1 --port 8000
```

Start the web app in another terminal:

```powershell
npm run dev
```

Open the Vite URL printed in the terminal (normally `http://localhost:5173`). The frontend defaults to the API at `http://localhost:8000`. To use another API URL, set `VITE_API_URL` before starting Vite.

## Open the app on a phone

To use the app from a phone on the same Wi-Fi network as the development computer:

1. Find the computer's Wi-Fi IPv4 address with `ipconfig` (for example, `192.168.1.25`). Use that address in the commands below, not `localhost`.
2. In the API terminal, allow the phone's frontend origin and bind the API to the network:

   ```powershell
   $env:PLANTIX_ALLOWED_ORIGINS = "http://localhost:5173,http://127.0.0.1:5173,http://192.168.1.25:5173"
   backend\.venv\Scripts\python.exe -m uvicorn main:app --app-dir backend --reload --host 0.0.0.0 --port 8000
   ```

3. In the frontend terminal, point the app at the computer's API address and start Vite:

   ```powershell
   $env:VITE_API_URL = "http://192.168.1.25:8000"
   npm run dev
   ```

4. On the phone, open `http://192.168.1.25:5173`. Replace both example IP addresses with the computer's actual Wi-Fi IPv4 address. Keep both terminals running, connect the phone to the same Wi-Fi, and allow Node.js and Python through Windows Firewall on private networks if prompted. The camera option uses the phone's native photo capture when live camera access is unavailable; live preview requires browser permission and HTTPS outside localhost.

## Test and build

```powershell
backend\.venv\Scripts\python.exe -m pytest backend\tests
npm run build
```

## Deployment

- **Frontend:** build with `npm run build`; deploy the generated `dist` directory to Vercel. The included `vercel.json` rewrites app routes to the SPA entry point. Set `VITE_API_URL` to the deployed API origin at build time.
- **Backend:** deploy `backend` on Render with build command `pip install -r requirements.txt` and start command `uvicorn main:app --host 0.0.0.0 --port $PORT`. Set `PLANTIX_ALLOWED_ORIGINS` to the exact frontend origin. Keep the provider in demo mode only for demonstrations; connect and validate a real model before production agricultural use.

History is held in IndexedDB in the current browser/device. It does not sync between devices. The history repository is isolated in `src/history.ts` for later server/database migration.

## Privacy and safety

Images are sent to the configured PLANTIX API only after the user explicitly starts analysis. The included API does not save uploaded images. Reports and compressed thumbnails are saved locally in browser IndexedDB. Clear scan history in the History screen to delete local records.

PLANTIX offers AI-assisted identification and general information, not a confirmed diagnosis or a substitute for a qualified local agricultural professional. Fertilizer selection and dosage require crop, growth-stage, soil-test, local guidance, and product-label context. The app does not prescribe pesticide treatments.
