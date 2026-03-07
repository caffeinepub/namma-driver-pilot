import type { PricingConfig } from "../backend";

/**
 * Default pricing configuration used as fallback when getPricingConfig fails or is loading.
 */
export const DEFAULT_CONFIG: PricingConfig = {
  local: {
    base_first_hour: 200,
    min_hours: 1,
    per_min_after_first_hour: 3.5,
    free_wait_mins: 10,
    wait_per_min: 1.5,
  },
  outstation: {
    min_days: 1,
    driver_bata_per_day: 500,
    commission_rate: 0.15,
    km_slab_1_limit: 400,
    km_slab_2_limit: 600,
    km_slab_3_limit: 900,
    per_km_slab_1: 8,
    per_km_slab_2: 9,
    per_km_slab_3: 10,
    per_km_slab_4: 11,
    extra_driver_comp_per_100km_over_400: 1000,
  },
  vehicle_multiplier: {
    hatchback: 1.0,
    sedan: 1.0,
    suv: 1.0,
    luxury: 2.0,
  },
  commission: {
    local: 0.2,
    outstation: 0.15,
  },
};
