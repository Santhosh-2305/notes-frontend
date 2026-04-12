import { useState, useCallback } from "react";

const STORAGE_KEY = "notevault_prefs";

const load = () => {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; }
  catch { return {}; }
};

const save = (data) => {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }
  catch {}
};

// Only client-side prefs (not persisted to DB)
export const defaultPrefs = () => ({
  fontSize:    "md",   // sm | md | lg
  attachments: [],     // [{ name, type, dataUrl }]
});

export const useNotePrefs = () => {
  const [prefs, setPrefs] = useState(load);

  const getPrefs = useCallback(
    (id) => ({ ...defaultPrefs(), ...(prefs[id] || {}) }),
    [prefs]
  );

  const updatePrefs = useCallback((id, patch) => {
    setPrefs((prev) => {
      const next = {
        ...prev,
        [id]: { ...defaultPrefs(), ...(prev[id] || {}), ...patch },
      };
      save(next);
      return next;
    });
  }, []);

  const removePrefs = useCallback((id) => {
    setPrefs((prev) => {
      const next = { ...prev };
      delete next[id];
      save(next);
      return next;
    });
  }, []);

  return { getPrefs, updatePrefs, removePrefs };
};
