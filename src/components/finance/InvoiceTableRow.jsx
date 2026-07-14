import { useState, useRef, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, Pencil, CheckCircle, Copy, XCircle, Eye, Download, Send, FileCheck } from 'lucide-react';

const statusColors = {
  draft: 'bg-yellow-600/20 text-yellow-400 border-yellow-600/30',
  sent: 'bg-blue-600/20 text-blue-400 border-blue-600/30',
  paid: 'bg-green-600/20 text-green-400 border-green-600/30',
  overdue: 'bg-red-600/20 text-red-400 border-red-600/30',
  cancelled: 'bg-slate-600/20 text-muted-foreground border-border/30'
};

export default function InvoiceTableRow({ invoice, language, statusLabels, onEdit, onView, onMarkPaid, onDuplicate, onCancel, onExportPDF, onSend, onGenerateReceipt }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const dueDate = invoice.due_date ? new Date(invoice.due_date) : null;
  const isOverdue = dueDate && dueDate < new Date() && invoice.status !== 'paid';

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="grid grid-cols-12 gap-3 px-4 py-3 items-center hover:bg-white/[0.02] transition-colors group">
      {/* Invoice # */}
      <div className="col-span-2">
        <span className="text-sm font-mono font-medium text-primary">
          {invoice.invoice_number || `#${invoice.id.slice(0, 8)}`}
        </span>
        <div className="text-[10px] text-muted-foreground mt-0.5">
          {invoice.date ? new Date(invoice.date).toLocaleDateString('pt-PT') : '—'}
        </div>
      </div>

      {/* Client */}
      <div className="col-span-3">
        <span className="text-sm text-foreground">{invoice.client_name}</span>
        {invoice.client_email && (
          <div className="text-[10px] text-muted-foreground truncate">{invoice.client_email}</div>
        )}
      </div>

      {/* Status */}
      <div className="col-span-2">
        <Badge className={`${statusColors[invoice.status] || statusColors.draft} text-[10px] h-5 px-2 font-medium border`}>
          {statusLabels[language]?.[invoice.status] || invoice.status}
        </Badge>
      </div>

      {/* Amount */}
      <div className="col-span-2 text-right">
        <span className="text-sm font-bold text-foreground tabular-nums">
          {invoice.currency} {invoice.total?.toFixed(2)}
        </span>
      </div>

      {/* Due Date */}
      <div className="col-span-2">
        {invoice.due_date ? (
          <span className={`text-xs ${isOverdue ? 'text-red-400' : 'text-muted-foreground'}`}>
            {new Date(invoice.due_date).toLocaleDateString('pt-PT')}
            {isOverdue && <span className="ml-1 text-red-500">!</span>}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        )}
      </div>

      {/* Actions dropdown */}
      <div className="col-span-1 flex justify-end" ref={menuRef}>
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="w-7 h-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-muted-foreground hover:bg-accent/50 transition-colors opacity-0 group-hover:opacity-100"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>

          {menuOpen && (
            <div
              className="absolute right-0 top-8 z-50 w-44 rounded-lg border border-border py-1 shadow-xl"
              style={{ backgroundColor: '#0d1a2d' }}
            >
              <MenuItem icon={<Eye className="w-3.5 h-3.5" />} label={language === 'pt' ? 'Ver' : 'View'} onClick={() => { onView(invoice); setMenuOpen(false); }} />
              <MenuItem icon={<Pencil className="w-3.5 h-3.5" />} label={language === 'pt' ? 'Editar' : 'Edit'} onClick={() => { onEdit(invoice); setMenuOpen(false); }} />
              {invoice.status === 'draft' && (
                <MenuItem icon={<Send className="w-3.5 h-3.5" />} label={language === 'pt' ? 'Marcar como enviada' : 'Mark as Sent'} color="text-blue-400" onClick={() => { onSend(invoice); setMenuOpen(false); }} />
              )}
              {(invoice.status === 'sent' || invoice.status === 'overdue') && (
                <MenuItem icon={<CheckCircle className="w-3.5 h-3.5" />} label={language === 'pt' ? 'Marcar paga' : 'Mark as Paid'} color="text-green-400" onClick={() => { onMarkPaid(invoice); setMenuOpen(false); }} />
              )}
              <MenuItem icon={<Download className="w-3.5 h-3.5" />} label="PDF" onClick={() => { onExportPDF(invoice); setMenuOpen(false); }} />
              <MenuItem icon={<Copy className="w-3.5 h-3.5" />} label={language === 'pt' ? 'Duplicar p/ próx. mês' : 'Duplicate for next month'} onClick={() => { onDuplicate(invoice); setMenuOpen(false); }} />
              {invoice.status === 'paid' && onGenerateReceipt && (
                <MenuItem icon={<FileCheck className="w-3.5 h-3.5" />} label={language === 'pt' ? 'Gerar Recibo' : 'Generate Receipt'} color="text-primary" onClick={() => { onGenerateReceipt(invoice); setMenuOpen(false); }} />
              )}
              {invoice.status !== 'cancelled' && invoice.status !== 'paid' && (
                <>
                  <div className="h-px bg-muted my-1" />
                  <MenuItem icon={<XCircle className="w-3.5 h-3.5" />} label={language === 'pt' ? 'Cancelar' : 'Cancel'} color="text-rose-400" onClick={() => { onCancel(invoice); setMenuOpen(false); }} />
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MenuItem({ icon, label, onClick, color = 'text-muted-foreground' }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-3 py-1.5 text-xs hover:bg-accent/50 transition-colors ${color}`}
    >
      <span className="opacity-70">{icon}</span>
      {label}
    </button>
  );
}