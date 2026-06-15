import { FileUpIcon, UploadCloudIcon } from "lucide-react"

import { products } from "@/data/mock"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export function UploadProductsDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild><Button variant="outline"><FileUpIcon className="size-4" /> Upload Excel</Button></DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader><DialogTitle>Upload Products</DialogTitle><DialogDescription>Only the official template is accepted. Validate rows before importing.</DialogDescription></DialogHeader>
        <div className="space-y-4">
          <div className="flex min-h-40 flex-col items-center justify-center rounded-lg border border-dashed bg-muted/30 p-6 text-center">
            <UploadCloudIcon className="mb-3 size-8 text-muted-foreground" />
            <div className="font-medium">Drop official Excel template here</div>
            <p className="text-sm text-muted-foreground">XLSX only, checksum validated before preview.</p>
            <Button className="mt-4" variant="secondary">Browse File</Button>
          </div>
          <div className="rounded-lg border p-4">
            <div className="flex justify-between text-sm"><span>Validation Results</span><span>92%</span></div>
            <Progress value={92} className="mt-2" />
            <p className="mt-2 text-sm text-muted-foreground">4 rows require customer/template review before import.</p>
          </div>
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader><TableRow><TableHead>Product ID</TableHead><TableHead>SKU</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
              <TableBody>{products.slice(0, 3).map((product) => <TableRow key={product.id}><TableCell>{product.id}</TableCell><TableCell>{product.sku}</TableCell><TableCell>{product.status}</TableCell></TableRow>)}</TableBody>
            </Table>
          </div>
        </div>
        <DialogFooter><Button variant="outline">Download Template</Button><Button>Import Valid Rows</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
