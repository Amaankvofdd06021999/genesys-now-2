import { LegalPage } from '@/components/genesys/pages';
import { content } from '@/lib/privacy-content';
export const metadata={title:'Privacy policy'};
export default function Page(){return <LegalPage title='Privacy policy' content={content}/>}
