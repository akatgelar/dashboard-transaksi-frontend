/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextRequest } from 'next/server'

export async function POST(request: NextRequest) {   
  try { 
    const payload = await request.json(); 
    
    const fluentdUrl = process.env.FLUENTD_URL; 
    const url = fluentdUrl+"/dashboard.event"  
    
    const settings = {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    }
    
    // await fetch(url, settings)  
    return Response.json({})
    
  } catch(error){
    if (typeof error === "string") {
      throw new Error(error.toUpperCase());
    } else if (error instanceof Error) {
      throw new Error(error.message);
    }
  }
}