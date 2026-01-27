# IFC-Viewer Digital Twin - User Guide

## Quick Start

The app loads a sample office building with MEP systems (HVAC, ventilation, heating, plumbing). Fragment files (`.frag`) load faster than IFC files.

## Interface

```
┌─────────────────┬──────────────────────┬─────────────────┐
│   LEFT PANEL    │    3D VIEWPORT       │   RIGHT PANEL   │
│ [Logo] [Icons]  │                      │ Selection Info  │
│ Spatial Tree    │   [Building Model]   │ [Sensors|Props] │
│ Property Filter │                      │ Documents       │
└─────────────────┴──────────────────────┴─────────────────┘
                                              [Views Toolbar]
                     [Floating Toolbar]
```

### Header Bar (Left Panel)
- **Theme Toggle** - Switch between dark and light mode
- **Help Button** - Opens this user guide
- **Language Toggle** - Switch between English (EN) and Croatian (HR)

## Navigation

| Action | Control |
|--------|---------|
| Rotate | Left-click + drag |
| Pan | Right-click + drag |
| Zoom | Scroll wheel |

**Camera modes** (floating toolbar):
- **Orbit** - Rotate around model (default)
- **First Person** - WASD movement + mouse look
- **Plan** - Top-down orthographic view

*Try it: Zoom out to see the whole building, then switch to First Person and walk inside using WASD.*

## Selection & Properties

- **Click** any element to select (highlighted in blue)
- **Hover** to preview elements before selecting
- Selected element shows **Sensors** and **Properties** tabs in right panel

The right panel has two tabs:
- **Sensors** - BMS sensor data for monitored equipment
- **Properties** - IFC properties (name, GUID, type, attributes)

*Try it: Click on a ceiling-mounted fan coil unit to see its properties and sensor data.*

## BMS Sensor Data

Monitored equipment displays real-time sensor readings in the Sensors tab:
- Temperature, humidity, CO2, airflow, pressure, energy
- Status colors: **Green** (normal), **Yellow** (warning), **Red** (alarm)
- **Click a sensor card** to view historical trend chart

Historical data options: 24 hours, 7 days, 30 days with min/max/average statistics.

*Try it: Select a fan coil unit (FCU-01) to see temperature, airflow, and energy sensors. Click any sensor to view its trend chart.*

## Documents

Select equipment to view linked documents (specs, manuals, certificates) in the Documents section.

- **View** - Open document in browser
- **Edit** - Modify document metadata
- **Download** - Save to local disk
- **Delete** - Remove document

**Upload documents**: Select element -> Documents section -> Upload Document button

*Try it: Select any fan coil unit to see linked specification PDFs.*

## Floating Toolbar

Located at the bottom center of the viewport:

### Navigate
- **Orbit** - Rotate around model center
- **First Person** - Walk through model with WASD keys
- **Plan** - Top-down 2D view

### Measure
- **Length** - Click two points to measure distance
- **Area** - Click multiple points to define polygon area
- **Clear** - Remove all measurements

*Try it: Enable Length measurement and click two corners of a room to get the distance in meters.*

### Section
- **Section** - Click a surface to create a clipping plane
- **Show Planes** - Toggle visibility of section plane controls
- **Delete All** - Remove all clipping planes

*Try it: Click Section, then click on a floor slab. The model cuts away to reveal hidden MEP systems.*

### Visibility
- **Ghost** - Make non-selected elements semi-transparent
- **Isolate** - Show only selected elements
- **Hide** - Hide selected elements
- **Show All** - Reset all visibility

*Try it: Select some elements, click Isolate. Only those elements remain visible. Click Show All to restore.*

## Views Toolbar

Located at the top-right of the viewport:

- **Floor Plans** - Generate 2D floor plan views from IFC storeys
- **Elevations** - Generate N/S/E/W elevation views
- **Exit 2D** - Return to 3D view
- **Saved Views** - Access saved camera positions

## Spatial Tree

In the left panel, browse the building hierarchy:
- Expand/collapse levels to navigate structure
- **Search** - Filter elements by name
- Click elements to select them in 3D view

## Property Filter

Filter and select elements by properties:

1. Click **+ Category** or **+ Attribute** to add a filter
2. For Category: Select IFC type (e.g., IFCFAN, IFCDUCTSEGMENT)
3. For Attribute: Enter attribute name and value pattern (regex supported)
4. Toggle **Match ALL conditions** for AND/OR logic
5. Click **Apply** to select matching elements

After applying:
- **Isolate** - Show only filtered elements
- **Hide** - Hide filtered elements
- **Clear** - Reset filter

*Try it: Add an Attribute filter with Name containing "Kampmann" to highlight all Kampmann equipment.*

## Settings

Access settings via the icons in the left panel header:

- **Theme** (moon/sun icon) - Toggle dark/light mode
- **Help** (question mark) - Open this user guide
- **Language** (EN/HR) - Switch interface language

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| W/A/S/D | Move (First Person mode) |
| Scroll | Zoom |
| Escape | Deselect / Exit tool |

## Loading Models

The app loads the default model automatically. To load custom models:
- **Load IFC**: Import .ifc files (slower, requires parsing)
- **Load Fragment**: Import .frag files (faster, pre-processed)

**Convert IFC to Fragment**: Use `convert-ifc-to-frag.html` for 5-10x faster loading.

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Model not loading | Wait 30s, check console (F12), refresh |
| Slow performance | Use clipping planes, hide elements, close browser tabs |
| No sensor data | Only pre-configured equipment has BMS data |
| Documents missing | Stored in IndexedDB; clearing browser data removes them |
| Language not changing | Refresh page after toggling language |
