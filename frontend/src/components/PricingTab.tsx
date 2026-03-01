import { useState, useEffect } from 'react';
import { useGetPricingConfig, useUpdatePricingConfig, useCheckIsAdmin } from '../hooks/useQueries';
import type { PricingConfig } from '../backend';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ShieldOff, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

// Helper to build a flat form state from PricingConfig
type FlatConfig = {
  // Local
  local_base_first_hour: string;
  local_min_hours: string;
  local_per_min_after_first_hour: string;
  local_free_wait_mins: string;
  local_wait_per_min: string;
  // Outstation
  out_min_days: string;
  out_driver_bata_per_day: string;
  out_commission_rate: string;
  out_km_slab_1_limit: string;
  out_km_slab_2_limit: string;
  out_km_slab_3_limit: string;
  out_per_km_slab_1: string;
  out_per_km_slab_2: string;
  out_per_km_slab_3: string;
  out_per_km_slab_4: string;
  out_extra_driver_comp: string;
  // Vehicle multipliers
  vm_hatchback: string;
  vm_sedan: string;
  vm_suv: string;
  vm_luxury: string;
  // Commission
  comm_local: string;
  comm_outstation: string;
};

function configToFlat(config: PricingConfig): FlatConfig {
  return {
    local_base_first_hour: String(config.local.base_first_hour),
    local_min_hours: String(config.local.min_hours),
    local_per_min_after_first_hour: String(config.local.per_min_after_first_hour),
    local_free_wait_mins: String(config.local.free_wait_mins),
    local_wait_per_min: String(config.local.wait_per_min),
    out_min_days: String(config.outstation.min_days),
    out_driver_bata_per_day: String(config.outstation.driver_bata_per_day),
    out_commission_rate: String(config.outstation.commission_rate),
    out_km_slab_1_limit: String(config.outstation.km_slab_1_limit),
    out_km_slab_2_limit: String(config.outstation.km_slab_2_limit),
    out_km_slab_3_limit: String(config.outstation.km_slab_3_limit),
    out_per_km_slab_1: String(config.outstation.per_km_slab_1),
    out_per_km_slab_2: String(config.outstation.per_km_slab_2),
    out_per_km_slab_3: String(config.outstation.per_km_slab_3),
    out_per_km_slab_4: String(config.outstation.per_km_slab_4),
    out_extra_driver_comp: String(config.outstation.extra_driver_comp_per_100km_over_400),
    vm_hatchback: String(config.vehicle_multiplier.hatchback),
    vm_sedan: String(config.vehicle_multiplier.sedan),
    vm_suv: String(config.vehicle_multiplier.suv),
    vm_luxury: String(config.vehicle_multiplier.luxury),
    comm_local: String(config.commission.local),
    comm_outstation: String(config.commission.outstation),
  };
}

function flatToConfig(flat: FlatConfig): PricingConfig {
  return {
    local: {
      base_first_hour: parseFloat(flat.local_base_first_hour) || 0,
      min_hours: parseFloat(flat.local_min_hours) || 0,
      per_min_after_first_hour: parseFloat(flat.local_per_min_after_first_hour) || 0,
      free_wait_mins: parseFloat(flat.local_free_wait_mins) || 0,
      wait_per_min: parseFloat(flat.local_wait_per_min) || 0,
    },
    outstation: {
      min_days: parseFloat(flat.out_min_days) || 0,
      driver_bata_per_day: parseFloat(flat.out_driver_bata_per_day) || 0,
      commission_rate: parseFloat(flat.out_commission_rate) || 0,
      km_slab_1_limit: parseFloat(flat.out_km_slab_1_limit) || 0,
      km_slab_2_limit: parseFloat(flat.out_km_slab_2_limit) || 0,
      km_slab_3_limit: parseFloat(flat.out_km_slab_3_limit) || 0,
      per_km_slab_1: parseFloat(flat.out_per_km_slab_1) || 0,
      per_km_slab_2: parseFloat(flat.out_per_km_slab_2) || 0,
      per_km_slab_3: parseFloat(flat.out_per_km_slab_3) || 0,
      per_km_slab_4: parseFloat(flat.out_per_km_slab_4) || 0,
      extra_driver_comp_per_100km_over_400: parseFloat(flat.out_extra_driver_comp) || 0,
    },
    vehicle_multiplier: {
      hatchback: parseFloat(flat.vm_hatchback) || 0,
      sedan: parseFloat(flat.vm_sedan) || 0,
      suv: parseFloat(flat.vm_suv) || 0,
      luxury: parseFloat(flat.vm_luxury) || 0,
    },
    commission: {
      local: parseFloat(flat.comm_local) || 0,
      outstation: parseFloat(flat.comm_outstation) || 0,
    },
  };
}

interface FieldRowProps {
  label: string;
  hint?: string;
  id: string;
  value: string;
  onChange: (val: string) => void;
  disabled?: boolean;
}

function FieldRow({ label, hint, id, value, onChange, disabled }: FieldRowProps) {
  return (
    <div className="grid grid-cols-2 gap-3 items-center">
      <div>
        <Label htmlFor={id} className="text-sm font-medium">
          {label}
        </Label>
        {hint && <p className="text-xs text-muted-foreground mt-0.5">{hint}</p>}
      </div>
      <Input
        id={id}
        type="number"
        step="any"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="text-right"
      />
    </div>
  );
}

export default function PricingTab() {
  const { isAdmin, isLoading: adminLoading } = useCheckIsAdmin();
  const { data: config, isLoading: configLoading } = useGetPricingConfig();
  const updateMutation = useUpdatePricingConfig();

  const [form, setForm] = useState<FlatConfig | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Populate form when config loads
  useEffect(() => {
    if (config && !form) {
      setForm(configToFlat(config));
    }
  }, [config, form]);

  const setField = (key: keyof FlatConfig) => (val: string) => {
    setForm((prev) => (prev ? { ...prev, [key]: val } : prev));
    setSaveError(null);
  };

  const handleSave = async () => {
    if (!form) return;
    setSaveError(null);
    const newConfig = flatToConfig(form);
    const result = await updateMutation.mutateAsync(newConfig).catch((err: Error) => {
      setSaveError(err.message ?? 'Unexpected error');
      return null;
    });
    if (!result) return;

    if (result.__kind__ === 'ok') {
      toast.success('Pricing updated');
      // Sync form with saved values
      setForm(configToFlat(result.ok));
    } else if (result.__kind__ === 'notAdmin') {
      setSaveError('Unauthorized: only admins can update pricing.');
    } else if (result.__kind__ === 'invalidConfig') {
      setSaveError(`Invalid config: ${result.invalidConfig}`);
    } else if (result.__kind__ === 'failedUpdate') {
      setSaveError(`Update failed: ${result.failedUpdate}`);
    } else {
      setSaveError('An unexpected error occurred.');
    }
  };

  if (adminLoading || configLoading) {
    return (
      <div className="space-y-4 py-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
        <ShieldOff className="h-12 w-12 text-destructive opacity-60" />
        <h2 className="text-xl font-semibold">Unauthorized</h2>
        <p className="text-muted-foreground max-w-sm">
          You do not have permission to view or edit pricing configuration.
        </p>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        Loading pricing config…
      </div>
    );
  }

  const isSaving = updateMutation.isPending;

  return (
    <div className="space-y-6">
      {/* Section A: Local Pricing */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">A — Local Pricing</CardTitle>
          <CardDescription>Rates applied to local (hourly) trips</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <FieldRow
            id="local_base_first_hour"
            label="Base fare (first hour)"
            hint="₹ flat for the first hour"
            value={form.local_base_first_hour}
            onChange={setField('local_base_first_hour')}
            disabled={isSaving}
          />
          <FieldRow
            id="local_min_hours"
            label="Minimum hours"
            hint="Minimum billable hours (≥ 1)"
            value={form.local_min_hours}
            onChange={setField('local_min_hours')}
            disabled={isSaving}
          />
          <FieldRow
            id="local_per_min_after_first_hour"
            label="Per-minute rate (after 1st hr)"
            hint="₹ per minute beyond the first hour"
            value={form.local_per_min_after_first_hour}
            onChange={setField('local_per_min_after_first_hour')}
            disabled={isSaving}
          />
          <FieldRow
            id="local_free_wait_mins"
            label="Free waiting time"
            hint="Minutes of free waiting included"
            value={form.local_free_wait_mins}
            onChange={setField('local_free_wait_mins')}
            disabled={isSaving}
          />
          <FieldRow
            id="local_wait_per_min"
            label="Waiting charge per minute"
            hint="₹ per minute after free wait"
            value={form.local_wait_per_min}
            onChange={setField('local_wait_per_min')}
            disabled={isSaving}
          />
        </CardContent>
      </Card>

      {/* Section B: Outstation Pricing */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">B — Outstation Pricing &amp; KM Slabs</CardTitle>
          <CardDescription>Rates applied to outstation (multi-day / long-distance) trips</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <FieldRow
            id="out_min_days"
            label="Minimum days"
            hint="Minimum billable days (≥ 1)"
            value={form.out_min_days}
            onChange={setField('out_min_days')}
            disabled={isSaving}
          />
          <FieldRow
            id="out_driver_bata_per_day"
            label="Driver bata per day"
            hint="₹ daily allowance for driver"
            value={form.out_driver_bata_per_day}
            onChange={setField('out_driver_bata_per_day')}
            disabled={isSaving}
          />
          <FieldRow
            id="out_commission_rate"
            label="Commission rate"
            hint="Fraction (e.g. 0.15 = 15%)"
            value={form.out_commission_rate}
            onChange={setField('out_commission_rate')}
            disabled={isSaving}
          />

          <div className="pt-2 pb-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">KM Slab Limits</p>
          </div>
          <FieldRow
            id="out_km_slab_1_limit"
            label="Slab 1 upper limit (km)"
            hint="e.g. 400 km"
            value={form.out_km_slab_1_limit}
            onChange={setField('out_km_slab_1_limit')}
            disabled={isSaving}
          />
          <FieldRow
            id="out_km_slab_2_limit"
            label="Slab 2 upper limit (km)"
            hint="e.g. 600 km (must be > slab 1)"
            value={form.out_km_slab_2_limit}
            onChange={setField('out_km_slab_2_limit')}
            disabled={isSaving}
          />
          <FieldRow
            id="out_km_slab_3_limit"
            label="Slab 3 upper limit (km)"
            hint="e.g. 900 km (must be > slab 2)"
            value={form.out_km_slab_3_limit}
            onChange={setField('out_km_slab_3_limit')}
            disabled={isSaving}
          />

          <div className="pt-2 pb-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Per-KM Rates</p>
          </div>
          <FieldRow
            id="out_per_km_slab_1"
            label="Rate — Slab 1 (0 – limit 1)"
            hint="₹ per km"
            value={form.out_per_km_slab_1}
            onChange={setField('out_per_km_slab_1')}
            disabled={isSaving}
          />
          <FieldRow
            id="out_per_km_slab_2"
            label="Rate — Slab 2 (limit 1 – limit 2)"
            hint="₹ per km"
            value={form.out_per_km_slab_2}
            onChange={setField('out_per_km_slab_2')}
            disabled={isSaving}
          />
          <FieldRow
            id="out_per_km_slab_3"
            label="Rate — Slab 3 (limit 2 – limit 3)"
            hint="₹ per km"
            value={form.out_per_km_slab_3}
            onChange={setField('out_per_km_slab_3')}
            disabled={isSaving}
          />
          <FieldRow
            id="out_per_km_slab_4"
            label="Rate — Slab 4 (> limit 3)"
            hint="₹ per km"
            value={form.out_per_km_slab_4}
            onChange={setField('out_per_km_slab_4')}
            disabled={isSaving}
          />
          <FieldRow
            id="out_extra_driver_comp"
            label="Extra driver comp / 100 km over 400"
            hint="₹ safety compensation per 100 km beyond 400"
            value={form.out_extra_driver_comp}
            onChange={setField('out_extra_driver_comp')}
            disabled={isSaving}
          />
        </CardContent>
      </Card>

      {/* Section C: Vehicle Multipliers */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">C — Vehicle Multipliers</CardTitle>
          <CardDescription>Fare multiplier applied per vehicle category (1.0 = no change)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <FieldRow
            id="vm_hatchback"
            label="Hatchback"
            value={form.vm_hatchback}
            onChange={setField('vm_hatchback')}
            disabled={isSaving}
          />
          <FieldRow
            id="vm_sedan"
            label="Sedan"
            value={form.vm_sedan}
            onChange={setField('vm_sedan')}
            disabled={isSaving}
          />
          <FieldRow
            id="vm_suv"
            label="SUV"
            value={form.vm_suv}
            onChange={setField('vm_suv')}
            disabled={isSaving}
          />
          <FieldRow
            id="vm_luxury"
            label="Luxury"
            value={form.vm_luxury}
            onChange={setField('vm_luxury')}
            disabled={isSaving}
          />
        </CardContent>
      </Card>

      {/* Section D: Commission */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">D — Commission</CardTitle>
          <CardDescription>Platform commission rates (fraction, e.g. 0.20 = 20%)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <FieldRow
            id="comm_local"
            label="Local commission"
            hint="Fraction of local fare"
            value={form.comm_local}
            onChange={setField('comm_local')}
            disabled={isSaving}
          />
          <FieldRow
            id="comm_outstation"
            label="Outstation commission"
            hint="Fraction of outstation fare"
            value={form.comm_outstation}
            onChange={setField('comm_outstation')}
            disabled={isSaving}
          />
        </CardContent>
      </Card>

      {/* Save button + error */}
      <div className="flex flex-col gap-3 pb-4">
        {saveError && (
          <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{saveError}</span>
          </div>
        )}
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full sm:w-auto"
          size="lg"
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving…
            </>
          ) : (
            <>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Save Pricing
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
