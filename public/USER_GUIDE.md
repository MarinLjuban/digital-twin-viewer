# IFC-Viewer Digital Twin - User Guide

## Quick Start

The app loads a sample office building with MEP systems (HVAC, ventilation, heating, plumbing). Fragment files (`.frag`) load faster than IFC files.

## Interface

```
┌─────────────────┬──────────────────────┬─────────────────┐
│   LEFT PANEL    │    3D VIEWPORT       │   RIGHT PANEL   │
│ Load Model      │                      │ Properties      │
│ Spatial Tree    │   [Building Model]   │ BMS Sensors     │
│ Filters         │                      │ Documents       │
│ Systems         │                      │                 │
└─────────────────┴──────────────────────┴─────────────────┘
                     [Floating Toolbar]
```

## Navigation

| Action | Control |
|--------|---------|
| Rotate | Left-click + drag |
| Pan | Right-click + drag |
| Zoom | Scroll wheel |

**Camera modes** (toolbar):
- **Orbit** - rotate around model (default)
- **First Person** - WASD movement + mouse look
- **Plan** - top-down orthographic view

*Try it: Zoom out to see the whole building, then switch to First Person and walk inside using WASD.*

## Selection & Properties

- **Click** any element to select (highlighted in blue)
- **Hover** to preview elements before selecting
- Selected element shows **Properties**, **BMS sensors**, and **Documents** in right panel

*Try it: Click on a ceiling-mounted fan coil unit (rectangular box) to see its properties - name, GUID, IFC type, and manufacturer specs.*

## BMS Sensor Data

Monitored equipment displays real-time sensor readings:
- Temperature, humidity, CO2, airflow, pressure, energy
- Status colors: **Green** (normal), **Yellow** (warning), **Red** (alarm)
- **Click a sensor card** to view 24h historical chart

*Try it: Select a fan coil unit (FCU-01) to see temperature, airflow, and energy sensors. Click on the Clivet VRF outdoor unit on the roof for pressure readings. Select the Kampmann HK320 trench heater at floor level for heating data.*

## Documents

Select equipment to view linked documents (specs, manuals, certificates). Click **View** to open or **Download** to save.

**Upload documents**: Select element → Documents panel → Upload Document

*Try it: Select any fan coil unit to see "Kampmann Fan Coil Specifikacija" PDF. Select the VRF unit for "Clivet MV6i-500 Specifikacija".*

## Tools (Floating Toolbar)

### Measurement
- **Length**: Click two points to measure distance
- **Area**: Click multiple points to define polygon
- **Clear**: Remove all measurements

*Try it: Enable Length measurement and click two corners of a room to get the distance in meters.*

### Clipping
- **Create Plane**: Click a surface to section the model
- Drag plane handle to adjust cut position
- Delete individual planes or all at once

*Try it: Click Create Plane, then click on a floor slab. Drag the plane up/down to reveal MEP systems hidden inside walls and ceilings.*

### Visibility
- **Ghost**: Make non-selected elements transparent
- **Isolate**: Show only selected elements
- **Hide**: Hide selected elements
- **Show All**: Reset visibility

*Try it: Open Systems tree, select all fan coil units, click Isolate. Only the FCUs remain visible. Click Show All to restore.*

### 2D Views
- **Floor Plans**: Select level for plan view
- **Elevations**: N/S/E/W building sections
- **Save View**: Store camera positions

## Filtering

In the **Filter Panel** (left side):
1. Choose filter type: **Category** or **Attribute**
2. Set conditions (e.g., Name contains "Kampmann")
3. Apply to select matching elements

Use **Systems Tree** to select equipment by type (Fan Coils, Air Terminals, etc.)

*Try it: Add an Attribute filter with Name → Contains → "Kampmann" to highlight all Kampmann equipment in the model.*

## Loading Models

- **Load IFC**: Import .ifc files (slower, requires parsing)
- **Load Fragment**: Import .frag files (faster, pre-processed)

**Convert IFC to Fragment**: Use `convert-ifc-to-frag.html` for 5-10x faster loading.

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| W/A/S/D | Move (First Person mode) |
| Scroll | Zoom |
| Escape | Deselect / Exit tool |

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Model not loading | Wait 30s, check console (F12), refresh |
| Slow performance | Use clipping planes, hide elements, close tabs |
| No sensor data | Only pre-configured equipment has BMS data |
| Documents missing | Stored in IndexedDB; clearing browser data removes them |
