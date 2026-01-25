/**
 * Mock BMS (Building Management System) API
 * Simulates sensor data for digital twin integration
 * Data is coupled to IFC elements via GlobalId (GUID)
 *
 * This mock API simulates a real BMS database where sensor data
 * is pre-configured and linked to specific IFC element GUIDs.
 */

// Sensor types supported by the BMS
export type SensorType =
  | "temperature"
  | "humidity"
  | "occupancy"
  | "co2"
  | "energy"
  | "lighting"
  | "airflow"
  | "pressure";

// Sensor reading with timestamp
export interface SensorReading {
  value: number;
  unit: string;
  timestamp: Date;
  status: "normal" | "warning" | "alarm";
}

// Sensor configuration
export interface SensorConfig {
  id: string;
  type: SensorType;
  name: string;
  minValue: number;
  maxValue: number;
  unit: string;
  warningThreshold: number;
  alarmThreshold: number;
}

// BMS data point linked to an IFC element
export interface BMSDataPoint {
  ifcGuid: string;
  elementName: string;
  sensors: Map<SensorType, SensorReading>;
  lastUpdated: Date;
}

// Historical data point
export interface HistoricalReading {
  timestamp: Date;
  value: number;
}

// Sensor configurations by type
const sensorConfigs: Record<SensorType, Omit<SensorConfig, "id" | "name">> = {
  temperature: { type: "temperature", minValue: 15, maxValue: 35, unit: "°C", warningThreshold: 28, alarmThreshold: 32 },
  humidity: { type: "humidity", minValue: 20, maxValue: 90, unit: "%", warningThreshold: 70, alarmThreshold: 85 },
  occupancy: { type: "occupancy", minValue: 0, maxValue: 100, unit: "people", warningThreshold: 80, alarmThreshold: 95 },
  co2: { type: "co2", minValue: 400, maxValue: 2000, unit: "ppm", warningThreshold: 1000, alarmThreshold: 1500 },
  energy: { type: "energy", minValue: 0, maxValue: 500, unit: "kWh", warningThreshold: 350, alarmThreshold: 450 },
  lighting: { type: "lighting", minValue: 0, maxValue: 100, unit: "%", warningThreshold: 90, alarmThreshold: 100 },
  airflow: { type: "airflow", minValue: 0, maxValue: 2000, unit: "m³/h", warningThreshold: 1500, alarmThreshold: 1800 },
  pressure: { type: "pressure", minValue: 95, maxValue: 105, unit: "kPa", warningThreshold: 102, alarmThreshold: 104 },
};

// Mock database of IFC GUIDs mapped to sensor types
// This simulates a real BMS database where sensors are pre-linked to IFC elements
const mockSensorMappings: Map<string, SensorType[]> = new Map();

// Store for simulated sensor readings
const sensorDataStore: Map<string, BMSDataPoint> = new Map();

// Subscribers for real-time updates
type UpdateCallback = (data: BMSDataPoint) => void;
const subscribers: Map<string, Set<UpdateCallback>> = new Map();

// Simulation interval
let simulationInterval: number | null = null;

/**
 * Pre-configured BMS database entries
 * In a real system, this would be loaded from a database/API
 * Format: { ifcGuid, elementName, sensorTypes }
 */
const MOCK_BMS_DATABASE: Array<{ ifcGuid: string; elementName: string; sensorTypes: SensorType[] }> = [
  // ============================================
  // Mechanical Equipment - Trench Heating
  // ============================================
  { ifcGuid: "2Z6LRLJyP8pPa$Guk37Xtu", elementName: "Kampmann_TrenchHeating_2pipe: HK320", sensorTypes: ["temperature", "energy"] },

  // ============================================
  // Mechanical Equipment - VRF System
  // ============================================
  { ifcGuid: "2Z6LRLJyP8pPa$Guk37Xt0", elementName: "BIMo_Clivet_VRF_Outdoor_MV6i_500T: MV6-i500WV2GN1", sensorTypes: ["temperature", "energy", "pressure"] },

  // ============================================
  // Mechanical Equipment - Fan Coil Units (Ceiling)
  // ============================================
  { ifcGuid: "2Z6LRLJyP8pPa$Guk37Xt1", elementName: "Kapmann_FanCoil_Ceiling: 1250x495_TopConnection (FCU-01)", sensorTypes: ["temperature", "airflow", "energy"] },
  { ifcGuid: "2Z6LRLJyP8pPa$Guk37Xt2", elementName: "Kapmann_FanCoil_Ceiling: 1250x495_TopConnection (FCU-02)", sensorTypes: ["temperature", "airflow", "energy"] },
  { ifcGuid: "2Z6LRLJyP8pPa$Guk37Xt3", elementName: "Kapmann_FanCoil_Ceiling: 1250x495_TopConnection (FCU-03)", sensorTypes: ["temperature", "airflow", "energy"] },
  { ifcGuid: "2Z6LRLJyP8pPa$Guk37XmN", elementName: "Kapmann_FanCoil_Ceiling: 1250x495_TopConnection (FCU-04)", sensorTypes: ["temperature", "airflow", "energy"] },
  { ifcGuid: "2Z6LRLJyP8pPa$Guk37XmO", elementName: "Kapmann_FanCoil_Ceiling: 1250x495_TopConnection (FCU-05)", sensorTypes: ["temperature", "airflow", "energy"] },
  { ifcGuid: "2Z6LRLJyP8pPa$Guk37Xpb", elementName: "Kapmann_FanCoil_Ceiling: 1250x495_TopConnection (FCU-06)", sensorTypes: ["temperature", "airflow", "energy"] },

  // ============================================
  // Air Terminals - Exhaust Valves
  // ============================================
  { ifcGuid: "2Z6LRLJyP8pPa$Guk37Xp4", elementName: "Generic_PoppetValve_Round_Exhaust: NW 100 (EXH-01)", sensorTypes: ["airflow"] },
  { ifcGuid: "2Z6LRLJyP8pPa$Guk37XCp", elementName: "Generic_PoppetValve_Round_Exhaust: NW 100 (EXH-02)", sensorTypes: ["airflow"] },
  { ifcGuid: "2Z6LRLJyP8pPa$Guk37XCC", elementName: "Generic_PoppetValve_Round_Exhaust: NW 100 (EXH-03)", sensorTypes: ["airflow"] },
  { ifcGuid: "2Z6LRLJyP8pPa$Guk37XCD", elementName: "Generic_PoppetValve_Round_Exhaust: NW 100 (EXH-04)", sensorTypes: ["airflow"] },

  // ============================================
  // Air Terminals - Supply Terminals
  // ============================================
  { ifcGuid: "2Z6LRLJyP8pPa$Guk37Xp5", elementName: "Klimaoprema_AirTerminal_OAH1: 425x325 (SUP-01)", sensorTypes: ["airflow", "temperature"] },
  { ifcGuid: "2Z6LRLJyP8pPa$Guk37XDs", elementName: "Klimaoprema_AirTerminal_OAH1: 425x125 (SUP-02)", sensorTypes: ["airflow", "temperature"] },

  // ============================================
  // Mechanical Equipment - Axial Fans
  // ============================================
  { ifcGuid: "2Z6LRLJyP8pPa$Guk37Xp6", elementName: "Aereco_AxialFan_EGPAML: EGP.AML.31.2.0.75 (FAN-01)", sensorTypes: ["airflow", "energy"] },
  { ifcGuid: "2Z6LRLJyP8pPa$Guk37XDv", elementName: "Infiniair_AxialFan_DuctMounted: Diameter_100 (FAN-02)", sensorTypes: ["airflow", "energy"] },

  // ============================================
  // Plumbing Fixtures - Roof Drains
  // ============================================
  { ifcGuid: "2Z6LRLJyP8pPa$Guk37XCX", elementName: "Geberit_PlumbingFixture_Pluvia: 125/50 (RD-01)", sensorTypes: ["pressure"] },
  { ifcGuid: "2Z6LRLJyP8pPa$Guk37XCZ", elementName: "Geberit_PlumbingFixture_Pluvia: 125/50 (RD-02)", sensorTypes: ["pressure"] },
  { ifcGuid: "2Z6LRLJyP8pPa$Guk37XCa", elementName: "Geberit_PlumbingFixture_Pluvia: 125/50 (RD-03)", sensorTypes: ["pressure"] },

  // ============================================
  // Legacy/Demo entries
  // ============================================
  { ifcGuid: "2Z6LRLJyP8pPa$Guk37XvH", elementName: "AHU-01", sensorTypes: ["temperature", "humidity", "airflow", "energy", "pressure"] },
  { ifcGuid: "2LftbZkEr4axg6d3FRT_e2", elementName: "Room 101", sensorTypes: ["temperature", "humidity", "occupancy", "co2", "lighting"] },
  { ifcGuid: "1hOSwPNfz2Bw_3Z7ePjS2T", elementName: "Chiller CH-01", sensorTypes: ["temperature", "energy", "pressure"] },
  { ifcGuid: "2nFhP8Tq94TgX6dNc7LqW1", elementName: "VAV Box VAV-01", sensorTypes: ["airflow", "temperature"] },
  { ifcGuid: "4kLmN9Rw31SaYbZcJhVuP8", elementName: "Pump P-01", sensorTypes: ["pressure", "energy", "temperature"] },
];

/**
 * Initialize the mock BMS database
 * This loads pre-configured sensor data linked to IFC GUIDs
 */
const initializeMockDatabase = (): void => {
  console.log("[BMS API] Initializing mock database...");
  console.log("[BMS API] MOCK_BMS_DATABASE entries:", MOCK_BMS_DATABASE);

  for (const entry of MOCK_BMS_DATABASE) {
    console.log(`[BMS API] Registering: ${entry.elementName} with GUID: "${entry.ifcGuid}"`);
    registerElement(entry.ifcGuid, entry.elementName, entry.sensorTypes);
  }

  console.log(`[BMS API] Database initialized with ${sensorDataStore.size} elements`);
  console.log("[BMS API] Registered GUIDs:", Array.from(sensorDataStore.keys()));
};

/**
 * Generate a random value within sensor range with some noise
 */
const generateSensorValue = (config: Omit<SensorConfig, "id" | "name">, baseValue?: number): number => {
  const range = config.maxValue - config.minValue;
  const base = baseValue ?? (config.minValue + range * 0.5);
  // Add random noise (-5% to +5% of range)
  const noise = (Math.random() - 0.5) * range * 0.1;
  const value = Math.max(config.minValue, Math.min(config.maxValue, base + noise));
  return Math.round(value * 10) / 10;
};

/**
 * Determine sensor status based on thresholds
 */
const getSensorStatus = (value: number, config: Omit<SensorConfig, "id" | "name">): "normal" | "warning" | "alarm" => {
  if (value >= config.alarmThreshold) return "alarm";
  if (value >= config.warningThreshold) return "warning";
  return "normal";
};

/**
 * Register an IFC element with the BMS system
 * This simulates the coupling between BIM and BMS
 */
export const registerElement = (ifcGuid: string, elementName: string, sensorTypes: SensorType[]): void => {
  mockSensorMappings.set(ifcGuid, sensorTypes);

  // Initialize sensor readings
  const sensors = new Map<SensorType, SensorReading>();
  for (const type of sensorTypes) {
    const config = sensorConfigs[type];
    const value = generateSensorValue(config);
    sensors.set(type, {
      value,
      unit: config.unit,
      timestamp: new Date(),
      status: getSensorStatus(value, config),
    });
  }

  sensorDataStore.set(ifcGuid, {
    ifcGuid,
    elementName,
    sensors,
    lastUpdated: new Date(),
  });
};

/**
 * Check if an element has BMS data
 */
export const hasData = (ifcGuid: string): boolean => {
  return sensorDataStore.has(ifcGuid);
};

/**
 * Get current sensor data for an IFC element
 */
export const getData = async (ifcGuid: string): Promise<BMSDataPoint | null> => {
  // Simulate API latency
  await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 100));
  return sensorDataStore.get(ifcGuid) || null;
};

/**
 * Get sensor data for multiple IFC elements
 */
export const getMultipleData = async (ifcGuids: string[]): Promise<Map<string, BMSDataPoint>> => {
  console.log("[BMS API] getMultipleData called with GUIDs:", ifcGuids);
  console.log("[BMS API] Current sensorDataStore keys:", Array.from(sensorDataStore.keys()));

  await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 150));
  const result = new Map<string, BMSDataPoint>();
  for (const guid of ifcGuids) {
    console.log(`[BMS API] Checking GUID: "${guid}"`);
    const data = sensorDataStore.get(guid);
    if (data) {
      console.log(`[BMS API] Found data for GUID: ${guid}`, data);
      result.set(guid, data);
    } else {
      console.log(`[BMS API] No data found for GUID: "${guid}"`);
      // Check for similar GUIDs (debugging)
      for (const storedGuid of sensorDataStore.keys()) {
        if (storedGuid.includes(guid.substring(0, 8)) || guid.includes(storedGuid.substring(0, 8))) {
          console.log(`[BMS API] Similar GUID in store: "${storedGuid}"`);
        }
      }
    }
  }
  console.log("[BMS API] Returning result with size:", result.size);
  return result;
};

/**
 * Get historical data for a sensor (mock implementation)
 */
export const getHistoricalData = async (
  ifcGuid: string,
  sensorType: SensorType,
  hours: number = 24
): Promise<HistoricalReading[]> => {
  await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));

  const config = sensorConfigs[sensorType];
  const readings: HistoricalReading[] = [];
  const now = new Date();
  const pointsPerHour = 4; // 15-minute intervals

  let baseValue = config.minValue + (config.maxValue - config.minValue) * 0.5;

  for (let i = hours * pointsPerHour; i >= 0; i--) {
    const timestamp = new Date(now.getTime() - i * 15 * 60 * 1000);
    // Add time-based variation (simulate daily patterns)
    const hourOfDay = timestamp.getHours();
    const timeMultiplier = Math.sin((hourOfDay - 6) * Math.PI / 12) * 0.3 + 1;
    const value = generateSensorValue(config, baseValue * timeMultiplier);
    readings.push({ timestamp, value });
    baseValue = value; // Use as base for next reading for continuity
  }

  return readings;
};

/**
 * Subscribe to real-time updates for an element
 */
export const subscribe = (ifcGuid: string, callback: UpdateCallback): () => void => {
  if (!subscribers.has(ifcGuid)) {
    subscribers.set(ifcGuid, new Set());
  }
  subscribers.get(ifcGuid)!.add(callback);

  // Return unsubscribe function
  return () => {
    subscribers.get(ifcGuid)?.delete(callback);
  };
};

/**
 * Get all elements with sensor data
 */
export const getAllMonitoredElements = (): string[] => {
  return Array.from(sensorDataStore.keys());
};

/**
 * Get elements with alarms or warnings
 */
export const getAlertsElements = (): Map<string, BMSDataPoint> => {
  const alerts = new Map<string, BMSDataPoint>();
  for (const [guid, data] of sensorDataStore) {
    for (const [, reading] of data.sensors) {
      if (reading.status === "alarm" || reading.status === "warning") {
        alerts.set(guid, data);
        break;
      }
    }
  }
  return alerts;
};

/**
 * Simulate sensor updates (call this periodically)
 */
const simulateUpdates = (): void => {
  for (const [guid, data] of sensorDataStore) {
    const sensorTypes = mockSensorMappings.get(guid) || [];

    for (const type of sensorTypes) {
      const config = sensorConfigs[type];
      const currentReading = data.sensors.get(type);
      const newValue = generateSensorValue(config, currentReading?.value);

      data.sensors.set(type, {
        value: newValue,
        unit: config.unit,
        timestamp: new Date(),
        status: getSensorStatus(newValue, config),
      });
    }

    data.lastUpdated = new Date();

    // Notify subscribers
    const callbacks = subscribers.get(guid);
    if (callbacks) {
      for (const callback of callbacks) {
        callback(data);
      }
    }
  }
};

/**
 * Start real-time simulation
 */
export const startSimulation = (intervalMs: number = 5000): void => {
  if (simulationInterval) {
    clearInterval(simulationInterval);
  }
  simulationInterval = window.setInterval(simulateUpdates, intervalMs);
  console.log(`BMS simulation started (update interval: ${intervalMs}ms)`);
};

/**
 * Stop real-time simulation
 */
export const stopSimulation = (): void => {
  if (simulationInterval) {
    clearInterval(simulationInterval);
    simulationInterval = null;
    console.log("BMS simulation stopped");
  }
};

/**
 * Initialize the BMS mock system
 * Loads the pre-configured database and starts simulation
 */
export const initialize = (): void => {
  if (sensorDataStore.size === 0) {
    initializeMockDatabase();
  }
  startSimulation(5000);
};

/**
 * Add a new element to the BMS database
 * Use this to dynamically register IFC elements with sensors
 */
export const addElement = (ifcGuid: string, elementName: string, sensorTypes: SensorType[]): void => {
  registerElement(ifcGuid, elementName, sensorTypes);
  console.log(`BMS: Added element ${elementName} (${ifcGuid}) with sensors: ${sensorTypes.join(", ")}`);
};

/**
 * Get all registered IFC GUIDs in the BMS database
 */
export const getRegisteredGuids = (): string[] => {
  return Array.from(sensorDataStore.keys());
};

/**
 * Get sensor configuration
 */
export const getSensorConfig = (type: SensorType): Omit<SensorConfig, "id" | "name"> => {
  return sensorConfigs[type];
};

/**
 * Format sensor value with unit
 */
export const formatSensorValue = (reading: SensorReading): string => {
  return `${reading.value} ${reading.unit}`;
};

/**
 * Get status color for visualization
 */
export const getStatusColor = (status: "normal" | "warning" | "alarm"): number => {
  switch (status) {
    case "alarm": return 0xff4444;
    case "warning": return 0xffaa00;
    case "normal": return 0x44ff44;
  }
};

// Export the BMS API as a namespace-like object
export const BMSApi = {
  // Initialization
  initialize,
  addElement,
  registerElement,

  // Query data
  hasData,
  getData,
  getMultipleData,
  getHistoricalData,
  getRegisteredGuids,
  getAllMonitoredElements,
  getAlertsElements,

  // Real-time updates
  subscribe,
  startSimulation,
  stopSimulation,

  // Utilities
  getSensorConfig,
  formatSensorValue,
  getStatusColor,
};

export default BMSApi;
