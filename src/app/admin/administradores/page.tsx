'use client';

import { useEffect, useState } from 'react';
import { CircleCheck, KeyRound, Mail, Plus, ShieldCheck, TriangleAlert, UserX, UserCheck } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

type Administrador = {
  id: string;
  username: string | null;
  email: string | null;
  name: string;
  nivel: 'RH' | 'ADMIN';
  ativo: boolean;
  temSenha: boolean;
  createdAt: string;
};

const NIVEL_LABEL = { RH: 'RH', ADMIN: 'Admin' };

export default function AdministradoresPage() {
  const [items, setItems] = useState<Administrador[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [credenciais, setCredenciais] = useState<{ username: string; senha: string } | null>(null);
  const [criadoViaZoho, setCriadoViaZoho] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch('/api/admin/administradores');
    setItems(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function alternarNivel(admin: Administrador) {
    setErro(null);
    const novoNivel = admin.nivel === 'ADMIN' ? 'RH' : 'ADMIN';
    const res = await fetch(`/api/admin/administradores/${admin.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nivel: novoNivel }),
    });
    const data = await res.json();
    if (!res.ok) {
      setErro(data.error ?? 'Não foi possível alterar o nível.');
      return;
    }
    load();
  }

  async function alternarAtivo(admin: Administrador) {
    setErro(null);
    const res = await fetch(`/api/admin/administradores/${admin.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ativo: !admin.ativo }),
    });
    const data = await res.json();
    if (!res.ok) {
      setErro(data.error ?? 'Não foi possível alterar o status.');
      return;
    }
    load();
  }

  async function resetarSenha(admin: Administrador) {
    setErro(null);
    const res = await fetch(`/api/admin/administradores/${admin.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resetarSenha: true }),
    });
    const data = await res.json();
    if (!res.ok) {
      setErro(data.error ?? 'Não foi possível resetar a senha.');
      return;
    }
    setCredenciais({ username: admin.username ?? '', senha: data.novaSenha });
  }

  return (
    <div>
      <div className="flex items-start justify-between mb-1">
        <div>
          <h1 className="font-bold text-xl">Administradores</h1>
          <p className="text-[13.5px] text-inksoft mt-1">
            Nível <b>RH</b>: só Justificativas, Chamados, Folha de Ponto e Funcionários. Nível{' '}
            <b>Admin</b>: além disso, Configurações e esta tela.
          </p>
        </div>
        <Button size="sm" onClick={() => setShowForm(true)}>
          <Plus className="h-3.5 w-3.5" />
          Novo administrador
        </Button>
      </div>

      {erro && (
        <div className="flex items-center gap-2 text-danger text-[13px] bg-danger-soft rounded-lg px-3 py-2.5 my-4">
          <TriangleAlert className="h-4 w-4 shrink-0" />
          {erro}
        </div>
      )}

      <Card className="p-5 mt-5">
        {loading ? (
          <p className="text-sm text-inksoft py-10 text-center">Carregando...</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Nome</TableHead>
                <TableHead>Login</TableHead>
                <TableHead>Nível</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Criado em</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((admin) => (
                <TableRow key={admin.id} className="cursor-default">
                  <TableCell className="font-bold">{admin.name}</TableCell>
                  <TableCell className="text-xs">
                    <div>{admin.temSenha ? admin.username : admin.email}</div>
                    <Badge variant={admin.temSenha ? 'outline' : 'info'} className="mt-1">
                      {admin.temSenha ? 'Usuário/senha' : 'Zoho'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={admin.nivel === 'ADMIN' ? 'default' : 'info'}>{NIVEL_LABEL[admin.nivel]}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={admin.ativo ? 'default' : 'outline'}>{admin.ativo ? 'Ativo' : 'Desativado'}</Badge>
                  </TableCell>
                  <TableCell className="text-xs text-inksoft">{new Date(admin.createdAt).toLocaleDateString('pt-BR')}</TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1.5">
                      <Button size="sm" variant="ghost" title="Alternar nível" onClick={() => alternarNivel(admin)}>
                        <ShieldCheck className="h-3.5 w-3.5" />
                      </Button>
                      {admin.temSenha && (
                        <Button size="sm" variant="ghost" title="Resetar senha" onClick={() => resetarSenha(admin)}>
                          <KeyRound className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" title={admin.ativo ? 'Desativar' : 'Reativar'} onClick={() => alternarAtivo(admin)}>
                        {admin.ativo ? <UserX className="h-3.5 w-3.5" /> : <UserCheck className="h-3.5 w-3.5" />}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {showForm && (
        <NovoAdministradorModal
          onClose={() => setShowForm(false)}
          onCreatedSenha={(cred) => {
            setShowForm(false);
            setCredenciais(cred);
            load();
          }}
          onCreatedZoho={(email) => {
            setShowForm(false);
            setCriadoViaZoho(email);
            load();
          }}
        />
      )}

      {credenciais && (
        <Dialog open onOpenChange={(open) => !open && setCredenciais(null)}>
          <DialogContent hideClose>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CircleCheck className="h-5 w-5 text-primary" />
                Credenciais geradas
              </DialogTitle>
            </DialogHeader>
            <p className="text-sm text-inksoft mb-3">
              Repasse isso pra pessoa por um canal seguro (não fica salvo em lugar nenhum — essa é a única vez que
              aparece). No primeiro login, a senha vai precisar ser trocada.
            </p>
            <div className="bg-muted rounded-xl p-4 font-mono text-sm flex flex-col gap-1">
              <div>
                <span className="text-inksoft">Usuário:</span> <b>{credenciais.username}</b>
              </div>
              <div>
                <span className="text-inksoft">Senha:</span> <b>{credenciais.senha}</b>
              </div>
            </div>
            <Button className="mt-4" onClick={() => setCredenciais(null)}>
              Entendi, já anotei
            </Button>
          </DialogContent>
        </Dialog>
      )}

      {criadoViaZoho && (
        <Dialog open onOpenChange={(open) => !open && setCriadoViaZoho(null)}>
          <DialogContent hideClose>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-primary" />
                Conta criada
              </DialogTitle>
            </DialogHeader>
            <p className="text-sm text-inksoft">
              <b>{criadoViaZoho}</b> já pode entrar em <code>/login</code>, aba "Sou do RH", clicando em "Entrar com
              Zoho" — sem senha nenhuma cadastrada aqui. Se esse e-mail não existir numa conta Zoho, o login vai ser
              recusado.
            </p>
            <Button className="mt-4" onClick={() => setCriadoViaZoho(null)}>
              Entendi
            </Button>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function NovoAdministradorModal({
  onClose,
  onCreatedSenha,
  onCreatedZoho,
}: {
  onClose: () => void;
  onCreatedSenha: (cred: { username: string; senha: string }) => void;
  onCreatedZoho: (email: string) => void;
}) {
  const [modo, setModo] = useState<'senha' | 'zoho'>('senha');
  const [name, setName] = useState('');
  const [nivel, setNivel] = useState<'RH' | 'ADMIN'>('RH');
  const [username, setUsername] = useState('');
  const [senha, setSenha] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const body = modo === 'senha' ? { modo, name, nivel, username, senha } : { modo, name, nivel, email };
      const res = await fetch('/api/admin/administradores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Não foi possível criar.');
        return;
      }
      if (modo === 'senha') onCreatedSenha({ username, senha });
      else onCreatedZoho(email);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo administrador</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>Nome completo</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Nível</Label>
            <Select value={nivel} onValueChange={(v) => setNivel(v as 'RH' | 'ADMIN')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="RH">RH — só atendimento</SelectItem>
                <SelectItem value="ADMIN">Admin — acesso completo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Tabs value={modo} onValueChange={(v) => setModo(v as 'senha' | 'zoho')}>
            <TabsList className="w-full">
              <TabsTrigger value="senha">Usuário e senha</TabsTrigger>
              <TabsTrigger value="zoho">Zoho (e-mail)</TabsTrigger>
            </TabsList>

            <TabsContent value="senha" className="flex flex-col gap-4 mt-4">
              <div className="flex flex-col gap-1.5">
                <Label>Usuário</Label>
                <Input value={username} onChange={(e) => setUsername(e.target.value)} required={modo === 'senha'} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Senha inicial</Label>
                <Input
                  type="password"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  required={modo === 'senha'}
                  minLength={6}
                />
                <p className="text-[11px] text-inksoft mt-1">Vai precisar ser trocada no primeiro login.</p>
              </div>
            </TabsContent>

            <TabsContent value="zoho" className="flex flex-col gap-4 mt-4">
              <div className="flex flex-col gap-1.5">
                <Label>E-mail (conta Zoho)</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="pessoa@empresa.com"
                  required={modo === 'zoho'}
                />
                <p className="text-[11px] text-inksoft mt-1">
                  Sem senha nenhuma — a pessoa entra clicando em "Entrar com Zoho" no login, e só funciona se esse
                  e-mail estiver numa conta Zoho de verdade. Precisa da integração Zoho já configurada
                  (Configurações → Zoho).
                </p>
              </div>
            </TabsContent>
          </Tabs>

          {error && (
            <div className="flex items-center gap-2 text-danger text-[13px] bg-danger-soft rounded-lg px-3 py-2">
              <TriangleAlert className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <div className="flex gap-2 mt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button disabled={loading} className="flex-1">
              {loading ? 'Criando...' : 'Criar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
