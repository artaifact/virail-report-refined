import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { AdminService } from '@/services/adminService';
import { AdminMessage } from '@/types/admin';
import {
  ArrowLeft,
  Mail,
  Calendar,
  Tag,
  Loader2,
  Save,
  AlertCircle,
  CheckCircle,
  Trash2,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface MessageDetailsProps {
  messageId: number;
  onBack: () => void;
  className?: string;
}

export function MessageDetails({ messageId, onBack, className = '' }: MessageDetailsProps) {
  const [message, setMessage] = useState<AdminMessage | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [status, setStatus] = useState<string>('');
  const [priority, setPriority] = useState<string>('');
  const [adminResponse, setAdminResponse] = useState<string>('');
  const [tags, setTags] = useState<string>('');
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadMessage();
  }, [messageId]);

  const loadMessage = async () => {
    setLoading(true);
    try {
      const data = await AdminService.getMessageById(messageId);
      setMessage(data);
      setStatus(data.status || 'new');
      setPriority(data.priority || 'medium');
      setAdminResponse(data.admin_response || '');
      setTags(data.tags?.join(', ') || '');
    } catch (error) {
      console.error('Erreur lors du chargement du message:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveMessage(null);

    try {
      const updateData: any = {
        status: status as any,
        priority: priority as any,
      };

      if (adminResponse.trim()) {
        updateData.admin_response = adminResponse.trim();
      }

      if (tags.trim()) {
        updateData.tags = tags.split(',').map((t) => t.trim()).filter(Boolean);
      }

      await AdminService.updateMessage(messageId, updateData);
      setSaveMessage({
        type: 'success',
        text: 'Message mis à jour avec succès',
      });
      loadMessage();
    } catch (error) {
      setSaveMessage({
        type: 'error',
        text: 'Erreur lors de la mise à jour du message',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    setSaveMessage(null);

    try {
      const result = await AdminService.deleteMessage(messageId);

      if (result.success) {
        setSaveMessage({
          type: 'success',
          text: 'Message supprimé avec succès',
        });
        // Attendre 1 seconde avant de retourner à la liste
        setTimeout(() => {
          onBack();
        }, 1000);
      } else {
        setSaveMessage({
          type: 'error',
          text: result.message || 'Erreur lors de la suppression',
        });
        setShowDeleteConfirm(false);
      }
    } catch (error) {
      setSaveMessage({
        type: 'error',
        text: 'Erreur lors de la suppression du message',
      });
      setShowDeleteConfirm(false);
    } finally {
      setDeleting(false);
    }
  };

  const getStatusBadge = (status?: string) => {
    const statusConfig = {
      new: { color: 'bg-blue-50 text-blue-700 border-blue-200', label: 'Nouveau' },
      unread: { color: 'bg-amber-50 text-amber-700 border-amber-200', label: 'Non lu' },
      read: { color: 'bg-slate-50 text-slate-600 border-slate-200', label: 'Lu' },
      replied: { color: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'Répondu' },
      archived: { color: 'bg-slate-50 text-slate-500 border-slate-200', label: 'Archivé' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.new;
    return <Badge variant="outline" className={`${config.color} text-xs font-medium`}>{config.label}</Badge>;
  };

  const getPriorityBadge = (priority?: string) => {
    const priorityConfig = {
      low: { color: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'Basse' },
      medium: { color: 'bg-blue-50 text-blue-700 border-blue-200', label: 'Moyenne' },
      high: { color: 'bg-orange-50 text-orange-700 border-orange-200', label: 'Haute' },
      urgent: { color: 'bg-rose-50 text-rose-700 border-rose-200', label: 'Urgente' },
    };

    const config = priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig.medium;
    return <Badge variant="outline" className={`${config.color} text-xs font-medium`}>{config.label}</Badge>;
  };

  if (loading) {
    return (
      <div className={className}>
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!message) {
    return (
      <div className={className}>
        <Card>
          <CardContent className="text-center py-12">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Message non trouvé</p>
            <Button onClick={onBack} className="mt-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour à la liste
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Bouton retour */}
      <Button 
        variant="ghost" 
        onClick={onBack} 
        className="mb-6 hover:bg-primary/10 text-sm h-9 px-3"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Retour à la liste
      </Button>

      {/* Détails du message */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="mb-2">Message de {message.first_name} {message.last_name}</CardTitle>
              <div className="flex gap-2">
                {getStatusBadge(message.status)}
                {getPriorityBadge(message.priority)}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Informations de contact */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-1">
                <Mail className="h-4 w-4" />
                Email
              </label>
              <p className="text-foreground">{message.email}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-1">
                <Calendar className="h-4 w-4" />
                Date de création
              </label>
              <p className="text-foreground">
                {message.created_at ? new Date(message.created_at).toLocaleString('fr-FR') : '-'}
              </p>
            </div>
          </div>

          {/* Sujet */}
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1 block">Sujet</label>
            <p className="text-foreground font-semibold">{message.subject}</p>
          </div>

          {/* Message */}
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1 block">Message</label>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-foreground whitespace-pre-wrap">{message.message}</p>
            </div>
          </div>

          {/* Tags existants */}
          {message.tags && message.tags.length > 0 && (
            <div>
              <label className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-2">
                <Tag className="h-4 w-4" />
                Tags actuels
              </label>
              <div className="flex gap-2 flex-wrap">
                {message.tags.map((tag, idx) => (
                  <Badge key={idx} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Formulaire de mise à jour */}
      <Card className="border-none shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Mettre à jour le message</CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          {/* Statut et Priorité */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Statut</label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">Nouveau</SelectItem>
                  <SelectItem value="unread">Non lu</SelectItem>
                  <SelectItem value="read">Lu</SelectItem>
                  <SelectItem value="replied">Répondu</SelectItem>
                  <SelectItem value="archived">Archivé</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Priorité</label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Basse</SelectItem>
                  <SelectItem value="medium">Moyenne</SelectItem>
                  <SelectItem value="high">Haute</SelectItem>
                  <SelectItem value="urgent">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Réponse admin */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Réponse administrateur</label>
            <Textarea
              value={adminResponse}
              onChange={(e) => setAdminResponse(e.target.value)}
              placeholder="Entrez votre réponse..."
              rows={6}
              className="resize-none focus-visible:ring-1"
            />
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Tags <span className="text-xs text-muted-foreground">(séparés par des virgules)</span>
            </label>
            <Input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="support, urgent, technique"
              className="h-10 focus-visible:ring-1"
            />
          </div>

          {/* Message de confirmation */}
          {saveMessage && (
            <div
              className={`p-4 rounded-xl flex items-center gap-3 ${
                saveMessage.type === 'success'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-rose-50 text-rose-700 border border-rose-200'
              }`}
            >
              {saveMessage.type === 'success' ? (
                <CheckCircle className="h-5 w-5 flex-shrink-0" />
              ) : (
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
              )}
              <span className="text-sm font-medium">{saveMessage.text}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button 
              onClick={handleSave} 
              disabled={saving || deleting} 
              className="flex-1 h-10"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin text-blue-600" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Enregistrer
                </>
              )}
            </Button>

            {!showDeleteConfirm ? (
              <Button
                onClick={() => setShowDeleteConfirm(true)}
                disabled={saving || deleting}
                variant="destructive"
                className="h-10 sm:w-auto"
              >
                <Trash2 className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Supprimer</span>
              </Button>
            ) : (
              <Button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                variant="outline"
                className="h-10 sm:w-auto"
              >
                Annuler
              </Button>
            )}
          </div>

          {/* Confirmation de suppression */}
          {showDeleteConfirm && (
            <div className="space-y-3 p-4 bg-rose-50 border border-rose-200 rounded-xl">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-rose-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-rose-900">Confirmer la suppression</p>
                  <p className="text-xs text-rose-700 mt-1">
                    Cette action est irréversible. Le message sera définitivement supprimé.
                  </p>
                </div>
              </div>
              <Button
                onClick={handleDelete}
                disabled={deleting}
                variant="destructive"
                className="w-full h-9"
              >
                {deleting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin text-blue-600" />
                    Suppression...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Confirmer la suppression
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

