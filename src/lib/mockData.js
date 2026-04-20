// Mock data for the workflow prototype

export const SENSORS = [
  { id: 's1', name: 'Temperature', unit: '°C' },
  { id: 's2', name: 'Humidity', unit: '%' },
  { id: 's3', name: 'CO₂', unit: 'ppm' },
  { id: 's4', name: 'Light', unit: 'lux' },
  { id: 's5', name: 'Soil Moisture', unit: '%' },
  { id: 's6', name: 'pH', unit: 'pH' },
  { id: 's7', name: 'EC', unit: 'mS/cm' },
];

export const DEVICES = [
  { id: 'd1', name: 'Fan 1', status: 'free' },
  { id: 'd2', name: 'Fan 2', status: 'workflow', workflowName: 'Ventilation' },
  { id: 'd3', name: 'Fan 3', status: 'free' },
  { id: 'd4', name: 'Open Thermal Screen', status: 'rule', ruleName: 'Rule A' },
  { id: 'd5', name: 'Side Vent', status: 'free' },
  { id: 'd6', name: 'Irrigation Valves', status: 'free' },
  { id: 'd7', name: 'Drip Line A', status: 'workflow', workflowName: 'Irrigation' },
  { id: 'd8', name: 'Drip Line B', status: 'free' },
  { id: 'd9', name: 'CO₂ Injector', status: 'rule', ruleName: 'Rule B' },
  { id: 'd10', name: 'Heater 1', status: 'free' },
  { id: 'd11', name: 'Heater 2', status: 'free' },
  { id: 'd12', name: 'Circulation Pump', status: 'free' },
];

export const DAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

// Status: 'idle' | 'running' | 'synchronizing' | 'completed' | 'error' | 'disabled'
export const initialWorkflows = [
  {
    id: 'wf1',
    name: 'Ventilation',
    priority: 1,
    mode: 'sensor', // 'sensor' | 'schedule'
    status: 'running',
    enabled: true,
    isDefault: false,
    trigger: {
      type: 'sensor',
      sensors: [
        { sensorId: 's1', operator: 'Higher than', value: 26, unit: '°C', currentValue: 24.1 },
        { sensorId: 's2', operator: 'Lower than', value: 40, unit: '%', currentValue: 38 },
      ],
      logic: 'AND',
      activationDelay: { minutes: 0, seconds: 10 },
    },
    activeHours: {
      enabled: false,
      from: '06:00',
      until: '18:00',
      days: [true, true, true, true, true, true, true],
    },
    notifications: {
      onCompletion: true,
      onFailure: true,
    },
    steps: [
      {
        id: 'step1',
        deviceId: 'd1',
        actionType: 'Stepper Motor',
        sensorRows: [
          { sensorId: 's1', from: 22, currentValue: 24.1, until: 25 },
          { sensorId: 's2', from: 40, currentValue: null, until: 40 },
        ],
        params: { run: '00:30', wait: '00:10' },
        status: 'done',
      },
      {
        id: 'step2',
        deviceId: 'd10',
        actionType: 'Loop',
        sensorRows: [
          { sensorId: 's1', from: 28, currentValue: 24.1, until: 24 },
          { sensorId: 's2', from: 40, currentValue: 38, until: 35 },
        ],
        params: { times: 5, on: '00:20', off: '00:10' },
        status: 'running',
      },
    ],
  },
  {
    id: 'wf2',
    name: 'Fertigation',
    priority: 2,
    mode: 'sensor',
    status: 'synchronizing',
    enabled: true,
    isDefault: false,
    trigger: {
      type: 'sensor',
      sensors: [
        { sensorId: 's7', operator: 'Lower than', value: 1.8, unit: 'mS/cm', currentValue: 1.5 },
      ],
      logic: null,
      activationDelay: { minutes: 0, seconds: 10 },
    },
    activeHours: {
      enabled: false,
      from: '06:00',
      until: '18:00',
      days: [true, true, true, true, true, true, true],
    },
    notifications: {
      onCompletion: true,
      onFailure: true,
    },
    steps: [
      {
        id: 'step1',
        deviceId: 'd6',
        actionType: 'Regular',
        sensorRows: [
          { sensorId: 's7', from: 1.8, currentValue: 1.5, until: 2.2 },
        ],
        params: {},
        status: 'pending',
      },
      {
        id: 'step2',
        deviceId: 'd12',
        actionType: 'Regular',
        sensorRows: [
          { sensorId: 's7', from: 1.8, currentValue: 1.5, until: 2.2 },
        ],
        params: {},
        status: 'pending',
      },
      {
        id: 'step3',
        deviceId: 'd5',
        actionType: 'Regular',
        sensorRows: [
          { sensorId: 's7', from: 1.8, currentValue: 1.5, until: 2.2 },
        ],
        params: {},
        status: 'pending',
      },
    ],
  },
  {
    id: 'wf4',
    name: 'CO₂ Management',
    priority: 4,
    mode: 'sensor',
    status: 'idle',
    enabled: true,
    isDefault: false,
    trigger: {
      type: 'sensor',
      sensors: [
        { sensorId: 's3', operator: 'Lower than', value: 800, unit: 'ppm', currentValue: 750 },
      ],
      logic: null,
      activationDelay: { minutes: 0, seconds: 10 },
    },
    activeHours: {
      enabled: false,
      from: '06:00',
      until: '18:00',
      days: [true, true, true, true, true, true, true],
    },
    notifications: {
      onCompletion: true,
      onFailure: true,
    },
    steps: [
      {
        id: 'step1',
        deviceId: 'd9',
        actionType: 'Regular',
        sensorRows: [
          { sensorId: 's3', from: 800, currentValue: 750, until: 1200 },
        ],
        params: {},
        status: 'pending',
      },
      {
        id: 'step2',
        deviceId: 'd5',
        actionType: 'Regular',
        sensorRows: [
          { sensorId: 's3', from: 800, currentValue: 750, until: 1200 },
        ],
        params: {},
        status: 'pending',
      },
      {
        id: 'step3',
        deviceId: 'd3',
        actionType: 'Regular',
        sensorRows: [
          { sensorId: 's3', from: 800, currentValue: 750, until: 1200 },
        ],
        params: {},
        status: 'pending',
      },
    ],
  },
  {
    id: 'wf3',
    name: 'Irrigation',
    priority: 3,
    mode: 'schedule',
    status: 'error',
    enabled: false,
    isDefault: true,
    trigger: {
      type: 'schedule',
      times: ['07:00', '19:00'],
      days: [true, true, true, true, true, true, true],
    },
    activeHours: null,
    notifications: {
      onCompletion: true,
      onFailure: true,
    },
    steps: [
      {
        id: 'step1',
        deviceId: 'd6',
        action: 'On',
        params: { duration: 30, unit: 'min' },
        status: 'done',
      },
      {
        id: 'step2',
        deviceId: 'd12',
        action: 'Pulse',
        params: { on: 10, off: 30, cycles: 3 },
        status: 'done',
      },
      {
        id: 'step3',
        deviceId: 'd8',
        action: 'On',
        params: { duration: 5, unit: 'min' },
        status: 'error',
      },
    ],
  },
  {
    id: 'wf5',
    name: 'Climate',
    priority: 5,
    mode: 'sensor',
    status: 'disabled',
    enabled: false,
    isDefault: true,
    trigger: {
      type: 'sensor',
      sensors: [
        { sensorId: 's1', operator: 'Higher than', value: 20, unit: '°C', currentValue: 18 },
      ],
      logic: null,
      activationDelay: { minutes: 0, seconds: 0 },
    },
    activeHours: {
      enabled: false,
      from: '06:00',
      until: '18:00',
      days: [true, true, true, true, true, true, true],
    },
    notifications: {
      onCompletion: true,
      onFailure: true,
    },
    steps: [
      {
        id: 'step1',
        deviceId: 'd1',
        actionType: 'Regular',
        sensorRows: [
          { sensorId: 's1', from: 20, currentValue: 18, until: 25 },
        ],
        params: {},
        status: 'pending',
      },
    ],
  },
];
