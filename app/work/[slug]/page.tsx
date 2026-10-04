import { WorkDetail } from '@/components/genesys/pages';
import { projects } from '@/lib/genesys-data';
import { notFound } from 'next/navigation';
export async function generateMetadata({params}:{params:Promise<{slug:string}>}){const {slug}=await params;const item=projects.find(s=>s.slug===slug);return {title:item?('title' in item?item.title:item.name):'Not found'};}
export default async function Page({params}:{params:Promise<{slug:string}>}){const {slug}=await params;if(!projects.some(s=>s.slug===slug))notFound();return <WorkDetail slug={slug}/>;}
