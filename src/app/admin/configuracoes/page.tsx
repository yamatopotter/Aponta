'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Cable, CalendarClock, Mail } from 'lucide-react';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import RhidSection from '@/components/admin/configuracoes/RhidSection';
import FolhaSection from '@/components/admin/configuracoes/FolhaSection';
import ZohoSection from '@/components/admin/configuracoes/ZohoSection';

const TABS = ['rhid', 'folha', 'zoho'] as const;
type Tab = (typeof TABS)[number];

export default function ConfiguracoesPage() {
  return (
    <Suspense>
      <ConfiguracoesContent />
    </Suspense>
  );
}

function ConfiguracoesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const tab: Tab = TABS.includes(tabParam as Tab) ? (tabParam as Tab) : 'rhid';

  function trocarTab(value: string) {
    router.push(`/admin/configuracoes?tab=${value}`);
  }

  return (
    <div>
      <h1 className="font-bold text-xl mb-1">Configurações</h1>
      <p className="text-[13.5px] text-inksoft mb-6">Integrações e parâmetros do sistema, num só lugar.</p>

      <Tabs value={tab} onValueChange={trocarTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="rhid" className="gap-1.5">
            <Cable className="h-3.5 w-3.5" />
            RHiD
          </TabsTrigger>
          <TabsTrigger value="folha" className="gap-1.5">
            <CalendarClock className="h-3.5 w-3.5" />
            Folha
          </TabsTrigger>
          <TabsTrigger value="zoho" className="gap-1.5">
            <Mail className="h-3.5 w-3.5" />
            Zoho
          </TabsTrigger>
        </TabsList>

        <TabsContent value="rhid" className="mt-0">
          <RhidSection />
        </TabsContent>
        <TabsContent value="folha" className="mt-0">
          <FolhaSection />
        </TabsContent>
        <TabsContent value="zoho" className="mt-0">
          <ZohoSection />
        </TabsContent>
      </Tabs>
    </div>
  );
}
