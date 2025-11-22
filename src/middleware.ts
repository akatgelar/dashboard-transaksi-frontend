// import moment from 'moment';
import moment from 'moment-timezone';
import { cookies } from 'next/headers' 
import { NextRequest, NextResponse, userAgent } from 'next/server';  
import { v4 as uuidv4 } from 'uuid';
import { jwtDecode } from "jwt-decode";  

export async function middleware(request: NextRequest) {   
  // get
  const cookieStore = await cookies() 
  const token = cookieStore.get('token')?.value  
  const exp = cookieStore.get('exp')?.value  
  if (!token) {  
    const url = request.nextUrl.clone();
    url.pathname = '/not-allowed'; 
    return NextResponse.redirect(url);
  }
  
  // check expire
  const epochTime = Number.parseInt(exp!);  
  const dateFromEpoch = moment(epochTime * 1000).tz('Asia/Jakarta');  
  const now = moment(new Date()).tz('Asia/Jakarta');  
  if (dateFromEpoch < now) {   
    const url = request.nextUrl.clone();
    url.pathname = '/session-expired';
    return NextResponse.redirect(url);
  }

  try {
    // log
    const fingerprint = uuidv4();
    const jwtData = jwtDecode<{ name?: string; email?: string; exp?: number; }>(token);
    const { browser, device, os } = userAgent(request)
    const orientation = request.headers.get('x-orientation') || 'unknown';
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
  
    let geoData = {
      'country': {
        'isoCode': '',
        'names': {
          'en': ''
        }
      },
      'subdivisions': [{
        'isoCode': '',
        'names': {
          'en': ''
        }
      }],
      'city': { 
        'names': {
          'en': ''
        }
      },
      'location': {
        'latitude': '',
        'longitude': ''
      }

    }
    try {
      const geoResult = await fetch(process.env.NEXT_PUBLIC_URL + '/api/geoip')
      const geoDatas = await geoResult.json(); 
      if (!geoDatas.hasOwnProperty('error')) {
        geoData = geoDatas;
      }
    } catch (error) {
      console.log(error)
    }
  
    const payload = { 
      'fingerprint': fingerprint,
      'user_agent': '',
      'os': os.name,
      'os_version': os.version,
      'browser': browser.name,
      'browser_version': browser.version,
      'device': device.model,
      'device_type': device.type,
      'orientation': orientation,
      'ip': ip,
      'county_code': geoData['country']['isoCode'],
      'country_name': geoData['country']['names']['en'],
      'region_code': geoData['subdivisions'][0]['isoCode'],
      'region_name': geoData['subdivisions'][0]['names']['en'],
      'city_code': '',
      'city_name': geoData['city']['names']['en'],
      'zip_code': '',
      'latitude': geoData['location']['latitude'],
      'longitude': geoData['location']['longitude'],
      'method': request.method, 
      'host': request.nextUrl.host,
      'path': request.nextUrl.pathname,
      'search': request.nextUrl.search,
      'search_param': request.nextUrl.searchParams,
      'user_name': jwtData['name'],
    }
    
    const settings = {
      method: 'POST',
      headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json', 
      },
      body: JSON.stringify(payload)
    };
    await fetch(process.env.NEXT_PUBLIC_URL + '/api/fluentd/page', settings)  

  } catch (error) {
    console.log("fluentd log, " + error)
  }
  return NextResponse.next();
}

export const config = { 
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    '/((?!api|login|autologin|not-allowed|session-expired|error-404|_next/static|_next/image|images|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
};
