export type DeliveryMethod = "HOME_DELIVERY" | "PICKUP_OWERRI";

export type DeliveryFeeConfig = {
  version: 1;
  zones: {
    zone1: {
      fee: number;
      durationLabel: string;
      lgas: string[];
    };
    zone2: {
      fee: number;
      durationLabel: string;
    };
    zone3: {
      fee: number;
      durationLabel: string;
      states: string[];
    };
    zone4: {
      fee: number;
      durationLabel: string;
      states: string[];
    };
    zone5: {
      fee: number;
      durationLabel: string;
      states: string[];
    };
    zone6: {
      fee: number;
      durationLabel: string;
    };
  };
};

export const DELIVERY_FEE_STORAGE_KEY = "bellehairs.deliveryFeeConfig.v1";

export const defaultDeliveryFeeConfig: DeliveryFeeConfig = {
  version: 1,
  zones: {
    zone1: {
      fee: 500,
      durationLabel: "Same Day Delivery",
      lgas: [
        "Owerri Municipal",
        "Owerri North",
        "Owerri West",
        "Orlu",
        "Okigwe",
      ],
    },
    zone2: {
      fee: 1000,
      durationLabel: "Next Day Delivery",
    },
    zone3: {
      fee: 1500,
      durationLabel: "Arrives in 1–2 days",
      states: ["Anambra", "Enugu", "Abia", "Ebonyi"],
    },
    zone4: {
      fee: 2000,
      durationLabel: "Arrives in 2–3 days",
      states: ["Rivers", "Delta", "Bayelsa", "Cross River", "Akwa Ibom", "Edo"],
    },
    zone5: {
      fee: 2500,
      durationLabel: "Arrives in 2–4 days",
      states: ["Lagos", "Ogun", "Oyo", "Osun", "Ondo", "Ekiti"],
    },
    zone6: {
      fee: 3500,
      durationLabel: "Arrives in 3–5 days",
    },
  },
};

export function normalizePlaceName(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export type DeliveryQuote =
  | {
      kind: "pickup";
      fee: 0;
      label: "Free Pickup — Contact us to arrange collection";
    }
  | {
      kind: "delivery";
      fee: number;
      durationLabel: string;
      zone: "Zone 1" | "Zone 2" | "Zone 3" | "Zone 4" | "Zone 5" | "Zone 6";
    }
  | {
      kind: "incomplete";
      reason: string;
    };

export function getDeliveryQuote(params: {
  config: DeliveryFeeConfig;
  deliveryMethod: DeliveryMethod;
  state: string;
  cityOrLga: string;
}): DeliveryQuote {
  if (params.deliveryMethod === "PICKUP_OWERRI") {
    return {
      kind: "pickup",
      fee: 0,
      label: "Free Pickup — Contact us to arrange collection",
    };
  }

  const state = params.state.trim();
  if (!state) return { kind: "incomplete", reason: "Select your state" };

  const cityOrLga = params.cityOrLga.trim();
  const config = params.config;

  if (state === "Imo") {
    if (!cityOrLga) {
      return {
        kind: "incomplete",
        reason: "Enter your City / LGA to calculate delivery in Imo State",
      };
    }

    const cityNorm = normalizePlaceName(cityOrLga);
    const zone1Match = config.zones.zone1.lgas.some(
      (lga) => normalizePlaceName(lga) === cityNorm,
    );

    if (zone1Match) {
      return {
        kind: "delivery",
        zone: "Zone 1",
        fee: config.zones.zone1.fee,
        durationLabel: config.zones.zone1.durationLabel,
      };
    }

    return {
      kind: "delivery",
      zone: "Zone 2",
      fee: config.zones.zone2.fee,
      durationLabel: config.zones.zone2.durationLabel,
    };
  }

  if (config.zones.zone3.states.includes(state)) {
    return {
      kind: "delivery",
      zone: "Zone 3",
      fee: config.zones.zone3.fee,
      durationLabel: config.zones.zone3.durationLabel,
    };
  }

  if (config.zones.zone4.states.includes(state)) {
    return {
      kind: "delivery",
      zone: "Zone 4",
      fee: config.zones.zone4.fee,
      durationLabel: config.zones.zone4.durationLabel,
    };
  }

  if (config.zones.zone5.states.includes(state)) {
    return {
      kind: "delivery",
      zone: "Zone 5",
      fee: config.zones.zone5.fee,
      durationLabel: config.zones.zone5.durationLabel,
    };
  }

  return {
    kind: "delivery",
    zone: "Zone 6",
    fee: config.zones.zone6.fee,
    durationLabel: config.zones.zone6.durationLabel,
  };
}

export function loadDeliveryFeeConfigFromStorage(): DeliveryFeeConfig {
  try {
    const raw = localStorage.getItem(DELIVERY_FEE_STORAGE_KEY);
    if (!raw) return defaultDeliveryFeeConfig;
    const parsed = JSON.parse(raw) as DeliveryFeeConfig;
    if (parsed?.version !== 1) return defaultDeliveryFeeConfig;
    return parsed;
  } catch {
    return defaultDeliveryFeeConfig;
  }
}

export function saveDeliveryFeeConfigToStorage(config: DeliveryFeeConfig) {
  localStorage.setItem(DELIVERY_FEE_STORAGE_KEY, JSON.stringify(config));
}

