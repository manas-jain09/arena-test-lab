
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

    // Instead of generating PDF with pdfMake, we'll create HTML content
    // and convert it to PDF using jsPDF or another approach
    // For simplicity, let's just generate HTML content directly
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${quiz.title} - Results Report</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1 { color: #333; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
          tr:nth-child(even) { background-color: #f9f9f9; }
        </style>
      </head>
      <body>
        <h1>${quiz.title} - Results Report</h1>
        <p>Generated on ${new Date().toLocaleString()}</p>
        
        <table>
          <tr>
            <th>Name</th>
            <th>PRN</th>
            <th>Division</th>
            <th>Cheating Status</th>
            <th>Marks</th>
            <th>Percentage</th>
            <th>Submitted At</th>
          </tr>
          ${results.map(result => `
            <tr>
              <td>${result.name}</td>
              <td>${result.prn}</td>
              <td>Division ${result.division}</td>
              <td>${result.cheating_status === 'flagged' ? 'Flagged' : 'No Issues'}</td>
              <td>${result.marks_scored} / ${result.total_marks}</td>
              <td>${((result.marks_scored / result.total_marks) * 100).toFixed(2)}%</td>
              <td>${new Date(result.submitted_at).toLocaleString()}</td>
            </tr>
          `).join('')}
        </table>
      </body>
      </html>
    `;

    // Convert HTML to Blob
    const encoder = new TextEncoder();
    const htmlBytes = encoder.encode(htmlContent);
    
    // Generate a unique filename for the HTML file
    const filename = `quiz-results-${quizId}-${Date.now()}.html`;
    
    // Create a storage bucket if it doesn't exist yet
    const { error: bucketError } = await supabaseClient
      .storage
      .createBucket('quiz-reports', {
        public: false,
        fileSizeLimit: 5242880 // 5MB 
      })
      .catch(() => ({ error: null })); // Bucket might already exist
    
    // Upload the HTML file to storage
    const { data: upload, error: uploadError } = await supabaseClient
      .storage
      .from('quiz-reports')
      .upload(`reports/${filename}`, htmlBytes, {
        contentType: 'text/html',
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
        pdfUrl: signedUrl.signedUrl,
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
