import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Pencil } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useBusiness } from '@/providers/business-provider'
import { useCustomerLabel } from '@/features/customers/use-customer-label'
import {
  useCustomer,
  useUpdateCustomer,
  type CustomerInput,
} from '@/features/customers/customers-queries'
import { CustomerFormDialog } from '@/features/customers/customer-form-dialog'
import { PlaceholderPage } from '@/components/placeholder-page'

export function CustomerProfilePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { currentBusiness } = useBusiness()
  const label = useCustomerLabel()
  const [editOpen, setEditOpen] = useState(false)

  const { data: customer, isLoading } = useCustomer(id)
  const updateCustomer = useUpdateCustomer(currentBusiness?.id ?? '', id ?? '')

  async function handleUpdate(values: CustomerInput) {
    await updateCustomer.mutateAsync(values)
    toast.success('Saved')
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
      </div>
    )
  }

  if (!customer) return null

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" className="-ml-2" onClick={() => navigate('/app/customers')}>
        <ArrowLeft className="size-4" /> Back to {label.toLowerCase()}
      </Button>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          <Avatar className="size-14">
            <AvatarFallback className="bg-accent text-lg text-accent-foreground">
              {customer.name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold tracking-tight">{customer.name}</h1>
              {customer.archived_at && <Badge variant="outline">Archived</Badge>}
            </div>
            <p className="text-sm text-muted-foreground">
              {customer.customer_type || label.replace(/s$/, '')}
            </p>
          </div>
        </div>
        <Button variant="outline" onClick={() => setEditOpen(true)}>
          <Pencil className="size-4" /> Edit
        </Button>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="contact">Contact</TabsTrigger>
          <TabsTrigger value="purchases">Purchase history</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Total purchases</p>
                <p className="mt-1 text-2xl font-semibold">₹0</p>
                <p className="mt-1 text-xs text-muted-foreground">No sales recorded yet</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Outstanding balance</p>
                <p className="mt-1 text-2xl font-semibold">₹0</p>
                <p className="mt-1 text-xs text-muted-foreground">No dues recorded</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Last purchase</p>
                <p className="mt-1 text-2xl font-semibold">—</p>
                <p className="mt-1 text-xs text-muted-foreground">Not available yet</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="contact" className="mt-4">
          <Card>
            <CardContent className="grid grid-cols-1 gap-4 pt-6 text-sm sm:grid-cols-2">
              <div>
                <p className="text-xs text-muted-foreground">Phone</p>
                <p className="font-medium">{customer.phone || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="font-medium">{customer.email || '—'}</p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-xs text-muted-foreground">Address</p>
                <p className="font-medium">{customer.address || '—'}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="purchases" className="mt-4">
          <PlaceholderPage
            title="No purchases yet"
            note="Orders and sales will appear here once the Orders module is built."
          />
        </TabsContent>

        <TabsContent value="notes" className="mt-4">
          <Card>
            <CardContent className="pt-6 text-sm">
              {customer.notes ? (
                <p className="whitespace-pre-wrap">{customer.notes}</p>
              ) : (
                <p className="text-muted-foreground">No notes yet.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <CustomerFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        customer={customer}
        label={label}
        onSubmit={handleUpdate}
      />
    </div>
  )
}
