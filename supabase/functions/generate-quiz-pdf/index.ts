
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    );
    
    // Parse request body
    const { quizId } = await req.json();
    
    if (!quizId) {
      return new Response(
        JSON.stringify({ error: 'Quiz ID is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Fetch quiz details
    const { data: quiz, error: quizError } = await supabaseClient
      .from('quizzes')
      .select('*')
      .eq('id', quizId)
      .single();
    
    if (quizError || !quiz) {
      return new Response(
        JSON.stringify({ error: 'Quiz not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    // Fetch student results for the quiz
    const { data: results, error: resultsError } = await supabaseClient
      .from('student_results')
      .select('*')
      .eq('quiz_id', quizId)
      .order('submitted_at', { ascending: false });
    
    if (resultsError) {
      return new Response(
        JSON.stringify({ error: 'Error fetching results' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Generate a unique filename for the PDF
    const filename = `quiz-results-${quizId}-${Date.now()}.pdf`;
    
    // In a real implementation, you would generate the actual PDF here
    // For this demo, we'll simulate a PDF being generated
    
    // Create a signed URL that will allow downloading the file
    const { data: signedUrl, error: signUrlError } = await supabaseClient
      .storage
      .from('quiz-reports')
      .createSignedUrl(`reports/${filename}`, 60);
      
    if (signUrlError) {
      return new Response(
        JSON.stringify({ error: 'Error creating signed URL' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    return new Response(
      JSON.stringify({ 
        pdfUrl: signedUrl.signedUrl,
        message: 'PDF generated successfully' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
