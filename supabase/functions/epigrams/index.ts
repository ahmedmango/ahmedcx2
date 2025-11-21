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
        result = await supabase
          .from('epigrams')
          .update({
            text: epigram.text,
            thread_id: epigram.thread_id || 'default'
          })
          .eq('id', epigram.id)
          .select()
          .single();
      } else {
        console.log('Creating new epigram');
        result = await supabase
          .from('epigrams')
          .insert({
            text: epigram.text,
            thread_id: epigram.thread_id || 'default'
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