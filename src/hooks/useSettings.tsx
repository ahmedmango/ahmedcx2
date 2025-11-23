import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Settings {
  header_text_color: string;
  thread_number_color: string;
  progress_bar_color: string;
  body_text_color: string;
}

const CACHE_KEY = 'epigram_settings_cache';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const useSettings = () => {
  const [settings, setSettings] = useState<Settings>(() => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_DURATION) {
          return data;
        }
      }
    } catch (e) {
      console.error('Error reading cached settings:', e);
    }
    
    return {
      header_text_color: '0 0% 45%',
      thread_number_color: '5 100% 66%',
      progress_bar_color: '5 100% 66%',
      body_text_color: '0 0% 15%'
    };
  });
  const [loading, setLoading] = useState(true);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('*');

      if (error) throw error;

      if (data) {
        const settingsObj = data.reduce((acc, curr) => {
          acc[curr.key as keyof Settings] = curr.value;
          return acc;
        }, {} as Settings);
        
        setSettings(settingsObj);
        
        // Cache the settings
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify({
            data: settingsObj,
            timestamp: Date.now()
          }));
        } catch (e) {
          console.error('Error caching settings:', e);
        }
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (key: keyof Settings, value: string) => {
    try {
      const { error } = await supabase
        .from('settings')
        .update({ value, updated_at: new Date().toISOString() })
        .eq('key', key);

      if (error) throw error;

      const newSettings = { ...settings, [key]: value };
      setSettings(newSettings);
      
      // Update cache
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify({
          data: newSettings,
          timestamp: Date.now()
        }));
      } catch (e) {
        console.error('Error updating cached settings:', e);
      }
      
      return true;
    } catch (error) {
      console.error('Error updating setting:', error);
      return false;
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  return { settings, loading, updateSetting, loadSettings };
};
