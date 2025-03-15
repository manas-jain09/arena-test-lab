
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

    console.log("Processing request for quizId:", quizId, "with filters:", filters);

    // Fetch quiz details
    const { data: quiz, error: quizError } = await supabaseClient
      .from('quizzes')
      .select('*')
      .eq('id', quizId)
      .single();
    
    if (quizError || !quiz) {
      console.error("Quiz fetch error:", quizError);
      return new Response(
        JSON.stringify({ error: 'Quiz not found', details: quizError }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    // Fetch student results with applied filters
    let query = supabaseClient
      .from('student_results')
      .select('*')
      .eq('quiz_id', quizId);
    
    // Apply division filter if provided
    if (filters && filters.division && filters.division !== 'all') {
      query = query.eq('division', filters.division);
    }
    
    // Apply search term filter if provided
    if (filters && filters.searchTerm) {
      const searchPattern = `%${filters.searchTerm.toLowerCase()}%`;
      query = query.or(`name.ilike.${searchPattern},prn.ilike.${searchPattern},email.ilike.${searchPattern}`);
    }
    
    // Execute the query to get filtered results
    const { data: results, error: resultsError } = await query;
    
    if (resultsError) {
      console.error("Results fetch error:", resultsError);
      return new Response(
        JSON.stringify({ error: 'Error fetching results', details: resultsError }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    if (!results || results.length === 0) {
      console.log("No results found with the given filters");
      return new Response(
        JSON.stringify({ error: 'No results found with the given filters' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    // Sort the results in JavaScript instead of SQL
    let sortedResults = [...results];
    
    if (filters && filters.sortBy) {
      sortedResults.sort((a, b) => {
        let comparison = 0;
        switch (filters.sortBy) {
          case 'name':
            comparison = a.name.localeCompare(b.name);
            break;
          case 'marks':
            comparison = a.marks_scored - b.marks_scored;
            break;
          case 'percentage':
            comparison = (a.marks_scored / a.total_marks) - (b.marks_scored / b.total_marks);
            break;
          case 'date':
          default:
            comparison = new Date(a.submitted_at).getTime() - new Date(b.submitted_at).getTime();
            break;
        }
        
        return filters.sortOrder === 'asc' ? comparison : -comparison;
      });
    } else {
      // Default sort by submission date (newest first)
      sortedResults.sort((a, b) => 
        new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime()
      );
    }

    console.log(`Generating CSV for ${sortedResults.length} results`);

    // Generate CSV content
    const csvHeader = [
      'Name',
      'PRN',
      'Division',
      'Quiz',
      'Cheating Status',
      'Marks',
      'Percentage',
      'Submitted At',
    ].join(',');

    const csvRows = sortedResults.map(result => {
      const percentage = ((result.marks_scored / result.total_marks) * 100).toFixed(2);
      const submittedDate = new Date(result.submitted_at).toLocaleString();
      
      // Format cheating status same as UI
      const cheatingStatus = result.cheating_status === 'flagged' || result.cheating_status === 'caught-cheating' 
        ? 'Flagged' 
        : 'No Issues';
      
      // Escape fields that might contain commas
      const escapeCsvField = (field) => {
        if (field && typeof field === 'string' && (field.includes(',') || field.includes('"') || field.includes('\n'))) {
          return `"${field.replace(/"/g, '""')}"`;
        }
        return field;
      };
      
      return [
        escapeCsvField(result.name),
        escapeCsvField(result.prn),
        `Division ${result.division}`,
        escapeCsvField(quiz.title), // Include quiz title
        cheatingStatus,
        `${result.marks_scored} / ${result.total_marks}`,
        `${percentage}%`,
        escapeCsvField(submittedDate)
      ].join(',');
    });

    const csvContent = [csvHeader, ...csvRows].join('\n');
    
    // Generate a filename for the CSV file
    const quizTitle = quiz.title.replace(/[^a-z0-9]/gi, '-').toLowerCase();
    const filename = `${quizTitle}-results-${Date.now()}.csv`;
    
    // Create a storage bucket if it doesn't exist yet
    const { error: bucketError } = await supabaseClient
      .storage
      .createBucket('quiz-reports', {
        public: false,
        fileSizeLimit: 5242880 // 5MB 
      })
      .catch(() => ({ error: null })); // Bucket might already exist
    
    if (bucketError) {
      console.error("Bucket creation error:", bucketError);
    }
    
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
      console.error("CSV upload error:", uploadError);
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
      console.error("Signed URL error:", signUrlError);
      return new Response(
        JSON.stringify({ error: 'Error creating signed URL', details: signUrlError }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    console.log("CSV report generated successfully");
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
