
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
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );
    
    // Parse request body
    const { quizId, filters } = await req.json();
    
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
        JSON.stringify({ error: 'Quiz not found', details: quizError }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    // Build the query for student results
    let resultsQuery = supabaseClient
      .from('student_results')
      .select('*')
      .eq('quiz_id', quizId);
    
    // Apply filters if provided
    if (filters) {
      if (filters.division) {
        resultsQuery = resultsQuery.eq('division', filters.division);
      }
      
      if (filters.searchTerm) {
        const term = filters.searchTerm.toLowerCase();
        resultsQuery = resultsQuery.or(`name.ilike.%${term}%,prn.ilike.%${term}%,email.ilike.%${term}%`);
      }
    }
    
    // Sort results if specified
    if (filters && filters.sortBy) {
      resultsQuery = resultsQuery.order(filters.sortBy, { ascending: filters.sortOrder === 'asc' });
    } else {
      resultsQuery = resultsQuery.order('submitted_at', { ascending: false });
    }
    
    // Fetch student results
    const { data: results, error: resultsError } = await resultsQuery;
    
    if (resultsError) {
      return new Response(
        JSON.stringify({ error: 'Error fetching results', details: resultsError }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Generate CSV content
    const csvHeader = [
      'Name',
      'PRN',
      'Division',
      'Cheating Status',
      'Marks Scored',
      'Total Marks',
      'Percentage',
      'Submitted At',
    ].join(',');

    const csvRows = results.map(result => {
      const percentage = ((result.marks_scored / result.total_marks) * 100).toFixed(2);
      const submittedDate = new Date(result.submitted_at).toLocaleString();
      const cheatingStatus = result.cheating_status === 'flagged' ? 'Flagged' : 'No Issues';
      
      // Escape fields that might contain commas
      const escapeCsvField = (field: string) => {
        if (field.includes(',') || field.includes('"') || field.includes('\n')) {
          return `"${field.replace(/"/g, '""')}"`;
        }
        return field;
      };
      
      return [
        escapeCsvField(result.name),
        escapeCsvField(result.prn),
        `Division ${result.division}`,
        cheatingStatus,
        result.marks_scored,
        result.total_marks,
        `${percentage}%`,
        escapeCsvField(submittedDate)
      ].join(',');
    });

    const csvContent = [csvHeader, ...csvRows].join('\n');
    
    // Generate a filename for the CSV file
    const filename = `quiz-results-${quizId}-${Date.now()}.csv`;
    
    // Create a storage bucket if it doesn't exist yet
    const { error: bucketError } = await supabaseClient
      .storage
      .createBucket('quiz-reports', {
        public: false,
        fileSizeLimit: 5242880 // 5MB 
      })
      .catch(() => ({ error: null })); // Bucket might already exist
    
    // Upload the CSV file to storage
    const encoder = new TextEncoder();
    const csvBytes = encoder.encode(csvContent);
    
    const { data: upload, error: uploadError } = await supabaseClient
      .storage
      .from('quiz-reports')
      .upload(`reports/${filename}`, csvBytes, {
        contentType: 'text/csv',
        upsert: true
      });
    
    if (uploadError) {
      return new Response(
        JSON.stringify({ error: 'Error uploading report', details: uploadError }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }
      
    // Create a signed URL that will allow downloading the file
    const { data: signedUrl, error: signUrlError } = await supabaseClient
      .storage
      .from('quiz-reports')
      .createSignedUrl(`reports/${filename}`, 60); // URL valid for 60 seconds
      
    if (signUrlError) {
      return new Response(
        JSON.stringify({ error: 'Error creating signed URL', details: signUrlError }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    return new Response(
      JSON.stringify({ 
        csvUrl: signedUrl.signedUrl,
        message: 'Report generated successfully' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in generate-quiz-pdf function:', error);
    return new Response(
      JSON.stringify({ error: error.message, stack: error.stack }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
