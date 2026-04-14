"use client";

import { useEffect, useRef } from "react";

interface Props {
  lat: number;
  lng: number;
  address: string;
}

type LeafletMap = any;
type LeafletMarker = any;
type LeafletRuntime = any;

declare global {
  interface Window {
    L?: LeafletRuntime;
  }
}

const LEAFLET_JS_CDN = "https://unpkg.com/leaflet/dist/leaflet.js";
const LEAFLET_CSS_CDN = "https://unpkg.com/leaflet/dist/leaflet.css";

function loadLeafletRuntime(): Promise<LeafletRuntime> {
  if (typeof window === "undefined") return Promise.reject(new Error("Window is unavailable"));
  if (window.L) return Promise.resolve(window.L);

  const existingScript = document.querySelector<HTMLScriptElement>('script[data-leaflet-cdn="true"]');
  const existingCss = document.querySelector<HTMLLinkElement>('link[data-leaflet-cdn="true"]');

  if (!existingCss) {
    const css = document.createElement("link");
    css.rel = "stylesheet";
    css.href = LEAFLET_CSS_CDN;
    css.setAttribute("data-leaflet-cdn", "true");
    document.head.appendChild(css);
  }

  return new Promise((resolve, reject) => {
    if (existingScript) {
      if (window.L) {
        resolve(window.L);
        return;
      }

      const onLoad = () => {
        if (window.L) resolve(window.L);
        else reject(new Error("Leaflet loaded but global L was not found"));
      };
      const onError = () => reject(new Error("Failed to load Leaflet script"));
      existingScript.addEventListener("load", onLoad, { once: true });
      existingScript.addEventListener("error", onError, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = LEAFLET_JS_CDN;
    script.async = true;
    script.setAttribute("data-leaflet-cdn", "true");
    script.onload = () => {
      if (window.L) resolve(window.L);
      else reject(new Error("Leaflet loaded but global L was not found"));
    };
    script.onerror = () => reject(new Error("Failed to load Leaflet script"));
    document.body.appendChild(script);
  });
}

export default function MapView({ lat, lng, address }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<LeafletMap | null>(null);
  const markerRef = useRef<LeafletMarker | null>(null);

  // Initialize map on mount
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    let cancelled = false;
    let createdMap: LeafletMap | null = null;

    void loadLeafletRuntime()
      .then((L) => {
        if (cancelled || !mapRef.current) return;

        const defaultIcon = L.icon({
          iconUrl: "https://unpkg.com/leaflet/dist/images/marker-icon.png",
          iconRetinaUrl: "https://unpkg.com/leaflet/dist/images/marker-icon-2x.png",
          shadowUrl: "https://unpkg.com/leaflet/dist/images/marker-shadow.png",
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowSize: [41, 41],
        });

        const map = L.map(mapRef.current, {
          center: [lat, lng],
          zoom: 17,
          zoomControl: true,
          attributionControl: true,
        });
        createdMap = map;

        // OpenStreetMap tiles - free, no API key
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 19,
        }).addTo(map);

        const marker = L.marker([lat, lng], { icon: defaultIcon })
          .addTo(map)
          .bindPopup(
            `<div style="font-family: 'DM Sans', sans-serif; font-size: 12px; max-width: 220px; line-height: 1.4;">
              <strong style="color: #0a0c10;">Plot Location</strong><br/>
              <span style="color: #555;">${address}</span>
            </div>`
          )
          .openPopup();

        mapInstanceRef.current = map;
        markerRef.current = marker;
        setTimeout(() => map.invalidateSize(), 100);
      })
      .catch(() => {
        // Keep silent: UI remains stable even if map provider is temporarily unreachable.
      });

    return () => {
      cancelled = true;
      if (createdMap) createdMap.remove();
      mapInstanceRef.current = null;
      markerRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Update position when lat/lng changes
  useEffect(() => {
    if (!mapInstanceRef.current || !markerRef.current) return;

    const pos: [number, number] = [lat, lng];
    mapInstanceRef.current.flyTo(pos, 17, { duration: 1.2 });
    markerRef.current.setLatLng(pos);
    markerRef.current.setPopupContent(
      `<div style="font-family: 'DM Sans', sans-serif; font-size: 12px; max-width: 220px; line-height: 1.4;">
        <strong style="color: #0a0c10;">Plot Location</strong><br/>
        <span style="color: #555;">${address}</span>
      </div>`
    );
    markerRef.current.openPopup();
  }, [lat, lng, address]);

  return (
    <div className="rounded-xl overflow-hidden border border-arch-border">
      <div ref={mapRef} className="w-full h-[400px]" />
    </div>
  );
}
