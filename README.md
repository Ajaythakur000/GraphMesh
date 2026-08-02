# 🌐 GraphMesh
**Intelligent Wi-Fi Channel Allocation & Network Simulation Engine**

[![Next.js](https://img.shields.io/badge/Next.js-Black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-20232A?style=flat-square&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

> A high-performance 2D network operations workspace that simulates router placement, calculates physical signal attenuation, and automatically resolves frequency interference using Graph Coloring algorithms.

🔗 **[Live Demo](https://graphmesh-2.onrender.com/)** 

---

## ✨ Core Features

* 📡 **Algorithmic Channel Allocation:** Automatically assigns non-overlapping frequencies (channels) to routers to completely eliminate signal interference.
* 🧱 **Realistic Signal Attenuation:** Uses computational geometry to calculate line-of-sight signal drops caused by physical walls. Accurately simulates distinct material properties:
  * **Concrete:** High attenuation
  * **Wood:** Medium attenuation
  * **Glass:** Low attenuation
* 🖱️ **Interactive 2D Workspace:** A fully drag-and-drop infinite canvas to plot complex network topologies in real-time.
* ⚡ **Optimized Rendering:** Built with React and native SVG math for zero-lag DOM updates, ensuring smooth topology manipulation without external image dependencies.

---

## 🧠 Under the Hood (How it Works)

GraphMesh relies on core computer science concepts to solve real-world networking problems:

1. **Graph Theory (Channel Assignment):** 
   Interfering routers are modeled as connected nodes in a mathematical graph. The engine applies a **Graph Coloring Algorithm** to ensure no two adjacent (interfering) nodes share the same frequency channel.
2. **Computational Geometry (Raycasting):** 
   To determine if a wall blocks a router's signal, the engine calculates the mathematical intersection between a router's signal radius (circle) and the physical wall (line segment).

---

## 🚀 Local Setup & Installation

Follow these steps to run GraphMesh on your local machine:

**1. Clone the repository:**
```bash
git clone [https://github.com/Ajaythakur000/GraphMesh.git](https://github.com/Ajaythakur000/GraphMesh.git)
cd GraphMesh
