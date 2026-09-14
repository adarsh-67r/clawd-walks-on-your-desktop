export interface ClawdConfig {
  window: {
    width: number;
    height: number;
    margin: number;
  };
  poll: {
    systemState: number;
    cursor: number;
    keypress: number;
    tokens: number;
  };
  idle: {
    phases: string[];
    durations: number[];
    walkAfterCycles: number;
    walkChance: number;
    walkDistance: { min: number; max: number };
    walkSettleDelay: number;
    ignoredAfter: number;
    ignoredCheck: number;
    edgePeekCheck: number;
    edgePeekThreshold: number;
  };
  happy: {
    duration: number;
    settlingDuration: number;
    petDuration: number;
  };
  drowsy: {
    delay: number;
  };
  typing: {
    speeds: { base: number; dual: number; triple: number };
    rampFactor: number;
    rampInterval: number;
    rampThreshold: number;
  };
  coffee: {
    interval: number;
    startDelay: number;
    pourDuration: number;
    grabDuration: number;
    drinkDuration: number;
    sipDuration: number;
    returnDuration: number;
  };
  stretch: {
    after: number;
    checkInterval: number;
    leanDuration: number;
    upDuration: number;
    holdDuration: number;
    yawnDuration: number;
    returnDuration: number;
  };
  clipboard: {
    grabDelay: number;
    holdDuration: number;
    doneDelay: number;
    copyHold: number;
    pasteHold: number;
  };
  screenshot: {
    duration: number;
  };
  charging: {
    duration: number;
  };
  thuglife: {
    onDuration: number;
    holdDuration: number;
    offDuration: number;
  };
  ignored: {
    armDuration: number;
    pressDuration: number;
    bannerDuration: number;
    swayDuration: number;
    floatDuration: number;
  };
  eyeTracking: {
    range: number;
    maxDistance: number;
  };
}

const config: ClawdConfig = {
  window: {
    width: 220,
    height: 260,
    margin: 24,
  },
  poll: {
    systemState: 2500,
    cursor: 33,
    keypress: 80,
    tokens: 60000,
  },
  idle: {
    phases: ['rest', 'look-right', 'rest', 'look-left', 'rest', 'scratch', 'rest', 'thuglife', 'rest'],
    durations: [4000, 2000, 3000, 2000, 5000, 1800, 3000, 5000, 2000],
    walkAfterCycles: 8,
    walkChance: 0.3,
    walkDistance: { min: 150, max: 450 },
    walkSettleDelay: 200,
    ignoredAfter: 120000,
    ignoredCheck: 10000,
    edgePeekCheck: 3000,
    edgePeekThreshold: 5,
  },
  happy: {
    duration: 2200,
    settlingDuration: 500,
    petDuration: 4000,
  },
  drowsy: {
    delay: 4500,
  },
  typing: {
    speeds: { base: 0.12, dual: 0.085, triple: 0.055 },
    rampFactor: 0.08,
    rampInterval: 80,
    rampThreshold: 0.002,
  },
  coffee: {
    interval: 18000,
    startDelay: 8000,
    pourDuration: 2500,
    grabDuration: 1000,
    drinkDuration: 1200,
    sipDuration: 1500,
    returnDuration: 800,
  },
  stretch: {
    after: 25 * 60 * 1000,
    checkInterval: 30000,
    leanDuration: 800,
    upDuration: 600,
    holdDuration: 2000,
    yawnDuration: 1500,
    returnDuration: 600,
  },
  clipboard: {
    grabDelay: 350,
    holdDuration: 2000,
    doneDelay: 350,
    copyHold: 2000,
    pasteHold: 1800,
  },
  screenshot: {
    duration: 2500,
  },
  charging: {
    duration: 3000,
  },
  thuglife: {
    onDuration: 500,
    holdDuration: 2500,
    offDuration: 500,
  },
  ignored: {
    armDuration: 500,
    pressDuration: 300,
    bannerDuration: 1400,
    swayDuration: 4000,
    floatDuration: 900,
  },
  eyeTracking: {
    range: 3.5,
    maxDistance: 150,
  },
};

export default config;
