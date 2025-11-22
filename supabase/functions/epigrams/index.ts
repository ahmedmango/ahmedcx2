import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // GET - Fetch all epigrams (public)
    if (req.method === 'GET') {
      console.log('Fetching all epigrams');
      
      const { data, error } = await supabase
        .from('epigrams')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching epigrams:', error);
        throw error;
      }

      console.log(`Successfully fetched ${data?.length || 0} epigrams`);

      return new Response(
        JSON.stringify(data),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    }

    // POST - Save/update epigrams or handle delete (admin only)
    if (req.method === 'POST') {
      const body = await req.json();
      const { write_key, epigram, delete_id, reorder_batch } = body;

      console.log('Epigrams POST request received');

      // Validate write key
      const validWriteKey = Deno.env.get('WRITE_KEY');
      if (!write_key || write_key !== validWriteKey) {
        console.error('Invalid write key provided');
        return new Response(
          JSON.stringify({ error: 'Unauthorized - Invalid write key' }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 401 
          }
        );
      }

      // Handle batch reordering to avoid unique constraint violations
      if (reorder_batch && Array.isArray(reorder_batch)) {
        console.log(`Batch reordering ${reorder_batch.length} epigrams`);
        
        try {
          // First, set all display_order to temporary high values to avoid conflicts
          const tempOffset = 10000;
          for (let i = 0; i < reorder_batch.length; i++) {
            const { id } = reorder_batch[i];
            await supabase
              .from('epigrams')
              .update({ display_order: tempOffset + i })
              .eq('id', id);
          }
          
          // Then set them to their final values
          for (let i = 0; i < reorder_batch.length; i++) {
            const { id, display_order } = reorder_batch[i];
            const { error } = await supabase
              .from('epigrams')
              .update({ display_order })
              .eq('id', id);
              
            if (error) {
              console.error('Error in batch reorder:', error);
              throw error;
            }
          }
          
          console.log('Successfully reordered epigrams');
          
          return new Response(
            JSON.stringify({ success: true }),
            { 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 200 
            }
          );
        } catch (error) {
          console.error('Batch reorder error:', error);
          throw error;
        }
      }

      // Handle delete via POST to avoid browser DELETE issues
      if (typeof delete_id !== 'undefined') {
        console.log(`Deleting epigram via POST delete_id: ${delete_id}`);

        const { error } = await supabase
          .from('epigrams')
          .delete()
          .eq('id', delete_id);

        if (error) {
          console.error('Error deleting epigram via POST:', error);
          throw error;
        }

        console.log('Successfully deleted epigram via POST');

        return new Response(
          JSON.stringify({ success: true }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200 
          }
        );
      }

      // Special case: validation-only request from admin login
      if (epigram && epigram.text === '__test__' && epigram.thread_id === 'test') {
        console.log('Write key validation request - no DB changes');
        return new Response(
          JSON.stringify({ success: true }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        );
      }

      if (!epigram || !epigram.text) {
        return new Response(
          JSON.stringify({ error: 'Missing epigram text' }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400 
          }
        );
      }

      // If epigram has an id, update it; otherwise insert
      let result;
      if (epigram.id) {
        console.log(`Updating epigram ${epigram.id}`);
        const updateData: any = {
          text: epigram.text,
          thread_id: epigram.thread_id || 'default',
          title: epigram.title || null
        };
        
        // Only update display_order if explicitly provided
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
        console.log('Creating new epigram');
        
        // Get the max display_order to assign the next one
        const { data: maxData } = await supabase
          .from('epigrams')
          .select('display_order')
          .order('display_order', { ascending: false })
          .limit(1);
        
        const nextDisplayOrder = maxData && maxData.length > 0 ? maxData[0].display_order + 1 : 1;
        
        result = await supabase
          .from('epigrams')
          .insert({
            text: epigram.text,
            thread_id: epigram.thread_id || 'default',
            title: epigram.title || null,
            display_order: nextDisplayOrder
          })
          .select()
          .single();
      }

      if (result.error) {
        console.error('Error saving epigram:', result.error);
        throw result.error;
      }

      console.log('Successfully saved epigram');

      return new Response(
        JSON.stringify(result.data),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    }

    // DELETE - Delete epigram (admin only)
    if (req.method === 'DELETE') {
      const url = new URL(req.url);
      const id = url.searchParams.get('id');
      const write_key = url.searchParams.get('write_key');

      console.log(`Delete epigram request for id: ${id}`);

      // Validate write key
      const validWriteKey = Deno.env.get('WRITE_KEY');
      if (!write_key || write_key !== validWriteKey) {
        console.error('Invalid write key provided');
        return new Response(
          JSON.stringify({ error: 'Unauthorized - Invalid write key' }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 401 
          }
        );
      }

      if (!id) {
        return new Response(
          JSON.stringify({ error: 'Missing epigram id' }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400 
          }
        );
      }

      const { error } = await supabase
        .from('epigrams')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting epigram:', error);
        throw error;
      }

      console.log('Successfully deleted epigram');

      return new Response(
        JSON.stringify({ success: true }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 405 
      }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});