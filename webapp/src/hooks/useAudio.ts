"use client";
import { useCallback, useEffect, useState } from "react";
import { audioPlayer } from "@/lib/audio";

export function useAudio(): { enabled: boolean; toggle: () => void } {
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    audioPlayer.registerWasmCallbacks();
  }, []);

  const toggle = useCallback(() => {
    const next = !audioPlayer.isEnabled;
    audioPlayer.isEnabled = next;
    setEnabled(next);
  }, []);

  return { enabled, toggle };
}
