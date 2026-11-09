/**
 * Crew Health Companion - Data & Reference Engine
 * NASA Space Apps Challenge
 * 
 * Standards & References:
 * - NASA-STD-3001 Volume 1 (Crew Health) & Volume 2 (Habitability & Medical)
 * - NASA Human Research Program (HRP) Evidence Reports
 * - NASA Exploration Medical Capabilities (ExMC) Clinical Database
 */

const NASA_HAZARDS = {
  R: {
    code: 'R',
    name: 'Space Radiation',
    icon: '☢️',
    description: 'Galactic cosmic rays (GCR) and solar particle events (SPE) penetrate spacecraft structures, damaging cellular DNA, suppressing immune function, and elevating cancer and cardiovascular risks.',
    countermeasures: 'Polyethylene radiation shielding, sleep bunker water walls, crew personal dosimeters, and dietary antioxidants.'
  },
  I: {
    code: 'I',
    name: 'Isolation & Confinement',
    icon: '🧘',
    description: 'Extended confinement in tight quarters, sensory deprivation, and isolation from Earth trigger psychological stress, sleep fragmentation, and neurobehavioral deconditioning.',
    countermeasures: 'Circadian lighting schedules, private crew quarters, family video downlinks, mindfulness protocols, and workload deconfliction.'
  },
  D: {
    code: 'D',
    name: 'Distance from Earth',
    icon: '🛰️',
    description: 'Beyond low Earth orbit, real-time ground communications face significant latency (up to 22 minutes one-way to Mars), and physical evacuation to terrestrial hospitals is impossible.',
    countermeasures: 'Autonomous crew medical decision-support systems, ultrasound diagnostics, onboard surgical/pharmaceutical kits, and CMO cross-training.'
  },
  G: {
    code: 'G',
    name: 'Gravity Fields',
    icon: '⚖️',
    description: 'Transitioning between 1-g, microgravity (0-g), lunar gravity (1/6-g), and Martian gravity (3/8-g) causes cephalad fluid shifts, vestibular motion sickness, and bone and muscle atrophy.',
    countermeasures: 'Daily 2-2.5 hour aerobic and resistive exercise (ARED/cycle ergometer), Lower Body Negative Pressure (LBNP) suits, and fluid loading.'
  },
  E: {
    code: 'E',
    name: 'Hostile / Closed Environments',
    icon: '🛸',
    description: 'The spacecraft habitat is a closed ecological loop. Elevated cabin pCO2, floating particulate hazards, toxic dust (lunar regolith), and microbial accumulation endanger crew health.',
    countermeasures: 'ECLSS air scrubbers, HEPA filtration, acoustic ear protection, regolith vacuum airlocks, and antimicrobial surface wipes.'
  }
};

const MISSION_ENVIRONMENTS = {
  iss: {
    id: 'iss',
    name: 'International Space Station (ISS)',
    destination: 'Low Earth Orbit (400 km)',
    gravity: '0 g (Microgravity)',
    commDelay: '0.8 sec (Near real-time)',
    radiationLevel: 'Moderate (~0.5 mSv/day, protected by Van Allen belts)',
    primaryHazards: ['G', 'I', 'E'],
    emphasis: 'Fluid shift, bone/muscle maintenance, and habitat CO2 management. Ground flight surgeons available 24/7 on voice loop.'
  },
  spacecraft: {
    id: 'spacecraft',
    name: 'Deep Space Transit (Orion / Starship)',
    destination: 'Trans-Mars or Trans-Lunar Injection',
    gravity: '0 g (Continuous Microgravity)',
    commDelay: '2 - 15 minutes (One-way latency)',
    radiationLevel: 'High (~1.5 mSv/day, deep space cosmic rays)',
    primaryHazards: ['R', 'D', 'G', 'I'],
    emphasis: 'Severe galactic cosmic radiation, strict confinement, and progressive communication delay requiring crew autonomy.'
  },
  lunar: {
    id: 'lunar',
    name: 'Artemis Lunar Base Camp',
    destination: 'Moon South Pole (Shackleton Crater)',
    gravity: '0.166 g (1/6th Earth gravity)',
    commDelay: '1.3 - 2.5 seconds',
    radiationLevel: 'High (~1.3 mSv/day, surface radiation)',
    primaryHazards: ['R', 'E', 'G'],
    emphasis: 'Abrasive lunar regolith dust inhalation, partial-gravity gait instability, and surface EVA thermal extremes.'
  },
  mars: {
    id: 'mars',
    name: 'Mars Surface Habitat',
    destination: 'Mars (Jezero Crater Outpost)',
    gravity: '0.38 g (3/8th Earth gravity)',
    commDelay: '4 to 22 minutes (One-way lag)',
    radiationLevel: 'Severe (~1.2 - 2.0 mSv/day + solar storms)',
    primaryHazards: ['D', 'R', 'I', 'E', 'G'],
    emphasis: 'Earth evacuation is impossible. Communication latency of up to 22 minutes means astronauts MUST self-assess and triage medical concerns autonomously.'
  }
};

/**
 * CLINICAL REFERENCE RANGES & VALIDATION BOUNDARIES
 * Includes validation bounds, typical healthy ranges, unit labels, and NASA sources
 */
const REFERENCE_RANGES = {
  heartRate: {
    name: 'Resting Heart Rate',
    key: 'heartRate',
    unit: 'bpm',
    minValid: 30,
    maxValid: 250,
    typicalMin: 60,
    typicalMax: 90,
    typicalText: '60 - 90 bpm',
    normalMin: 55,
    normalMax: 90,
    cautionMin: 48,
    cautionMax: 105,
    criticalLow: 45,
    criticalHigh: 115,
    source: 'NASA-STD-3001 Vol 1 §4.2.1',
    description: 'Resting cardiac pulse frequency. Space fluid shifts cause initial bradycardia or deconditioned resting tachycardia.',
    format: (v) => `${Math.round(v)} bpm`
  },
  systolicBP: {
    name: 'Systolic Blood Pressure',
    key: 'systolicBP',
    unit: 'mmHg',
    minValid: 50,
    maxValid: 260,
    typicalMin: 95,
    typicalMax: 125,
    typicalText: '95 - 125 mmHg',
    normalMin: 95,
    normalMax: 125,
    cautionMin: 85,
    cautionMax: 139,
    criticalLow: 80,
    criticalHigh: 150,
    source: 'NASA-STD-3001 Vol 1 §4.2.2 & AHA Guidelines',
    description: 'Cephalad blood redistribution elevates central upper-body blood pressure. Orthostatic intolerance is common upon landing.',
    format: (v) => `${Math.round(v)} mmHg`
  },
  diastolicBP: {
    name: 'Diastolic Blood Pressure',
    key: 'diastolicBP',
    unit: 'mmHg',
    minValid: 30,
    maxValid: 160,
    typicalMin: 60,
    typicalMax: 82,
    typicalText: '60 - 82 mmHg',
    normalMin: 60,
    normalMax: 82,
    cautionMin: 50,
    cautionMax: 89,
    criticalLow: 45,
    criticalHigh: 95,
    source: 'NASA-STD-3001 Vol 1 §4.2.2',
    description: 'Diastolic vascular resistance reading.',
    format: (v) => `${Math.round(v)} mmHg`
  },
  bloodGlucose: {
    name: 'Blood Glucose',
    key: 'bloodGlucose',
    unit: 'mg/dL',
    minValid: 20,
    maxValid: 500,
    typicalMin: 70,
    typicalMax: 105,
    typicalText: '70 - 105 mg/dL (fasting)',
    normalMin: 70,
    normalMax: 105,
    cautionMin: 65,
    cautionMax: 130,
    criticalLow: 60,
    criticalHigh: 160,
    source: 'NASA Human Research Program (HRP) Metabolic Risk Protocol',
    description: 'Fasting blood sugar. Weightlessness induces altered carbohydrate metabolism and mild peripheral insulin resistance.',
    format: (v) => `${Math.round(v)} mg/dL`
  },
  hydrationLitres: {
    name: 'Daily Fluid Intake',
    key: 'hydrationLitres',
    unit: 'Liters',
    minValid: 0,
    maxValid: 10.0,
    typicalMin: 2.2,
    typicalMax: 3.5,
    typicalText: '2.2 - 3.5 L / day',
    normalMin: 2.2,
    normalMax: 3.5,
    cautionMin: 1.6,
    cautionMax: 2.1,
    criticalLow: 1.4,
    criticalHigh: 4.5,
    source: 'NASA Nutritional Requirements for Long-Duration Spaceflight',
    description: 'Urinary volume drops and thirst blunts in zero-g, dramatically increasing the risk of calcium-oxalate kidney stone formation.',
    format: (v) => `${Number(v).toFixed(1)} L`
  },
  bodyTemp: {
    name: 'Core Body Temperature',
    key: 'bodyTemp',
    unit: '°C',
    minValid: 30.0,
    maxValid: 44.0,
    typicalMin: 36.5,
    typicalMax: 37.4,
    typicalText: '36.5 - 37.4 °C',
    normalMin: 36.5,
    normalMax: 37.4,
    cautionMin: 36.0,
    cautionMax: 37.9,
    criticalLow: 35.5,
    criticalHigh: 38.3,
    source: 'ESA/NASA Space Fever Study (Hannibal et al., Scientific Reports)',
    description: 'Astronauts experience resting core temperature elevation (~1°C) due to blunted convective heat dissipation in zero-g.',
    format: (v) => `${Number(v).toFixed(1)} °C`
  },
  spo2: {
    name: 'Blood Oxygen Saturation (SpO2)',
    key: 'spo2',
    unit: '%',
    minValid: 50,
    maxValid: 100,
    typicalMin: 96,
    typicalMax: 100,
    typicalText: '96 - 100%',
    normalMin: 96,
    normalMax: 100,
    cautionMin: 93,
    cautionMax: 95,
    criticalLow: 91,
    criticalHigh: 100,
    source: 'NASA-STD-3001 Vol 2 §6.3 (Atmosphere & Respiration)',
    description: 'Arterial blood oxygen saturation. Module CO2 buildup or suit depressurization degrades oxygen transport.',
    format: (v) => `${Math.round(v)}%`
  },
  respirationRate: {
    name: 'Respiration Rate',
    key: 'respirationRate',
    unit: 'breaths/min',
    minValid: 4,
    maxValid: 60,
    typicalMin: 12,
    typicalMax: 18,
    typicalText: '12 - 18 /min',
    normalMin: 12,
    normalMax: 18,
    cautionMin: 10,
    cautionMax: 22,
    criticalLow: 8,
    criticalHigh: 26,
    source: 'NASA Space Clinical Operations Standards',
    description: 'Ventilatory resting rate. Elevated frequency indicates carbon dioxide pocket inhalation or respiratory irritation.',
    format: (v) => `${Math.round(v)}/min`
  },
  sleepHours: {
    name: 'Sleep Duration',
    key: 'sleepHours',
    unit: 'hours',
    minValid: 0,
    maxValid: 24.0,
    typicalMin: 7.0,
    typicalMax: 8.5,
    typicalText: '7.0 - 8.5 hrs',
    normalMin: 7.0,
    normalMax: 9.0,
    cautionMin: 5.8,
    cautionMax: 7.0,
    criticalLow: 5.5,
    criticalHigh: 11.0,
    source: 'NASA-STD-3001 Vol 1 §4.5 (Behavioral Health Requirements)',
    description: 'Consecutive restorative sleep. Circadian shifts and module noise degrade rapid eye movement and slow-wave sleep.',
    format: (v) => `${Number(v).toFixed(1)} hrs`
  },
  moodScore: {
    name: 'Subjective Mood / Morale',
    key: 'moodScore',
    unit: 'scale (1-10)',
    minValid: 1,
    maxValid: 10,
    typicalMin: 7,
    typicalMax: 10,
    typicalText: '7 - 10 (Good)',
    normalMin: 7,
    normalMax: 10,
    cautionMin: 5,
    cautionMax: 6,
    criticalLow: 4,
    criticalHigh: 10,
    source: 'NASA Behavioral Health & Performance (BHP) Operational Scale',
    description: 'Daily emotional valence and psychological resilience score in confinement.',
    format: (v) => `${Math.round(v)}/10`
  },
  stressLevel: {
    name: 'Cognitive Stress Index',
    key: 'stressLevel',
    unit: 'scale (1-10)',
    minValid: 1,
    maxValid: 10,
    typicalMin: 1,
    typicalMax: 4,
    typicalText: '1 - 4 (Low)',
    normalMin: 1,
    normalMax: 4,
    cautionMin: 5,
    cautionMax: 7,
    criticalLow: 0,
    criticalHigh: 8,
    source: 'NASA Cognition Battery Standard (Basner et al.)',
    description: 'Cognitive workload, mental strain, and task fatigue self-rating.',
    format: (v) => `${Math.round(v)}/10`
  },
  visionScore: {
    name: 'Visual Clarity / SANS Score',
    key: 'visionScore',
    unit: 'scale (1-10)',
    minValid: 1,
    maxValid: 10,
    typicalMin: 8,
    typicalMax: 10,
    typicalText: '8 - 10 (Sharp)',
    normalMin: 8,
    normalMax: 10,
    cautionMin: 6,
    cautionMax: 7,
    criticalLow: 5,
    criticalHigh: 10,
    source: 'NASA Spaceflight-Associated Neuro-ocular Syndrome (SANS) Working Group',
    description: 'Near-point reading acuity and absence of blurred vision or globe flattening.',
    format: (v) => `${Math.round(v)}/10`
  },
  headachePresent: {
    name: 'Headache / Sinus Pressure',
    key: 'headachePresent',
    unit: 'status',
    minValid: 0,
    maxValid: 1,
    typicalMin: 0,
    typicalMax: 0,
    typicalText: 'None (0)',
    normalMin: 0,
    normalMax: 0,
    cautionMin: 1,
    cautionMax: 1,
    criticalLow: 0,
    criticalHigh: 1,
    source: 'NASA Space Medicine Clinical Guidelines (Headache & Intracranial Pressure)',
    description: 'Presence of persistent fronto-temporal space headache or sinus fullness caused by cephalic venous congestion or elevated CO2.',
    format: (v) => (v == 1 ? 'Present' : 'None')
  },
  exerciseMinutes: {
    name: 'Daily Countermeasure Exercise',
    key: 'exerciseMinutes',
    unit: 'minutes',
    minValid: 0,
    maxValid: 360,
    typicalMin: 120,
    typicalMax: 150,
    typicalText: '120 - 150 min',
    normalMin: 120,
    normalMax: 160,
    cautionMin: 75,
    cautionMax: 119,
    criticalLow: 60,
    criticalHigh: 240,
    source: 'NASA Exercise Countermeasures Project Standard (2.5 hr daily prescription)',
    description: 'Combined aerobic and heavy resistive loading to protect bone mineral density and extensor muscle volume.',
    format: (v) => `${Math.round(v)} min`
  },
  spineDiscomfort: {
    name: 'Spine Discomfort / Back Pain',
    key: 'spineDiscomfort',
    unit: 'scale (1-10)',
    minValid: 1,
    maxValid: 10,
    typicalMin: 1,
    typicalMax: 3,
    typicalText: '1 - 3 (Mild/None)',
    normalMin: 1,
    normalMax: 3,
    cautionMin: 4,
    cautionMax: 6,
    criticalLow: 0,
    criticalHigh: 7,
    source: 'NASA Musculoskeletal Countermeasures Protocol (Spinal Elongation)',
    description: 'Lumbar and cervical back pain caused by intervertebral disc decompression and spinal elongation (up to 5-7 cm).',
    format: (v) => `${Math.round(v)}/10`
  },
  muscleWeakness: {
    name: 'Muscle Weakness / Soreness',
    key: 'muscleWeakness',
    unit: 'scale (1-10)',
    minValid: 1,
    maxValid: 10,
    typicalMin: 1,
    typicalMax: 3,
    typicalText: '1 - 3 (Normal)',
    normalMin: 1,
    normalMax: 3,
    cautionMin: 4,
    cautionMax: 6,
    criticalLow: 0,
    criticalHigh: 7,
    source: 'NASA Muscle Atrophy Research Group Standards',
    description: 'Subjective lower-limb weakness or cramping in postural calf and thigh extensor muscles.',
    format: (v) => `${Math.round(v)}/10`
  },
  skinIntegrity: {
    name: 'Skin / Immune Comfort Score',
    key: 'skinIntegrity',
    unit: 'scale (1-10)',
    minValid: 1,
    maxValid: 10,
    typicalMin: 8,
    typicalMax: 10,
    typicalText: '8 - 10 (Intact)',
    normalMin: 8,
    normalMax: 10,
    cautionMin: 6,
    cautionMax: 7,
    criticalLow: 5,
    criticalHigh: 10,
    source: 'NASA Immunology & Microbiome Evidence Report',
    description: 'Dermal barrier health: absence of rashes, contact dermatitis from recirculated cabin air, and viral flares.',
    format: (v) => `${Math.round(v)}/10`
  }
};

/**
 * BODY REGIONS CONFIGURATION
 * Maps to interactive SVG regions, input forms, instructions, and hazard effects
 */
const BODY_REGIONS = {
  brain: {
    id: 'brain',
    name: 'Brain & Cognitive Health',
    subtitle: 'Mood, Sleep, Stress & Circadian Rhythm',
    svgRegionId: 'region-brain',
    simpleDescription: 'Your brain directs decision-making, mood stability, reflexes, and operational focus. Quality sleep and emotional regulation are critical for mission safety.',
    hazards: ['I', 'R', 'E'],
    hazardDetails: [
      {
        hazard: 'I',
        text: 'Extended confinement in tight quarters, absence of day-night cycles, and separation from loved ones cause neurobehavioral fatigue, mood dips, and sleep architecture fragmentation.'
      },
      {
        hazard: 'R',
        text: 'Galactic cosmic rays can trigger neuro-inflammation and subtle deficits in executive cognitive function during multi-year deep space voyages.'
      },
      {
        hazard: 'E',
        text: 'Elevated spacecraft CO2 levels (>3 mmHg) cause headaches, cognitive lethargy, and sleep disturbances.'
      }
    ],
    primaryIndicators: ['sleepHours', 'moodScore'],
    secondaryIndicators: ['stressLevel'],
    measurementGuide: [
      '1. Review your sleep duration: Check your biometric sleep band or log total uninterrupted sleep hours.',
      '2. Subjective Mood Self-Audit: Rate your morale on a 1-10 scale honestly (reflect on crew cohesion and motivation).',
      '3. Stress Check: Assess cognitive workload, mental fatigue, or persistent space head pressure.'
    ],
    countermeasures: [
      'Engage in 30 minutes of high-intensity blue-enriched light therapy upon wake-up to synchronize circadian rhythm.',
      'Schedule a 20-minute private family communication pass or listen to nature audio soundscapes.',
      'Review daily task manifest with ground flight controller to de-conflict high-workload timeline blocks.',
      'Practice 10 minutes of guided progressive muscle relaxation or mindfulness before entering sleep restraint.'
    ],
    escalationGuidance: 'If sleep duration is <5.5 hours for 3 consecutive days, or mood score drops below 4/10 with feelings of severe burnout or dissociation, notify the Ground Flight Surgeon (or onboard medical lead during Mars comm blackout). Consider prescription melatonin or sleep aid per medical kit manifest.'
  },

  eyes: {
    id: 'eyes',
    name: 'Eyes & Visual Acuity (SANS)',
    subtitle: 'Spaceflight-Associated Neuro-Ocular Syndrome',
    svgRegionId: 'region-eyes',
    simpleDescription: 'Your eyes and optic nerves allow precise piloting and task execution. Microgravity shifts fluids into the skull, putting pressure on the back of the eyeball.',
    hazards: ['G', 'E'],
    hazardDetails: [
      {
        hazard: 'G',
        text: 'Without gravity pulling venous blood down toward your feet, 1.5 to 2 liters of fluid shift upward into the head. This elevated venous and intracranial pressure flattens the posterior globe, causes choroidal folds, and swells the optic nerve disc (papilledema).'
      },
      {
        hazard: 'E',
        text: 'Dry cabin air and micro-particulates floating in closed ventilation can cause corneal irritation and micro-foreign body hazards.'
      }
    ],
    primaryIndicators: ['visionScore', 'headachePresent'],
    secondaryIndicators: [],
    measurementGuide: [
      '1. Mount the Near-Point Vision acuity chart at calibrated arm-reach (40 cm) on the habitat bulkhead.',
      '2. Test each eye separately by covering the opposite eye with an opaque hand card.',
      '3. Record whether letters remain sharp (8-10) or appear blurred/haloed compared to baseline.',
      '4. Note if you are experiencing retro-orbital eye aches, optic flashes, or fronto-temporal headaches.'
    ],
    countermeasures: [
      'Wear prescribed "Space Anticipation Glasses" (variable-focus focal length lenses) for computer and reading tasks.',
      'Utilize Lower Body Negative Pressure (LBNP) chamber sessions for 2 hours to draw cephalic fluid downward.',
      'Avoid high-strain isometric maneuvers that dramatically increase intracranial venous pressures.'
    ],
    escalationGuidance: 'New-onset vision loss, sudden worsening of hyperopic shift, cotton wool spots, or severe retro-orbital aching requires immediate fundoscopic ultrasound imaging and flight surgeon consultation. On Mars missions, initiate daily ONSD monitoring and reduce head-down rest.'
  },

  heart: {
    id: 'heart',
    name: 'Cardiovascular System',
    subtitle: 'Heart Rate, Blood Pressure & Orthostatic Stability',
    svgRegionId: 'region-heart',
    simpleDescription: 'The heart pumps oxygenated blood throughout your body. In zero-g, it does not have to fight gravity, causing the heart muscle to adapt and shrink slightly if not exercised.',
    hazards: ['G', 'R'],
    hazardDetails: [
      {
        hazard: 'G',
        text: 'The body perceives fluid shifting into the chest as "hypervolemia," triggering plasma volume reduction by 10-15% within days. Cardiac output increases initially, then left ventricular mass decreases over months.'
      },
      {
        hazard: 'R',
        text: 'Long-term deep space radiation accelerates endothelial damage and cardiovascular atherosclerotic changes.'
      }
    ],
    primaryIndicators: ['heartRate', 'systolicBP'],
    secondaryIndicators: ['diastolicBP'],
    measurementGuide: [
      '1. Rest tethered in a neutral body posture for 5 minutes without arm movement.',
      '2. Fasten the pneumatic BP cuff onto your left upper arm at heart level, ensuring Velcro is snug.',
      '3. In zero-g, let your arm float gently or place against the arm-rest pad; keep relaxed during cuff inflation.',
      '4. Record Resting Heart Rate (bpm) and Systolic / Diastolic pressures displayed on the digital sphygmomanometer.'
    ],
    countermeasures: [
      'Complete daily interval protocol on the cycle ergometer (75-85% VO2 max for 30 minutes).',
      'Maintain strict sodium and electrolyte fluid loading regimen (1.5g sodium tablets + 1L water) prior to planetary landings or EVAs.',
      'Perform periodic passive calf venous volume checks to assess vascular elasticity.'
    ],
    escalationGuidance: 'Resting tachycardia >110 bpm or severe hypotension (<85/55 mmHg) accompanied by dizziness, palpitations, or lightheadedness upon movement indicates hypovolemia or cardiac arrhythmia. Contact Flight Surgeon immediately for ECG rhythm analysis strip.'
  },

  lungs: {
    id: 'lungs',
    name: 'Respiratory & Gas Exchange',
    subtitle: 'SpO2 Oxygen Saturation & Ventilation Rate',
    svgRegionId: 'region-lungs',
    simpleDescription: 'Lungs deliver vital oxygen to your bloodstream and expel toxic carbon dioxide. In an enclosed spacecraft, cabin atmospheric pressure and gas mix directly govern breathing.',
    hazards: ['E', 'G'],
    hazardDetails: [
      {
        hazard: 'E',
        text: 'Without convection in microgravity, exhaled CO2 can form stagnant bubbles around sleeping astronauts. Habitat scrubbing systems must keep pCO2 below 2.0-3.0 mmHg.'
      },
      {
        hazard: 'G',
        text: 'Ventilation-perfusion matching changes slightly in zero-g; pulmonary blood distribution becomes more uniform, improving gas exchange slightly, though suit depressurization poses decompression sickness (DCS) risks.'
      }
    ],
    primaryIndicators: ['spo2', 'respirationRate'],
    secondaryIndicators: [],
    measurementGuide: [
      '1. Ensure fingertip is warm and free of surface moisture or oils.',
      '2. Slide pulse oximeter probe onto index or middle finger; keep hand relaxed without tapping bulkhead.',
      '3. Wait 15 seconds until the plethysmograph pulse waveform stabilizes on the screen.',
      '4. Record SpO2 percentage and resting breathing frequency over 60 seconds.'
    ],
    countermeasures: [
      'Verify cabin air circulation fans are operating at nominal flow in crew quarters to disperse CO2 pockets.',
      'Perform spirometry breathing resistance routine once weekly.',
      'Inspect ECLSS (Environmental Control and Life Support System) LiOH or amine CO2 scrubbers if respiratory rate elevates.'
    ],
    escalationGuidance: 'SpO2 falling below 93% on ambient cabin air, or tachypnea >24 breaths/min with shortness of breath, points to cabin hypoxia, toxic contaminant leak (ammonia/hydrazine), or pulmonary complication. Don emergency O2 mask immediately and alert flight controller.'
  },

  gut: {
    id: 'gut',
    name: 'Metabolic & Digestive System',
    subtitle: 'Blood Glucose, Hydration & Nutrition',
    svgRegionId: 'region-gut',
    simpleDescription: 'The digestive system converts freeze-dried space nutrition into cellular fuel and regulates blood sugar, gut microbiome, and fluid balance.',
    hazards: ['G', 'I', 'E'],
    hazardDetails: [
      {
        hazard: 'G',
        text: 'Gastric emptying slows in microgravity, and space motion sickness (SMS / neurovestibular adaptation) frequently causes nausea and anorexia in the first 72 hours.'
      },
      {
        hazard: 'I',
        text: 'Repetitive rehydrated meals and altered microbial flora can cause dysbiosis, insulin resistance, and nutrient absorption declines.'
      },
      {
        hazard: 'E',
        text: 'Reclaimed potable water has mineral alterations; inadequate fluid intake creates high risks for calcium-oxalate kidney stone formation.'
      }
    ],
    primaryIndicators: ['bloodGlucose', 'hydrationLitres'],
    secondaryIndicators: [],
    measurementGuide: [
      '1. Cleanse fingertip with alcohol swab and let dry completely (capture swab in zero-g disposal pouch).',
      '2. Use spring-loaded micro-lancet to prick side of fingertip. Form a single neat droplet.',
      '3. Touch capillary strip of glucometer to blood droplet; ensure vacuum strip draws sample without letting droplets float free.',
      '4. Record blood glucose in mg/dL, and tally your daily drink pouch logs from the galley dispenser.'
    ],
    countermeasures: [
      'Target minimum 2.5 Liters of water daily from the galley rehydration station to dilute renal calcium excretion.',
      'Consume prebiotic and shelf-stable probiotic packets to preserve gut microbiome diversity.',
      'Ensure balanced carbohydrate intake; avoid high glycemic processed snacks prior to sleep cycles.'
    ],
    escalationGuidance: 'Persistent fasting glucose >135 mg/dL or acute hypoglycemia (<60 mg/dL with tremors/sweats), severe unyielding nausea beyond Sol 4, or flank pain indicating renal colic (kidney stone) demands urgent telemedicine consultation and ultrasound imaging.'
  },

  spine: {
    id: 'spine',
    name: 'Skeletal System & Spine',
    subtitle: 'Bone Demineralization Risk & Spine Elongation',
    svgRegionId: 'region-spine',
    simpleDescription: 'Your bones support your posture and store minerals. In weightlessness, without gravitational load, bones rapidly lose calcium (up to 1% bone mineral density per month in hips/spine).',
    hazards: ['G', 'R'],
    hazardDetails: [
      {
        hazard: 'G',
        text: 'Osteoclasts break down bone faster than osteoblasts build it due to the absence of mechanical stress. Intervertebral spinal discs also expand, causing astronaut height to increase up to 5-7 cm and creating acute lower back pain.'
      },
      {
        hazard: 'R',
        text: 'Deep space cosmic radiation damages bone marrow progenitor cells, further impairing long-term skeletal remodeling.'
      }
    ],
    primaryIndicators: ['exerciseMinutes', 'spineDiscomfort'],
    secondaryIndicators: [],
    measurementGuide: [
      '1. Log total minutes performed on the ARED (Advanced Resistive Exercise Device) simulating deadlifts, squats, and heel raises.',
      '2. Rate subjective lumbar or cervical spinal discomfort on a 1-10 scale during morning stretch routines.',
      '3. Note any radiating tingling or nerve sensations into the glutes or legs.'
    ],
    countermeasures: [
      'Complete mandatory 2.0 to 2.5 hours of daily scheduled exercise (resistive loading + high-impact treadmill running).',
      'Adhere to weekly bisphosphonate (e.g. alendronate) or rank-ligand bone-preservation medication protocols if manifested.',
      'Use the spinal elongation harness during sleep to mitigate disc hyper-expansion strain.'
    ],
    escalationGuidance: 'Accumulated daily exercise <60 minutes for 3 consecutive days triggers an operational red flag. Acute severe radicular lower back pain radiating down the leg (herniated disc suspicion) warrants immediate suspension of axial loading and flight surgeon consultation.'
  },

  muscles: {
    id: 'muscles',
    name: 'Musculoskeletal & Posture',
    subtitle: 'Muscle Mass Preservation & Lower-Limb Strength',
    svgRegionId: 'region-muscles',
    simpleDescription: 'Postural muscles (calves, thighs, spinal erectors) keep you standing on Earth. In zero-g, postural muscles are barely used for floating, triggering rapid muscle atrophy and fiber type switching.',
    hazards: ['G', 'D'],
    hazardDetails: [
      {
        hazard: 'G',
        text: 'Anti-gravity extensor muscles (soleus, gastrocnemius, quadriceps) can lose up to 20% of their mass and 30% of strength in just 30 to 60 days without heavy loading.',
      },
      {
        hazard: 'D',
        text: 'Upon arriving on Mars or returning to Earth, muscle-wasted astronauts face catastrophic inability to egress the spacecraft in an emergency without crew-assisted support.'
      }
    ],
    primaryIndicators: ['exerciseMinutes', 'muscleWeakness'],
    secondaryIndicators: [],
    measurementGuide: [
      '1. Measure maximum calf circumference with the non-stretch anthropometric measuring tape at skin tattoo marks.',
      '2. Self-rate subjective leg weakness, quadriceps fatigue, or muscular soreness on a 1-10 scale.',
      '3. Record total resistive load volume (kg lifted or minutes) from the ARED telemetry console log.'
    ],
    countermeasures: [
      'Execute eccentric and concentric heavy resistance sets targeting quadriceps and calf muscle groups.',
      'Ensure 1.5 to 1.8 grams of dietary protein per kilogram of body mass per day.',
      'Perform neuromotor balance and agility exercises using onboard elastic resistance cords.'
    ],
    escalationGuidance: 'Loss of >2 cm calf circumference over 14 days or sudden localized muscle tear/sprain requires immediate orthopedic evaluation, anti-inflammatory treatment, and modification of ARED loading curves.'
  },

  immune: {
    id: 'immune',
    name: 'Immune System & Dermal Barrier',
    subtitle: 'Core Temperature, Infection Defense & Skin Integrity',
    svgRegionId: 'region-immune',
    simpleDescription: 'Your immune system fights off microbes, while your skin protects against environmental hazards. Spaceflight dampens T-cell function and reactivates dormant viruses.',
    hazards: ['R', 'I', 'E'],
    hazardDetails: [
      {
        hazard: 'R',
        text: 'Chronic radiation impairs lymphocyte proliferation, suppresses leukocyte activity, and raises cancer risk.'
      },
      {
        hazard: 'I',
        text: 'Elevated chronic cortisol from isolation suppresses cell-mediated immunity, frequently causing reactivation of latent Epstein-Barr virus (EBV), Varicella-Zoster, and herpes simplex.'
      },
      {
        hazard: 'E',
        text: 'Closed habitat microbial swapping among crewmates, dry recirculated air, and absence of gravity cause skin flaking, delayed wound healing, and persistent contact dermatitis.'
      }
    ],
    primaryIndicators: ['bodyTemp', 'skinIntegrity'],
    secondaryIndicators: [],
    measurementGuide: [
      '1. Use the non-contact infrared tympanic (ear) or temporal thermometer; clean probe with antiseptic wipe.',
      '2. Hold probe perpendicular against temporal artery or gently seal within ear canal.',
      '3. Record core temperature reading in degrees Celsius (°C).',
      '4. Visual Skin Audit: Inspect skin surfaces (hands, torso, suit contact points) for dry lesions or itchy rashes (rate comfort 1-10).'
    ],
    countermeasures: [
      'Apply hypoallergenic barrier moisturizers daily after sponge baths to prevent epidermal breakdown.',
      'Take daily prophylactic Vitamin D3 (1000-2000 IU) and multi-micronutrient rations.',
      'Utilize onboard UV-C sanitization wands for frequently touched flight-deck instruments.'
    ],
    escalationGuidance: 'Core temperature >38.2°C (febrile illness), rapidly expanding dermal infection, or herpes zoster reactivation necessitates immediate quarantine protocols, oral antiviral/antibiotic deployment from onboard pharmacy pack, and flight surgeon intervention.'
  }
};

const BADGES = [
  {
    id: 'first_log',
    title: 'First Orbit Check-in',
    icon: '🚀',
    description: 'Logged your first real biometric measurement as an astronaut.',
    xpReward: 100
  },
  {
    id: 'heart_hero',
    title: 'Heart Hero',
    icon: '❤️',
    description: 'Maintained nominal cardiovascular vitals across 5 separate logged readings.',
    xpReward: 250
  },
  {
    id: 'sleep_champion',
    title: 'Sleep Champion',
    icon: '🌙',
    description: 'Achieved 7+ hours of quality restorative sleep in microgravity.',
    xpReward: 200
  },
  {
    id: 'gravity_defier',
    title: 'Gravity Defier',
    icon: '🏋️‍♂️',
    description: 'Logged 120+ minutes of daily countermeasure training.',
    xpReward: 300
  },
  {
    id: 'deep_space_pioneer',
    title: 'Deep Space Pioneer',
    icon: '🪐',
    description: 'Logged real measurements for all 8 body regions.',
    xpReward: 400
  },
  {
    id: 'hydration_master',
    title: 'Hydration Master',
    icon: '💧',
    description: 'Maintained optimal 2.5L+ fluid intake to protect kidney function.',
    xpReward: 150
  },
  {
    id: 'streak_master',
    title: 'Consistent Crewmember',
    icon: '🔥',
    description: 'Maintained a 7-day daily check-in streak.',
    xpReward: 350
  }
];

/**
 * Validation engine: ensures astronaut inputs are physically possible
 */
function validateMetricInput(metricKey, rawValue) {
  if (rawValue === '' || rawValue === null || rawValue === undefined) {
    return { valid: true, empty: true, value: null };
  }

  const numVal = parseFloat(rawValue);
  if (isNaN(numVal)) {
    return { valid: false, empty: false, error: 'Please enter a valid number.' };
  }

  const ref = REFERENCE_RANGES[metricKey];
  if (!ref) {
    return { valid: true, empty: false, value: numVal };
  }

  if (ref.minValid !== undefined && numVal < ref.minValid) {
    return { 
      valid: false, 
      empty: false, 
      error: `${ref.name} must be at least ${ref.minValid} ${ref.unit}.` 
    };
  }

  if (ref.maxValid !== undefined && numVal > ref.maxValid) {
    return { 
      valid: false, 
      empty: false, 
      error: `${ref.name} cannot exceed ${ref.maxValid} ${ref.unit}.` 
    };
  }

  return { valid: true, empty: false, value: numVal };
}

/**
 * OPTIONAL PRESENTATION DEMO DATA GENERATOR
 * Strictly for the "Load Demo Data (Presentations Only)" button.
 * Generates 14 realistic sample readings ending on Sol 42.
 */
function generatePreloadedHistory() {
  const readings = [];
  const baseTime = Date.now() - 14 * 86400000;
  
  const regions = ['brain', 'eyes', 'heart', 'lungs', 'gut', 'spine', 'muscles', 'immune'];
  
  for (let i = 0; i < 14; i++) {
    const timestamp = baseTime + i * 86400000;
    const sol = 29 + i;
    
    // Heart
    readings.push({
      id: `demo_${sol}_heart`,
      sol: sol,
      timestamp: timestamp,
      regionId: 'heart',
      values: {
        heartRate: 70 + Math.round(Math.sin(i) * 5),
        systolicBP: 118 + Math.round(Math.cos(i) * 4),
        diastolicBP: 75 + Math.round(Math.sin(i) * 3)
      },
      status: 'normal',
      env: 'iss'
    });

    // Brain
    readings.push({
      id: `demo_${sol}_brain`,
      sol: sol,
      timestamp: timestamp + 1000,
      regionId: 'brain',
      values: {
        sleepHours: parseFloat((7.4 + Math.sin(i * 0.8) * 0.6).toFixed(1)),
        moodScore: 8,
        stressLevel: 3
      },
      status: 'normal',
      env: 'iss'
    });

    // Eyes
    readings.push({
      id: `demo_${sol}_eyes`,
      sol: sol,
      timestamp: timestamp + 2000,
      regionId: 'eyes',
      values: {
        visionScore: 9,
        headachePresent: 0
      },
      status: 'normal',
      env: 'iss'
    });

    // Lungs
    readings.push({
      id: `demo_${sol}_lungs`,
      sol: sol,
      timestamp: timestamp + 3000,
      regionId: 'lungs',
      values: {
        spo2: 98,
        respirationRate: 14 + (i % 2)
      },
      status: 'normal',
      env: 'iss'
    });

    // Gut
    readings.push({
      id: `demo_${sol}_gut`,
      sol: sol,
      timestamp: timestamp + 4000,
      regionId: 'gut',
      values: {
        bloodGlucose: 90 + Math.round(Math.cos(i) * 6),
        hydrationLitres: 2.8
      },
      status: 'normal',
      env: 'iss'
    });

    // Spine
    readings.push({
      id: `demo_${sol}_spine`,
      sol: sol,
      timestamp: timestamp + 5000,
      regionId: 'spine',
      values: {
        exerciseMinutes: 130 + (i % 3) * 5,
        spineDiscomfort: 2
      },
      status: 'normal',
      env: 'iss'
    });

    // Muscles
    readings.push({
      id: `demo_${sol}_muscles`,
      sol: sol,
      timestamp: timestamp + 6000,
      regionId: 'muscles',
      values: {
        exerciseMinutes: 130 + (i % 3) * 5,
        muscleWeakness: 2
      },
      status: 'normal',
      env: 'iss'
    });

    // Immune
    readings.push({
      id: `demo_${sol}_immune`,
      sol: sol,
      timestamp: timestamp + 7000,
      regionId: 'immune',
      values: {
        bodyTemp: parseFloat((37.0 + (i % 2) * 0.1).toFixed(1)),
        skinIntegrity: 9
      },
      status: 'normal',
      env: 'iss'
    });
  }

  return readings;
}

// Export to window
window.NASA_HAZARDS = NASA_HAZARDS;
window.MISSION_ENVIRONMENTS = MISSION_ENVIRONMENTS;
window.REFERENCE_RANGES = REFERENCE_RANGES;
window.BODY_REGIONS = BODY_REGIONS;
window.BADGES = BADGES;
window.validateMetricInput = validateMetricInput;
window.generatePreloadedHistory = generatePreloadedHistory;
