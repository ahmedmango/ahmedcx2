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

    // POST - Save/update epigrams (admin only)
    if (req.method === 'POST') {
      const body = await req.json();
      const { write_key, epigram } = body;

      console.log('Save epigram request received');

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
        
        // Get the current display_order of the epigram being updated
        const { data: currentEpigram } = await supabase
          .from('epigrams')
          .select('display_order')
          .eq('id', epigram.id)
          .single();
        
        const oldOrder = currentEpigram?.display_order;
        const newOrder = epigram.display_order;
        
        // If display_order is changing, we need to reorder
        if (oldOrder !== newOrder) {
          if (newOrder < oldOrder) {
            // Moving up: shift epigrams between newOrder and oldOrder down
            await supabase
              .from('epigrams')
              .update({ display_order: supabase.rpc('increment', {}) })
              .gte('display_order', newOrder)
              .lt('display_order', oldOrder)
              .neq('id', epigram.id);
          } else {
            // Moving down: shift epigrams between oldOrder and newOrder up
            await supabase
              .from('epigrams')
              .update({ display_order: supabase.rpc('decrement', {}) })
              .gt('display_order', oldOrder)
              .lte('display_order', newOrder)
              .neq('id', epigram.id);
          }
        }
        
        result = await supabase
          .from('epigrams')
          .update({
            text: epigram.text,
            thread_id: epigram.thread_id || 'default',
            title: epigram.title || null,
            display_order: newOrder
          })
          .eq('id', epigram.id)
          .select()
          .single();
      } else {
        console.log('Creating new epigram');
        const targetOrder = epigram.display_order || 1;
        
        // Shift all epigrams at and after the target position down by 1
        const { error: shiftError } = await supabase.rpc('shift_epigrams_down', { 
          from_order: targetOrder 
        });
        
        if (shiftError) {
          console.error('Error shifting epigrams:', shiftError);
          // If the function doesn't exist, do it manually
          await supabase
            .from('epigrams')
            .select('id, display_order')
            .gte('display_order', targetOrder)
            .order('display_order', { ascending: false })
            .then(async ({ data: epigramsToShift }) => {
              if (epigramsToShift) {
                for (const ep of epigramsToShift) {
                  await supabase
                    .from('epigrams')
                    .update({ display_order: ep.display_order + 1 })
                    .eq('id', ep.id);
                }
              }
            });
        }
        
        result = await supabase
          .from('epigrams')
          .insert({
            text: epigram.text,
            thread_id: epigram.thread_id || 'default',
            title: epigram.title || null,
            display_order: targetOrder
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

      // Get the display_order of the epigram being deleted
      const { data: deletedEpigram } = await supabase
        .from('epigrams')
        .select('display_order')
        .eq('id', id)
        .single();

      const { error } = await supabase
        .from('epigrams')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting epigram:', error);
        throw error;
      }

      // Shift all epigrams after the deleted one up by 1
      if (deletedEpigram?.display_order) {
        await supabase
          .from('epigrams')
          .select('id, display_order')
          .gt('display_order', deletedEpigram.display_order)
          .then(async ({ data: epigramsToShift }) => {
            if (epigramsToShift) {
              for (const ep of epigramsToShift) {
                await supabase
                  .from('epigrams')
                  .update({ display_order: ep.display_order - 1 })
                  .eq('id', ep.id);
              }
            }
          });
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