import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get the authenticated user
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser()

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { quizId, filters, filteredResults } = await req.json()

    if (!quizId) {
      return new Response(JSON.stringify({ error: 'Quiz ID is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Verify that the quiz belongs to the authenticated user
    const { data: quizData, error: quizError } = await supabaseClient
      .from('quizzes')
      .select('*')
      .eq('id', quizId)
      .eq('created_by', user.id)
      .single()

    if (quizError || !quizData) {
      console.error('Quiz access error:', quizError)
      return new Response(
        JSON.stringify({ error: 'You do not have permission to access this quiz' }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    let results = []

    // Use the filtered results directly if provided from the client
    if (filteredResults && Array.isArray(filteredResults) && filteredResults.length > 0) {
      results = filteredResults
    } else {
      // Otherwise fetch from database with filters (fallback)
      let query = supabaseClient
        .from('student_results')
        .select('*')
        .eq('quiz_id', quizId)

      // Apply batch filter if provided
      if (filters?.batch && filters.batch !== 'all') {
        query = query.eq('batch', filters.batch)
      }

      const { data: fetchedResults, error: resultsError } = await query

      if (resultsError) {
        console.error('Error fetching results:', resultsError)
        return new Response(JSON.stringify({ error: 'Failed to fetch quiz results' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      if (!fetchedResults || fetchedResults.length === 0) {
        return new Response(JSON.stringify({ error: 'No results found for this quiz' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      results = fetchedResults

      // Apply search filter if provided
      if (filters?.searchTerm) {
        const term = filters.searchTerm.toLowerCase()
        results = results.filter(
          (result) =>
            result.name.toLowerCase().includes(term) ||
            result.prn.toLowerCase().includes(term) ||
            result.email.toLowerCase().includes(term)
        )
      }

      // Apply sorting if provided
      if (filters?.sortBy) {
        results.sort((a, b) => {
          let comparison = 0

          switch (filters.sortBy) {
            case 'name':
              comparison = a.name.localeCompare(b.name)
              break
            case 'marks':
              comparison = a.marks_scored - b.marks_scored
              break
            case 'percentage':
              comparison = a.marks_scored / a.total_marks - b.marks_scored / b.total_marks
              break
            case 'date':
              comparison = new Date(a.submitted_at).getTime() - new Date(b.submitted_at).getTime()
              break
            default:
              comparison = 0
          }

          return filters.sortOrder === 'asc' ? comparison : -comparison
        })
      }
    }

    // Format dates (similar to frontend formatting)
    const formatDate = (dateString: string) => {
      const date = new Date(dateString)
      return date.toLocaleString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Kolkata'
      })
    }

    // Format cheating status (match UI representation)
    const formatCheatingStatus = (status: string) => {
      return status === 'flagged' || status === 'caught-cheating' ? 'Flagged' : 'No Issues'
    }

    // Generate CSV content
    let csvContent = `Quiz Results for: ${quizData.title}\n`
    csvContent += 'Name,PRN,Batch,Cheating Status,Marks,Percentage,Submitted At\n'

    results.forEach((result) => {
      const percentage = ((result.marks_scored / result.total_marks) * 100).toFixed(2)
      const batch = result.batch || '';
      const submittedAt = result.submitted_at || result.submittedAt;
      const marksScored = result.marks_scored || result.marksScored;
      const totalMarks = result.total_marks || result.totalMarks;
      const cheatingStatus = result.cheating_status || result.cheatingStatus;
      
      csvContent += `"${result.name}","${result.prn}","Batch ${batch}","${formatCheatingStatus(
        cheatingStatus
      )}","${marksScored} / ${totalMarks}","${percentage}%","${formatDate(
        submittedAt
      )}"\n`
    })

    // For demo purposes, we're returning the CSV content as a Data URL
    // In a production environment, you might want to upload this to storage
    const csvBase64 = btoa(csvContent)
    const csvUrl = `data:text/csv;base64,${csvBase64}`

    console.log('CSV generation successful')

    return new Response(JSON.stringify({ csvUrl }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error in generate-quiz-pdf function:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
