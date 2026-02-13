import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Settings {
  header_text_color: string;
  thread_number_color: string;
  progress_bar_color: string;
  body_text_color: string;
  loading_bar_color: string;
  keyhole_quote: string;
  depth_page_content: string;
  [key: string]: string;
}

export const useSettings = () => {
  const [settings, setSettings] = useState<Settings>({
    header_text_color: '0 0% 45%',
    thread_number_color: '5 100% 66%',
    progress_bar_color: '5 100% 66%',
    body_text_color: '0 0% 15%',
    loading_bar_color: '5 100% 66%',
    keyhole_quote: 'the most entertaining satisfying outcome is most likely',
    depth_page_content: '',
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
          acc[curr.key] = curr.value;
          return acc;
        }, {} as Record<string, string>);
        
        setSettings(prev => ({ ...prev, ...settingsObj }));
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (key: string, value: string) => {
    const writeKey = sessionStorage.getItem("ahmed_write_key");
    if (!writeKey) {
      console.error('No write key found');
      return false;
    }

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/epigrams`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            write_key: writeKey,
            action: 'update_setting',
            key,
            value
          })
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update setting');
      }

      setSettings(prev => ({ ...prev, [key]: value }));
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
