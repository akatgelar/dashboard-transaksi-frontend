import { v4 as uuidv4 } from 'uuid';

export const createEventLog = async(userName: string, path: string, actionComponent: string, action: string, actionData: string) => {
    try { 
        // log
        const fingerprint = uuidv4(); 
    
        const payload = { 
            'fingerprint': fingerprint,
            'method': 'GET',  
            'path': path,
            'user_name': userName,
            'action': action,
            'action_component': actionComponent,
            'action_data': actionData,
        }
        
        const settings = {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json', 
            },
            body: JSON.stringify(payload)
        };
        await fetch(process.env.NEXT_PUBLIC_URL + '/api/fluentd/event', settings)  

    } catch (error) {
        console.log("fluentd log, " + error)
    }
   
};