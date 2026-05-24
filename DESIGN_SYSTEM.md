# Local AI Command Center - Design Execution Note

## Visual System
The application is designed to feel like a premium AI operating system, specifically targeting a "JARVIS-level command center" aesthetic. The interface uses heavy glassmorphism (`backdrop-blur-xl`, subtle white borders, dark semi-transparent backgrounds), layered shadows, and high contrast against a deep dark background. 

## Color System
- **Background:** Deep dark gradient (`#050816` to `#0B1026`).
- **Surface (Cards):** Glassmorphism (`bg-white/5` or `bg-slate-900/50`).
- **Borders:** Subtle (`border-white/10`).
- **Typography:** Soft white for primary, slate/muted gray for secondary, cyan for accents.
- **Accents & Glows:**
  - **Primary/Cyan Glow:** `#22D3EE` (Active focus, tech accents)
  - **Secondary/Purple Glow:** `#A855F7` (Adjusted states, AI processing)
  - **Blue Glow:** `#3B82F6` (Pending, standard operations)
  - **Emerald:** `#10B981` (Success, active, healthy)
  - **Amber:** `#F59E0B` (Warning, caution)
  - **Red:** `#EF4444` (Danger, failure)

## Component Hierarchy
1. **App Layout:** Full height/width flex layout with a left sidebar (Control Console) and a main content area.
2. **Top Bar:** Houses the Command Palette, System Mode indicator, AI Core Status, and Clock.
3. **Hero Mission Card:** The dominant focal point of the "Today's Mission" page, featuring the execution score and main mission.
4. **Protocol Grid:** 4 large cards (Work, Body, Skin, Study) for quick status overviews.
5. **System Components:** Risk Radar, Agent Power Grid, Mission Timeline, and Demo Mode animated pipeline.
6. **Primitive Components:** GlassCard, GlowingBadge, AnimatedRing, CinematicButton.

## Motion System (Framer Motion)
- **Entrance:** Staggered upward fade for layout elements (`initial={{ opacity: 0, y: 20 }}`).
- **Hover:** Slight scale (`scale: 1.02`), increased shadow/glow intensity, and border color shift.
- **Active States:** Subtle pulsing animation for AI Agent status rings and warning indicators.
- **Micro-interactions:** Smooth transition durations (`duration: 0.3`, `ease: "easeOut"`).

## Page Structure - "Today's Mission"
1. **Top Bar**
2. **Hero Section:** Full width, containing the main mission statement, "Next Best Action" button, and circular "Daily Execution Score".
3. **Mid Section (Grid):**
   - Left 2/3: Protocol Cards (Work, Body, Skin, Study).
   - Right 1/3: Risk Radar / System Health card.
4. **Bottom Section:** Mini Mission Timeline preview.

