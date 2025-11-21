import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useSettings } from "@/hooks/useSettings";
import { hexToHSL, hslToHex } from "@/lib/colorUtils";

interface Epigram {
  id?: number;
  text: string;
  thread_id: string;
  created_at?: string;
}

const Admin = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [writeKey, setWriteKey] = useState("");
  const [epigrams, setEpigrams] = useState<Epigram[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editText, setEditText] = useState("");
  const [editThreadId, setEditThreadId] = useState("default");
  const [newText, setNewText] = useState("");
  const [newThreadId, setNewThreadId] = useState("default");
  const [loading, setLoading] = useState(false);
  const { settings, updateSetting, loadSettings } = useSettings();

  useEffect(() => {
    const storedKey = sessionStorage.getItem("ahmed_write_key");
    if (storedKey) {
      setWriteKey(storedKey);
      setIsAuthenticated(true);
      loadEpigrams();
    }
  }, []);

  const handleLogin = () => {
    if (writeKey.trim()) {
      sessionStorage.setItem("ahmed_write_key", writeKey);
      setIsAuthenticated(true);
      loadEpigrams();
      toast.success("Authenticated successfully");
    } else {
      toast.error("Please enter a write key");
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("ahmed_write_key");
    setIsAuthenticated(false);
    setWriteKey("");
    navigate("/");
  };

  const loadEpigrams = async () => {
    try {
      const { data, error } = await supabase
        .from('epigrams')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;
      setEpigrams(data || []);
    } catch (error) {
      console.error('Error loading epigrams:', error);
      toast.error("Failed to load epigrams");
    }
  };

  const handleSaveNew = async () => {
    if (!newText.trim()) {
      toast.error("Text cannot be empty");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/epigrams`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            write_key: writeKey,
            epigram: {
              text: newText,
              thread_id: newThreadId
            }
          })
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save');
      }

      toast.success("Epigram created successfully");
      setNewText("");
      setNewThreadId("default");
      await loadEpigrams();
    } catch (error) {
      console.error('Error creating epigram:', error);
      toast.error(error instanceof Error ? error.message : "Failed to create epigram");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (epigram: Epigram) => {
    setEditingId(epigram.id || null);
    setEditText(epigram.text);
    setEditThreadId(epigram.thread_id);
  };

  const handleSaveEdit = async () => {
    if (!editText.trim() || editingId === null) {
      toast.error("Text cannot be empty");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/epigrams`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            write_key: writeKey,
            epigram: {
              id: editingId,
              text: editText,
              thread_id: editThreadId
            }
          })
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save');
      }

      toast.success("Epigram updated successfully");
      setEditingId(null);
      setEditText("");
      setEditThreadId("default");
      await loadEpigrams();
    } catch (error) {
      console.error('Error updating epigram:', error);
      toast.error(error instanceof Error ? error.message : "Failed to update epigram");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this epigram?")) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/epigrams?id=${id}&write_key=${writeKey}`,
        {
          method: 'DELETE',
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete');
      }

      toast.success("Epigram deleted successfully");
      await loadEpigrams();
    } catch (error) {
      console.error('Error deleting epigram:', error);
      toast.error(error instanceof Error ? error.message : "Failed to delete epigram");
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <Card className="w-full max-w-md p-8">
          <h1 className="text-2xl font-bold mb-6 text-center">Admin Login</h1>
          <div className="space-y-4">
            <Input
              type="password"
              placeholder="Enter write key"
              value={writeKey}
              onChange={(e) => setWriteKey(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            />
            <Button onClick={handleLogin} className="w-full">
              Login
            </Button>
            <Button
              variant="ghost"
              onClick={() => navigate("/")}
              className="w-full"
            >
              Back to Home
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4 md:px-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 pb-6 border-b">
          <div>
            <h1 className="text-3xl font-bold mb-1">Admin Dashboard</h1>
            <p className="text-sm text-muted-foreground">{epigrams.length} epigrams</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate("/")} size="sm">
              View Public Site
            </Button>
            <Button variant="destructive" onClick={handleLogout} size="sm">
              Logout
            </Button>
          </div>
        </div>

        {/* Color Customization */}
        <Card className="p-6 mb-8 border-accent/20">
          <h2 className="text-xl font-semibold mb-4">Color Customization</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Pick colors visually or enter HSL values manually
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="text-sm font-medium block">
                Header Text Color ("AHMED")
              </label>
              <div className="flex gap-3 items-center">
                <input
                  type="color"
                  value={hslToHex(settings.header_text_color)}
                  onChange={(e) => updateSetting('header_text_color', hexToHSL(e.target.value))}
                  className="w-20 h-12 rounded border-2 border-border cursor-pointer"
                />
                <Input
                  value={settings.header_text_color}
                  onChange={(e) => updateSetting('header_text_color', e.target.value)}
                  placeholder="0 0% 45%"
                  className="font-mono text-sm flex-1"
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium block">
                Thread Number Color
              </label>
              <div className="flex gap-3 items-center">
                <input
                  type="color"
                  value={hslToHex(settings.thread_number_color)}
                  onChange={(e) => updateSetting('thread_number_color', hexToHSL(e.target.value))}
                  className="w-20 h-12 rounded border-2 border-border cursor-pointer"
                />
                <Input
                  value={settings.thread_number_color}
                  onChange={(e) => updateSetting('thread_number_color', e.target.value)}
                  placeholder="5 100% 66%"
                  className="font-mono text-sm flex-1"
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium block">
                Progress Bar Color
              </label>
              <div className="flex gap-3 items-center">
                <input
                  type="color"
                  value={hslToHex(settings.progress_bar_color)}
                  onChange={(e) => updateSetting('progress_bar_color', hexToHSL(e.target.value))}
                  className="w-20 h-12 rounded border-2 border-border cursor-pointer"
                />
                <Input
                  value={settings.progress_bar_color}
                  onChange={(e) => updateSetting('progress_bar_color', e.target.value)}
                  placeholder="5 100% 66%"
                  className="font-mono text-sm flex-1"
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium block">
                Body Text Color
              </label>
              <div className="flex gap-3 items-center">
                <input
                  type="color"
                  value={hslToHex(settings.body_text_color)}
                  onChange={(e) => updateSetting('body_text_color', hexToHSL(e.target.value))}
                  className="w-20 h-12 rounded border-2 border-border cursor-pointer"
                />
                <Input
                  value={settings.body_text_color}
                  onChange={(e) => updateSetting('body_text_color', e.target.value)}
                  placeholder="0 0% 15%"
                  className="font-mono text-sm flex-1"
                />
              </div>
            </div>
          </div>
          <div className="mt-6 p-4 bg-muted/30 rounded-lg">
            <p className="text-xs text-muted-foreground mb-2">Preview:</p>
            <div className="flex gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded border-2" style={{ backgroundColor: `hsl(${settings.header_text_color})` }} />
                <span className="text-xs">Header</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded border-2" style={{ backgroundColor: `hsl(${settings.thread_number_color})` }} />
                <span className="text-xs">Thread #</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded border-2" style={{ backgroundColor: `hsl(${settings.progress_bar_color})` }} />
                <span className="text-xs">Progress</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded border-2" style={{ backgroundColor: `hsl(${settings.body_text_color})` }} />
                <span className="text-xs">Body Text</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Create New Epigram */}
        <Card className="p-6 mb-8 border-accent/20">
          <h2 className="text-xl font-semibold mb-4">Create New Epigram</h2>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block text-muted-foreground">
                Thread ID
              </label>
              <Input
                placeholder="default"
                value={newThreadId}
                onChange={(e) => setNewThreadId(e.target.value)}
                className="max-w-xs"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block text-muted-foreground">
                Text <span className="text-xs">(Press Enter for line breaks)</span>
              </label>
              <Textarea
                placeholder="Write your epigram... Press Enter to add line breaks."
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
                rows={8}
                className="font-serif text-lg resize-none"
              />
            </div>
            <Button onClick={handleSaveNew} disabled={loading} className="w-full md:w-auto">
              {loading ? "Creating..." : "Create Epigram"}
            </Button>
          </div>
        </Card>

        {/* Existing Epigrams */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold mb-4">All Epigrams</h2>
          {epigrams.map((epigram) => (
            <Card key={epigram.id} className="overflow-hidden">
              {editingId === epigram.id ? (
                <div className="p-6 space-y-4 bg-muted/20">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-medium text-muted-foreground">
                      Editing #{String(epigram.id).padStart(4, '0')}
                    </label>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block text-muted-foreground">
                      Thread ID
                    </label>
                    <Input
                      value={editThreadId}
                      onChange={(e) => setEditThreadId(e.target.value)}
                      className="max-w-xs"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block text-muted-foreground">
                      Text
                    </label>
                    <Textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      rows={10}
                      className="font-serif text-lg resize-none"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleSaveEdit} disabled={loading}>
                      {loading ? "Saving..." : "Save Changes"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setEditingId(null);
                        setEditText("");
                        setEditThreadId("default");
                      }}
                      disabled={loading}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="p-6">
                  <div className="flex justify-between items-start gap-4 mb-4">
                    <div className="flex-1">
                      <div className="text-xs text-muted-foreground mb-1">
                        #{String(epigram.id).padStart(4, '0')} • Thread: {epigram.thread_id}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(epigram)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => epigram.id && handleDelete(epigram.id)}
                        disabled={loading}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                  <p className="text-lg leading-relaxed font-serif whitespace-pre-wrap">
                    {epigram.text}
                  </p>
                </div>
              )}
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Admin;
