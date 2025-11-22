"use client" 
 
import { useEffect } from "react"; 
import { redirect } from 'next/navigation'
import { useRouter } from 'next/navigation';
import { use } from 'react';
import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'
import { setCookie } from 'cookies-next/client';
import toast from "react-hot-toast";
import { v4 as uuidv4 } from 'uuid';
import { jwtDecode } from "jwt-decode"; 
// import { NextRequest, userAgent } from 'next/server'; 

export default function Autologin({ searchParams }: { searchParams: Promise<{ code: string }>}) {
// export default function Autologin({ searchParams, request }: { searchParams: Promise<{ code: string }>, request: NextRequest }) {
  const { code } = use(searchParams);
  const router = useRouter();
  const alert = withReactContent(Swal)  

  async function getToken() {
    await fetch('/api/auth/get-token?code='+code)
    .then((response) => {
			if (response.status >= 500 && response.status < 600) { 
        toast.error(response.statusText)
			}  
			return response;
		})
    .then(async (response) => {
			const result = await response.json()

      if ('access_token' in result) {  
        verifyToken(result['access_token'], result['refresh_token'])

      } else {
        alert.fire({
          title: "Error Session",
          text: "Failed to get token from SSO",
          icon: "error", 
        }).then(() => { 
          redirect('/login');
        })
      } 
		})
    .catch((error) => { 
			alert.fire({
        title: "Error Session",
        text: error,
        icon: "error", 
      }).then(() => { 
        redirect('/login');
      })
		});
  }

  async function verifyToken(token: string, refresh_token: string) { 
    const settings = {
      method: 'GET',
      headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token,
      }
    };
    await fetch('/api/auth/verify-token', settings)
    .then((response) => {
			if (response.status >= 500 && response.status < 600) {
        toast.error(response.statusText)
			}  
			return response;
		})
    .then(async (response) => {
			const result = await response.json()

      if (result['status']) {  
        if ('resource_access' in result['data']['payload']) { 
          if ('dashboard' in result['data']['payload']['resource_access']) { 
            // session
            saveSession(
              token, 
              refresh_token,
              result['data']['payload']['name'], 
              result['data']['payload']['email'], 
              result['data']['payload']['resource_access']['dashboard']['roles'][0],
              result['data']['payload']['exp']
            )  
            // log
            await saveLogLogin(token, result['data']['payload']['resource_access']['dashboard']['roles'][0]) .then(() => {});
          } 
          else { 
            alert.fire({
              title: "Error Session",
              text: "Don't have access in dashboard",
              icon: "error", 
            }).then(() => { 
              redirect('/login');
            })
          } 
        } 
        else { 
          alert.fire({
            title: "Error Session",
            text: "Don't have access in dashboard",
            icon: "error", 
          }).then(() => { 
            redirect('/login');
          })
        } 
      } else {
        alert.fire({
          title: "Error Session",
          text: result['message'],
          icon: "error", 
        }).then(() => { 
          redirect('/login');
        })
      } 
    })
    .catch((error) => {  
			alert.fire({
        title: "Error Session",
        text: error,
        icon: "error", 
      }).then(() => { 
        redirect('/login');
      }) 
		}); 
  }

  function saveSession(token: string, refresh_token: string, name: string, email: string, role: string, exp: string) { 
    setCookie('token', token);  
    setCookie('refresh_token', refresh_token);  
    setCookie('name', name);
    setCookie('email', email);
    setCookie('role', role);
    setCookie('exp', exp);
    router.push('/');
  }

  async function saveLogLogin(token: string, role:string) {
    try {
      // log
      const fingerprint = uuidv4();
      const jwtData = jwtDecode<{ name?: string; email?: string; exp?: number; role?: string}>(token);
      // const { browser, device, os } = userAgent(request)
      // const orientation = request.headers.get('x-orientation') || 'unknown';
      // const ip = request.headers.get('x-forwarded-for') || 'unknown';
      
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
        // 'os': os.name,
        // 'os_version': os.version,
        // 'browser': browser.name,
        // 'browser_version': browser.version,
        // 'device': device.model,
        // 'device_type': device.type,
        // 'orientation': orientation,
        // 'ip': ip,
        'county_code': geoData['country']['isoCode'],
        'country_name': geoData['country']['names']['en'],
        'region_code': geoData['subdivisions'][0]['isoCode'],
        'region_name': geoData['subdivisions'][0]['names']['en'],
        'city_code': '',
        'city_name': geoData['city']['names']['en'],
        'zip_code': '',
        'latitude': geoData['location']['latitude'],
        'longitude': geoData['location']['longitude'],
        'user_name': jwtData['name'],
        'user_email': jwtData['email'],
        'user_role': role,
        'session_exp': jwtData['exp'],
        'session_exp_date': new Date(Number(jwtData['exp']) * 1000),
        'session_token': token
      }
      
      const settings = {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json', 
        },
        body: JSON.stringify(payload)
      };
      await fetch(process.env.NEXT_PUBLIC_URL + '/api/fluentd/login', settings)
    
    } catch (error) { 
      console.log("fluentd log, " + error)
    }
  }

  useEffect(() => {  
    getToken()
  });
  
  return <div></div>;
}
