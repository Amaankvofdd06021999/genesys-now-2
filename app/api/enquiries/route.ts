import { z } from 'zod';
const schema=z.object({requestId:z.string().uuid(),name:z.string().trim().min(1).max(120),email:z.string().trim().email().max(254),company:z.string().trim().max(160).default(''),services:z.array(z.enum(['web-applications','business-solutions','integrations','payments','automation','optimization'])).max(6),stage:z.enum(['Exploring an idea','Ready to start','Improving an existing system','Looking for ongoing support']),message:z.string().trim().min(20).max(5000),consent:z.literal(true),website:z.string().max(500).optional()});
export async function POST(request:Request){
 const origin=request.headers.get('origin');if(origin&&origin!==new URL(request.url).origin)return Response.json({error:'This request must be sent from the contact page.'},{status:403});
 if(Number(request.headers.get('content-length')||0)>24000)return Response.json({error:'Your enquiry is too long.'},{status:413});
 let raw;try{const text=await request.text();if(text.length>24000)return Response.json({error:'Your enquiry is too long.'},{status:413});raw=JSON.parse(text)}catch{return Response.json({error:'Please check your enquiry and try again.'},{status:400})}
 const parsed=schema.safeParse(raw);if(!parsed.success)return Response.json({error:'Please provide your name, a valid email, at least 20 characters about your project, and privacy consent.'},{status:400});
 const d=parsed.data;if(d.website)return Response.json({error:'Please try again or email hello@genesysnow.com.'},{status:400});

 // Online delivery is not connected yet (no email or database provider configured).
 // Validation above stays in place so a provider can be added here later.
 return Response.json({error:'Online enquiries are not available yet. Please email hello@genesysnow.com or call +1 242 801-1372 — your details are still in the form to copy.'},{status:503});
}
