
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import * as pdfMake from 'https://esm.sh/pdfmake@0.2.7';

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

    // Generate PDF document definition
    const docDefinition = {
      content: [
        { text: `${quiz.title} - Results Report`, style: 'header' },
        { text: `Generated on ${new Date().toLocaleString()}`, style: 'subheader' },
        { text: ' ' }, // Spacer
        {
          table: {
            headerRows: 1,
            widths: ['*', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto'],
            body: [
              [
                'Name', 
                'PRN', 
                'Division', 
                'Cheating Status', 
                'Marks', 
                'Percentage', 
                'Submitted At'
              ],
              ...results.map((result) => [
                result.name,
                result.prn,
                `Division ${result.division}`,
                result.cheating_status === 'flagged' ? 'Flagged' : 'No Issues',
                `${result.marks_scored} / ${result.total_marks}`,
                `${((result.marks_scored / result.total_marks) * 100).toFixed(2)}%`,
                new Date(result.submitted_at).toLocaleString()
              ])
            ]
          }
        }
      ],
      styles: {
        header: {
          fontSize: 18,
          bold: true,
          margin: [0, 0, 0, 10]
        },
        subheader: {
          fontSize: 14,
          margin: [0, 0, 0, 10]
        }
      }
    };

    // Create PDF
    const pdfDoc = pdfMake.createPdf(docDefinition);
    
    // Convert to buffer
    const pdfBuffer = await new Promise((resolve) => {
      pdfDoc.getBuffer((buffer) => {
        resolve(buffer);
      });
    });

    // Generate a unique filename for the PDF
    const filename = `quiz-results-${quizId}-${Date.now()}.pdf`;
    
    // Create a storage bucket if it doesn't exist yet
    const { error: bucketError } = await supabaseClient
      .storage
      .createBucket('quiz-reports', {
        public: false,
        fileSizeLimit: 5242880 // 5MB 
      })
      .catch(() => ({ error: null })); // Bucket might already exist
    
    // Upload the PDF to storage
    const { data: upload, error: uploadError } = await supabaseClient
      .storage
      .from('quiz-reports')
      .upload(`reports/${filename}`, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: true
      });
    
    if (uploadError) {
      return new Response(
        JSON.stringify({ error: 'Error uploading PDF', details: uploadError }),
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
        message: 'PDF generated successfully' 
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
