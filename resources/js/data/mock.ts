export const customers = [
  { code: "CUST-A", name: "NorthStar Dairy", templates: ["A4 Milk Carton", "A3 Pallet"], status: "Active", createdAt: "2026-06-08" },
  { code: "CUST-B", name: "Evergreen Pharma", templates: ["Vial QR", "Cold Chain"], status: "Active", createdAt: "2026-06-07" },
  { code: "CUST-C", name: "Summit Foods", templates: ["Retail Pack"], status: "Inactive", createdAt: "2026-05-29" },
]

export const users = [
  { name: "Maria Santos", email: "maria@prodlabel.local", role: "Production Supervisor", status: "Active", lastLogin: "Today 09:42" },
  { name: "John Reyes", email: "john@prodlabel.local", role: "Encoder", status: "Active", lastLogin: "Today 08:13" },
  { name: "Anne Cruz", email: "anne@prodlabel.local", role: "Viewer", status: "Locked", lastLogin: "Jun 08, 2026" },
]

export const products = [
  { id: "PRD-1001", customer: "NorthStar Dairy", sku: "MILK-1L", name: "Whole Milk 1L", quantity: 50, prints: 2, status: "Printed", createdAt: "2026-06-10" },
  { id: "PRD-1002", customer: "NorthStar Dairy", sku: "MILK-500", name: "Whole Milk 500ml", quantity: 120, prints: 0, status: "Pending", createdAt: "2026-06-10" },
  { id: "PRD-1003", customer: "Evergreen Pharma", sku: "VIAL-A12", name: "Sterile Vial A12", quantity: 500, prints: 1, status: "Reprinted", createdAt: "2026-06-09" },
  { id: "PRD-1004", customer: "Summit Foods", sku: "SAUCE-250", name: "Tomato Sauce 250g", quantity: 80, prints: 0, status: "Failed", createdAt: "2026-06-08" },
]

export const templates = [
  { name: "A4 Milk Carton", customers: 2, version: "v4", updatedAt: "Today 10:20", status: "Active" },
  { name: "Vial QR", customers: 1, version: "v7", updatedAt: "Yesterday 16:12", status: "Active" },
  { name: "Retail Pack", customers: 4, version: "v2", updatedAt: "Jun 04, 2026", status: "Archived" },
]

export const activities = [
  { user: "Maria Santos", action: "Print completed", module: "Printing", description: "Batch PRN-20260610-001 completed 48 labels", ip: "10.0.2.21", createdAt: "2 min ago" },
  { user: "John Reyes", action: "Product created", module: "Products", description: "Created PRD-1002", ip: "10.0.2.44", createdAt: "18 min ago" },
  { user: "Anne Cruz", action: "Customer updated", module: "Customers", description: "Updated contact details", ip: "10.0.2.57", createdAt: "1 hr ago" },
]

export const trendData = [
  { day: "Mon", printed: 380, reprinted: 22, failed: 8 },
  { day: "Tue", printed: 460, reprinted: 31, failed: 6 },
  { day: "Wed", printed: 520, reprinted: 28, failed: 12 },
  { day: "Thu", printed: 610, reprinted: 35, failed: 9 },
  { day: "Fri", printed: 740, reprinted: 42, failed: 7 },
  { day: "Sat", printed: 330, reprinted: 12, failed: 3 },
  { day: "Sun", printed: 210, reprinted: 8, failed: 2 },
]

export const usageData = [
  { name: "NorthStar", value: 42 },
  { name: "Evergreen", value: 29 },
  { name: "Summit", value: 18 },
  { name: "Others", value: 11 },
]
