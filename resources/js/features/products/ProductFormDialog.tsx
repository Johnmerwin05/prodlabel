import { PlusIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

export function ProductFormDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild><Button><PlusIcon className="size-4" /> Create Product</Button></DialogTrigger>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader><DialogTitle>Create Product</DialogTitle><DialogDescription>Capture product, batch, lot, and expiry data before printing.</DialogDescription></DialogHeader>
        <div className="grid gap-4 py-2 md:grid-cols-2">
          <div className="grid gap-2"><Label>Product ID</Label><Input /></div>
          <div className="grid gap-2"><Label>Customer</Label><Select><SelectTrigger><SelectValue placeholder="Select customer" /></SelectTrigger><SelectContent><SelectItem value="northstar">NorthStar Dairy</SelectItem></SelectContent></Select></div>
          <div className="grid gap-2"><Label>SKU</Label><Input /></div>
          <div className="grid gap-2"><Label>Product Name</Label><Input /></div>
          <div className="grid gap-2"><Label>Quantity</Label><Input type="number" /></div>
          <div className="grid gap-2"><Label>Batch Number</Label><Input /></div>
          <div className="grid gap-2"><Label>Lot Number</Label><Input /></div>
          <div className="grid gap-2"><Label>Status</Label><Select><SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger><SelectContent><SelectItem value="ready">Ready</SelectItem><SelectItem value="draft">Draft</SelectItem></SelectContent></Select></div>
          <div className="grid gap-2"><Label>Manufacturing Date</Label><Input type="date" /></div>
          <div className="grid gap-2"><Label>Expiration Date</Label><Input type="date" /></div>
          <div className="grid gap-2 md:col-span-2"><Label>Description</Label><Textarea /></div>
        </div>
        <DialogFooter><Button>Save Product</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
