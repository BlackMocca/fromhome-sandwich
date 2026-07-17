'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2, Trash2, Send, Paperclip, CheckCircle2, AlertCircle, Eye, EyeOff, List } from 'lucide-react';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { toast } from '@/lib/toast';
import { createClient } from '@/lib/supabase/client';
import {
  getTelegramSettings,
  createTelegramSettings,
  updateTelegramSettings,
  deleteTelegramSettings,
} from '@/lib/db';
import type { TelegramSettings } from '@/types/telegram';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '';

type SendFile = { file: File; url: string };

export default function TelegramSettingsPage() {
  const [settingsId, setSettingsId] = useState<number | null>(null);
  const [botToken, setBotToken] = useState('');
  const [chatId, setChatId] = useState('');
  const [showToken, setShowToken] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Send-test panel state
  const [sendText, setSendText] = useState('');
  const [sendFiles, setSendFiles] = useState<SendFile[]>([]);
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);

  // Chat discovery (getUpdates) state
  const [chats, setChats] = useState<{ id: number; type: string; title?: string; username?: string; first_name?: string }[]>([]);
  const [loadingChats, setLoadingChats] = useState(false);
  const [showChatList, setShowChatList] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function load() {
      try {
        const s = await getTelegramSettings();
        if (s) {
          setSettingsId(s.id);
          setBotToken(s.bot_token);
          setChatId(s.chat_id ?? '');
        }
      } catch (err) {
        console.error('Failed to load telegram settings', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleSave = async () => {
    if (!botToken.trim()) {
      toast({ title: 'กรุณากรอก BOT Token', description: 'โทเค็นจาก BotFather จำเป็นต้องระบุ' });
      return;
    }
    setSaving(true);
    setFeedback(null);
    try {
      if (settingsId != null) {
        await updateTelegramSettings(settingsId, {
          bot_token: botToken.trim(),
          chat_id: chatId.trim() || null,
        });
      } else {
        const created = await createTelegramSettings({
          bot_token: botToken.trim(),
          chat_id: chatId.trim() || null,
        });
        setSettingsId(created.id);
      }
      toast({ title: 'บันทึกเรียบร้อย', description: 'เชื่อมต่อ Telegram แล้ว' });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'ไม่สามารถบันทึกได้';
      toast({ title: 'เกิดข้อผิดพลาด', description: msg });
      setFeedback({ kind: 'error', text: msg });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (settingsId == null) return;
    setDeleting(true);
    try {
      await deleteTelegramSettings(settingsId);
      setSettingsId(null);
      setBotToken('');
      setChatId('');
      toast({ title: 'ลบการเชื่อมต่อแล้ว' });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'ไม่สามารถลบได้';
      toast({ title: 'เกิดข้อผิดพลาด', description: msg });
    } finally {
      setDeleting(false);
    }
  };

  /* ─── Send-test panel ──────────────────────────────── */
  const addFiles = (files: FileList | File[]) => {
    const next: SendFile[] = [];
    for (const f of Array.from(files)) {
      if (!f.type.startsWith('image/')) continue;
      next.push({ file: f, url: URL.createObjectURL(f) });
    }
    if (next.length) setSendFiles(prev => [...prev, ...next]);
  };

  // Fetch recent chats via getUpdates (discover chat_id).
  // Uses the BOT Token typed in the input only — no need to save first,
  // and chat_id is not required (we are trying to find it).
  const handleFetchChats = async () => {
    if (!botToken.trim()) {
      toast({ title: 'กรุณากรอก BOT Token', description: 'ระบุโทเค็นก่อนดึงรายการแชท' });
      return;
    }
    setLoadingChats(true);
    setFeedback(null);
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error('ไม่พบเซสชันผู้ใช้ (กรุณาเข้าสู่ระบบใหม่)');
      const res = await fetch(`${SUPABASE_URL}/functions/v1/telegram-updates`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          apikey: ANON_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ bot_token: botToken.trim() }),
      });
      const body = await res.json().catch(() => ({}) as Record<string, unknown>);
      if (!res.ok) throw new Error((body?.error as string) || `HTTP ${res.status}`);
      const list = Array.isArray(body.chats) ? (body.chats as typeof chats) : [];
      setChats(list);
      setShowChatList(true);
      if (list.length === 0) {
        setFeedback({ kind: 'error', text: 'ไม่พบแชท ลองส่งข้อความหาบอท หรือเพิ่มบอทเข้าแชทก่อน แล้วกดดึงใหม่' });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'ไม่สามารถดึงรายการแชทได้';
      setFeedback({ kind: 'error', text: msg });
    } finally {
      setLoadingChats(false);
    }
  };

  const pickChat = (id: number) => {
    setChatId(String(id));
    setShowChatList(false);
  };

  const handleSend = async () => {
    if (!sendText.trim() && sendFiles.length === 0) {
      toast({ title: 'กรุณาใส่ข้อความหรือรูปภาพ', description: 'อย่างน้อย 1 รายการ' });
      return;
    }
    setSending(true);
    setFeedback(null);
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) {
        throw new Error('ไม่พบเซสชันผู้ใช้ (กรุณาเข้าสู่ระบบใหม่)');
      }

      const fd = new FormData();
      if (sendText.trim()) fd.append('text', sendText.trim());
      sendFiles.forEach(sf => fd.append('file', sf.file));

      const res = await fetch(`${SUPABASE_URL}/functions/v1/telegram-send`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          apikey: ANON_KEY,
        },
        body: fd,
      });

      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error((body as Record<string, unknown>)?.error as string || `HTTP ${res.status}`);
      }

      toast({ title: 'ส่งสำเร็จ!', description: 'ส่งไปยัง Telegram เรียบร้อยแล้ว' });
      setFeedback({ kind: 'success', text: 'ส่งข้อความและรูปภาพไปยัง Telegram เรียบร้อยแล้ว' });
      setSendText('');
      sendFiles.forEach(sf => URL.revokeObjectURL(sf.url));
      setSendFiles([]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'ไม่สามารถส่งได้';
      toast({ title: 'เกิดข้อผิดพลาด', description: msg });
      setFeedback({ kind: 'error', text: msg });
    } finally {
      setSending(false);
    }
  };

  const removeFile = (idx: number) => {
    setSendFiles(prev => {
      const target = prev[idx];
      if (target) URL.revokeObjectURL(target.url);
      return prev.filter((_, i) => i !== idx);
    });
  };

  // Support pasting images from clipboard
  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.files;
    if (items && items.length > 0) {
      e.preventDefault();
      addFiles(items);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="mr-2 h-6 w-6 animate-spin text-muted-foreground" />
        <p className="text-muted-foreground">กำลังโหลด...</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/management"
          className="p-2 rounded-lg hover:bg-surface transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-primary" />
        </Link>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-primary">เชื่อมต่อ Telegram</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            ตั้งค่า Bot Token และ Chat ปลายทาง สำหรับส่งข้อความและรูปภาพ
          </p>
        </div>
      </div>

      {feedback && (
        <div className={cn(
          'flex items-start gap-2 rounded-lg border p-3 text-sm',
          feedback.kind === 'success'
            ? 'border-success/40 bg-success/10 text-success'
            : 'border-destructive/40 bg-destructive/10 text-destructive',
        )}>
          {feedback.kind === 'success'
            ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            : <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          }
          <span>{feedback.text}</span>
        </div>
      )}

      {/* ── Bot config (CRUD) ── */}
      <Card className="border-border/40">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">ตั้งค่า Bot</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-0">
          {/* BOT Token */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-primary">
              BOT Token <span className="text-destructive">*</span>
            </label>
            <div className="relative">
              <Input
                type={showToken ? 'text' : 'password'}
                placeholder="1234567890:AAH..."
                value={botToken}
                onChange={e => setBotToken(e.target.value)}
                autoComplete="off"
                className="pr-10 font-mono"
              />
              <button
                type="button"
                onClick={() => setShowToken(o => !o)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary"
                aria-label={showToken ? 'ซ่อนโทเค็น' : 'แสดงโทเค็น'}
              >
                {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              รับจาก @BotFather → /newbot (เก็บเป็นความลับ)
            </p>
          </div>

          {/* Chat ID */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-primary">
              Chat ID / Channel
            </label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="border-border w-full sm:w-auto"
              onClick={handleFetchChats}
              disabled={loadingChats}
            >
              {loadingChats ? <Loader2 className="w-4 h-4 animate-spin" /> : <List className="w-4 h-4" />}
              ดึงรายการแชท
            </Button>
            <Input
              placeholder="-1001234567890 หรือ @mychannel"
              value={chatId}
              onChange={e => setChatId(e.target.value)}
              className="font-mono"
            />

            {/* Chat picker (from getUpdates) */}
            {showChatList && chats.length > 0 && (
              <div className="mt-1 rounded-lg border border-border bg-surface/60 divide-y divide-border max-h-56 overflow-y-auto">
                {chats.map(c => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => pickChat(c.id)}
                    className="w-full flex items-center justify-between gap-2 px-3 py-2 text-left hover:bg-primary/5 transition-colors"
                  >
                    <span className="min-w-0">
                      <span className="block text-sm font-medium text-primary truncate">
                        {c.title || c.username || c.first_name || c.type}
                      </span>
                      <span className="block text-xs text-muted-foreground truncate">
                        {c.type}{c.username ? ` @${c.username}` : ''}
                      </span>
                    </span>
                    <span className="font-mono text-xs text-muted-foreground shrink-0">{c.id}</span>
                  </button>
                ))}
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              ช่องทางหรือแชทที่จะส่งข้อความไป (ปล่อยว่างได้ หากระบุตอนส่ง) · กด “ดึงรายการแชท” เพื่อเลือกจากรายการล่าสุด (ต้องมีข้อความเข้ามาหาบอทก่อน)
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            {settingsId != null && (
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                ลบ
              </Button>
            )}
            <Button type="button" variant="primary" onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              บันทึก
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── Send test panel ── */}
      <Card className="border-border/40">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">ทดสอบส่งข้อความและรูปภาพ</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          <textarea
            value={sendText}
            onChange={e => setSendText(e.target.value)}
            onPaste={handlePaste}
            rows={4}
            placeholder="พิมพ์ข้อความ... (สามารถวางรูปภาพจากคลิปบอร์ดได้)"
            className="flex w-full rounded-md border border-border bg-surface px-3 py-2 text-sm ring-offset-surface placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
          />

          {/* Drop zone */}
          <div
            ref={dropRef}
            onDragOver={e => e.preventDefault()}
            onDrop={e => {
              e.preventDefault();
              if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
            }}
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border bg-surface/60 px-4 py-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
          >
            <Paperclip className="w-5 h-5 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              คลิกเพื่อเลือกรูป / วาง (Paste) หรือลากไฟล์มาวางที่นี่
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={e => { if (e.target.files) addFiles(e.target.files); e.target.value = ''; }}
            />
          </div>

          {/* Previews */}
          {sendFiles.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {sendFiles.map((sf, i) => (
                <div key={i} className="relative h-20 w-20 rounded-lg overflow-hidden border border-border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={sf.url} alt="" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeFile(i)}
                    className="absolute top-0.5 right-0.5 h-5 w-5 rounded-full bg-black/60 text-white text-xs flex items-center justify-center hover:bg-black/80"
                    aria-label="ลบรูป"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-end">
            <Button type="button" variant="primary" onClick={handleSend} disabled={sending}>
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              ส่งไป Telegram
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export const dynamic = 'force-dynamic';
