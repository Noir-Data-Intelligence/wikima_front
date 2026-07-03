import React, { useState } from 'react';
import { useLanguage } from './LanguageContext';
import { api } from '@/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Upload, X, FileText, Download, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function ServiceAttachmentsDialog({ service, open, onClose, onUpdate }) {
  const { language } = useLanguage();
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [attachmentType, setAttachmentType] = useState('invoice');

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    try {
      const { file_url } = await api.integrations.Core.UploadFile({ file: selectedFile });
      
      const newAttachment = {
        type: attachmentType,
        file_url,
        file_name: selectedFile.name,
        uploaded_date: new Date().toISOString()
      };

      const updatedAttachments = [...(service.attachments || []), newAttachment];
      
      await api.entities.Service.update(service.id, {
        ...service,
        attachments: updatedAttachments
      });

      toast.success(language === 'pt' ? 'Documento anexado!' : 'Document attached!');
      onUpdate();
      setSelectedFile(null);
    } catch (error) {
      toast.error(language === 'pt' ? 'Erro ao carregar ficheiro' : 'Error uploading file');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (index) => {
    try {
      const updatedAttachments = service.attachments.filter((_, i) => i !== index);
      
      await api.entities.Service.update(service.id, {
        ...service,
        attachments: updatedAttachments
      });

      toast.success(language === 'pt' ? 'Documento removido!' : 'Document removed!');
      onUpdate();
    } catch (error) {
      toast.error(language === 'pt' ? 'Erro ao remover documento' : 'Error removing document');
    }
  };

  const attachmentTypeLabels = {
    pt: {
      invoice: 'Fatura',
      proforma: 'Proforma',
      order: 'Encomenda',
      receipt: 'Recibo',
      contract: 'Contrato',
      other: 'Outro'
    },
    en: {
      invoice: 'Invoice',
      proforma: 'Proforma',
      order: 'Order',
      receipt: 'Receipt',
      contract: 'Contract',
      other: 'Other'
    }
  };

  const typeColors = {
    invoice: 'bg-green-100 text-green-800 border-green-300',
    proforma: 'bg-blue-100 text-blue-800 border-blue-300',
    order: 'bg-purple-100 text-purple-800 border-purple-300',
    receipt: 'bg-orange-100 text-orange-800 border-orange-300',
    contract: 'bg-indigo-100 text-indigo-800 border-indigo-300',
    other: 'bg-gray-100 text-gray-800 border-gray-300'
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {language === 'pt' ? 'Documentos Anexados' : 'Attached Documents'}
          </DialogTitle>
          <p className="text-sm text-muted-foreground mt-2">
            {service?.service_name}
          </p>
        </DialogHeader>

        <div className="space-y-6">
          {/* Upload New Document */}
          <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 bg-gray-50">
            <h3 className="font-semibold text-gray-900 mb-4">
              {language === 'pt' ? 'Anexar Novo Documento' : 'Attach New Document'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <Label>{language === 'pt' ? 'Tipo de Documento' : 'Document Type'}</Label>
                <Select value={attachmentType} onValueChange={setAttachmentType}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="invoice">{attachmentTypeLabels[language].invoice}</SelectItem>
                    <SelectItem value="proforma">{attachmentTypeLabels[language].proforma}</SelectItem>
                    <SelectItem value="order">{attachmentTypeLabels[language].order}</SelectItem>
                    <SelectItem value="receipt">{attachmentTypeLabels[language].receipt}</SelectItem>
                    <SelectItem value="contract">{attachmentTypeLabels[language].contract}</SelectItem>
                    <SelectItem value="other">{attachmentTypeLabels[language].other}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>{language === 'pt' ? 'Ficheiro' : 'File'}</Label>
                <Input
                  type="file"
                  onChange={handleFileSelect}
                  className="mt-1.5"
                />
                {selectedFile && (
                  <p className="text-sm text-muted-foreground mt-2 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    {selectedFile.name}
                  </p>
                )}
              </div>

              <Button
                onClick={handleUpload}
                disabled={!selectedFile || uploading}
                className="w-full bg-primary hover:bg-cyan-700"
              >
                <Upload className="w-4 h-4 mr-2" />
                {uploading 
                  ? (language === 'pt' ? 'A carregar...' : 'Uploading...') 
                  : (language === 'pt' ? 'Anexar Documento' : 'Attach Document')}
              </Button>
            </div>
          </div>

          {/* Existing Attachments */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">
              {language === 'pt' ? 'Documentos Anexados' : 'Attached Documents'} 
              {service?.attachments?.length > 0 && ` (${service.attachments.length})`}
            </h3>

            {!service?.attachments || service.attachments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-2 opacity-40" />
                <p className="text-sm">
                  {language === 'pt' 
                    ? 'Nenhum documento anexado ainda.' 
                    : 'No documents attached yet.'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {service.attachments.map((attachment, index) => (
                  <div 
                    key={index} 
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-white hover:shadow-md transition-all"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {attachment.file_name}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={`${typeColors[attachment.type]} text-xs border`}>
                            {attachmentTypeLabels[language][attachment.type]}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {new Date(attachment.uploaded_date).toLocaleDateString(
                              language === 'pt' ? 'pt-PT' : 'en-US'
                            )}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <a
                        href={attachment.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        title={language === 'pt' ? 'Abrir' : 'Open'}
                      >
                        <Download className="w-4 h-4 text-muted-foreground" />
                      </a>
                      <button
                        onClick={() => {
                          if (confirm(language === 'pt' 
                            ? 'Remover este documento?' 
                            : 'Remove this document?'
                          )) {
                            handleDelete(index);
                          }
                        }}
                        className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                        title={language === 'pt' ? 'Eliminar' : 'Delete'}
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            {language === 'pt' ? 'Fechar' : 'Close'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}