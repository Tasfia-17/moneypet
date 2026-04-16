"use client";
import { useState, useEffect, useCallback } from "react";

const API = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export interface PetState {
  name: string;
  stage: "baby" | "teen" | "adult" | "elder";
  mood: "happy"|"hungry"|"excited"|"worried"|"sick"|"curious"|"sleeping";
  hunger: number;
  happiness: number;
  health: number;
  balance_usdc: number;
  lifetime_earned: number;
  lifetime_spent: number;
  tx_log: { time: string; msg: string }[];
  age_hours: number;
  checkout_session_id: string;
  // xiaozhi additions
  device_state: "idle"|"listening"|"thinking"|"speaking";
  emotion: string;
  spending_controls?: {
    allowance_usdc: string;
    max_tx_usdc: string;
    approval_threshold: string;
    wallet_address: string;
    wallet_status: string;
  };
}

export function usePet() {
  const [state, setState] = useState<PetState | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const r = await fetch(`${API}/state`);
    if (r.ok) setState(await r.json());
  }, []);

  useEffect(() => {
    refresh().finally(() => setLoading(false));
    const es = new EventSource(`${API}/stream`);
    es.onmessage = (e) => setState(JSON.parse(e.data));
    return () => es.close();
  }, [refresh]);

  const sendCommand = useCallback(async (text: string) => {
    // Signal listening state
    await fetch(`${API}/state/listening`, { method: "POST" });
    const r = await fetch(`${API}/command`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    const data = await r.json();
    if (data.state) setState(data.state);
    return data.reply as string;
  }, []);

  const feedPet = useCallback(async (amount = 1) => {
    const r = await fetch(`${API}/feed?amount=${amount}`, { method: "POST" });
    if (r.ok) setState(await r.json());
  }, []);

  return { state, loading, sendCommand, feedPet, refresh };
}
