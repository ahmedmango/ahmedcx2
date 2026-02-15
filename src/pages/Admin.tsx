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
import { DndContext, DragEndEvent, closestCenter } from "@dnd-kit/core";
import { SortableContext, arrayMove, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { SortableEpigramCard } from "@/components/SortableEpigramCard";
import ImageComposer from "@/components/ImageComposer";
import ThresholdQuestionsEditor from "@/components/ThresholdQuestionsEditor";

interface Epigram {
  id?: number;
  text: string;
  thread_id: string;
  created_at?: string;
  title?: string;
  image_url?: string;
}

interface SecretEpigram {
  id?: number;
  text: string;
  title?: string;
  display_order: number;
  created_at?: string;
}

const edgeFunctionUrl = () => `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/epigrams`;

const Admin = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [writeKey, setWriteKey] = useState("");
  const [epigrams, setEpigrams] = useState<Epigram[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editText, setEditText] = useState("");
  const [editThreadId, setEditThreadId] = useState("default");
  const [editTitle, setEditTitle] = useState("");
  const [newText, setNewText] = useState("");
  const [newThreadId, setNewThreadId] = useState("default");
  const [newTitle, setNewTitle] = useState("");
  const [newImageUrl, setNewImageUrl] = useState("");
  const [loading, setLoading] = useState(false);
  
  const [secretEpigrams, setSecretEpigrams] = useState<SecretEpigram[]>([]);
  const [newSecretText, setNewSecretText] = useState("");
  const [newSecretTitle, setNewSecretTitle] = useState("");
  const [editingSecretId, setEditingSecretId] = useState<number | null>(null);
  const [editSecretText, setEditSecretText] = useState("");
  const [editSecretTitle, setEditSecretTitle] = useState("");
  const [secretPreview, setSecretPreview] = useState(false);
  
  const { settings, updateSetting, loadSettings } = useSettings();

  const getWriteKey = () => sessionStorage.getItem("ahmed_write_key") || writeKey;

  useEffect(() => {
    const validateStoredKey = async () => {
      const storedKey = sessionStorage.getItem("ahmed_write_key");
      if (!storedKey) return;

      try {
        const response = await fetch(edgeFunctionUrl(), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            write_key: storedKey,
            epigram: { text: '__test__', thread_id: 'test' }
          })
        });

        if (!response.ok) {
          sessionStorage.removeItem("ahmed_write_key");
          setWriteKey("");
          setIsAuthenticated(false);
          toast.error("Session expired. Please log in again.");
          return;
        }

        setWriteKey(storedKey);
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Error validating stored write key:', error);
        sessionStorage.removeItem("ahmed_write_key");
        setWriteKey("");
        setIsAuthenticated(false);
      }
    };

    void validateStoredKey();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadEpigrams();
      loadSettings();
      loadSecretEpigrams();
    }
  }, [isAuthenticated]);

  // ========== SECRET EPIGRAMS (via edge function) ==========

  const loadSecretEpigrams = async () => {
    try {
      const { data, error } = await supabase
        .from('secret_epigrams')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      setSecretEpigrams(data || []);
    } catch (error) {
      console.error('Error loading secret epigrams:', error);
    }
  };

  const handleSaveNewSecret = async () => {
    if (!newSecretText.trim()) {
      toast.error("Please enter text for the secret epigram");
      return;
    }

    setLoading(true);
    try {
      const maxOrder = secretEpigrams.length > 0 
        ? Math.max(...secretEpigrams.map(e => e.display_order)) 
        : 0;

      const response = await fetch(edgeFunctionUrl(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          write_key: getWriteKey(),
          action: 'create_secret',
          text: newSecretText,
          title: newSecretTitle || null,
          display_order: maxOrder + 1
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create');
      }

      toast.success("Secret epigram created");
      setNewSecretText("");
      setNewSecretTitle("");
      await loadSecretEpigrams();
    } catch (error) {
      console.error('Error creating secret epigram:', error);
      toast.error("Failed to create secret epigram");
    } finally {
      setLoading(false);
    }
  };

  const handleEditSecret = (epigram: SecretEpigram) => {
    setEditingSecretId(epigram.id || null);
    setEditSecretText(epigram.text);
    setEditSecretTitle(epigram.title || "");
  };

  const handleSaveSecretEdit = async () => {
    if (!editSecretText.trim() || editingSecretId === null) {
      toast.error("Text cannot be empty");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(edgeFunctionUrl(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          write_key: getWriteKey(),
          action: 'update_secret',
          id: editingSecretId,
          text: editSecretText,
          title: editSecretTitle || null
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update');
      }

      toast.success("Secret epigram updated");
      setEditingSecretId(null);
      setEditSecretText("");
      setEditSecretTitle("");
      await loadSecretEpigrams();
    } catch (error) {
      console.error('Error updating secret epigram:', error);
      toast.error("Failed to update secret epigram");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSecret = async (id: number) => {
    if (!confirm("Are you sure you want to delete this secret epigram?")) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(edgeFunctionUrl(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          write_key: getWriteKey(),
          action: 'delete_secret',
          id
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete');
      }

      toast.success("Secret epigram deleted");
      await loadSecretEpigrams();
    } catch (error) {
      console.error('Error deleting secret epigram:', error);
      toast.error("Failed to delete secret epigram");
    } finally {
      setLoading(false);
    }
  };

  // ========== AUTH ==========

  const handleLogin = async () => {
    if (!writeKey.trim()) {
      toast.error("Please enter a write key");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(edgeFunctionUrl(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          write_key: writeKey,
          epigram: { text: '__test__', thread_id: 'test' }
        })
      });

      if (response.status === 401) {
        toast.error("Invalid write key");
        setWriteKey("");
        return;
      }

      sessionStorage.setItem("ahmed_write_key", writeKey);
      setIsAuthenticated(true);
      await loadEpigrams();
      toast.success("Authenticated successfully");
    } catch (error) {
      console.error('Authentication error:', error);
      toast.error("Authentication failed");
      setWriteKey("");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("ahmed_write_key");
    setIsAuthenticated(false);
    setWriteKey("");
    navigate("/");
  };

  // ========== EPIGRAMS ==========

  const loadEpigrams = async () => {
    try {
      const { data, error } = await supabase
        .from('epigrams')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      setEpigrams(data || []);
    } catch (error) {
      console.error('Error loading epigrams:', error);
      toast.error("Failed to load epigrams");
    }
  };

  const handleSaveNew = async () => {
    if (!newText.trim() && !newImageUrl) {
      toast.error("Please provide either text or an image");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(edgeFunctionUrl(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          write_key: getWriteKey(),
          epigram: {
            text: newText || '',
            thread_id: newThreadId,
            title: newTitle || null,
            image_url: newImageUrl || null
          }
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save');
      }

      toast.success("Epigram created successfully");
      setNewText("");
      setNewThreadId("default");
      setNewTitle("");
      setNewImageUrl("");
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
    setEditTitle(epigram.title || "");
  };

  const handleSaveEdit = async () => {
    if (!editText.trim() || editingId === null) {
      toast.error("Text cannot be empty");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(edgeFunctionUrl(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          write_key: getWriteKey(),
          epigram: {
            id: editingId,
            text: editText,
            thread_id: editThreadId,
            title: editTitle || null
          }
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save');
      }

      toast.success("Epigram updated successfully");
      setEditingId(null);
      setEditText("");
      setEditThreadId("default");
      setEditTitle("");
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
      const response = await fetch(edgeFunctionUrl(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          write_key: getWriteKey(),
          delete_id: id,
        })
      });

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

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = epigrams.findIndex((e) => e.id === active.id);
    const newIndex = epigrams.findIndex((e) => e.id === over.id);

    const reorderedEpigrams = arrayMove(epigrams, oldIndex, newIndex);
    setEpigrams(reorderedEpigrams);

    setLoading(true);
    try {
      const reorderData = reorderedEpigrams.map((epigram, index) => ({
        id: epigram.id,
        display_order: index + 1
      }));

      const response = await fetch(edgeFunctionUrl(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          write_key: getWriteKey(),
          reorder_batch: reorderData
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update order');
      }
      
      toast.success("Order updated successfully");
      await loadEpigrams();
    } catch (error) {
      console.error('Error updating order:', error);
      toast.error(error instanceof Error ? error.message : "Failed to update order");
      await loadEpigrams();
    } finally {
      setLoading(false);
    }
  };

  // ========== RENDER ==========

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
            <Button onClick={handleLogin} className="w-full" disabled={loading}>
              {loading ? "Verifying..." : "Login"}
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
            {([
              ['header_text_color', 'Header Text Color ("AHMED")'],
              ['thread_number_color', 'Thread Number Color'],
              ['progress_bar_color', 'Progress Bar Color'],
              ['body_text_color', 'Body Text Color'],
              ['loading_bar_color', 'Loading Bar Color'],
            ] as const).map(([key, label]) => (
              <div key={key} className="space-y-3">
                <label className="text-sm font-medium block">{label}</label>
                <div className="flex gap-3 items-center">
                  <input
                    type="color"
                    value={hslToHex(settings[key])}
                    onChange={(e) => updateSetting(key, hexToHSL(e.target.value))}
                    className="w-20 h-12 rounded border-2 border-border cursor-pointer"
                  />
                  <Input
                    value={settings[key]}
                    onChange={(e) => updateSetting(key, e.target.value)}
                    placeholder="0 0% 45%"
                    className="font-mono text-sm flex-1"
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 p-4 bg-muted/30 rounded-lg">
            <p className="text-xs text-muted-foreground mb-2">Preview:</p>
            <div className="flex gap-4 flex-wrap">
              {([
                ['header_text_color', 'Header'],
                ['thread_number_color', 'Thread #'],
                ['progress_bar_color', 'Progress'],
                ['body_text_color', 'Body Text'],
                ['loading_bar_color', 'Loading Bar'],
              ] as const).map(([key, label]) => (
                <div key={key} className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded border-2" style={{ backgroundColor: `hsl(${settings[key]})` }} />
                  <span className="text-xs">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Create New Epigram */}
        <Card className="p-6 mb-8 border-accent/20">
          <h2 className="text-xl font-semibold mb-4">Create New Epigram</h2>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block text-muted-foreground">Thread ID</label>
              <Input
                placeholder="default"
                value={newThreadId}
                onChange={(e) => setNewThreadId(e.target.value)}
                className="max-w-xs"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block text-muted-foreground">
                Title <span className="text-xs">(Optional - bold, centered, larger)</span>
              </label>
              <Input
                placeholder="Optional title for this epigram..."
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="font-serif text-lg"
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

        {/* Image Composer */}
        <ImageComposer onImageCreated={(url) => {
          setNewImageUrl(url);
          toast.success("Image ready! Fill in details and click Create Epigram");
        }} />

        {/* Secret Thread Editor */}
        <Card className="p-6 mb-8 border-orange-500/30 bg-black/5">
          <h2 className="text-xl font-semibold mb-2">Secret Epigrams</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Hidden content revealed when users flip their phone upside down for 2 seconds (mobile only)
          </p>
          
          <div className="space-y-4 mb-6 p-4 bg-muted/20 rounded-lg">
            <h3 className="text-sm font-semibold">Create New Secret Epigram</h3>
            <div>
              <label className="text-sm font-medium mb-2 block text-muted-foreground">
                Title <span className="text-xs">(Optional)</span>
              </label>
              <Input
                placeholder="Optional title..."
                value={newSecretTitle}
                onChange={(e) => setNewSecretTitle(e.target.value)}
                className="font-mono"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block text-muted-foreground">
                Text <span className="text-xs">(HTML supported)</span>
              </label>
              <Textarea
                placeholder="Enter secret content... HTML tags like <p>, <br>, <em> are supported"
                value={newSecretText}
                onChange={(e) => setNewSecretText(e.target.value)}
                rows={6}
                className="font-mono text-sm resize-none"
              />
            </div>
            <Button 
              onClick={handleSaveNewSecret} 
              disabled={loading}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {loading ? "Creating..." : "Create Secret Epigram"}
            </Button>
          </div>

          <div className="mb-4">
            <Button 
              variant="outline"
              onClick={() => setSecretPreview(!secretPreview)}
              size="sm"
            >
              {secretPreview ? "Hide Preview" : "Show Preview"}
            </Button>
          </div>

          {secretPreview && (
            <div 
              className="mb-6 p-6 rounded-lg min-h-[200px]"
              style={{
                background: '#000000',
                color: '#FF7A00',
                fontFamily: '"Courier New", Courier, monospace',
                lineHeight: 1.7,
                textShadow: '0 0 12px rgba(255, 122, 0, 0.25)',
              }}
            >
              <p className="text-xs opacity-50 mb-4">Preview (as it appears in secret mode):</p>
              <div className="space-y-8">
                {secretEpigrams.map((ep, idx) => (
                  <div key={ep.id}>
                    <div className="text-xs opacity-40 mb-2">#{String(idx + 1).padStart(4, '0')}</div>
                    {ep.title && <h3 className="text-xl font-bold mb-2">{ep.title}</h3>}
                    <div dangerouslySetInnerHTML={{ __html: ep.text }} />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-3">
            <h3 className="text-sm font-semibold">All Secret Epigrams ({secretEpigrams.length})</h3>
            {secretEpigrams.length === 0 ? (
              <p className="text-sm text-muted-foreground">No secret epigrams yet.</p>
            ) : (
              secretEpigrams.map((ep, index) => (
                <div key={ep.id} className="p-4 border rounded-lg bg-background">
                  {editingSecretId === ep.id ? (
                    <div className="space-y-3">
                      <Input
                        value={editSecretTitle}
                        onChange={(e) => setEditSecretTitle(e.target.value)}
                        placeholder="Title (optional)"
                        className="font-mono"
                      />
                      <Textarea
                        value={editSecretText}
                        onChange={(e) => setEditSecretText(e.target.value)}
                        rows={4}
                        className="font-mono text-sm resize-none"
                      />
                      <div className="flex gap-2">
                        <Button onClick={handleSaveSecretEdit} disabled={loading} size="sm">
                          Save
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            setEditingSecretId(null);
                            setEditSecretText("");
                            setEditSecretTitle("");
                          }}
                          size="sm"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs text-muted-foreground">#{String(index + 1).padStart(4, '0')}</span>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleEditSecret(ep)}>
                            Edit
                          </Button>
                          <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDeleteSecret(ep.id!)}>
                            Delete
                          </Button>
                        </div>
                      </div>
                      {ep.title && <h4 className="font-semibold mb-1">{ep.title}</h4>}
                      <p className="text-sm line-clamp-3">{ep.text.replace(/<[^>]*>/g, '')}</p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </Card>
<ThresholdQuestionsEditor writeKey={writeKey} />
        {/* Existing Epigrams */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold mb-4">All Epigrams (Drag to Reorder)</h2>
          <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={epigrams.map(e => e.id || 0)} strategy={verticalListSortingStrategy}>
              {epigrams.map((epigram, index) => (
                <SortableEpigramCard
                  key={epigram.id}
                  epigram={epigram}
                  displayNumber={index + 1}
                  editingId={editingId}
                  editText={editText}
                  editThreadId={editThreadId}
                  editTitle={editTitle}
                  loading={loading}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onSaveEdit={handleSaveEdit}
                  onCancelEdit={() => {
                    setEditingId(null);
                    setEditText("");
                    setEditThreadId("default");
                    setEditTitle("");
                  }}
                  setEditText={setEditText}
                  setEditThreadId={setEditThreadId}
                  setEditTitle={setEditTitle}
                />
              ))}
            </SortableContext>
          </DndContext>
        </div>
      </div>
    </div>
  );
};

export default Admin;
