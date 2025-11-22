import { NextRequest } from 'next/server'
import * as Sentry from "@sentry/nextjs";

export async function GET(request: NextRequest) {   
  try { 
    const {searchParams} = new URL(request.url);
    const code = searchParams.get("code"); 
    
    const ssoUrl = process.env.SSO_URL;
    const ssoRealms = process.env.SSO_REALMS;
    const clientId = process.env.SSO_CLIENT_ID;
    const clientSecret = process.env.SSO_CLIENT_SECRET;
    const redirectUrl = process.env.SSO_REDIRECT_URL;  

    const url = ssoUrl+"/realms/"+ssoRealms+"/protocol/openid-connect/token" 
    const payload = new URLSearchParams();
    payload.append('grant_type', 'authorization_code');
    payload.append('scope', 'openid');
    payload.append('redirect_uri', redirectUrl!);
    payload.append('client_id', clientId!);
    payload.append('client_secret', clientSecret!);
    payload.append('code', code!);
    const settings = {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: payload
    }
    
    const res = await fetch(url, settings)  
    const data = await res.json()  
    if('access_token' in data) {
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