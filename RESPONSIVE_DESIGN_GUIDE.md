# 📐 SPOT-Q ERP — Frontend Responsive Design Guide

> **Project:** SPOT-Q ERP (`/Projects/SPOT-Q/frontend/`)
> **Purpose:** Complete responsive design standard for every `.jsx` + `.css` file in this project
> **Scope:** Laptop & Desktop ONLY — `1024px` to `2560px`
> **Audience:** Developers and AI coding agents working on this codebase

---

## Table of Contents

1. [Project Structure Map](#1-project-structure-map)
2. [Responsive Philosophy](#2-responsive-philosophy)
3. [Supported Screen Sizes](#3-supported-screen-sizes)
4. [Standard CSS Rules](#4-standard-css-rules)
5. [Mandatory Responsiveness Rules](#5-mandatory-responsiveness-rules)
6. [Component-by-Component Guidelines](#6-component-by-component-guidelines)
7. [Page-by-Page Guidelines](#7-page-by-page-guidelines)
8. [Page-Level Workflow](#8-page-level-workflow)
9. [Media Query Standards](#9-media-query-standards)
10. [Safe Refactoring Rules](#10-safe-refactoring-rules)
11. [JSX Responsiveness Guidelines](#11-jsx-responsiveness-guidelines)
12. [CSS File Organization Standard](#12-css-file-organization-standard)
13. [Common ERP Responsiveness Problems & Solutions](#13-common-erp-responsiveness-problems--solutions)
14. [AI Agent Instructions](#14-ai-agent-instructions)
15. [Before / After Improvement Examples](#15-before--after-improvement-examples)
16. [Testing Checklist](#16-testing-checklist)
17. [Final Golden Rule](#17-final-golden-rule)

---

## 1. Project Structure Map

This is the **exact file structure** of SPOT-Q frontend. Agents must reference these real paths — never invent file names.

```
frontend/
├── src/
│   ├── Components/                          ← Shared reusable components
│   │   ├── AdminDashboard.jsx               → styles/ComponentStyles/AdminDashboard.css
│   │   ├── Alert.jsx                        → styles/ComponentStyles/Alert.css
│   │   ├── Buttons.jsx                      → styles/ComponentStyles/Buttons.css
│   │   ├── CustomDatePicker.jsx             → styles/ComponentStyles/CustomDatePicker.css
│   │   ├── Dashboard.jsx                    → styles/ComponentStyles/Dashboard.css
│   │   ├── DepartmentRouteGuard.jsx         (logic only — NO CSS, DO NOT TOUCH)
│   │   ├── Info.jsx                         → styles/ComponentStyles/Info.css
│   │   ├── Loader.jsx                       → styles/ComponentStyles/ (confirm if CSS exists)
│   │   ├── PopUp.jsx                        → styles/ComponentStyles/PopUp.css
│   │   ├── Sakthi.jsx                       → styles/ComponentStyles/Sakthi.css
│   │   ├── sidebar.jsx                      → styles/ComponentStyles/sidebar.css
│   │   ├── Table.jsx                        → styles/ComponentStyles/Table.css
│   │   └── UserProfile.jsx                  → styles/ComponentStyles/UserProfile.css
│   │
│   ├── config/                              ← DO NOT TOUCH (API/env config)
│   ├── context/                             ← DO NOT TOUCH (global state)
│   │
│   ├── pages/                               ← Page-level components (verify exact files)
│   │
│   └── styles/
│       ├── ComponentStyles/                 ← CSS paired with Components/ above
│       │   ├── AdminDashboard.css
│       │   ├── Alert.css
│       │   ├── Buttons.css
│       │   ├── CustomDatePicker.css
│       │   ├── Dashboard.css
│       │   ├── Info.css
│       │   ├── PopUp.css
│       │   ├── Sakthi.css
│       │   ├── sidebar.css
│       │   ├── Table.css
│       │   └── UserProfile.css
│       │
│       └── PageStyles/                      ← One folder per ERP module
│           ├── Impact/
│           │   └── Impact.css
│           ├── Melting/
│           ├── MicroStructure/
│           ├── MicroTensile/
│           ├── Moulding/
│           ├── Process/
│           ├── QcProduction/
│           ├── Sandlab/
│           └── Tensile/
│               └── Login.css
│
├── app.jsx                                  ← Root routing — DO NOT TOUCH
├── app.css                                  ← Global styles — global resets only
├── main.jsx                                 ← DO NOT TOUCH
├── index.html                               ← DO NOT TOUCH
├── vite.config.js                           ← DO NOT TOUCH
└── package.json                             ← DO NOT TOUCH
```

### File Access Reference Table

| Path | Editable? | What To Do |
|---|---|---|
| `src/styles/ComponentStyles/*.css` | ✅ Full access | Primary target for responsive fixes |
| `src/styles/PageStyles/**/*.css` | ✅ Full access | One file per ERP module page |
| `app.css` | ✅ Global resets only | Add box-sizing, overflow-x, root vars |
| `src/Components/*.jsx` | ⚠️ Read only | Read class names, never edit logic |
| `src/pages/**/*.jsx` | ⚠️ Read only | Read class names, never edit logic |
| `src/config/` | ❌ Forbidden | API configuration — never touch |
| `src/context/` | ❌ Forbidden | Global React state — never touch |
| `app.jsx` | ❌ Forbidden | Routing — never touch |
| `main.jsx` | ❌ Forbidden | Entry point — never touch |
| `vite.config.js` | ❌ Forbidden | Build config — never touch |
| `package.json` | ❌ Forbidden | Dependencies — never touch |

---

## 2. Responsive Philosophy

### Approach: Desktop-First, Percentage-Fluid

SPOT-Q is an ERP system used **only on laptops and desktop monitors** — by manufacturing floor operators, QC engineers, and production managers. No mobile support is needed.

We use a **percentage-fluid** layout strategy:
- All widths expressed as `%` of parent — not fixed `px`
- Typography scaled with `clamp()` — no per-breakpoint font rules
- Spacing in `rem` — respects browser zoom changes
- Flex and Grid handle structure — no positional hacks

### Why Percentage-First Over Breakpoints?

SPOT-Q users work on many different hardware setups:

| User Type | Typical Screen |
|---|---|
| Shop Floor Operator | 13–14 inch Dell/HP laptop, 1366px |
| QC Engineer | Docked 24-inch FHD monitor, 1920px |
| Production Manager | 27–32 inch 2K monitor, 2560px |
| Senior Analyst | 15-inch laptop + external display |

A `%`-based layout at 1366px looks right at 1920px — just more spacious. A fixed `px` layout that works at 1366px **breaks** at 1920px or at 125% zoom.

### Importance of Preserving Business Logic

Each SPOT-Q module (Impact, Melting, MicroStructure, MicroTensile, Moulding, Process, QcProduction, Sandlab, Tensile) contains complex API calls, state management, form validation, and data workflows. An accidental CSS class rename or JSX structural change can silently break a production workflow.

> **All responsiveness work is CSS-only. No exceptions.**

---

## 3. Supported Screen Sizes

### Primary Breakpoints

| Label | Width | Common Devices |
|---|---|---|
| Small Laptop | `1024px` | Minimum supported — older office laptops |
| Standard Laptop | `1280px` | 13–14 inch office laptops |
| HD Laptop | `1366px` | Most common in manufacturing environments |
| Large Laptop | `1440px` | MacBook Pro 14/16, 15-inch business laptops |
| Full HD Monitor | `1920px` | Docked 24-inch monitors |
| 2K / QHD | `2560px` | Engineering workstations, large monitors |

### Zoom Levels — Must All Work

| Base Screen | Zoom | Effective Width |
|---|---|---|
| 1920px | 125% | ~1536px |
| 1920px | 150% | ~1280px |
| 1366px | 125% | ~1093px |
| 1366px | 110% | ~1242px |

### Out of Scope — Do Not Add

- Mobile (`< 768px`) — not required
- Tablet (`768px–1023px`) — not required
- Do **not** add `@media (max-width: 768px)` or `@media (max-width: 480px)`

---

## 4. Standard CSS Rules

### 4.1 Global Reset — goes in `app.css`

Add these if missing. Do not remove existing rules.

```css
/* app.css — Global Resets */
*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html {
  font-size: 16px;       /* base for all rem values */
  scroll-behavior: smooth;
}

html, body {
  width: 100%;
  min-height: 100vh;
  overflow-x: hidden;
}

img, svg, video {
  max-width: 100%;
  height: auto;
  display: block;
}

input, select, textarea, button {
  max-width: 100%;
  font-family: inherit;
}
```

### 4.2 CSS Custom Properties — goes in `app.css` `:root`

```css
:root {
  --space-xs:  0.25rem;   /*  4px */
  --space-sm:  0.5rem;    /*  8px */
  --space-md:  1rem;      /* 16px */
  --space-lg:  1.5rem;    /* 24px */
  --space-xl:  2rem;      /* 32px */
  --space-2xl: 3rem;      /* 48px */

  --sidebar-width: 18%;
  --sidebar-min:   200px;
  --sidebar-max:   280px;
}
```

### 4.3 Overflow Handling

```css
body { overflow-x: hidden; }

/* Table / wide content scroll container */
.table-wrapper {
  width: 100%;
  overflow-x: auto;
}

/* Flex children — prevents the #1 overflow bug */
.flex-grow-child {
  flex: 1;
  min-width: 0;   /* CRITICAL */
}
```

### 4.4 Container Width Pattern

```css
/* Standard pages */
.page-wrapper {
  width: 94%;
  max-width: 1600px;
  margin: 0 auto;
  padding: 1.5rem 0;
}

/* Wide data-heavy pages (dashboards, large tables) */
.page-wrapper--wide {
  width: 97%;
  max-width: 1920px;
  margin: 0 auto;
}
```

### 4.5 Responsive Typography Scale

```css
h1 { font-size: clamp(1.4rem, 2vw,    2.2rem); line-height: 1.2; }
h2 { font-size: clamp(1.2rem, 1.6vw,  1.8rem); line-height: 1.3; }
h3 { font-size: clamp(1rem,   1.3vw,  1.5rem); line-height: 1.4; }
h4 { font-size: clamp(0.9rem, 1.1vw,  1.2rem); }
p, li, td, th   { font-size: clamp(0.8rem,  0.9vw,  1rem);   }
label           { font-size: clamp(0.75rem, 0.85vw, 0.95rem); }
small, .caption { font-size: clamp(0.7rem,  0.75vw, 0.85rem); }
```

### 4.6 Flexbox Layout Patterns

```css
/* Sidebar + content layout */
.app-layout {
  display: flex;
  width: 100%;
  min-height: 100vh;
  overflow: hidden;
}

/* Filter bar / button row */
.flex-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  align-items: flex-end;
}
```

### 4.7 Grid Layout Patterns

```css
/* Auto-fit card grid */
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1.2rem;
}

/* Form field grid */
.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 1.2rem 2%;
}
```

---

## 5. Mandatory Responsiveness Rules

### ✅ Always Do

| Rule | Why |
|---|---|
| Use `%` for all container widths | Scales with viewport automatically |
| Use `rem` for spacing | Respects browser zoom |
| Use `clamp(min, preferred, max)` for typography | Smooth scaling, zero breakpoints needed |
| Add `min-width: 0` to flex children that grow | Prevents the invisible flex overflow bug |
| Wrap every `<table>` in `.table-wrapper { overflow-x: auto }` | Prevents page-level horizontal scroll |
| Add `max-width` to page containers | Prevents stretched layouts on 2K monitors |
| Use `grid-template-columns: repeat(auto-fit, minmax(...))` for cards | Natural wrapping at any width |
| Use `min-height` instead of fixed `height` | Allows content to grow |
| Use `box-sizing: border-box` globally | Padding doesn't break width math |
| Use `flex-wrap: wrap` on flex rows | Prevents overflow on narrower screens |

### ❌ Never Do

| Rule | Why |
|---|---|
| `width: 1200px` on any container | Breaks on smaller laptops and zoomed views |
| `font-size: 24px` without `clamp()` | Doesn't scale with zoom |
| `position: absolute` for primary layout | Breaks when content changes |
| `overflow: hidden` on scrollable content | Traps content |
| `height: 400px` on cards or rows | Clips content |
| Leave `<table>` without an overflow wrapper | Causes page-level horizontal scroll |
| `padding: 0 60px` fixed padding on containers | Use `3%` instead |
| `min-width` without `flex-wrap` | Forces overflow |

---

## 6. Component-by-Component Guidelines

Exact rules for each file pair in `src/Components/` + `src/styles/ComponentStyles/`.

---

### `sidebar.jsx` + `sidebar.css`

The sidebar is the spine of the entire layout. Every layout decision here affects all module pages.

```css
/* sidebar.css */

.app-layout {
  display: flex;
  width: 100%;
  min-height: 100vh;
  overflow: hidden;
}

.sidebar {
  width: var(--sidebar-width, 18%);
  min-width: var(--sidebar-min, 200px);
  max-width: var(--sidebar-max, 280px);
  flex-shrink: 0;
  height: 100vh;
  overflow-y: auto;
  overflow-x: hidden;
  position: sticky;
  top: 0;
}

.sidebar-nav-item {
  padding: 0.65rem 1rem;
  font-size: clamp(0.78rem, 0.88vw, 0.95rem);
  display: flex;
  align-items: center;
  gap: 0.6rem;
  white-space: nowrap;
}

.sidebar-icon {
  width: 1.2rem;
  height: 1.2rem;
  flex-shrink: 0;
}

/* Main content — sits next to sidebar */
.main-content {
  flex: 1;
  min-width: 0;          /* CRITICAL — prevents flex overflow */
  overflow-x: hidden;
  padding: 1.5rem 2%;
}
```

---

### `Dashboard.jsx` + `Dashboard.css`

Main dashboard — stat cards + charts.

```css
/* Dashboard.css */

.dashboard-wrapper {
  width: 94%;
  max-width: 1600px;
  margin: 0 auto;
  padding: 1.5rem 0;
}

.dashboard-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1.2rem;
  margin-bottom: 2rem;
}

.dashboard-card {
  padding: clamp(1rem, 2%, 1.5rem);
  border-radius: 0.5rem;
  width: 100%;
}

.dashboard-card__value {
  font-size: clamp(1.4rem, 2vw, 2.2rem);
  font-weight: 700;
}

.dashboard-card__label {
  font-size: clamp(0.75rem, 0.8vw, 0.9rem);
}

.dashboard-charts {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 1.5rem;
}

.chart-wrapper {
  width: 100%;
  aspect-ratio: 16 / 7;
  overflow: hidden;
}
```

---

### `AdminDashboard.jsx` + `AdminDashboard.css`

Admin view — user management tables and admin stats.

```css
/* AdminDashboard.css */

.admin-dashboard {
  width: 94%;
  max-width: 1600px;
  margin: 0 auto;
  padding: 1.5rem 0;
}

.admin-stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.admin-table-section {
  width: 100%;
  overflow-x: auto;
}
```

---

### `Table.jsx` + `Table.css`

The shared table component reused across every SPOT-Q module. Most critical responsive fix.

```css
/* Table.css */

.table-wrapper {
  width: 100%;
  overflow-x: auto;
  border-radius: 0.4rem;
}

table {
  width: 100%;
  min-width: 700px;
  border-collapse: collapse;
  table-layout: auto;
}

th {
  font-size: clamp(0.75rem, 0.82vw, 0.9rem);
  padding: 0.65rem 1rem;
  white-space: nowrap;
  text-align: left;
}

td {
  font-size: clamp(0.78rem, 0.85vw, 0.95rem);
  padding: 0.6rem 1rem;
  white-space: nowrap;
}

.table-actions {
  display: flex;
  gap: 0.5rem;
  white-space: nowrap;
  justify-content: flex-end;
}

.table-pagination {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  justify-content: flex-end;
  align-items: center;
  padding: 0.75rem 0;
  font-size: clamp(0.78rem, 0.85vw, 0.9rem);
}
```

---

### `PopUp.jsx` + `PopUp.css`

Used across all modules for confirmations, alerts, and inline forms.

```css
/* PopUp.css */

.popup-overlay {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 2vh 2vw;
  background: rgba(0, 0, 0, 0.5);
}

.popup-box {
  width: clamp(380px, 45vw, 800px);
  max-height: 85vh;
  overflow-y: auto;
  border-radius: 0.5rem;
  padding: 1.5rem 2rem;
}

.popup-title {
  font-size: clamp(1rem, 1.3vw, 1.4rem);
  margin-bottom: 1rem;
}

.popup-actions {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  justify-content: flex-end;
  margin-top: 1.5rem;
}
```

---

### `Buttons.jsx` + `Buttons.css`

Shared button component — used on every page.

```css
/* Buttons.css */

.btn {
  padding: 0.5rem 1.2rem;
  font-size: clamp(0.78rem, 0.85vw, 0.95rem);
  border-radius: 0.3rem;
  cursor: pointer;
  white-space: nowrap;
  flex-shrink: 0;
}

.btn-group {
  display: flex;
  gap: 0.6rem;
  flex-wrap: wrap;
  align-items: center;
}
```

---

### `Alert.jsx` + `Alert.css`

Notification/alert banners.

```css
/* Alert.css */

.alert {
  width: 100%;
  padding: 0.75rem 1rem;
  border-radius: 0.4rem;
  font-size: clamp(0.8rem, 0.9vw, 1rem);
  display: flex;
  align-items: flex-start;
  gap: 0.6rem;
}
```

---

### `CustomDatePicker.jsx` + `CustomDatePicker.css`

Date input used in filters and forms.

```css
/* CustomDatePicker.css */

.date-picker-wrapper {
  width: 100%;
  max-width: 220px;
  position: relative;
}

.date-picker-wrapper input {
  width: 100%;
  padding: 0.5rem 0.75rem;
  font-size: clamp(0.78rem, 0.85vw, 0.95rem);
}
```

---

### `Info.jsx` + `Info.css`

Detail/info display sections.

```css
/* Info.css */

.info-section {
  width: 100%;
  padding: clamp(1rem, 2%, 1.5rem);
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1rem;
}
```

---

### `UserProfile.jsx` + `UserProfile.css`

User profile panel or dropdown.

```css
/* UserProfile.css */

.user-profile-wrapper {
  width: clamp(300px, 30vw, 480px);
  padding: 1.5rem;
}

.user-profile-avatar {
  width: clamp(60px, 5vw, 90px);
  height: clamp(60px, 5vw, 90px);
  border-radius: 50%;
}

.user-profile-details {
  display: grid;
  gap: 0.6rem;
  margin-top: 1rem;
}

.user-profile-label {
  font-size: clamp(0.75rem, 0.82vw, 0.9rem);
}
```

---

### `Loader.jsx`

```css
.loader-overlay {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9998;
}

.loader-spinner {
  width: clamp(2rem, 4vw, 3.5rem);
  height: clamp(2rem, 4vw, 3.5rem);
}
```

---

### `Sakthi.jsx` + `Sakthi.css`

Apply standard page wrapper + content grid patterns. If it renders a table, follow `Table.css` rules.

---

## 7. Page-by-Page Guidelines

Each ERP module lives in `src/styles/PageStyles/[ModuleName]/`. Apply the General Page Template to every module.

### General Module Page Template

```css
/* ModuleName.css */

.module-page {
  width: 94%;
  max-width: 1600px;
  margin: 0 auto;
  padding: 1.5rem 0;
}

/* Header: title + action buttons */
.module-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.module-title {
  font-size: clamp(1.2rem, 1.6vw, 1.8rem);
  font-weight: 600;
}

/* Filter / search bar */
.module-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  align-items: flex-end;
  margin-bottom: 1.2rem;
}

.module-filters input,
.module-filters select {
  flex: 1 1 160px;
  min-width: 130px;
  max-width: 240px;
  padding: 0.45rem 0.75rem;
  font-size: clamp(0.78rem, 0.85vw, 0.95rem);
}

/* Table area */
.module-table-wrapper {
  width: 100%;
  overflow-x: auto;
}

/* Form layout */
.module-form {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 1.2rem 2%;
}

.module-form-field {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.module-form-field input,
.module-form-field select,
.module-form-field textarea {
  width: 100%;
  padding: 0.5rem 0.75rem;
  font-size: clamp(0.78rem, 0.88vw, 0.95rem);
}

/* Full-width fields (section headers, long textareas) */
.module-form-field--full {
  grid-column: 1 / -1;
}
```

---

### `PageStyles/Impact/Impact.css`

Impact testing module — data entry form + results table.

- Page wrapper: standard `94% / max-width: 1600px`
- Form: `grid-template-columns: repeat(auto-fit, minmax(260px, 1fr))`
- Results table: wrap in `overflow-x: auto`
- Numeric result cards: `repeat(auto-fit, minmax(180px, 1fr))`

---

### `PageStyles/Tensile/Login.css`

Login page — standalone, no sidebar.

```css
/* Login.css */

.login-page {
  width: 100%;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2vh 2vw;
}

.login-card {
  width: clamp(320px, 35vw, 480px);
  padding: clamp(1.5rem, 3%, 2.5rem);
  border-radius: 0.5rem;
}

.login-card h1 {
  font-size: clamp(1.3rem, 1.8vw, 1.8rem);
  margin-bottom: 1.5rem;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.login-form input {
  width: 100%;
  padding: 0.6rem 0.9rem;
  font-size: clamp(0.85rem, 0.95vw, 1rem);
}

.login-form button {
  width: 100%;
  padding: 0.65rem;
  font-size: clamp(0.85rem, 0.95vw, 1rem);
  margin-top: 0.5rem;
}
```

---

### `PageStyles/Melting/`, `MicroStructure/`, `MicroTensile/`, `Moulding/`, `Process/`, `QcProduction/`, `Sandlab/`

All follow the **General Module Page Template** above. Per-file key checks:

- Data input forms: `auto-fit minmax(260px, 1fr)` grid
- Data results/reports: `overflow-x: auto` table wrapper
- Filter bars: `flex-wrap: wrap`, `flex: 1 1 160px` on inputs
- Summary stat sections: `auto-fit minmax(200px, 1fr)` card grid

---

## 8. Page-Level Workflow

Follow this **exact sequence** for every file you work on:

```
╔══════════════════════════════════════════════════════════════════╗
║  STEP 1 — LOCATE FILES                                           ║
║  Component: src/Components/Name.jsx                              ║
║         →   src/styles/ComponentStyles/Name.css                  ║
║  Module Page: src/pages/Module/Page.jsx                          ║
║         →   src/styles/PageStyles/Module/Page.css                ║
╠══════════════════════════════════════════════════════════════════╣
║  STEP 2 — READ JSX                                               ║
║  Understand layout structure + existing class names.             ║
║  DO NOT EDIT. Note container/wrapper class names only.           ║
╠══════════════════════════════════════════════════════════════════╣
║  STEP 3 — READ CSS                                               ║
║  List every: fixed px width, height, font-size, padding,         ║
║  un-wrapped tables, non-flex/grid containers.                    ║
╠══════════════════════════════════════════════════════════════════╣
║  STEP 4 — AUDIT                                                  ║
║  Document each issue. State what breaks and at which width.      ║
╠══════════════════════════════════════════════════════════════════╣
║  STEP 5 — FIX CSS ONLY                                           ║
║  Apply: %, rem, clamp(), flex, grid, overflow rules.             ║
║  Follow all rules in Sections 4 and 5.                           ║
╠══════════════════════════════════════════════════════════════════╣
║  STEP 6 — MEDIA QUERIES                                          ║
║  Add ONLY if fluid layout still breaks at a specific width.      ║
║  ALL media queries go at BOTTOM of the CSS file.                 ║
╠══════════════════════════════════════════════════════════════════╣
║  STEP 7 — VERIFY                                                 ║
║  Check mentally: 1024px / 1366px / 1920px / 2560px              ║
║  No logic changed. No class renamed. No JSX modified.            ║
╚══════════════════════════════════════════════════════════════════╝
```

---

## 9. Media Query Standards

### When to Use

Media queries are a **last resort** in SPOT-Q. A properly built `%` + `clamp()` layout should not need one for every size. Add only when:

1. The fluid layout visibly breaks at a specific width
2. A component (modal, filter bar) needs structurally different behavior
3. Typography needs a hard limit beyond what `clamp()` handles

### Standard Breakpoint Order — Always at Bottom of CSS File

```css
/* ─── Large Monitor / 2K ─── */
@media (min-width: 1921px) {
  /* Extra whitespace, more grid columns, larger max-widths */
}

/* ─── Standard HD Laptop ─── */
@media (max-width: 1440px) {
  /* Fine-tune sidebar width, card padding */
}

/* ─── Small Laptop ─── */
@media (max-width: 1280px) {
  /* Tighter spacing, adjust grid columns */
}

/* ─── Minimum Supported ─── */
@media (max-width: 1024px) {
  /* Last-resort adjustments only */
}
```

### Full Module Page Example

```css
@media (min-width: 1921px) {
  .module-page { max-width: 1800px; }
  .module-form { grid-template-columns: repeat(4, 1fr); }
}

@media (max-width: 1440px) {
  .module-page { width: 96%; }
}

@media (max-width: 1280px) {
  .sidebar     { width: 20%; }
  .popup-box   { width: clamp(340px, 60vw, 680px); }
}

@media (max-width: 1024px) {
  .module-form    { grid-template-columns: 1fr 1fr; }
  .module-filters { gap: 0.5rem; }
}
```

---

## 10. Safe Refactoring Rules

### ✅ Allowed

| Action | Example |
|---|---|
| Replace fixed px width with % | `width: 1200px` → `width: 94%; max-width: 1400px` |
| Replace fixed font with clamp | `font-size: 18px` → `font-size: clamp(1rem, 1.2vw, 1.2rem)` |
| Replace fixed padding with rem/% | `padding: 40px 60px` → `padding: 2rem 3%` |
| Add flex-wrap | `display: flex` → `display: flex; flex-wrap: wrap` |
| Add min-width: 0 to flex child | Safe addition, invisible at normal sizes |
| Add overflow-x: auto to wrapper | Safe addition |
| Add max-width + margin: auto | Safe centering |
| Replace height with min-height | `height: 400px` → `min-height: 200px; height: auto` |
| Add media queries at bottom | Additive, never breaking |
| Add `<div className="table-wrapper">` around bare table | Only if no wrapper exists; use a fresh unused class name |

### ❌ Forbidden

| Action | Reason |
|---|---|
| Edit `.jsx` component logic | Breaks state, routing, or API calls |
| Rename CSS class names | JS may reference them conditionally |
| Remove CSS without replacing | May break other components |
| Import new npm packages | Out of scope |
| Add Tailwind / Bootstrap / Ant Design | Introduces conflicts |
| Change color variables or theme tokens | Out of scope |
| Rewrite entire CSS file | Too risky — targeted fixes only |
| Add `display: none` to any element | Breaks accessibility and functionality |
| Touch `src/config/` or `src/context/` | Global config and state — forbidden |
| Touch `app.jsx`, `main.jsx`, `vite.config.js` | Entry/routing — forbidden |

---

## 11. JSX Responsiveness Guidelines

### Flex vs Grid Decision Guide

| Use Flex When | Use Grid When |
|---|---|
| Navbar items in a row | Card grids (auto-fit) |
| Sidebar + content layout | Form field layouts |
| Button groups | Dashboard stat rows |
| Filter bar inputs + buttons | Multi-column report layouts |
| Any alignment-focused row | Any auto-wrapping layout |

### The Critical `min-width: 0` Flex Fix

```css
/* Without this, flex children overflow their container silently */
.app-layout { display: flex; }
.sidebar    { flex-shrink: 0; width: 18%; }
.main-content { flex: 1; min-width: 0; }  /* ← This prevents horizontal overflow */
```

This is the #1 invisible flex bug. Always add to any flex child that holds wide content.

### Responsive Container Pattern

```jsx
{/* JSX — read only, do not edit logic */}
<div className="page-wrapper">
  <div className="module-header"> ... </div>
  <div className="module-filters"> ... </div>
  <div className="table-wrapper">
    <table> ... </table>
  </div>
</div>
```

```css
/* CSS — this is where you work */
.page-wrapper    { width: 94%; max-width: 1600px; margin: 0 auto; }
.module-header   { display: flex; justify-content: space-between; flex-wrap: wrap; gap: 1rem; }
.module-filters  { display: flex; flex-wrap: wrap; gap: 0.75rem; }
.table-wrapper   { width: 100%; overflow-x: auto; }
```

---

## 12. CSS File Organization Standard

Every `.css` file in this project must follow this structure:

```css

/* ─── 1. CSS Variables (component-specific, if needed) ─── */
:root { ... }

/* ─── 2. Layout Wrappers ─── */
.page-wrapper { ... }
.app-layout { ... }

/* ─── 3. Header / Title ─── */
.module-header { ... }
.module-title { ... }

/* ─── 4. Filter / Search Bar ─── */
.module-filters { ... }

/* ─── 5. Cards / Stats Grid ─── */
.card-grid { ... }
.card { ... }

/* ─── 6. Tables ─── */
.table-wrapper { ... }
table, th, td { ... }
.table-pagination { ... }

/* ─── 7. Forms ─── */
.module-form { ... }
.module-form-field { ... }

/* ─── 8. Modals / Popups ─── */
.popup-overlay { ... }
.popup-box { ... }

/* ─── 9. Typography ─── */
h1, h2, h3 { ... }

/* ─── 10. Buttons / Actions ─── */
.btn { ... }
.btn-group { ... }

/* ─── 11. Utilities ─── */

/* ─── 12. Media Queries — ALWAYS LAST ─── */
@media (min-width: 1921px) { ... }
@media (max-width: 1440px) { ... }
@media (max-width: 1280px) { ... }
@media (max-width: 1024px) { ... }
```

---

## 13. Common ERP Responsiveness Problems & Solutions

### Problem 1: Sidebar Overlapping Main Content

**File:** `sidebar.css`
**Cause:** `position: fixed` without compensating `margin-left`, or `flex` without `min-width: 0`.

```css
.app-layout   { display: flex; overflow: hidden; width: 100%; min-height: 100vh; }
.sidebar      { width: 18%; min-width: 200px; max-width: 280px; flex-shrink: 0; position: sticky; top: 0; height: 100vh; }
.main-content { flex: 1; min-width: 0; overflow-x: hidden; }
```

### Problem 2: Table Causing Page Horizontal Scroll

**File:** `Table.css` or any module CSS
**Cause:** `<table>` rendered without an overflow container.

```css
.table-wrapper { width: 100%; overflow-x: auto; }
table          { min-width: 700px; width: 100%; }
```

### Problem 3: PopUp / Modal Cut Off

**File:** `PopUp.css`
**Cause:** Fixed `top:` / `left:` positioning.

```css
.popup-overlay { position: fixed; inset: 0; display: flex; align-items: center; justify-content: center; padding: 2vh 2vw; }
.popup-box     { width: clamp(380px, 45vw, 800px); max-height: 85vh; overflow-y: auto; }
```

### Problem 4: Layout Breaks at 125% Zoom

**Cause:** All sizes in `px`. At 125% zoom on 1920px, viewport is effectively ~1536px.
**Fix:** Convert all container widths to `%` + `max-width`. Convert font sizes to `clamp()`. Zoom scales everything proportionally.

### Problem 5: Module Form Fields Not Aligning

**File:** Any `PageStyles/Module/*.css`
**Cause:** Form fields in a raw `div` column.

```css
.module-form        { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 1.2rem 2%; }
.module-form-field  { display: flex; flex-direction: column; gap: 0.4rem; }
.module-form-field input,
.module-form-field select { width: 100%; }
```

### Problem 6: Fixed Height Clips Content

**Cause:** `height: 400px` on a section or card.

```css
/* Before */ .section { height: 400px; }
/* After  */ .section { min-height: 120px; height: auto; }
```

### Problem 7: Dashboard Cards Too Wide on 2K

**File:** `Dashboard.css` or `AdminDashboard.css`
**Cause:** `repeat(4, 1fr)` on 2560px = cards ~600px wide.

```css
.dashboard-cards { grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); }

@media (min-width: 1921px) {
  .dashboard-cards { grid-template-columns: repeat(6, 1fr); }
}
```

### Problem 8: Filter Bar Overflowing Horizontally

**Cause:** `display: flex` without `flex-wrap: wrap`.

```css
.module-filters          { display: flex; flex-wrap: wrap; gap: 0.75rem; }
.module-filters input,
.module-filters select   { flex: 1 1 160px; min-width: 130px; max-width: 240px; }
```

---

## 14. AI Agent Instructions

### Agents MUST:

- Reference **Section 1 Project Structure Map** to find the correct CSS file path before editing anything
- Work on **one file pair at a time**: `ComponentName.jsx` → `ComponentStyles/ComponentName.css` OR `PageName.jsx` → `PageStyles/Module/PageName.css`
- Read both `.jsx` and `.css` fully before making any change
- List every responsiveness issue found before applying fixes
- Apply fixes to **CSS only** — the only exception is adding a `<div className="table-wrapper">` around a bare table
- Use `%`, `rem`, `clamp()`, `flex`, `grid` — never introduce new fixed `px` sizes
- Preserve all existing CSS class names exactly as written
- Place all `@media` queries at the **very bottom** of the CSS file
- Mentally verify layout at: `1024px / 1280px / 1366px / 1440px / 1920px / 2560px`
- Preserve all accessibility — no `display: none` on functional elements

### Agents MUST NOT:

- Edit any `.jsx` logic, hooks, handlers, state, or API calls
- Touch `src/config/` or `src/context/` — forbidden
- Touch `app.jsx`, `main.jsx`, `vite.config.js`, `package.json` — forbidden
- Rename any CSS class name, JSX variable, or function
- Remove existing CSS unless directly replacing with a responsive equivalent
- Introduce Tailwind, Bootstrap, Ant Design, or any new CSS framework
- Add mobile/tablet media queries (`< 1024px`) — out of scope
- Add animations not already in the file
- Change theme colors, font families, or design tokens
- Rewrite an entire CSS file — targeted fixes only

---

## 15. Before / After Improvement Examples

### Container Width

```css
/* Before */ .module-container { width: 1400px; margin: 0 auto; padding: 40px 60px; }
/* After  */ .module-container { width: 94%; max-width: 1600px; margin: 0 auto; padding: 1.5rem 2%; }
```

### Font Sizes

```css
/* Before */ .page-title   { font-size: 28px; }
/* Before */ .table-header { font-size: 14px; }
/* After  */ .page-title   { font-size: clamp(1.3rem, 2vw, 2rem); }
/* After  */ .table-header { font-size: clamp(0.75rem, 0.85vw, 0.92rem); }
```

### Overflowing Table (`Table.css`)

```css
/* Before */ table { width: 1600px; }
/* After  */
.table-wrapper { width: 100%; overflow-x: auto; }
table          { width: 100%; min-width: 700px; }
```

### Non-Wrapping Filter Bar (module CSS)

```css
/* Before */ .module-filters { display: flex; }
/* Before */ .module-filters input { width: 200px; }
/* After  */ .module-filters { display: flex; flex-wrap: wrap; gap: 0.75rem; }
/* After  */ .module-filters input { flex: 1 1 160px; min-width: 130px; max-width: 240px; }
```

### Fixed Stat Card Grid (`Dashboard.css`)

```css
/* Before */ .stats { display: flex; }
/* Before */ .stat-card { width: 280px; }
/* After  */ .stats     { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1.2rem; }
/* After  */ .stat-card { width: 100%; }
```

### Fixed Sidebar (`sidebar.css`)

```css
/* Before */ .sidebar { width: 260px; position: fixed; }
/* Before */ .main    { margin-left: 260px; }
/* After  */
.app-layout { display: flex; }
.sidebar    { width: 18%; min-width: 200px; max-width: 280px; flex-shrink: 0; position: sticky; top: 0; height: 100vh; }
.main       { flex: 1; min-width: 0; }
```

### Fixed Modal (`PopUp.css`)

```css
/* Before */ .popup { position: fixed; top: 200px; left: 50%; transform: translateX(-50%); width: 700px; }
/* After  */
.popup-overlay { position: fixed; inset: 0; display: flex; align-items: center; justify-content: center; padding: 2vh 2vw; }
.popup-box     { width: clamp(380px, 45vw, 800px); max-height: 85vh; overflow-y: auto; }
```

### Fixed Padding

```css
/* Before */ .content-area { padding: 40px 80px; }
/* After  */ .content-area { padding: 2rem 3%; }
```

---

## 16. Testing Checklist

Run after completing responsive work on any file.

### Resolution Testing

- [ ] **1024px** — No horizontal scroll, all content visible, sidebar intact
- [ ] **1280px** — Layout proportional, no overlap
- [ ] **1366px** — Standard laptop (most common in SPOT-Q environment), must look ideal
- [ ] **1440px** — Comfortable spacing, no stretch
- [ ] **1920px** — FHD monitor, content centered, not edge-to-edge
- [ ] **2560px** — 2K monitor, max-width respected, no extreme line lengths

### Zoom Testing

- [ ] **1920px at 125% zoom** (effective ~1536px) — no breaks
- [ ] **1920px at 150% zoom** (effective ~1280px) — no breaks
- [ ] **1366px at 125% zoom** (effective ~1093px) — still functional

### Component Testing

- [ ] **`sidebar.css`** — Correct `%` width, `min-width: 0` on content, not overlapping
- [ ] **`Table.css`** — All tables in `overflow-x: auto` wrapper, not causing body scroll
- [ ] **`PopUp.css`** — Centered with flex `inset: 0`, scrollable if content is tall
- [ ] **`Dashboard.css`** — Cards auto-fitting, charts not overflowing container
- [ ] **`Buttons.css`** — No fixed widths on buttons
- [ ] **`CustomDatePicker.css`** — Input not overflowing container

### Module Page Testing (each PageStyles module)

- [ ] Filter bar inputs wrapping cleanly at 1280px
- [ ] Form grid wrapping from multi-column to fewer columns at 1024px
- [ ] Table horizontally scrollable, not breaking page layout
- [ ] Header (title + action buttons) wrapping cleanly on resize
- [ ] No fixed heights cutting off any content

### General

- [ ] No horizontal scrollbar on `<body>` at any supported width
- [ ] No content clipped or hidden unintentionally
- [ ] No element overflowing its parent container
- [ ] All buttons, inputs, and links are accessible and clickable
- [ ] All SPOT-Q module features work identically — no business logic changed

---

## 17. Final Golden Rule

> **"The goal is to improve responsiveness and adaptability WITHOUT changing application logic, workflow, or user functionality."**

In SPOT-Q specifically:
- Every `%` makes the layout uniform across every operator's laptop — from a 13-inch office machine to a 32-inch engineering monitor
- Every `clamp()` makes content readable at any browser zoom level
- Every `overflow-x: auto` on a table wrapper prevents a broken screen for a QC engineer mid-inspection
- Every fixed `px` you leave behind is a potential layout break at 125% zoom on a 1366px laptop

**Responsiveness is about proportions, not redesigns. Make it scale. Keep it working. Touch nothing else.**

---

*SPOT-Q ERP Frontend Responsive Design Guide*
*Path: `/Projects/SPOT-Q/frontend/`*
*Stack: React + Vite + Plain CSS*
*Scope: Laptop & Desktop only — 1024px to 2560px*
*AI Agent compatible — see Section 1 for all real file paths*
