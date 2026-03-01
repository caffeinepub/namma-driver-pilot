import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useGetMyRole, useGetPricingConfig, useUpdatePricingConfig } from '../hooks/useQueries';
import type { PricingConfig } from '../backend';

// ─── Field helpers ────────────────────────────────────────────────────────────

function NumericField({
  label,
  value,
  onChange,
  disabled,
  min = 0,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
  min?: number;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Input
        type="number"
        value={value}
        min={min}
        step="any"
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        disabled={disabled}
        className="h-8 text-sm"
      />
    </div>
  );
}

// ─── Default config (used while loading) ─────────────────────────────────────

const EMPTY_CONFIG: PricingConfig = {
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
    local: 0.20,
    outstation: 0.15,
  },
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function PricingTab() {
  const { data: role } = useGetMyRole();
  const isAdmin = role === 'admin';

  const {
    data: pricingConfig,
    isLoading: configLoading,
    isError: configError,
    refetch,
  } = useGetPricingConfig();

  const updateMutation = useUpdatePricingConfig();

  // Local form state
  const [local, setLocal] = useState(EMPTY_CONFIG.local);
  const [outstation, setOutstation] = useState(EMPTY_CONFIG.outstation);
  const [vehicleMultiplier, setVehicleMultiplier] = useState(EMPTY_CONFIG.vehicle_multiplier);
  const [commission, setCommission] = useState(EMPTY_CONFIG.commission);

  // Populate form when config loads
  useEffect(() => {
    if (pricingConfig) {
      setLocal(pricingConfig.local);
      setOutstation(pricingConfig.outstation);
      setVehicleMultiplier(pricingConfig.vehicle_multiplier);
      setCommission(pricingConfig.commission);
    }
  }, [pricingConfig]);

  async function handleSave() {
    const config: PricingConfig = {
      local,
      outstation,
      vehicle_multiplier: vehicleMultiplier,
      commission,
    };

    try {
      const result = await updateMutation.mutateAsync(config);
      if (result.__kind__ === 'ok') {
        toast.success('Pricing saved');
      } else if (result.__kind__ === 'notAdmin') {
        toast.error('Not authorized to update pricing');
      } else if (result.__kind__ === 'invalidConfig') {
        toast.error(`Invalid config: ${result.invalidConfig}`);
      } else {
        toast.error('Failed to save pricing');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to save pricing');
    }
  }

  const isSaving = updateMutation.isPending;

  if (!isAdmin) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          <AlertCircle className="w-8 h-8 mx-auto mb-3 opacity-50" />
          <p>Admin access required to view pricing configuration.</p>
        </CardContent>
      </Card>
    );
  }

  if (configLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-48 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    );
  }

  if (configError) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <AlertCircle className="w-8 h-8 mx-auto mb-3 text-destructive opacity-70" />
          <p className="text-muted-foreground mb-4">Failed to load pricing configuration.</p>
          <Button variant="outline" onClick={() => refetch()}>
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Local Pricing */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Local Pricing</CardTitle>
          <CardDescription>Rates for local trips within the city</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <NumericField
            label="Base First Hour (₹)"
            value={local.base_first_hour}
            onChange={(v) => setLocal((p) => ({ ...p, base_first_hour: v }))}
            disabled={isSaving}
          />
          <NumericField
            label="Min Hours"
            value={local.min_hours}
            onChange={(v) => setLocal((p) => ({ ...p, min_hours: v }))}
            disabled={isSaving}
            min={1}
          />
          <NumericField
            label="Per Min After 1st Hour (₹)"
            value={local.per_min_after_first_hour}
            onChange={(v) => setLocal((p) => ({ ...p, per_min_after_first_hour: v }))}
            disabled={isSaving}
          />
          <NumericField
            label="Free Wait Mins"
            value={local.free_wait_mins}
            onChange={(v) => setLocal((p) => ({ ...p, free_wait_mins: v }))}
            disabled={isSaving}
          />
          <NumericField
            label="Wait Per Min (₹)"
            value={local.wait_per_min}
            onChange={(v) => setLocal((p) => ({ ...p, wait_per_min: v }))}
            disabled={isSaving}
          />
        </CardContent>
      </Card>

      {/* Outstation Pricing */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Outstation Pricing</CardTitle>
          <CardDescription>Rates for outstation trips</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <NumericField
            label="Min Days"
            value={outstation.min_days}
            onChange={(v) => setOutstation((p) => ({ ...p, min_days: v }))}
            disabled={isSaving}
            min={1}
          />
          <NumericField
            label="Driver Bata/Day (₹)"
            value={outstation.driver_bata_per_day}
            onChange={(v) => setOutstation((p) => ({ ...p, driver_bata_per_day: v }))}
            disabled={isSaving}
          />
          <NumericField
            label="Commission Rate"
            value={outstation.commission_rate}
            onChange={(v) => setOutstation((p) => ({ ...p, commission_rate: v }))}
            disabled={isSaving}
          />
          <NumericField
            label="KM Slab 1 Limit"
            value={outstation.km_slab_1_limit}
            onChange={(v) => setOutstation((p) => ({ ...p, km_slab_1_limit: v }))}
            disabled={isSaving}
          />
          <NumericField
            label="KM Slab 2 Limit"
            value={outstation.km_slab_2_limit}
            onChange={(v) => setOutstation((p) => ({ ...p, km_slab_2_limit: v }))}
            disabled={isSaving}
          />
          <NumericField
            label="KM Slab 3 Limit"
            value={outstation.km_slab_3_limit}
            onChange={(v) => setOutstation((p) => ({ ...p, km_slab_3_limit: v }))}
            disabled={isSaving}
          />
          <NumericField
            label="Per KM Slab 1 (₹)"
            value={outstation.per_km_slab_1}
            onChange={(v) => setOutstation((p) => ({ ...p, per_km_slab_1: v }))}
            disabled={isSaving}
          />
          <NumericField
            label="Per KM Slab 2 (₹)"
            value={outstation.per_km_slab_2}
            onChange={(v) => setOutstation((p) => ({ ...p, per_km_slab_2: v }))}
            disabled={isSaving}
          />
          <NumericField
            label="Per KM Slab 3 (₹)"
            value={outstation.per_km_slab_3}
            onChange={(v) => setOutstation((p) => ({ ...p, per_km_slab_3: v }))}
            disabled={isSaving}
          />
          <NumericField
            label="Per KM Slab 4 (₹)"
            value={outstation.per_km_slab_4}
            onChange={(v) => setOutstation((p) => ({ ...p, per_km_slab_4: v }))}
            disabled={isSaving}
          />
          <NumericField
            label="Extra Driver Comp/100km (₹)"
            value={outstation.extra_driver_comp_per_100km_over_400}
            onChange={(v) =>
              setOutstation((p) => ({ ...p, extra_driver_comp_per_100km_over_400: v }))
            }
            disabled={isSaving}
          />
        </CardContent>
      </Card>

      {/* Vehicle Multipliers */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Vehicle Multipliers</CardTitle>
          <CardDescription>Fare multiplier per vehicle type</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <NumericField
            label="Hatchback"
            value={vehicleMultiplier.hatchback}
            onChange={(v) => setVehicleMultiplier((p) => ({ ...p, hatchback: v }))}
            disabled={isSaving}
          />
          <NumericField
            label="Sedan"
            value={vehicleMultiplier.sedan}
            onChange={(v) => setVehicleMultiplier((p) => ({ ...p, sedan: v }))}
            disabled={isSaving}
          />
          <NumericField
            label="SUV"
            value={vehicleMultiplier.suv}
            onChange={(v) => setVehicleMultiplier((p) => ({ ...p, suv: v }))}
            disabled={isSaving}
          />
          <NumericField
            label="Luxury"
            value={vehicleMultiplier.luxury}
            onChange={(v) => setVehicleMultiplier((p) => ({ ...p, luxury: v }))}
            disabled={isSaving}
          />
        </CardContent>
      </Card>

      {/* Commission */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Commission Rates</CardTitle>
          <CardDescription>Platform commission (0–1 range, e.g. 0.20 = 20%)</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <NumericField
            label="Local Commission"
            value={commission.local}
            onChange={(v) => setCommission((p) => ({ ...p, local: v }))}
            disabled={isSaving}
          />
          <NumericField
            label="Outstation Commission"
            value={commission.outstation}
            onChange={(v) => setCommission((p) => ({ ...p, outstation: v }))}
            disabled={isSaving}
          />
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving} className="min-w-32">
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving…
            </>
          ) : (
            'Save Pricing'
          )}
        </Button>
      </div>
    </div>
  );
}
