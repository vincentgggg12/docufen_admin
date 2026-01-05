import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import {
  Plus,
  Trash2,
  FileText,
  ChevronUp,
  ChevronDown,
  Info,
  Save,
  Download,
  Upload,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Columns,
  ChevronLeft
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { SidebarLeft } from '@/components/left-sidebar/sidebar-left';
import { useAppStore } from '@/lib/stateManagement';
import { useShallow } from 'zustand/react/shallow';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

// Types for header/footer structure
interface CellContent {
  type: 'text' | 'field' | 'image';
  value: string;
  alignment?: 'left' | 'center' | 'right';
  bold?: boolean;
  width?: string; // percentage or auto
}

interface Row {
  id: string;
  cells: CellContent[];
}

interface HeaderFooterTemplate {
  enabled: boolean;
  rows: Row[];
}

const OpenTextConnector: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { sidebarOpen, setSidebarOpen } = useAppStore(useShallow((state) => ({
    sidebarOpen: state.sidebarOpen,
    setSidebarOpen: state.setSidebarOpen,
  })));

  const [headerFooterIncluded, setHeaderFooterIncluded] = useState<boolean>(false);
  const [headerTemplate, setHeaderTemplate] = useState<HeaderFooterTemplate>({
    enabled: true,
    rows: []
  });
  const [footerTemplate, setFooterTemplate] = useState<HeaderFooterTemplate>({
    enabled: true,
    rows: []
  });
  const [selectedSection, setSelectedSection] = useState<'header' | 'footer'>('header');

  // Available OpenText fields that customers can map
  const availableFields = [
    { category: 'Document Info', fields: [
      { id: 'doc_number', label: 'Document Number', example: 'IFS-6094' },
      { id: 'doc_code', label: 'Document Code', example: 'DOC-001' },
      { id: 'doc_version', label: 'Version', example: 'v2.1' },
      { id: 'doc_title', label: 'Title', example: 'Manufacturing Instruction' },
      { id: 'doc_type', label: 'Document Type', example: 'Formulario' },
      { id: 'doc_state', label: 'State', example: 'Vigente' }
    ]},
    { category: 'Dates', fields: [
      { id: 'effective_date', label: 'Effective Date (Fecha de Vigencia)', example: '24/10/2025' },
      { id: 'review_date', label: 'Review Date', example: '24/10/2025' },
      { id: 'expiry_date', label: 'Expiry Date', example: '24/10/2026' },
      { id: 'creation_date', label: 'Creation Date', example: '01/10/2025' }
    ]},
    { category: 'People', fields: [
      { id: 'author', label: 'Author', example: 'John Doe' },
      { id: 'reviewer', label: 'Reviewed By (Revisado por)', example: 'Jane Smith' },
      { id: 'approver', label: 'Approved By', example: 'Manager Name' },
      { id: 'owner', label: 'Owner', example: 'Quality Dept' }
    ]},
    { category: 'Related', fields: [
      { id: 'related_doc', label: 'Related Document Code', example: 'REL-123' },
      { id: 'parent_doc', label: 'Parent Document', example: 'PARENT-456' },
      { id: 'sop_number', label: 'SOP Number', example: 'SOP-789' }
    ]},
    { category: 'System', fields: [
      { id: 'page_number', label: 'Page Number', example: 'Page 1 of 10' },
      { id: 'print_date', label: 'Print Date', example: '24/10/2025' },
      { id: 'copy_type', label: 'Copy Type', example: 'Copia No Controlada' }
    ]}
  ];

  // Sample TOWA template for quick loading
  const towaHeaderTemplate: Row[] = [
    {
      id: '1',
      cells: [
        { type: 'text', value: 'COPIA NO CONTROLADA', alignment: 'center', bold: true }
      ]
    },
    {
      id: '2',
      cells: [
        { type: 'image', value: 'company_logo', alignment: 'center' }
      ]
    },
    {
      id: '3',
      cells: [
        { type: 'text', value: 'Vigente:', bold: true, alignment: 'left' },
        { type: 'field', value: 'doc_state', alignment: 'left' },
        { type: 'text', value: 'Código:', bold: true, alignment: 'left' },
        { type: 'field', value: 'doc_code', alignment: 'left' }
      ]
    },
    {
      id: '4',
      cells: [
        { type: 'text', value: 'Fecha de Vigencia:', bold: true, alignment: 'left' },
        { type: 'field', value: 'effective_date', alignment: 'left' },
        { type: 'text', value: 'Versión:', bold: true, alignment: 'left' },
        { type: 'field', value: 'doc_version', alignment: 'left' }
      ]
    },
    {
      id: '5',
      cells: [
        { type: 'text', value: 'Documento:', bold: true, alignment: 'left' },
        { type: 'field', value: 'doc_number', alignment: 'left' },
        { type: 'text', value: 'Código Doc. Relacionado:', bold: true, alignment: 'left' },
        { type: 'field', value: 'related_doc', alignment: 'left' }
      ]
    },
    {
      id: '6',
      cells: [
        { type: 'text', value: 'Título:', bold: true, alignment: 'left' },
        { type: 'field', value: 'doc_title', alignment: 'left' }
      ]
    },
    {
      id: '7',
      cells: [
        { type: 'text', value: 'Revisado por:', bold: true, alignment: 'left' },
        { type: 'field', value: 'reviewer', alignment: 'left' },
        { type: 'text', value: 'Fecha:', bold: true, alignment: 'left' },
        { type: 'field', value: 'review_date', alignment: 'left' }
      ]
    }
  ];

  const addRow = () => {
    const newRow: Row = {
      id: Date.now().toString(),
      cells: [{ type: 'text', value: 'New Cell', alignment: 'left' }]
    };
    
    if (selectedSection === 'header') {
      setHeaderTemplate(prev => ({
        ...prev,
        rows: [...prev.rows, newRow]
      }));
    } else {
      setFooterTemplate(prev => ({
        ...prev,
        rows: [...prev.rows, newRow]
      }));
    }
  };

  const deleteRow = (rowId: string) => {
    if (selectedSection === 'header') {
      setHeaderTemplate(prev => ({
        ...prev,
        rows: prev.rows.filter(row => row.id !== rowId)
      }));
    } else {
      setFooterTemplate(prev => ({
        ...prev,
        rows: prev.rows.filter(row => row.id !== rowId)
      }));
    }
  };

  const addCell = (rowId: string) => {
    const updateRows = (rows: Row[]) => 
      rows.map(row => {
        if (row.id === rowId) {
          return {
            ...row,
            cells: [...row.cells, { type: 'text', value: 'New Cell', alignment: 'left' } as CellContent]
          };
        }
        return row;
      });

    if (selectedSection === 'header') {
      setHeaderTemplate(prev => ({
        ...prev,
        rows: updateRows(prev.rows)
      }));
    } else {
      setFooterTemplate(prev => ({
        ...prev,
        rows: updateRows(prev.rows)
      }));
    }
  };

  const updateCell = (rowId: string, cellIndex: number, updates: Partial<CellContent>) => {
    const updateRows = (rows: Row[]) =>
      rows.map(row => {
        if (row.id === rowId) {
          const newCells = [...row.cells];
          newCells[cellIndex] = { ...newCells[cellIndex], ...updates };
          return { ...row, cells: newCells };
        }
        return row;
      });

    if (selectedSection === 'header') {
      setHeaderTemplate(prev => ({
        ...prev,
        rows: updateRows(prev.rows)
      }));
    } else {
      setFooterTemplate(prev => ({
        ...prev,
        rows: updateRows(prev.rows)
      }));
    }
  };

  const loadTemplate = (templateName: string) => {
    if (templateName === 'towa') {
      setHeaderTemplate({
        enabled: true,
        rows: towaHeaderTemplate
      });
    } else if (templateName === 'blank') {
      setHeaderTemplate({
        enabled: true,
        rows: []
      });
      setFooterTemplate({
        enabled: true,
        rows: []
      });
    }
  };

  const moveRow = (rowId: string, direction: 'up' | 'down') => {
    const template = selectedSection === 'header' ? headerTemplate : footerTemplate;
    const setTemplate = selectedSection === 'header' ? setHeaderTemplate : setFooterTemplate;
    
    const index = template.rows.findIndex(r => r.id === rowId);
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === template.rows.length - 1)) {
      return;
    }
    
    const newRows = [...template.rows];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    [newRows[index], newRows[newIndex]] = [newRows[newIndex], newRows[index]];
    
    setTemplate(prev => ({ ...prev, rows: newRows }));
  };

  const currentTemplate = selectedSection === 'header' ? headerTemplate : footerTemplate;

  return (
    <SidebarProvider open={sidebarOpen} onOpenChange={setSidebarOpen}>
      <SidebarLeft />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/connectors')}
              className="gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              Back to Connectors
            </Button>
          </div>
          <Separator orientation="vertical" className="h-6 mx-2" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/connectors">{t('nav.connectors')}</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>OpenText DMS</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <div className="flex-1 overflow-y-auto">
          <div className="container mx-auto p-6 max-w-7xl">
            <div className="mb-6">
              <h1 className="text-3xl font-bold">OpenText Connector Configuration</h1>
              <p className="text-muted-foreground mt-2">
                Configure how documents from OpenText are processed in Docufen
              </p>
            </div>

      <Tabs defaultValue="basic" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="basic">Basic Settings</TabsTrigger>
          <TabsTrigger value="header-footer">Header & Footer</TabsTrigger>
          <TabsTrigger value="field-mapping">Field Mapping</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
          <TabsTrigger value="integration">Integration Guide</TabsTrigger>
          <TabsTrigger value="logs">Activity Logs</TabsTrigger>
        </TabsList>

        {/* Basic Settings Tab */}
        <TabsContent value="basic">
          <Card>
            <CardHeader>
              <CardTitle>OpenText Connection Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="opentext-url">OpenText Server URL</Label>
                  <Input id="opentext-url" placeholder="https://opentext.company.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="api-version">OpenText Version</Label>
                  <Select defaultValue="16.2">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="16.2">Version 16.2</SelectItem>
                      <SelectItem value="16.4">Version 16.4</SelectItem>
                      <SelectItem value="20.2">Version 20.2</SelectItem>
                      <SelectItem value="21.3">Version 21.3</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="header-footer-included">
                      Headers and footers already included in Word document
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Turn OFF if OpenText sends clean documents without headers/footers
                    </p>
                  </div>
                  <Switch
                    id="header-footer-included"
                    checked={headerFooterIncluded}
                    onCheckedChange={setHeaderFooterIncluded}
                  />
                </div>

                {!headerFooterIncluded && (
                  <Alert className="border-blue-200 bg-blue-50">
                    <Info className="h-4 w-4 text-blue-600" />
                    <AlertTitle className="text-blue-900">Header/Footer Configuration Required</AlertTitle>
                    <AlertDescription className="text-blue-800">
                      Since OpenText doesn't include headers/footers in the document, configure them in the next tab.
                      Docufen will add these to received documents.
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Document Reception</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="doc-format">Expected Document Format</Label>
                    <Select defaultValue="docx">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="docx">.docx (Word 2007+)</SelectItem>
                        <SelectItem value="doc">.doc (Legacy Word)</SelectItem>
                        <SelectItem value="pdf">PDF</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="max-size">Maximum File Size</Label>
                    <Select defaultValue="2mb">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2mb">2 MB</SelectItem>
                        <SelectItem value="5mb">5 MB</SelectItem>
                        <SelectItem value="10mb">10 MB</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Header & Footer Builder Tab */}
        <TabsContent value="header-footer">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Document Header & Footer Builder</CardTitle>
                  <CardDescription>
                    Design your document template to match OpenText formatting
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Select onValueChange={loadTemplate}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Load Template" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="blank">Blank Template</SelectItem>
                      <SelectItem value="towa">TOWA Pharma Template</SelectItem>
                      <SelectItem value="standard">Standard Template</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline">
                    <Upload className="h-4 w-4 mr-2" />
                    Import
                  </Button>
                  <Button variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Section Selector */}
                <div className="flex gap-2">
                  <Button
                    variant={selectedSection === 'header' ? 'default' : 'outline'}
                    onClick={() => setSelectedSection('header')}
                  >
                    Edit Header
                  </Button>
                  <Button
                    variant={selectedSection === 'footer' ? 'default' : 'outline'}
                    onClick={() => setSelectedSection('footer')}
                  >
                    Edit Footer
                  </Button>
                </div>

                {/* Template Builder */}
                <div className="border rounded-lg p-4 space-y-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold text-lg">
                      {selectedSection === 'header' ? 'Header' : 'Footer'} Rows
                    </h3>
                    <Button onClick={addRow} size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Row
                    </Button>
                  </div>

                  {currentTemplate.rows.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No rows added yet. Click "Add Row" to start building your {selectedSection}.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {currentTemplate.rows.map((row, rowIndex) => (
                        <div key={row.id} className="border rounded-lg p-3 bg-muted/30">
                          <div className="flex items-start gap-2 mb-3">
                            <div className="flex flex-col gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => moveRow(row.id, 'up')}
                                disabled={rowIndex === 0}
                              >
                                <ChevronUp className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => moveRow(row.id, 'down')}
                                disabled={rowIndex === currentTemplate.rows.length - 1}
                              >
                                <ChevronDown className="h-3 w-3" />
                              </Button>
                            </div>
                            
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium">Row {rowIndex + 1}</span>
                                <div className="flex gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => addCell(row.id)}
                                  >
                                    <Columns className="h-3 w-3 mr-1" />
                                    Add Column
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => deleteRow(row.id)}
                                  >
                                    <Trash2 className="h-3 w-3 text-red-500" />
                                  </Button>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
                                {row.cells.map((cell, cellIndex) => (
                                  <div key={cellIndex} className="border rounded p-2 bg-white">
                                    <div className="space-y-2">
                                      <Select
                                        value={cell.type}
                                        onValueChange={(value) => 
                                          updateCell(row.id, cellIndex, { type: value as any })
                                        }
                                      >
                                        <SelectTrigger className="h-8 text-xs">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="text">Static Text</SelectItem>
                                          <SelectItem value="field">Dynamic Field</SelectItem>
                                          <SelectItem value="image">Image/Logo</SelectItem>
                                        </SelectContent>
                                      </Select>

                                      {cell.type === 'text' && (
                                        <Input
                                          value={cell.value}
                                          onChange={(e) => 
                                            updateCell(row.id, cellIndex, { value: e.target.value })
                                          }
                                          placeholder="Enter text..."
                                          className="h-8 text-xs"
                                        />
                                      )}

                                      {cell.type === 'field' && (
                                        <Select
                                          value={cell.value}
                                          onValueChange={(value) => 
                                            updateCell(row.id, cellIndex, { value })
                                          }
                                        >
                                          <SelectTrigger className="h-8 text-xs">
                                            <SelectValue placeholder="Select field" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            {availableFields.map(category => (
                                              <div key={category.category}>
                                                <div className="px-2 py-1 text-xs font-semibold text-muted-foreground">
                                                  {category.category}
                                                </div>
                                                {category.fields.map(field => (
                                                  <SelectItem key={field.id} value={field.id}>
                                                    {field.label}
                                                  </SelectItem>
                                                ))}
                                              </div>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                      )}

                                      {cell.type === 'image' && (
                                        <Select
                                          value={cell.value}
                                          onValueChange={(value) => 
                                            updateCell(row.id, cellIndex, { value })
                                          }
                                        >
                                          <SelectTrigger className="h-8 text-xs">
                                            <SelectValue placeholder="Select image" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="company_logo">Company Logo</SelectItem>
                                            <SelectItem value="quality_seal">Quality Seal</SelectItem>
                                            <SelectItem value="custom_image">Custom Image</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      )}

                                      <div className="flex gap-1">
                                        <Button
                                          variant={cell.alignment === 'left' ? 'default' : 'ghost'}
                                          size="sm"
                                          className="h-6 w-6 p-0"
                                          onClick={() => 
                                            updateCell(row.id, cellIndex, { alignment: 'left' })
                                          }
                                        >
                                          <AlignLeft className="h-3 w-3" />
                                        </Button>
                                        <Button
                                          variant={cell.alignment === 'center' ? 'default' : 'ghost'}
                                          size="sm"
                                          className="h-6 w-6 p-0"
                                          onClick={() => 
                                            updateCell(row.id, cellIndex, { alignment: 'center' })
                                          }
                                        >
                                          <AlignCenter className="h-3 w-3" />
                                        </Button>
                                        <Button
                                          variant={cell.alignment === 'right' ? 'default' : 'ghost'}
                                          size="sm"
                                          className="h-6 w-6 p-0"
                                          onClick={() => 
                                            updateCell(row.id, cellIndex, { alignment: 'right' })
                                          }
                                        >
                                          <AlignRight className="h-3 w-3" />
                                        </Button>
                                        <Button
                                          variant={cell.bold ? 'default' : 'ghost'}
                                          size="sm"
                                          className="h-6 w-6 p-0"
                                          onClick={() => 
                                            updateCell(row.id, cellIndex, { bold: !cell.bold })
                                          }
                                        >
                                          <Bold className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Field Mapping Tab */}
        <TabsContent value="field-mapping">
          <Card>
            <CardHeader>
              <CardTitle>OpenText Field Mapping</CardTitle>
              <CardDescription>
                Map OpenText metadata fields to Docufen fields
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    These mappings determine how OpenText metadata is transferred to Docufen when documents are received.
                  </AlertDescription>
                </Alert>

                <div className="space-y-3">
                  {availableFields.map(category => (
                    <div key={category.category} className="space-y-2">
                      <h3 className="font-semibold text-sm">{category.category}</h3>
                      <div className="space-y-2">
                        {category.fields.map(field => (
                          <div key={field.id} className="grid grid-cols-3 gap-4 items-center p-2 border rounded">
                            <div className="text-sm">
                              <span className="font-medium">{field.label}</span>
                              <p className="text-xs text-muted-foreground">Example: {field.example}</p>
                            </div>
                            <Input 
                              placeholder="OpenText field name"
                              className="h-8"
                            />
                            <div className="flex items-center space-x-2">
                              <Switch id={`enable-${field.id}`} />
                              <Label htmlFor={`enable-${field.id}`} className="text-xs">
                                Enabled
                              </Label>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preview Tab */}
        <TabsContent value="preview">
          <Card>
            <CardHeader>
              <CardTitle>Document Preview</CardTitle>
              <CardDescription>
                Preview how your document will look with the configured header and footer
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border-2 border-gray-300 rounded-lg p-8 bg-white min-h-[600px]">
                {/* Header Preview */}
                {headerTemplate.rows.length > 0 && (
                  <div className="border-b-2 border-gray-200 pb-4 mb-8">
                    {headerTemplate.rows.map((row) => (
                      <div key={row.id} className="mb-2">
                        <div className="grid grid-cols-4 gap-2">
                          {row.cells.map((cell, cellIndex) => (
                            <div
                              key={cellIndex}
                              className={`
                                ${cell.alignment === 'center' ? 'text-center' : ''}
                                ${cell.alignment === 'right' ? 'text-right' : ''}
                                ${cell.bold ? 'font-bold' : ''}
                              `}
                            >
                              {cell.type === 'text' && cell.value}
                              {cell.type === 'field' && (
                                <span className="text-blue-600">
                                  [{availableFields.flatMap(c => c.fields).find(f => f.id === cell.value)?.label || cell.value}]
                                </span>
                              )}
                              {cell.type === 'image' && (
                                <div className={`
                                  ${cell.alignment === 'center' ? 'mx-auto' : ''}
                                  ${cell.alignment === 'right' ? 'ml-auto' : ''}
                                  w-24 h-12 bg-gray-200 rounded flex items-center justify-center text-xs
                                `}>
                                  {cell.value === 'company_logo' ? 'Logo' : cell.value}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Document Content Area */}
                <div className="min-h-[400px] text-gray-400 text-center pt-20">
                  <FileText className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p>Document content will appear here</p>
                </div>

                {/* Footer Preview */}
                {footerTemplate.rows.length > 0 && (
                  <div className="border-t-2 border-gray-200 pt-4 mt-8">
                    {footerTemplate.rows.map((row) => (
                      <div key={row.id} className="mb-2">
                        <div className="grid grid-cols-4 gap-2">
                          {row.cells.map((cell, cellIndex) => (
                            <div
                              key={cellIndex}
                              className={`
                                ${cell.alignment === 'center' ? 'text-center' : ''}
                                ${cell.alignment === 'right' ? 'text-right' : ''}
                                ${cell.bold ? 'font-bold' : ''}
                                text-sm
                              `}
                            >
                              {cell.type === 'text' && cell.value}
                              {cell.type === 'field' && (
                                <span className="text-blue-600">
                                  [{availableFields.flatMap(c => c.fields).find(f => f.id === cell.value)?.label || cell.value}]
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export Template
              </Button>
              <div className="flex gap-2">
                <Button variant="outline">Test with Sample Document</Button>
                <Button>
                  <Save className="h-4 w-4 mr-2" />
                  Save Configuration
                </Button>
              </div>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Integration Guide Tab */}
        <TabsContent value="integration">
          <Card>
            <CardHeader>
              <CardTitle>OpenText Integration Guide</CardTitle>
              <CardDescription>
                Technical documentation for integrating OpenText with Docufen
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Configure your OpenText system to send documents to Docufen using the API endpoint and authentication token from the Basic Settings tab.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Integration Steps</h3>
                <ol className="list-decimal ml-6 space-y-2">
                  <li>Configure OpenText to export documents in .docx format</li>
                  <li>Set up OpenText workflow to trigger document export on specific events</li>
                  <li>Configure OpenText to send documents via HTTP POST to Docufen endpoint</li>
                  <li>Include required metadata fields in the document transmission</li>
                  <li>Test the integration with sample documents</li>
                </ol>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Required Configuration</h3>
                <div className="bg-muted p-4 rounded-lg space-y-2">
                  <p className="font-semibold">OpenText Workflow Configuration:</p>
                  <ul className="list-disc ml-6 space-y-1">
                    <li>Document export format: DOCX</li>
                    <li>Metadata extraction: Enable all required fields</li>
                    <li>HTTP endpoint: Configure from Basic Settings tab</li>
                    <li>Authentication: Bearer token from Basic Settings tab</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activity Logs Tab */}
        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <CardTitle>Activity Logs</CardTitle>
              <CardDescription>
                Recent document submissions from this connector
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Document Name</TableHead>
                      <TableHead>Number</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Filename</TableHead>
                      <TableHead>Sent Date/Time</TableHead>
                      <TableHead>Imported Date/Time</TableHead>
                      <TableHead>Imported By</TableHead>
                      <TableHead>Link</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[
                      {
                        name: 'SOP Manufacturing Process',
                        number: 'SOP-MFG-025',
                        category: 'SOP',
                        filename: 'IFS6094.docx',
                        sentDate: '2025-01-29 14:30:12',
                        importedDate: '2025-01-29 14:30:35',
                        importedBy: 'API Token',
                        link: '/documents/doc456'
                      },
                      {
                        name: 'Quality Control Protocol',
                        number: 'QCP-2025-008',
                        category: 'Protocol',
                        filename: 'QC-Protocol-2025.docx',
                        sentDate: '2025-01-29 13:15:45',
                        importedDate: '2025-01-29 13:16:02',
                        importedBy: 'API Token',
                        link: '/documents/doc455'
                      },
                      {
                        name: 'Validation Report',
                        number: 'VAL-2025-003',
                        category: 'Report',
                        filename: 'Validation-Report-Q1.docx',
                        sentDate: '2025-01-29 11:45:20',
                        importedDate: '2025-01-29 11:45:38',
                        importedBy: 'API Token',
                        link: '/documents/doc454'
                      },
                    ].map((log, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{log.name}</TableCell>
                        <TableCell>{log.number}</TableCell>
                        <TableCell>{log.category}</TableCell>
                        <TableCell className="font-mono text-xs">{log.filename}</TableCell>
                        <TableCell className="text-sm">{log.sentDate}</TableCell>
                        <TableCell className="text-sm">{log.importedDate}</TableCell>
                        <TableCell>{log.importedBy}</TableCell>
                        <TableCell>
                          <Button variant="link" className="h-auto p-0" onClick={() => navigate(log.link)}>
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default OpenTextConnector;