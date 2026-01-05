import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Loader2, Building2, CreditCard, ChevronDown, ChevronUp, DollarSign, Package, Plug } from "lucide-react";
import { SERVERURL } from '@/lib/server';
import { INTEGRITY_CODES_ADMIN_TENANT } from '@/lib/constants';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '@/lib/stateManagement';
import { useShallow } from 'zustand/shallow';
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SidebarLeft } from "@/components/left-sidebar/sidebar-left";
import { SidebarInset } from "@/components/ui/sidebar";

interface Tenant {
  id: string;
  tenantName: string;
  companyName: string;
  companyAddress: string;
  companyCity: string;
  companyState: string;
  companyPostCode: string;
  companyCountry: string;
  businessRegistrationNumber: string;
  locale: string | string[];
  logo?: string;
  expires: number;
  status: "trial" | "active" | "expired" | "deactivated";
  tenantId: string;
  ersdText?: string;
  enforceDigitalSignatures?: boolean;
  // Stripe integration fields
  stripeCustomerId?: string;
  stripePriceId?: string;
  billingEmail?: string;
  billingCurrency?: string;
  paymentMethod?: 'stripe' | 'azure_marketplace';
  azureSubscriptionId?: string;
  lastNotification?: number;
  // Paper cost tracking
  paperCostPerPage?: number;
  paperCostUpdatedAt?: number;
  // Investment and ROI tracking
  investmentCost?: number;
  investmentCostUpdatedAt?: number;
  estimatedMonthlyPages?: number;
  estimatedMonthlyPagesUpdatedAt?: number;
  // Validation package tracking
  validationPackagePurchaseDate?: number;
  validationPackageVersion?: string;
  // Connector settings
  connectorsEnabled?: boolean;
}
const InternalAdmin: React.FC = () => {
  const { homeTenantName } = useUserStore(useShallow((state) => ({
    homeTenantName: state.homeTenantName
  })));
  const navigate = useNavigate();
  const [isResetting, setIsResetting] = useState<Record<string, boolean>>({});
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const [updatingValidation, setUpdatingValidation] = useState<Record<string, boolean>>({});
  const [updatingConnectors, setUpdatingConnectors] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (homeTenantName !== INTEGRITY_CODES_ADMIN_TENANT) {
      navigate("/home");
      return;
    }

    const fetchTenants = async () => {
      try {
        const response = await fetch(SERVERURL + 'admin/tenants', { 
          credentials: 'include' 
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch tenants: ${response.statusText}`);
        }
        
        const data = await response.json();
        setTenants(data.tenants);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch tenants');
        console.error('Error fetching tenants:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTenants();
  }, [homeTenantName, navigate]);

  const handleReset = async (tenantId: string) => {
    setIsResetting((prev) => ({ ...prev, [tenantId]: true }));

    console.log(`Resetting tenant ${tenantId}`);
    fetch(SERVERURL + `admin/account/${tenantId}`, { credentials: 'include', method: 'DELETE' })
      .then(response => {
        if (!response.ok) {
          console.error(`Failed to reset tenant ${tenantId}:`, response.statusText);
        } else {
          console.log(`Tenant ${tenantId} reset successfully`);
        }
      }).catch((error) => {
        if (error instanceof Error) {
          console.error(`Error resetting tenant ${tenantId}:`, error.message);
        }
      }).finally(() => {
        setIsResetting((prev) => ({ ...prev, [tenantId]: false }));
      });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500">Active</Badge>;
      case 'trial':
        return <Badge className="bg-blue-500">Trial</Badge>;
      case 'expired':
        return <Badge className="bg-red-500">Expired</Badge>;
      case 'deactivated':
        return <Badge variant="secondary">Deactivated</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount?: number, currency: string = 'USD') => {
    if (!amount) return 'Not set';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const getLocaleDisplay = (locale: string | string[]) => {
    if (Array.isArray(locale)) {
      return locale.map(l => l.toUpperCase()).join(', ');
    }
    return locale.toUpperCase();
  };

  const toggleRow = (tenantId: string) => {
    setExpandedRows(prev => ({
      ...prev,
      [tenantId]: !prev[tenantId]
    }));
  };

  const handleValidationPackageUpdate = async (tenantId: string, enabled: boolean, version?: string) => {
    setUpdatingValidation(prev => ({ ...prev, [tenantId]: true }));

    try {
      const response = await fetch(SERVERURL + `admin/tenants/${tenantId}/validation-package`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ enabled, version: version || '1' })
      });

      if (!response.ok) {
        throw new Error(`Failed to update validation package: ${response.statusText}`);
      }

      const result = await response.json();
      
      // Update the local state
      setTenants(prevTenants => 
        prevTenants.map(tenant => 
          tenant.id === tenantId 
            ? {
                ...tenant,
                validationPackagePurchaseDate: result.validationPackagePurchaseDate,
                validationPackageVersion: result.validationPackageVersion
              }
            : tenant
        )
      );

      toast.success(result.message);
    } catch (error) {
      console.error('Error updating validation package:', error);
      toast.error(error instanceof Error ? error.message : "Failed to update validation package");
    } finally {
      setUpdatingValidation(prev => ({ ...prev, [tenantId]: false }));
    }
  };

  const handleConnectorToggle = async (tenantId: string, enabled: boolean) => {
    setUpdatingConnectors(prev => ({ ...prev, [tenantId]: true }));

    try {
      const response = await fetch(SERVERURL + `admin/tenants/${tenantId}/connectors`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ enabled })
      });

      if (!response.ok) {
        throw new Error(`Failed to update connector setting: ${response.statusText}`);
      }

      const result = await response.json();

      // Update the local state
      setTenants(prevTenants =>
        prevTenants.map(tenant =>
          tenant.id === tenantId
            ? {
                ...tenant,
                connectorsEnabled: result.connectorsEnabled
              }
            : tenant
        )
      );

      toast.success(enabled ? 'Connectors enabled successfully' : 'Connectors disabled successfully');
    } catch (error) {
      console.error('Error updating connector setting:', error);
      toast.error(error instanceof Error ? error.message : "Failed to update connector setting");
    } finally {
      setUpdatingConnectors(prev => ({ ...prev, [tenantId]: false }));
    }
  };

  const handleExtendTrial = async (tenantId: string) => {
    const response = await fetch(SERVERURL + `admin/tenants/${tenantId}/extend-trial/`, {
      method: "PUT",
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      throw new Error(`Failed to extend trial: ${response.statusText}`);
    }
    const result = await response.json();
    toast.success(result.message);
    // Optionally, refresh the tenant list after extending trial
    setTenants(prevTenants =>
      prevTenants.map(tenant =>
        tenant.id === tenantId
          ? { ...tenant, expires: Date.now() + 14 * 24 * 60 * 60 * 1000 } // Extend by 14 days
          : tenant
      )
    );
  }

  const handleActivateLicense = async (tenantId: string) => {
    const response = await fetch(SERVERURL + `admin/tenants/${tenantId}/activate-tenant/`, {
      method: "PUT",
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json', 
      },
    });
    if (!response.ok) {
      throw new Error(`Failed to activate license: ${response.statusText}`);
    }
    const result = await response.json();
    toast.success(result.message);
    // Optionally, refresh the tenant list after activating license
    setTenants(prevTenants => 
      prevTenants.map(tenant => 
        tenant.id === tenantId 
          ? { ...tenant, status: 'active' } // Set to 1 year from now
          : tenant
      )
    )
  }

  if (homeTenantName !== INTEGRITY_CODES_ADMIN_TENANT) {
    return null;
  }
  return (
    <>
      <SidebarLeft />
      <SidebarInset style={{ border: 'none' }}>
        <div className="container mx-auto p-6">
          <h1 className="text-3xl font-bold mb-6" data-testid="internalAdmin.pageTitle">Integrity Codes Pty Ltd Administration</h1>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {isLoading && (
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      )}

      {!isLoading && !error && (
        <>
          <div className="mb-4 flex items-center justify-between">
            <p className="text-muted-foreground">
              Total tenants: {tenants.length}
            </p>
            <div className="flex gap-2">
              <Badge variant="outline">
                Active: {tenants.filter(t => t.status === 'active').length}
              </Badge>
              <Badge variant="outline">
                Trial: {tenants.filter(t => t.status === 'trial').length}
              </Badge>
              <Badge variant="outline">
                Expired: {tenants.filter(t => t.status === 'expired').length}
              </Badge>
            </div>
          </div>

          <div className="overflow-hidden border rounded-md">
            <Table>
              <TableHeader>
                <TableRow className="bg-table-header">
                  <TableHead className="text-sm font-medium text-gray-600 bg-table-header border-b z-10 w-10"></TableHead>
                  <TableHead className="text-sm font-medium text-gray-600 bg-table-header border-b z-10 w-[20%]">Company Name</TableHead>
                  <TableHead className="text-sm font-medium text-gray-600 bg-table-header border-b z-10 w-[10%]">Tenant ID</TableHead>
                  <TableHead className="text-sm font-medium text-gray-600 bg-table-header border-b z-10 w-[10%]">Status</TableHead>
                  <TableHead className="text-sm font-medium text-gray-600 bg-table-header border-b z-10 w-[15%]">Billing Email</TableHead>
                  <TableHead className="text-sm font-medium text-gray-600 bg-table-header border-b z-10 w-[10%]">Locale</TableHead>
                  <TableHead className="text-sm font-medium text-gray-600 bg-table-header border-b z-10 w-[15%]">Payment Method</TableHead>
                  <TableHead className="text-sm font-medium text-gray-600 bg-table-header border-b z-10 w-[10%]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tenants.map((tenant: Tenant) => (
                  <React.Fragment key={tenant.id}>
                    <TableRow
                      className={`cursor-pointer h-12 hover:bg-[#FAF9F4] ${expandedRows[tenant.id] ? 'bg-[#FAF9F4]' : ''}`}
                      onClick={() => toggleRow(tenant.id)}
                      data-testid={`internalAdmin.${tenant.id}Row`}
                    >
                      <TableCell>
                        {expandedRows[tenant.id] ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </TableCell>
                      <TableCell className="font-medium text-gray-700" data-testid={`internalAdmin.${tenant.id}Title`}>
                        <div className="flex items-center gap-2">
                          <span>{tenant.companyName || tenant.tenantName}</span>
                          {tenant.validationPackagePurchaseDate && (
                            <Badge className="bg-purple-500 ml-2" title={`Validation Package v${tenant.validationPackageVersion || '1'}`}>
                              <Package className="h-3 w-3 mr-1" />
                              VP
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm font-normal text-gray-600">
                        <code className="text-xs">{tenant.tenantName}</code>
                      </TableCell>
                      <TableCell className="text-sm font-normal text-gray-600">
                        <div className="flex items-center gap-2">
                          {getStatusBadge(tenant.status)}
                          {tenant.status === 'trial' && (
                            <span className="text-xs text-muted-foreground">
                              {formatDate(tenant.expires)}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm font-normal text-gray-600">
                        <span className="truncate">{tenant.billingEmail || '-'}</span>
                      </TableCell>
                      <TableCell className="text-sm font-normal text-gray-600">
                        {getLocaleDisplay(tenant.locale)}
                      </TableCell>
                      <TableCell className="text-sm font-normal text-gray-600">
                        {tenant.paymentMethod ? (
                          <span className="capitalize">{tenant.paymentMethod.replace('_', ' ')}</span>
                        ) : '-'}
                      </TableCell>
                      <TableCell className="text-sm font-normal text-gray-600">
                        {tenant.status === 'trial' && (
                          <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleExtendTrial(tenant.id)}
                              className="text-xs h-7 px-2"
                            >
                              Extend
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleActivateLicense(tenant.id)}
                              className="text-xs h-7 px-2"
                            >
                              Activate
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                    {expandedRows[tenant.id] && (
                      <TableRow className="bg-[#FAF9F4]">
                        <TableCell colSpan={8} className="p-0">
                          <div className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {/* Company Details */}
                              <div className="border rounded-md p-4 bg-white">
                                <h4 className="font-semibold mb-3 flex items-center gap-2">
                                  <Building2 className="h-4 w-4" />
                                  Company Details
                                </h4>
                                <div className="space-y-2 text-sm">
                                  <p><span className="text-muted-foreground">Address:</span> {tenant.companyAddress || 'Not set'}</p>
                                  <p><span className="text-muted-foreground">City:</span> {tenant.companyCity || 'Not set'}</p>
                                  <p><span className="text-muted-foreground">State:</span> {tenant.companyState || 'Not set'}</p>
                                  <p><span className="text-muted-foreground">Post Code:</span> {tenant.companyPostCode || 'Not set'}</p>
                                  <p><span className="text-muted-foreground">Country:</span> {tenant.companyCountry || 'Not set'}</p>
                                  <p><span className="text-muted-foreground">Registration #:</span> {tenant.businessRegistrationNumber || 'Not set'}</p>
                                  <p><span className="text-muted-foreground">Tenant ID:</span> <code className="text-xs">{tenant.tenantId}</code></p>
                                </div>
                              </div>

                              {/* Billing Details */}
                              <div className="border rounded-md p-4 bg-white">
                                <h4 className="font-semibold mb-3 flex items-center gap-2">
                                  <CreditCard className="h-4 w-4" />
                                  Billing Details
                                </h4>
                                <div className="space-y-2 text-sm">
                                  <p><span className="text-muted-foreground">Stripe Customer:</span> <code className="text-xs">{tenant.stripeCustomerId || 'Not set'}</code></p>
                                  <p><span className="text-muted-foreground">Stripe Price ID:</span> <code className="text-xs">{tenant.stripePriceId || 'Not set'}</code></p>
                                  <p><span className="text-muted-foreground">Currency:</span> {tenant.billingCurrency?.toUpperCase() || 'USD'}</p>
                                  {tenant.azureSubscriptionId && (
                                    <p><span className="text-muted-foreground">Azure Subscription:</span> <code className="text-xs">{tenant.azureSubscriptionId}</code></p>
                                  )}
                                </div>
                              </div>

                              {/* Cost Tracking */}
                              <div className="border rounded-md p-4 bg-white">
                                <h4 className="font-semibold mb-3 flex items-center gap-2">
                                  <DollarSign className="h-4 w-4" />
                                  Cost Tracking
                                </h4>
                                <div className="space-y-2 text-sm">
                                  <p><span className="text-muted-foreground">Paper Cost/Page:</span> {formatCurrency(tenant.paperCostPerPage)}</p>
                                  <p><span className="text-muted-foreground">Investment Cost:</span> {formatCurrency(tenant.investmentCost)}</p>
                                  <p><span className="text-muted-foreground">Est. Monthly Pages:</span> {tenant.estimatedMonthlyPages?.toLocaleString() || 'Not set'}</p>
                                  {tenant.paperCostUpdatedAt && (
                                    <p><span className="text-muted-foreground">Paper Cost Updated:</span> {formatDate(tenant.paperCostUpdatedAt)}</p>
                                  )}
                                  {tenant.investmentCostUpdatedAt && (
                                    <p><span className="text-muted-foreground">Investment Updated:</span> {formatDate(tenant.investmentCostUpdatedAt)}</p>
                                  )}
                                  {tenant.estimatedMonthlyPagesUpdatedAt && (
                                    <p><span className="text-muted-foreground">Pages Estimate Updated:</span> {formatDate(tenant.estimatedMonthlyPagesUpdatedAt)}</p>
                                  )}
                                </div>
                              </div>

                              {/* Validation Package */}
                              <div className="border rounded-md p-4 bg-white">
                                <h4 className="font-semibold mb-3 flex items-center gap-2">
                                  <Package className="h-4 w-4" />
                                  Validation Package
                                </h4>
                                <div className="space-y-3 text-sm">
                                  <div className="flex items-center space-x-2">
                                    <Switch
                                      id={`validation-${tenant.id}`}
                                      checked={!!tenant.validationPackagePurchaseDate}
                                      disabled={updatingValidation[tenant.id]}
                                      onCheckedChange={(checked) => {
                                        handleValidationPackageUpdate(tenant.id, checked, tenant.validationPackageVersion);
                                      }}
                                    />
                                    <Label htmlFor={`validation-${tenant.id}`}>
                                      {tenant.validationPackagePurchaseDate ? 'Enabled' : 'Disabled'}
                                    </Label>
                                    {updatingValidation[tenant.id] && (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    )}
                                  </div>

                                  {tenant.validationPackagePurchaseDate && (
                                    <>
                                      <div className="space-y-1">
                                        <p><span className="text-muted-foreground">Purchase Date:</span> {formatDate(tenant.validationPackagePurchaseDate)}</p>
                                        <p><span className="text-muted-foreground">Version:</span> {tenant.validationPackageVersion || '1'}</p>
                                      </div>
                                      <div className="space-y-2">
                                        <Label htmlFor={`version-${tenant.id}`} className="text-xs">Update Version</Label>
                                        <div className="flex gap-2">
                                          <Input
                                            id={`version-${tenant.id}`}
                                            type="text"
                                            placeholder="e.g., 2.0"
                                            defaultValue={tenant.validationPackageVersion || '1'}
                                            className="h-8"
                                            onKeyDown={(e) => {
                                              if (e.key === 'Enter') {
                                                const input = e.target as HTMLInputElement;
                                                handleValidationPackageUpdate(tenant.id, true, input.value);
                                              }
                                            }}
                                          />
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            disabled={updatingValidation[tenant.id]}
                                            onClick={() => {
                                              const input = document.getElementById(`version-${tenant.id}`) as HTMLInputElement;
                                              if (input) {
                                                handleValidationPackageUpdate(tenant.id, true, input.value);
                                              }
                                            }}
                                          >
                                            Update
                                          </Button>
                                        </div>
                                      </div>
                                    </>
                                  )}
                                </div>
                              </div>

                              {/* Connector Settings */}
                              <div className="border rounded-md p-4 bg-white">
                                <h4 className="font-semibold mb-3 flex items-center gap-2">
                                  <Plug className="h-4 w-4" />
                                  Connector Settings
                                </h4>
                                <div className="space-y-3 text-sm">
                                  <div className="flex items-center space-x-2">
                                    <Switch
                                      id={`connectors-${tenant.id}`}
                                      checked={!!tenant.connectorsEnabled}
                                      disabled={updatingConnectors[tenant.id]}
                                      onCheckedChange={(checked) => {
                                        handleConnectorToggle(tenant.id, checked);
                                      }}
                                    />
                                    <Label htmlFor={`connectors-${tenant.id}`}>
                                      {tenant.connectorsEnabled ? 'Enabled' : 'Disabled'}
                                    </Label>
                                    {updatingConnectors[tenant.id] && (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    )}
                                  </div>
                                  <p className="text-muted-foreground text-xs">
                                    When enabled, users can access the Connectors page and create documents from connected apps in the Create Document dialog.
                                  </p>
                                </div>
                              </div>

                              {/* Test Tenant Reset Button */}
                              {(tenant.tenantName === 'xmwkb' || tenant.tenantName === '17nj5d') && (
                                <div className="border rounded-md p-4 bg-white col-span-full">
                                  <h4 className="font-semibold mb-3 text-red-600">Test Tenant Actions</h4>
                                  <Button
                                    data-testid={`internalAdmin.reset${tenant.tenantName}Button`}
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => handleReset(tenant.tenantName)}
                                    disabled={isResetting[tenant.tenantName]}
                                  >
                                    {isResetting[tenant.tenantName] ? (
                                      <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Resetting...
                                      </>
                                    ) : (
                                      `Reset Test Tenant`
                                    )}
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}
        </div>
      </SidebarInset>
    </>
  );
};

export default InternalAdmin;