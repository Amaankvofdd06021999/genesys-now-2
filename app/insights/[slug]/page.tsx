import { ArticleDetail } from '@/components/genesys/pages';
import { articles } from '@/lib/genesys-data';
import { notFound } from 'next/navigation';
export async function generateMetadata({params}:{params:Promise<{slug:string}>}){const {slug}=await params;const item=articles.find(s=>s.slug===slug);return {title:item?.title||'Not found'};}
export default async function Page({params}:{params:Promise<{slug:string}>}){const {slug}=await params;if(!articles.some(s=>s.slug===slug))notFound();return <ArticleDetail slug={slug}/>;}
