As requested, I will create a new page `/mrocriativo` that serves as the entry point for the "Sistema IA para Gestão e Automação de Instagram". This page will feature a professional sales landing page for the MVP, highlighting the AI-driven features like profile analysis, strategy generation, creative creation, and automated scheduling via Meta Business Suite.

### 1. New Page Creation
- Create `src/pages/MROCriativo.tsx`: A high-conversion landing page using the project's premium design system (gradients, glassmorphism, Lucide icons).
- Section 1: Hero with the specified objective and "Connect Instagram" CTA (simulated OAuth flow for MVP).
- Section 2: Features breakdown (IA Analysis, Strategic Organization, Content Strategies, Automatic Creatives, High-Performance Posts, Captions/CTA, Approval Screen, Scheduling).
- Section 3: "How it works" steps based on the flow (OAuth -> Reading -> Optimization -> Strategies -> Post Generation -> Approval -> Auto-posting).
- Section 4: Pricing/CTA (MVP access).

### 2. Integration with Existing System
- Add the route `/mrocriativo` to `src/App.tsx`.
- Connect the CTA on this new page to existing tools (like `ProfileSearch` or a new MVP dashboard flow).
- Since the user mentioned "Initially SEM App Review della Meta", I will implement the login/connection flow using the existing "Development Mode" pattern (adding users as testers).

### 3. Technical Implementation
- Use `framer-motion` for smooth animations (consistent with other premium pages in the project).
- Implement a dashboard-style preview on the sales page to show how the "Approval Screen" and "Scheduling Calendar" look.
- Ensure the page is fully responsive for mobile and desktop.

### 4. MVP Flow Simulation
- The page will include placeholders for the "Tester/Developer" addition instructions in the onboarding flow, as requested in point 9 of the specifications.

---
**Technical Details**
- **File:** `src/pages/MROCriativo.tsx` (New)
- **Route:** `/mrocriativo`
- **Dependencies:** `lucide-react`, `framer-motion`, `sonner`
- **Authentication:** Meta OAuth simulation via the project's existing API patterns.
