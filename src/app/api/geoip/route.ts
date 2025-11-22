import { NextRequest } from 'next/server'
import path from 'path';
import { Reader } from '@maxmind/geoip2-node';

export async function GET(request: NextRequest) {   
  const ipAddress = request.headers.get('x-forwarded-for') || 'unknown'; 
  if (ipAddress !== '::1') {
    try {
      const dbPath = path.resolve('public/db/GeoLite2-City.mmdb');
      const reader = await Reader.open(dbPath); 
      const response = reader.city(ipAddress);
      return Response.json(response)
    } catch (err) { 
      return Response.json({ error: 'Failed to retrieve GeoIP data, ' + err})
    }
  } else {
    return Response.json({ error: 'Localhost cannot retrieve GeoIP data '})
  }
}