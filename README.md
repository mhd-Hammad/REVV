# REVV 🏎️

**The Ultimate Automotive Experience** — An immersive hypercar showcase built entirely with vanilla web technologies.

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black)
![Three.js](https://img.shields.io/badge/Three.js-000000?style=flat&logo=threedotjs&logoColor=white)
![GSAP](https://img.shields.io/badge/GSAP-88CE02?style=flat&logo=greensock&logoColor=black)

---

## 📋 About

REVV is a premium frontend project that presents seven iconic hypercars through cinematic video experiences, interactive 3D models, scroll-driven animations, and a dark luxury UI. Designed as a portfolio piece that demonstrates advanced frontend capabilities without any frameworks or build tools.

---

## ✨ Features

- **Interactive 3D Models** — Rotate, zoom, and explore each car in full 360°
- **Drive Mode** — Simulated headlights, taillights, wheel spin, and engine vibration
- **Real-time Color Customization** — Change car paint colors on the 3D model
- **Cinematic Scroll Animations** — GSAP-powered transitions between sections
- **Performance Specs** — Dynamic data tables for each hypercar
- **Brand-Aware UI** — Navbar and elements adapt their accent color per car brand
- **Glassmorphism Design** — Frosted glass panels with backdrop blur effects
- **Page Transitions** — Animated brand logo overlays when navigating between pages
- **Fully Responsive** — Optimized for desktop, tablet, and mobile
- **Splash Screen** — Chrome logo assembly animation on entry

---

## 🚗 Featured Cars

| Brand | Model | Highlight |
|-------|-------|-----------|
| Ferrari | SF90 Stradale | V8 Hybrid — 735 kW |
| Lamborghini | Revuelto | V12 Hybrid — 757 kW |
| Bugatti | Chiron | W16 Quad-Turbo — 1,103 kW |
| Rimac | Nevera | Quad Electric — 1,427 kW |
| Porsche | 911 GT3 RS | Flat-6 NA — 386 kW |
| McLaren | P1 | V8 Hybrid — 674 kW |
| Pagani | Huayra R | V12 NA — 634 kW |

---

## 🛠️ Tech Stack

| Technology | Purpose |
|-----------|---------|
| HTML5 | Semantic structure |
| CSS3 | Styling, animations, glassmorphism, responsive design |
| JavaScript | Interactivity, DOM manipulation, event handling |
| Three.js | 3D model rendering (GLB/GLTF) |
| GSAP + ScrollTrigger | Scroll-based animations and transitions |
| Lenis | Smooth scrolling (Bugatti page) |

No frameworks. No build tools. No dependencies beyond CDN libraries.

---

## 🚀 How to Run

```bash
# Clone the repository
git clone https://github.com/your-username/revv.git

# Navigate to the project
cd revv

# Open in browser
# Option 1: Open index.html directly (splash screen)
# Option 2: Use a local server (recommended for video/3D assets)
npx serve .
```

> **Note:** A local server is recommended since the project uses video files and 3D models that require HTTP serving.

---

## 📸 Screenshots

<!-- Add your screenshots here -->

| Landing Page 
|:---:|:---:|:---:|
| *![landing page](image.png)* 
| Car Detail (360°) Drive Mode |
![360](image-1.png)

| Performance Specs |
![performance](image-2.png)


 Mobile View |
 ![mobile responsiveness](image-3.png)

 Page Transition |
![landing to specific page ](image-4.png)
![specific to landing page](image-5.png)

---

## 🌐 Live Demo

<!-- Add your deployment link here -->

🔗 **[View Live Demo](#)** *[](https://revv-hypercars.netlify.app/)*

---

## 📁 Project Structure

```
REVV/
├── index.html           # Splash/intro screen (entry point)
├── home.html            # Landing page (car collection)
├── script.js            # Landing page logic
├── style.css            # Landing page styles
│
├── assets/
│   ├── videos/          # MP4 video files
│   ├── images/          # SVG, PNG, JPG, AVIF, WebP
│   └── models/          # GLB 3D models
│
├── pages/               # Individual car detail pages
│   ├── bugatti-chiron.html
│   ├── ferrari-sf90.html
│   ├── lamborghini-revuelto.html
│   ├── mclaren-p1.html
│   ├── pagani-huayra.html
│   ├── porsche-911.html
│   └── rimac-nevera.html
│
└── css/                 # Car page stylesheets
    ├── bugatti-chiron.css
    ├── ferrari-sf90.css
    ├── lamborghini-revuelto.css
    ├── mclaren-p1.css
    ├── pagani-huayra.css
    ├── porsche-911.css
    └── rimac-nevera.css
```

---

## 📝 License

This project is built for educational and portfolio purposes.  
Car brands, logos, and media are property of their respective owners.

---

<p align="center">
  <strong>REVV</strong> — Crafted with precision and passion for automotive excellence.
</p>

