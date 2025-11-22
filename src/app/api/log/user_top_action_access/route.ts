import { NextRequest } from 'next/server'
import * as Sentry from "@sentry/nextjs";
import { cookies } from 'next/headers' 

export async function GET(request: NextRequest) {  
  try {  
    const {searchParams} = new URL(request.url);
    const name = searchParams.get("name"); 
  
    const cookieStore = await cookies() 
    const token = cookieStore.get('token')?.value; 
    const api_url = process.env.API_URL;
    const url = api_url + '/log/user_top_action_access?name='+name;
    const settings = {
      method: 'GET',
      headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token,
      }
    }; 

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