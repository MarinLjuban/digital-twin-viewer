// Internationalization (i18n) system for IFC Viewer
// Supports English (en) and Croatian (hr)

export type Language = 'en' | 'hr';

export interface Translations {
  // Page title
  pageTitle: string;

  // Panel labels
  properties: string;
  model: string;
  selection: string;
  sensors: string;
  settings: string;
  elementProperties: string;
  bmsSensors: string;
  documents: string;
  spatialTree: string;
  propertyFilter: string;

  // Selection indicator
  selectedElement: string;
  nothingSelected: string;

  // Empty states
  noElementSelected: string;
  clickToViewProperties: string;
  selectElementForSensors: string;
  noSensorsLinked: string;
  selectElementForDocuments: string;
  noDocumentsLinked: string;

  // Filter panel
  addCategory: string;
  addAttribute: string;
  matchAllConditions: string;
  apply: string;
  clear: string;
  isolate: string;
  hide: string;
  ifcCategory: string;
  attributeName: string;
  valueRegex: string;
  elementsFound: string;

  // Toolbar - Navigation
  navigate: string;
  orbit: string;
  firstPerson: string;
  planView: string;

  // Toolbar - Measurement
  measure: string;
  length: string;
  area: string;
  clearMeasurements: string;

  // Toolbar - Section
  section: string;
  createSection: string;
  showPlanes: string;
  deleteAll: string;

  // Toolbar - Visibility
  visibility: string;
  ghost: string;
  showAll: string;

  // Toolbar - Views
  views: string;
  floorPlans: string;
  elevations: string;
  exit2D: string;
  savedViews: string;

  // Documents
  uploadDocument: string;
  addDocument: string;
  documentName: string;
  documentType: string;
  documentDate: string;
  descriptionOptional: string;
  enterDocumentName: string;
  addDescription: string;
  upload: string;
  save: string;
  cancel: string;
  view: string;
  edit: string;
  download: string;
  delete: string;
  pleaseEnterDocumentName: string;

  // Document types
  docTypeManual: string;
  docTypeSpecification: string;
  docTypeDrawing: string;
  docTypeReport: string;
  docTypeWarranty: string;
  docTypeCertificate: string;
  docTypeMaintenance: string;
  docTypeOther: string;

  // BMS Sensors
  clickToHighlight: string;
  clickToViewTrend: string;
  lastUpdated: string;
  sensorHistory: string;
  sensorTrend: string;
  close: string;
  loading: string;
  noHistoricalData: string;
  hours24: string;
  days7: string;
  days30: string;
  current: string;
  min: string;
  max: string;
  average: string;

  // Sensor types
  sensorTemperature: string;
  sensorHumidity: string;
  sensorOccupancy: string;
  sensorCo2: string;
  sensorEnergy: string;
  sensorLighting: string;
  sensorAirflow: string;
  sensorPressure: string;

  // Status
  statusNormal: string;
  statusWarning: string;
  statusAlarm: string;

  // Help panel
  userGuide: string;

  // Search
  search: string;

  // Misc
  guid: string;
  copyValue: string;
  valueCopied: string;

  // BCF Topics
  BCF: string;
  bcfTopics: string;
  createTopic: string;
  noTopics: string;
  noTopicsDesc: string;
  topicTitle: string;
  topicType: string;
  topicStatus: string;
  topicPriority: string;
  topicDescription: string;
  create: string;
  deleteTopic: string;
  bcfIssue: string;
  bcfRemark: string;
  bcfRequest: string;
  bcfFault: string;
  bcfOpen: string;
  bcfInProgress: string;
  bcfResolved: string;
  bcfClosed: string;
  goToViewpoint: string;
  noViewpoint: string;
  titleRequired: string;
  exportBcf: string;
  importBcf: string;
  bcfExported: string;
  bcfImported: string;
  bcfImportError: string;
}

const translations: Record<Language, Translations> = {
  en: {
    // Page title
    pageTitle: 'IFC Viewer',

    // Panel labels
    properties: 'Properties',
    model: 'Model',
    selection: 'Selection',
    sensors: 'Sensors',
    settings: 'Settings',
    elementProperties: 'Element Properties',
    bmsSensors: 'BMS Sensors',
    documents: 'Documents',
    spatialTree: 'Spatial Tree',
    propertyFilter: 'Property Filter',

    // Selection indicator
    selectedElement: 'Selected',
    nothingSelected: 'Nothing selected',

    // Empty states
    noElementSelected: 'No element selected',
    clickToViewProperties: 'Click on a model element to view its properties',
    selectElementForSensors: 'Select an element to view sensor data',
    noSensorsLinked: 'No sensors linked to this element',
    selectElementForDocuments: 'Select an element to view linked documents',
    noDocumentsLinked: 'No documents linked to this element',

    // Filter panel
    addCategory: '+ Category',
    addAttribute: '+ Attribute',
    matchAllConditions: 'Match ALL conditions (AND)',
    apply: 'Apply',
    clear: 'Clear',
    isolate: 'Isolate',
    hide: 'Hide',
    ifcCategory: 'IFC Category',
    attributeName: 'Attribute Name',
    valueRegex: 'Value (regex)',
    elementsFound: 'elements found',

    // Toolbar - Navigation
    navigate: 'Navigate',
    orbit: 'Orbit',
    firstPerson: 'First Person',
    planView: 'Plan View',

    // Toolbar - Measurement
    measure: 'Measure',
    length: 'Length',
    area: 'Area',
    clearMeasurements: 'Clear',

    // Toolbar - Section
    section: 'Section',
    createSection: 'Section',
    showPlanes: 'Show Planes',
    deleteAll: 'Delete All',

    // Toolbar - Visibility
    visibility: 'Visibility',
    ghost: 'Ghost',
    showAll: 'Show All',

    // Toolbar - Views
    views: 'Views',
    floorPlans: 'Floor Plans',
    elevations: 'Elevations',
    exit2D: 'Exit 2D',
    savedViews: 'Saved Views',

    // Documents
    uploadDocument: 'Upload Document',
    addDocument: 'Add Document',
    documentName: 'Document Name *',
    documentType: 'Document Type',
    documentDate: 'Document Date',
    descriptionOptional: 'Description (optional)',
    enterDocumentName: 'Enter document name',
    addDescription: 'Add a description...',
    upload: 'Upload',
    save: 'Save',
    cancel: 'Cancel',
    view: 'View',
    edit: 'Edit',
    download: 'Download',
    delete: 'Delete',
    pleaseEnterDocumentName: 'Please enter a document name.',

    // Document types
    docTypeManual: 'Manual',
    docTypeSpecification: 'Specification',
    docTypeDrawing: 'Drawing',
    docTypeReport: 'Report',
    docTypeWarranty: 'Warranty',
    docTypeCertificate: 'Certificate',
    docTypeMaintenance: 'Maintenance',
    docTypeOther: 'Other',

    // BMS Sensors
    clickToHighlight: 'Click to highlight this element in the 3D view',
    clickToViewTrend: 'Click to view historical trend',
    lastUpdated: 'Last updated',
    sensorHistory: 'Sensor History',
    sensorTrend: 'Trend',
    close: 'Close',
    loading: 'Loading...',
    noHistoricalData: 'No historical data available',
    hours24: '24h',
    days7: '7d',
    days30: '30d',
    current: 'Current',
    min: 'Min',
    max: 'Max',
    average: 'Average',

    // Sensor types
    sensorTemperature: 'Temperature',
    sensorHumidity: 'Humidity',
    sensorOccupancy: 'Occupancy',
    sensorCo2: 'CO2',
    sensorEnergy: 'Energy',
    sensorLighting: 'Lighting',
    sensorAirflow: 'Airflow',
    sensorPressure: 'Pressure',

    // Status
    statusNormal: 'NORMAL',
    statusWarning: 'WARNING',
    statusAlarm: 'ALARM',

    // Help panel
    userGuide: 'User Guide',

    // Search
    search: 'Search...',

    // Misc
    guid: 'GUID',
    copyValue: 'Click to copy value',
    valueCopied: 'Value copied!',

    // BCF Topics
    BCF: 'Work Orders',
    bcfTopics: 'Work Orders',
    createTopic: 'Create Work Orders',
    noTopics: 'No work orders yet',
    noTopicsDesc: 'Create a work order to track issues and link them to model elements',
    topicTitle: 'Title',
    topicType: 'Type',
    topicStatus: 'Status',
    topicPriority: 'Priority',
    topicDescription: 'Description',
    create: 'Create',
    deleteTopic: 'Delete',
    bcfIssue: 'Issue',
    bcfRemark: 'Remark',
    bcfRequest: 'Request',
    bcfFault: 'Fault',
    bcfOpen: 'Open',
    bcfInProgress: 'In Progress',
    bcfResolved: 'Resolved',
    bcfClosed: 'Closed',
    goToViewpoint: 'Go to viewpoint',
    noViewpoint: 'No viewpoint saved',
    titleRequired: 'Title is required',
    exportBcf: 'Export BCF',
    importBcf: 'Import BCF',
    bcfExported: 'BCF exported successfully',
    bcfImported: 'BCF imported successfully',
    bcfImportError: 'Error importing BCF file',
  },

  hr: {
    // Page title
    pageTitle: 'IFC Preglednik',

    // Panel labels
    properties: 'Svojstva',
    model: 'Model',
    selection: 'Odabir',
    sensors: 'Senzori',
    settings: 'Postavke',
    elementProperties: 'Svojstva elementa',
    bmsSensors: 'BMS Senzori',
    documents: 'Dokumenti',
    spatialTree: 'Prostorna struktura',
    propertyFilter: 'Filter svojstava',

    // Selection indicator
    selectedElement: 'Odabrano',
    nothingSelected: 'Ništa nije odabrano',

    // Empty states
    noElementSelected: 'Nijedan element nije odabran',
    clickToViewProperties: 'Kliknite na element modela za prikaz svojstava',
    selectElementForSensors: 'Odaberite element za prikaz podataka senzora',
    noSensorsLinked: 'Nema senzora povezanih s ovim elementom',
    selectElementForDocuments: 'Odaberite element za prikaz povezanih dokumenata',
    noDocumentsLinked: 'Nema dokumenata povezanih s ovim elementom',

    // Filter panel
    addCategory: '+ Kategorija',
    addAttribute: '+ Atribut',
    matchAllConditions: 'Zadovolji SVE uvjete (I)',
    apply: 'Primijeni',
    clear: 'Obriši',
    isolate: 'Izoliraj',
    hide: 'Sakrij',
    ifcCategory: 'IFC Kategorija',
    attributeName: 'Naziv atributa',
    valueRegex: 'Vrijednost (regex)',
    elementsFound: 'elemenata pronađeno',

    // Toolbar - Navigation
    navigate: 'Navigacija',
    orbit: 'Orbita',
    firstPerson: 'Prva osoba',
    planView: 'Tlocrt',

    // Toolbar - Measurement
    measure: 'Mjerenje',
    length: 'Duljina',
    area: 'Površina',
    clearMeasurements: 'Obriši',

    // Toolbar - Section
    section: 'Presjek',
    createSection: 'Presjek',
    showPlanes: 'Prikaži ravnine',
    deleteAll: 'Izbriši sve',

    // Toolbar - Visibility
    visibility: 'Vidljivost',
    ghost: 'Prozirnost',
    showAll: 'Prikaži sve',

    // Toolbar - Views
    views: 'Pogledi',
    floorPlans: 'Tlocrti',
    elevations: 'Pročelja',
    exit2D: 'Izlaz 2D',
    savedViews: 'Spremljeni pogledi',

    // Documents
    uploadDocument: 'Učitaj dokument',
    addDocument: 'Dodaj dokument',
    documentName: 'Naziv dokumenta *',
    documentType: 'Vrsta dokumenta',
    documentDate: 'Datum dokumenta',
    descriptionOptional: 'Opis (neobavezno)',
    enterDocumentName: 'Unesite naziv dokumenta',
    addDescription: 'Dodajte opis...',
    upload: 'Učitaj',
    save: 'Spremi',
    cancel: 'Odustani',
    view: 'Pregledaj',
    edit: 'Uredi',
    download: 'Preuzmi',
    delete: 'Izbriši',
    pleaseEnterDocumentName: 'Molimo unesite naziv dokumenta.',

    // Document types
    docTypeManual: 'Priručnik',
    docTypeSpecification: 'Specifikacija',
    docTypeDrawing: 'Crtež',
    docTypeReport: 'Izvještaj',
    docTypeWarranty: 'Jamstvo',
    docTypeCertificate: 'Certifikat',
    docTypeMaintenance: 'Održavanje',
    docTypeOther: 'Ostalo',

    // BMS Sensors
    clickToHighlight: 'Kliknite za označavanje elementa u 3D prikazu',
    clickToViewTrend: 'Kliknite za prikaz povijesnog trenda',
    lastUpdated: 'Zadnje ažurirano',
    sensorHistory: 'Povijest senzora',
    sensorTrend: 'Trend',
    close: 'Zatvori',
    loading: 'Učitavanje...',
    noHistoricalData: 'Nema dostupnih povijesnih podataka',
    hours24: '24h',
    days7: '7d',
    days30: '30d',
    current: 'Trenutno',
    min: 'Min',
    max: 'Maks',
    average: 'Prosjek',

    // Sensor types
    sensorTemperature: 'Temperatura',
    sensorHumidity: 'Vlažnost',
    sensorOccupancy: 'Zauzetost',
    sensorCo2: 'CO2',
    sensorEnergy: 'Energija',
    sensorLighting: 'Rasvjeta',
    sensorAirflow: 'Protok zraka',
    sensorPressure: 'Tlak',

    // Status
    statusNormal: 'NORMALNO',
    statusWarning: 'UPOZORENJE',
    statusAlarm: 'ALARM',

    // Help panel
    userGuide: 'Korisnički vodič',

    // Search
    search: 'Pretraži...',

    // Misc
    guid: 'GUID',
    copyValue: 'Kliknite za kopiranje vrijednosti',
    valueCopied: 'Vrijednost kopirana!',

    // BCF Topics
    BCF: 'Radni nalozi',
    bcfTopics: 'Radni nalozi',
    createTopic: 'Stvori radni nalog',
    noTopics: 'Nema tema',
    noTopicsDesc: 'Stvorite radni nalog za praćenje problema i povezivanje s elementima modela',
    topicTitle: 'Naslov',
    topicType: 'Vrsta',
    topicStatus: 'Status',
    topicPriority: 'Prioritet',
    topicDescription: 'Opis',
    create: 'Stvori',
    deleteTopic: 'Izbriši',
    bcfIssue: 'Problem',
    bcfRemark: 'Napomena',
    bcfRequest: 'Zahtjev',
    bcfFault: 'Kvar',
    bcfOpen: 'Otvoreno',
    bcfInProgress: 'U tijeku',
    bcfResolved: 'Riješeno',
    bcfClosed: 'Zatvoreno',
    goToViewpoint: 'Idi na pogled',
    noViewpoint: 'Nema spremljenog pogleda',
    titleRequired: 'Naslov je obavezan',
    exportBcf: 'Izvezi BCF',
    importBcf: 'Uvezi BCF',
    bcfExported: 'BCF uspješno izvezen',
    bcfImported: 'BCF uspješno uvezen',
    bcfImportError: 'Greška pri uvozu BCF datoteke',
  }
};

// Current language state
let currentLanguage: Language = 'en';

// Event listeners for language changes
const languageChangeListeners: ((lang: Language) => void)[] = [];

/**
 * Get current language
 */
export const getLanguage = (): Language => currentLanguage;

/**
 * Set current language and notify listeners
 */
export const setLanguage = (lang: Language): void => {
  if (lang !== currentLanguage) {
    currentLanguage = lang;
    localStorage.setItem('ifc-viewer-language', lang);

    // Update document lang attribute
    document.documentElement.setAttribute('lang', lang);

    // Notify all listeners
    for (const listener of languageChangeListeners) {
      listener(lang);
    }
  }
};

/**
 * Subscribe to language changes
 */
export const onLanguageChange = (callback: (lang: Language) => void): (() => void) => {
  languageChangeListeners.push(callback);
  return () => {
    const index = languageChangeListeners.indexOf(callback);
    if (index > -1) {
      languageChangeListeners.splice(index, 1);
    }
  };
};

/**
 * Get translation for a key
 */
export const t = (key: keyof Translations): string => {
  return translations[currentLanguage][key] || translations.en[key] || key;
};

/**
 * Get all translations for current language
 */
export const getTranslations = (): Translations => {
  return translations[currentLanguage];
};

/**
 * Get sensor type label
 */
export const getSensorTypeLabel = (sensorType: string): string => {
  const sensorKey = `sensor${sensorType.charAt(0).toUpperCase() + sensorType.slice(1)}` as keyof Translations;
  return t(sensorKey) || sensorType.charAt(0).toUpperCase() + sensorType.slice(1);
};

/**
 * Get document type label (translated)
 */
export const getDocumentTypeLabel = (docType: string): string => {
  const typeMap: Record<string, keyof Translations> = {
    'manual': 'docTypeManual',
    'specification': 'docTypeSpecification',
    'drawing': 'docTypeDrawing',
    'report': 'docTypeReport',
    'warranty': 'docTypeWarranty',
    'certificate': 'docTypeCertificate',
    'maintenance': 'docTypeMaintenance',
    'other': 'docTypeOther',
  };
  const key = typeMap[docType];
  return key ? t(key) : docType;
};

/**
 * Get translated document types for dropdowns
 */
export const getDocumentTypes = (): { value: string; label: string }[] => {
  return [
    { value: 'manual', label: t('docTypeManual') },
    { value: 'specification', label: t('docTypeSpecification') },
    { value: 'drawing', label: t('docTypeDrawing') },
    { value: 'report', label: t('docTypeReport') },
    { value: 'warranty', label: t('docTypeWarranty') },
    { value: 'certificate', label: t('docTypeCertificate') },
    { value: 'maintenance', label: t('docTypeMaintenance') },
    { value: 'other', label: t('docTypeOther') },
  ];
};

/**
 * Get status label (translated)
 */
export const getStatusLabel = (status: 'normal' | 'warning' | 'alarm'): string => {
  const statusMap: Record<string, keyof Translations> = {
    'normal': 'statusNormal',
    'warning': 'statusWarning',
    'alarm': 'statusAlarm',
  };
  return t(statusMap[status]);
};

/**
 * Initialize i18n from localStorage or browser preference
 */
export const initI18n = (): void => {
  // Check localStorage first
  const savedLang = localStorage.getItem('ifc-viewer-language') as Language | null;
  if (savedLang && (savedLang === 'en' || savedLang === 'hr')) {
    currentLanguage = savedLang;
  } else {
    // Check browser language
    const browserLang = navigator.language.toLowerCase();
    if (browserLang.startsWith('hr')) {
      currentLanguage = 'hr';
    }
  }

  // Set document lang attribute
  document.documentElement.setAttribute('lang', currentLanguage);
};

/**
 * Toggle language between English and Croatian
 */
export const toggleLanguage = (): Language => {
  const newLang: Language = currentLanguage === 'en' ? 'hr' : 'en';
  setLanguage(newLang);
  return newLang;
};

// Initialize on module load
initI18n();

export default {
  t,
  getLanguage,
  setLanguage,
  toggleLanguage,
  onLanguageChange,
  getTranslations,
  getSensorTypeLabel,
  getDocumentTypeLabel,
  getDocumentTypes,
  getStatusLabel,
  initI18n,
};
