"use client";
import { useState } from "react";
import { Navigation, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { buildDirectionsUrl } from "@/lib/utils";

export function DirectionsButton({
  address,
  placeId,
  variant = "primary",
}: {
  address: string;
  placeId?: string | null;
  variant?: "primary" | "outline";
}) {
  const [loading, setLoading] = useState(false);

  const onClick = () => {
    setLoading(true);
    const open = (origin?: { lat: number; lng: number } | null) => {
      const url = buildDirectionsUrl(address, placeId, origin);
      window.open(url, "_blank");
      setLoading(false);
    };
    if (!navigator.geolocation) return open(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => open({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => open(null),
      { timeout: 6000 }
    );
  };

  return (
    <Button variant={variant} onClick={onClick} disabled={loading}>
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Navigation className="h-4 w-4" />}
      Get Directions
    </Button>
  );
}
