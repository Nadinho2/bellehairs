"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import {
  defaultDeliveryFeeConfig,
  loadDeliveryFeeConfigFromStorage,
  saveDeliveryFeeConfigToStorage,
  type DeliveryFeeConfig,
} from "@/lib/delivery";

function parseLines(value: string) {
  return value
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}

function formatLines(values: string[]) {
  return values.join("\n");
}

export default function DeliveryAdminPage() {
  const [config, setConfig] = useState<DeliveryFeeConfig>(() => {
    if (typeof window === "undefined") return defaultDeliveryFeeConfig;
    return loadDeliveryFeeConfigFromStorage();
  });
  const [saved, setSaved] = useState(false);

  const zone1LgasText = useMemo(
    () => formatLines(config.zones.zone1.lgas),
    [config.zones.zone1.lgas],
  );
  const zone3StatesText = useMemo(
    () => formatLines(config.zones.zone3.states),
    [config.zones.zone3.states],
  );
  const zone4StatesText = useMemo(
    () => formatLines(config.zones.zone4.states),
    [config.zones.zone4.states],
  );
  const zone5StatesText = useMemo(
    () => formatLines(config.zones.zone5.states),
    [config.zones.zone5.states],
  );

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <p className="text-xs font-semibold text-brand">Admin</p>
          <h1 className="text-4xl font-semibold tracking-tight text-foreground">
            Delivery Fees
          </h1>
          <p className="text-sm text-foreground/70">
            Edit delivery fees and estimated delivery durations without changing
            code.
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/admin"
            className="inline-flex items-center justify-center rounded-full border border-black bg-white px-5 py-2 text-sm font-semibold text-black hover:border-brand"
          >
            Back to admin
          </Link>
          <Link
            href="/checkout"
            className="inline-flex items-center justify-center rounded-full border border-black bg-white px-5 py-2 text-sm font-semibold text-black hover:border-brand"
          >
            Go to Checkout
          </Link>
          <Link
            href="/products"
            className="inline-flex items-center justify-center rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#C2177A]"
          >
            Shop
          </Link>
        </div>
      </div>

      <form
        className="mt-8 space-y-6"
        onSubmit={(e) => {
          e.preventDefault();
          saveDeliveryFeeConfigToStorage(config);
          setSaved(true);
          window.setTimeout(() => setSaved(false), 1500);
        }}
      >
        <div className="rounded-3xl border border-border bg-card p-6 text-white">
          <p className="text-sm font-semibold text-white">Zone 1 — Owerri & Environs</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <NumberField
              label="Fee (₦)"
              value={config.zones.zone1.fee}
              onChange={(fee) =>
                setConfig((prev) => ({
                  ...prev,
                  zones: { ...prev.zones, zone1: { ...prev.zones.zone1, fee } },
                }))
              }
            />
            <TextField
              label="Duration Label"
              value={config.zones.zone1.durationLabel}
              onChange={(durationLabel) =>
                setConfig((prev) => ({
                  ...prev,
                  zones: {
                    ...prev.zones,
                    zone1: { ...prev.zones.zone1, durationLabel },
                  },
                }))
              }
            />
            <TextAreaField
              label="Zone 1 LGAs (one per line)"
              value={zone1LgasText}
              onChange={(text) => {
                const lgas = parseLines(text);
                setConfig((prev) => ({
                  ...prev,
                  zones: { ...prev.zones, zone1: { ...prev.zones.zone1, lgas } },
                }));
              }}
            />
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-card p-6 text-white">
          <p className="text-sm font-semibold text-white">Zone 2 — Imo State (Other LGAs)</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <NumberField
              label="Fee (₦)"
              value={config.zones.zone2.fee}
              onChange={(fee) =>
                setConfig((prev) => ({
                  ...prev,
                  zones: { ...prev.zones, zone2: { ...prev.zones.zone2, fee } },
                }))
              }
            />
            <TextField
              label="Duration Label"
              value={config.zones.zone2.durationLabel}
              onChange={(durationLabel) =>
                setConfig((prev) => ({
                  ...prev,
                  zones: { ...prev.zones, zone2: { ...prev.zones.zone2, durationLabel } },
                }))
              }
            />
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-card p-6 text-white">
          <p className="text-sm font-semibold text-white">Zone 3 — South East</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <NumberField
              label="Fee (₦)"
              value={config.zones.zone3.fee}
              onChange={(fee) =>
                setConfig((prev) => ({
                  ...prev,
                  zones: { ...prev.zones, zone3: { ...prev.zones.zone3, fee } },
                }))
              }
            />
            <TextField
              label="Duration Label"
              value={config.zones.zone3.durationLabel}
              onChange={(durationLabel) =>
                setConfig((prev) => ({
                  ...prev,
                  zones: { ...prev.zones, zone3: { ...prev.zones.zone3, durationLabel } },
                }))
              }
            />
            <TextAreaField
              label="States in Zone 3 (one per line)"
              value={zone3StatesText}
              onChange={(text) => {
                const states = parseLines(text);
                setConfig((prev) => ({
                  ...prev,
                  zones: { ...prev.zones, zone3: { ...prev.zones.zone3, states } },
                }));
              }}
            />
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-card p-6 text-white">
          <p className="text-sm font-semibold text-white">Zone 4 — South South</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <NumberField
              label="Fee (₦)"
              value={config.zones.zone4.fee}
              onChange={(fee) =>
                setConfig((prev) => ({
                  ...prev,
                  zones: { ...prev.zones, zone4: { ...prev.zones.zone4, fee } },
                }))
              }
            />
            <TextField
              label="Duration Label"
              value={config.zones.zone4.durationLabel}
              onChange={(durationLabel) =>
                setConfig((prev) => ({
                  ...prev,
                  zones: { ...prev.zones, zone4: { ...prev.zones.zone4, durationLabel } },
                }))
              }
            />
            <TextAreaField
              label="States in Zone 4 (one per line)"
              value={zone4StatesText}
              onChange={(text) => {
                const states = parseLines(text);
                setConfig((prev) => ({
                  ...prev,
                  zones: { ...prev.zones, zone4: { ...prev.zones.zone4, states } },
                }));
              }}
            />
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-card p-6 text-white">
          <p className="text-sm font-semibold text-white">Zone 5 — South West</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <NumberField
              label="Fee (₦)"
              value={config.zones.zone5.fee}
              onChange={(fee) =>
                setConfig((prev) => ({
                  ...prev,
                  zones: { ...prev.zones, zone5: { ...prev.zones.zone5, fee } },
                }))
              }
            />
            <TextField
              label="Duration Label"
              value={config.zones.zone5.durationLabel}
              onChange={(durationLabel) =>
                setConfig((prev) => ({
                  ...prev,
                  zones: { ...prev.zones, zone5: { ...prev.zones.zone5, durationLabel } },
                }))
              }
            />
            <TextAreaField
              label="States in Zone 5 (one per line)"
              value={zone5StatesText}
              onChange={(text) => {
                const states = parseLines(text);
                setConfig((prev) => ({
                  ...prev,
                  zones: { ...prev.zones, zone5: { ...prev.zones.zone5, states } },
                }));
              }}
            />
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-card p-6 text-white">
          <p className="text-sm font-semibold text-white">Zone 6 — North & Other States</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <NumberField
              label="Fee (₦)"
              value={config.zones.zone6.fee}
              onChange={(fee) =>
                setConfig((prev) => ({
                  ...prev,
                  zones: { ...prev.zones, zone6: { ...prev.zones.zone6, fee } },
                }))
              }
            />
            <TextField
              label="Duration Label"
              value={config.zones.zone6.durationLabel}
              onChange={(durationLabel) =>
                setConfig((prev) => ({
                  ...prev,
                  zones: { ...prev.zones, zone6: { ...prev.zones.zone6, durationLabel } },
                }))
              }
            />
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="submit"
            className="inline-flex w-full items-center justify-center rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#C2177A]"
          >
            Save changes
          </button>
          <button
            type="button"
            onClick={() => {
              setConfig(defaultDeliveryFeeConfig);
              saveDeliveryFeeConfigToStorage(defaultDeliveryFeeConfig);
              setSaved(true);
              window.setTimeout(() => setSaved(false), 1500);
            }}
            className="inline-flex w-full items-center justify-center rounded-full border border-black bg-white px-6 py-3 text-sm font-semibold text-black hover:border-brand"
          >
            Reset to defaults
          </button>
        </div>

        {saved ? (
          <p className="text-sm text-foreground/70">Saved.</p>
        ) : null}
      </form>
    </div>
  );
}

function TextField(props: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-semibold text-white">{props.label}</span>
      <input
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        className="h-11 w-full rounded-2xl border border-white/15 bg-black/40 px-4 text-sm text-white outline-none focus:ring-2 focus:ring-brand/40"
      />
    </label>
  );
}

function NumberField(props: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-semibold text-white">{props.label}</span>
      <input
        type="number"
        min={0}
        step={50}
        value={props.value}
        onChange={(e) => props.onChange(Number(e.target.value))}
        className="h-11 w-full rounded-2xl border border-white/15 bg-black/40 px-4 text-sm text-white outline-none focus:ring-2 focus:ring-brand/40"
      />
    </label>
  );
}

function TextAreaField(props: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block space-y-2 sm:col-span-2">
      <span className="text-sm font-semibold text-white">{props.label}</span>
      <textarea
        rows={5}
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        className="w-full resize-none rounded-2xl border border-white/15 bg-black/40 px-4 py-3 text-sm text-white outline-none focus:ring-2 focus:ring-brand/40"
      />
    </label>
  );
}
