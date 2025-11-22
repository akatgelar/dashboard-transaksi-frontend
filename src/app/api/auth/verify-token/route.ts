import * as Sentry from "@sentry/nextjs";
import { headers } from 'next/headers'

export async function GET() {    
  try { 
    const authorization = (await headers()).get('authorization')

    const api_url = process.env.API_URL;
    const url = api_url + "/auth/verify-token"  
    const settings = {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded', 
        'Authorization': authorization || '',
      } 
    }
    
    const res = await fetch(url, settings)  
    const data = await res.json()
    if(data['status'] == true) {
      return Response.json(data)
    } else { 
      Sentry.captureException(data);
      return Response.json(data, {status:400})
    }
  } catch(error){
    if (typeof error === "string") {
      throw new Error(error.toUpperCase());
    } else if (error instanceof Error) {
      throw new Error(error.message);
    }
  }
}