import { cookies } from 'next/headers' 

export async function GET() {   
  try { 
    const cookieStore = await cookies()   
    const refresh_token = cookieStore.get('refresh_token')?.value   

    const ssoUrl = process.env.SSO_URL;
    const ssoRealms = process.env.SSO_REALMS;
    const clientId = process.env.SSO_CLIENT_ID;
    const clientSecret = process.env.SSO_CLIENT_SECRET;
    const url = ssoUrl+"/realms/"+ssoRealms+"/protocol/openid-connect/logout" 
    const payload = new URLSearchParams();
    payload.append('client_id', clientId!);
    payload.append('client_secret', clientSecret!);
    payload.append('refresh_token', refresh_token || '');
    const settings = {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: payload
    }
      
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const res = await fetch(url, settings) 
    return Response.json({})  
  } catch(error){
    if (typeof error === "string") {
      throw new Error(error.toUpperCase());
    } else if (error instanceof Error) {
      throw new Error(error.message);
    }
  }
}