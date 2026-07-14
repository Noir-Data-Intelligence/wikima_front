import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { api } from '@/api/client';
import { useLanguage } from '../LanguageContext';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Trash2 } from 'lucide-react';

export default function EventDialog({
  open, onClose, onSuccess, event = null, selectedDate = null,
  // Company workspace props
  projects = [], isCompany = false,
  defaultProjectId = null, defaultProjectName = null
}) {
  const { language } = useLanguage();
  const pt = language === 'pt';
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: selectedDate || format(new Date(), 'yyyy-MM-dd'),
    start_time: '09:00',
    end_time: '10:00',
    client_id: '',
    client_name: '',
    project_id: defaultProjectId || '',
    project_name: defaultProjectName || '',
    location: '',
    reminder_enabled: true,
    reminder_channels: ['in_app', 'email'],
    reminder_time: 30,
    notes: ''
  });

  useEffect(() => {
    if (event) {
      setFormData({
        title: event.title || '',
        description: event.description || '',
        date: event.date || '',
        start_time: event.start_time || '09:00',
        end_time: event.end_time || '10:00',
        client_id: event.client_id || '',
        client_name: event.client_name || '',
        project_id: event.project_id || defaultProjectId || '',
        project_name: event.project_name || defaultProjectName || '',
        location: event.location || '',
        reminder_enabled: event.reminder_enabled || false,
        reminder_channels: event.reminder_channels || ['in_app'],
        reminder_time: event.reminder_time || 30,
        notes: event.notes || ''
      });
    } else {
      setFormData(prev => ({
        ...prev,
        date: selectedDate || format(new Date(), 'yyyy-MM-dd'),
        project_id: defaultProjectId || '',
        project_name: defaultProjectName || ''
      }));
    }
  }, [event, selectedDate, defaultProjectId, defaultProjectName]);

  useEffect(() => {
    if (open) loadClients();
  }, [open]);

  const loadClients = async () => {
    try {
      const user = await api.auth.me();
      const workspace = await api.entities.Workspace.filter({ owner_email: user.email });
      if (workspace.length > 0) {
        const clientsList = await api.entities.Client.filter({ workspace_id: workspace[0].id });
        setClients(clientsList);
      }
    } catch (error) {
      console.error('Error loading clients:', error);
    }
  };

  const handleProjectChange = (projectId) => {
    const proj = projects.find(p => p.id === projectId);
    setFormData({ ...formData, project_id: projectId, project_name: proj ? proj.name : '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const user = await api.auth.me();
      const workspace = await api.entities.Workspace.filter({ owner_email: user.email });
      if (workspace.length === 0) {
        toast.error(pt ? 'Workspace não encontrado' : 'Workspace not found');
        return;
      }

      const eventData = { ...formData, workspace_id: workspace[0].id };

      if (event) {
        await api.entities.AgendaEvent.update(event.id, eventData);
        toast.success(pt ? '✅ Evento atualizado!' : '✅ Event updated!');
      } else {
        await api.entities.AgendaEvent.create(eventData);
        toast.success(pt ? '✅ Evento criado!' : '✅ Event created!');
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving event:', error);
      toast.error(pt ? 'Erro ao guardar evento' : 'Error saving event');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!event) return;
    const confirmed = window.confirm(pt ? 'Eliminar este evento?' : 'Delete this event?');
    if (!confirmed) return;

    setLoading(true);
    try {
      await api.entities.AgendaEvent.delete(event.id);
      toast.success(pt ? '🗑️ Evento eliminado!' : '🗑️ Event deleted!');
      onSuccess();
      onClose();
    } catch (error) {
      toast.error(pt ? 'Erro ao eliminar evento' : 'Error deleting event');
    } finally {
      setLoading(false);
    }
  };

  const handleClientChange = (clientId) => {
    const client = clients.find(c => c.id === clientId);
    setFormData({ ...formData, client_id: clientId, client_name: client ? client.name : '' });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {event ? (pt ? 'Editar Evento' : 'Edit Event') : (pt ? 'Novo Evento' : 'New Event')}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <Label>{pt ? 'Título' : 'Title'} *</Label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder={pt ? 'Reunião com cliente' : 'Client meeting'}
              required
            />
          </div>

          <div className="sm:col-span-2">
            <Label>{pt ? 'Descrição' : 'Description'}</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder={pt ? 'Detalhes do evento...' : 'Event details...'}
              rows={3}
            />
          </div>

          <div className="sm:col-span-2 grid grid-cols-3 gap-4">
            <div>
              <Label>{pt ? 'Data' : 'Date'} *</Label>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>{pt ? 'Início' : 'Start Time'} *</Label>
              <Input
                type="time"
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>{pt ? 'Fim' : 'End Time'} *</Label>
              <Input
                type="time"
                value={formData.end_time}
                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                required
              />
            </div>
          </div>

          {/* Project selector — company workspace only */}
          {isCompany && projects.length > 0 && (
            <div className="sm:col-span-2">
              <Label>{pt ? 'Projeto' : 'Project'} *</Label>
              <Select value={formData.project_id} onValueChange={handleProjectChange} required>
                <SelectTrigger>
                  <SelectValue placeholder={pt ? 'Selecionar projeto' : 'Select project'} />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((proj) => (
                    <SelectItem key={proj.id} value={proj.id}>{proj.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <Label>{pt ? 'Cliente' : 'Client'}</Label>
            <Select value={formData.client_id} onValueChange={handleClientChange}>
              <SelectTrigger>
                <SelectValue placeholder={pt ? 'Selecionar cliente (opcional)' : 'Select client (optional)'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_none">{pt ? 'Nenhum' : 'None'}</SelectItem>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>{pt ? 'Localização' : 'Location'}</Label>
            <Input
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder={pt ? 'Escritório, online, etc.' : 'Office, online, etc.'}
            />
          </div>

          <div className="sm:col-span-2 space-y-3 border-t pt-4">
            <div className="flex items-center gap-2">
              <Checkbox
                id="reminder"
                checked={formData.reminder_enabled}
                onCheckedChange={(checked) => setFormData({ ...formData, reminder_enabled: checked })}
              />
              <Label htmlFor="reminder" className="cursor-pointer">
                {pt ? 'Ativar lembretes' : 'Enable reminders'}
              </Label>
            </div>

            {formData.reminder_enabled && (
              <div className="ml-6 space-y-3">
                <div>
                  <Label>{pt ? 'Lembrar' : 'Remind'}</Label>
                  <Select
                    value={formData.reminder_time.toString()}
                    onValueChange={(value) => setFormData({ ...formData, reminder_time: parseInt(value) })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 {pt ? 'minutos antes' : 'minutes before'}</SelectItem>
                      <SelectItem value="30">30 {pt ? 'minutos antes' : 'minutes before'}</SelectItem>
                      <SelectItem value="60">1 {pt ? 'hora antes' : 'hour before'}</SelectItem>
                      <SelectItem value="1440">1 {pt ? 'dia antes' : 'day before'}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{pt ? 'Notificar via' : 'Notify via'}</Label>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="in_app"
                        checked={formData.reminder_channels.includes('in_app')}
                        onCheckedChange={(checked) => {
                          const channels = checked
                            ? [...formData.reminder_channels, 'in_app']
                            : formData.reminder_channels.filter(c => c !== 'in_app');
                          setFormData({ ...formData, reminder_channels: channels });
                        }}
                      />
                      <Label htmlFor="in_app" className="cursor-pointer">{pt ? 'App' : 'In-app'}</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="email"
                        checked={formData.reminder_channels.includes('email')}
                        onCheckedChange={(checked) => {
                          const channels = checked
                            ? [...formData.reminder_channels, 'email']
                            : formData.reminder_channels.filter(c => c !== 'email');
                          setFormData({ ...formData, reminder_channels: channels });
                        }}
                      />
                      <Label htmlFor="email" className="cursor-pointer">Email</Label>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="sm:col-span-2">
            <Label>{pt ? 'Notas' : 'Notes'}</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder={pt ? 'Notas adicionais...' : 'Additional notes...'}
              rows={2}
            />
          </div>
          </div>

          <div className="flex justify-between pt-4 border-t">
            {event && (
              <Button type="button" variant="destructive" onClick={handleDelete} disabled={loading} className="gap-2">
                <Trash2 className="w-4 h-4" />
                {pt ? 'Eliminar' : 'Delete'}
              </Button>
            )}
            <div className="flex gap-2 ml-auto">
              <Button type="button" variant="outline" onClick={onClose}>
                {pt ? 'Cancelar' : 'Cancel'}
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (pt ? 'A guardar...' : 'Saving...') : (pt ? 'Guardar' : 'Save')}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}