import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    // Test if we can connect to the database
    const { data, error } = await supabase
      .from('habits')
      .select('count')
      .limit(1)
    
    if (error) {
      return NextResponse.json({ 
        error: error.message, 
        code: error.code,
        hint: 'The habits table might not exist. Please run the SQL schema in your Supabase dashboard.'
      }, { status: 500 })
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Database connection successful',
      tableExists: true
    })
  } catch (error) {
    return NextResponse.json({ 
      error: 'Failed to connect to database',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 