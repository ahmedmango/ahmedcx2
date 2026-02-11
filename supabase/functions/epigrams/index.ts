import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // GET - Fetch all epigrams (public)
    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('epigrams')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;

      return new Response(
        JSON.stringify(data),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // POST - All admin operations
    if (req.method === 'POST') {
      const body = await req.json();
      const { write_key, action } = body;

      // Validate write key for ALL write operations
      const validWriteKey = Deno.env.get('WRITE_KEY');
      if (!write_key || write_key !== validWriteKey) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized - Invalid write key' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
        );
      }

      // Special case: validation-only request from admin login
      if (body.epigram && body.epigram.text === '__test__' && body.epigram.thread_id === 'test') {
        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
      }

      // ========== SETTINGS ==========
      if (action === 'update_setting') {
        const { key, value } = body;
        if (!key || value === undefined) {
          return new Response(
            JSON.stringify({ error: 'Missing key or value' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
          );
        }

        const { error } = await supabase
          .from('settings')
          .update({ value, updated_at: new Date().toISOString() })
          .eq('key', key);

        if (error) throw error;

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
      }

      // ========== SECRET EPIGRAMS ==========
      if (action === 'create_secret') {
        const { text, title, display_order } = body;
        if (!text) {
          return new Response(
            JSON.stringify({ error: 'Missing text' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
          );
        }

        const { data, error } = await supabase
          .from('secret_epigrams')
          .insert({ text, title: title || null, display_order: display_order || 1 })
          .select()
          .single();

        if (error) throw error;

        return new Response(
          JSON.stringify(data),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
      }

      if (action === 'update_secret') {
        const { id, text, title } = body;
        if (!id || !text) {
          return new Response(
            JSON.stringify({ error: 'Missing id or text' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
          );
        }

        const { error } = await supabase
          .from('secret_epigrams')
          .update({ text, title: title || null })
          .eq('id', id);

        if (error) throw error;

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
      }

      if (action === 'delete_secret') {
        const { id } = body;
        if (!id) {
          return new Response(
            JSON.stringify({ error: 'Missing id' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
          );
        }

        const { error } = await supabase
          .from('secret_epigrams')
          .delete()
          .eq('id', id);

        if (error) throw error;

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
      }

      // ========== EPIGRAMS (existing logic) ==========

      const { epigram, delete_id, reorder_batch } = body;

      // Handle batch reordering
      if (reorder_batch && Array.isArray(reorder_batch)) {
        try {
          const tempOffset = 10000;
          for (let i = 0; i < reorder_batch.length; i++) {
            const { id } = reorder_batch[i];
            await supabase
              .from('epigrams')
              .update({ display_order: tempOffset + i })
              .eq('id', id);
          }
          
          for (let i = 0; i < reorder_batch.length; i++) {
            const { id, display_order } = reorder_batch[i];
            const { error } = await supabase
              .from('epigrams')
              .update({ display_order })
              .eq('id', id);
              
            if (error) throw error;
          }
          
          return new Response(
            JSON.stringify({ success: true }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
          );
        } catch (error) {
          throw error;
        }
      }

      // Handle delete
      if (typeof delete_id !== 'undefined') {
        const { error } = await supabase
          .from('epigrams')
          .delete()
          .eq('id', delete_id);

        if (error) throw error;

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
      }

      // Handle create/update epigram
      if (!epigram || (!epigram.text && !epigram.image_url)) {
        return new Response(
          JSON.stringify({ error: 'Missing epigram text or image' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }

      let result;
      if (epigram.id) {
        const updateData: any = {
          text: epigram.text || '',
          thread_id: epigram.thread_id || 'default',
          title: epigram.title || null,
          image_url: epigram.image_url || null
        };
        
        if (epigram.display_order !== undefined) {
          updateData.display_order = epigram.display_order;
        }
        
        result = await supabase
          .from('epigrams')
          .update(updateData)
          .eq('id', epigram.id)
          .select()
          .single();
      } else {
        const { data: maxData } = await supabase
          .from('epigrams')
          .select('display_order')
          .order('display_order', { ascending: false })
          .limit(1);
        
        const nextDisplayOrder = maxData && maxData.length > 0 ? maxData[0].display_order + 1 : 1;
        
        result = await supabase
          .from('epigrams')
          .insert({
            text: epigram.text || '',
            thread_id: epigram.thread_id || 'default',
            title: epigram.title || null,
            image_url: epigram.image_url || null,
            display_order: nextDisplayOrder
          })
          .select()
          .single();
      }

      if (result.error) throw result.error;

      return new Response(
        JSON.stringify(result.data),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // DELETE - Delete epigram (admin only)
    if (req.method === 'DELETE') {
      const url = new URL(req.url);
      const id = url.searchParams.get('id');
      const write_key = url.searchParams.get('write_key');

      const validWriteKey = Deno.env.get('WRITE_KEY');
      if (!write_key || write_key !== validWriteKey) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized - Invalid write key' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
        );
      }

      if (!id) {
        return new Response(
          JSON.stringify({ error: 'Missing epigram id' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }

      const { error } = await supabase
        .from('epigrams')
        .delete()
        .eq('id', id);

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 405 }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
