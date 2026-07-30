# 🌳 Canopy test images

Five synthetic canopy photos spanning open sky → dense canopy. The percentage
next to each is **what the deployed pipeline actually reports** for that file
(measured live, Otsu sky/leaf segmentation), so you have a known-answer set to
validate the ESP32-CAM and the backend against.

| Image | System canopy cover |
|-------|:------------------:|
| `canopy-open.jpg`       | **17%** |
| `canopy-sparse.jpg`     | **35%** |
| `canopy-medium.jpg`     | **56%** |
| `canopy-dense.jpg`      | **76%** |
| `canopy-very-dense.jpg` | **91%** |

## Two ways to test

### A. Test the backend + dashboard now (no hardware)
Simulate an ESP32-CAM capture — uploads an image through the *exact* same
`Storage → process-capture → dashboard` path the camera will use:

```bash
# PowerShell (Windows)
./samples/simulate-capture.ps1 samples/canopy-medium.jpg
```
```bash
# Git Bash / Linux / macOS
./samples/simulate-capture.sh samples/canopy-medium.jpg
```
Then watch it appear live on the dashboard. Credentials are read from
`web/.env.local` (nothing hardcoded). Delete the test row from the capture
detail view when done.

### B. Test the real ESP32-CAM (isolated)
1. Flash the firmware (see `../README.md`).
2. Open one of these images **fullscreen** on a monitor or phone.
3. Point the camera straight at it and press the capture button.
4. The LCD should read close to the value above.

> Real-world note: pointing a camera at a screen adds glare, angle and
> white-balance effects, so expect a few points of drift — that's the camera,
> not the algorithm. The direct-upload method (A) is the ground truth.
