"use client";

import dynamic from "next/dynamic";
import { MapPin } from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const LocationMapInner = dynamic(
  () => import("./location-map-inner").then((m) => m.LocationMapInner),
  {
    ssr: false,
    loading: () => (
      <div
        className="w-full animate-pulse rounded-lg bg-muted"
        style={{ height: 160 }}
      />
    ),
  }
);

export type LocationMapWidgetProps = {
  city: string | null;
  region: string | null;
  latitude: number | null;
  longitude: number | null;
};

export function LocationMapWidget({
  city,
  region,
  latitude,
  longitude,
}: LocationMapWidgetProps) {
  const [open, setOpen] = useState(false);
  const label = city ?? region ?? "Location not specified";
  const hasCoords =
    latitude != null &&
    longitude != null &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude);

  if (!hasCoords) {
    return (
      <div className="flex items-start gap-2 text-sm text-gray-900">
        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gray-500" />
        <span>{label}</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm text-gray-900">
        <MapPin className="h-4 w-4 shrink-0 text-gray-500" />
        <span>{label}</span>
      </div>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full overflow-hidden rounded-lg border bg-muted/20 text-left transition hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <div className="pointer-events-none h-40 w-full">
          <LocationMapInner
            lat={latitude}
            lng={longitude}
            height={160}
            zoom={12}
            interactive={false}
          />
        </div>
        <p className="px-3 py-2 text-xs text-muted-foreground">
          Click to open interactive map
        </p>
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl gap-0 overflow-hidden p-0 sm:max-w-[min(90vw,52rem)]">
          <DialogHeader className="border-b px-6 py-4 pr-14 text-left">
            <DialogTitle>{label}</DialogTitle>
          </DialogHeader>
          <div className="p-2">
            {open ? (
              <LocationMapInner
                key={`${latitude}-${longitude}-dialog`}
                lat={latitude}
                lng={longitude}
                height={440}
                zoom={14}
                interactive
                invalidateAfterMount
              />
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
