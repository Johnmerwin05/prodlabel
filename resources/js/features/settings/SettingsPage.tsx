import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const tabs = ["General", "Printing", "Templates", "Users", "Security", "Notifications"]

export function SettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Configure global system preferences, security policy, template defaults, and notification behavior." actions={<Button>Save Changes</Button>} />
      <Tabs defaultValue="General">
        <TabsList className="flex h-auto flex-wrap justify-start">{tabs.map((tab) => <TabsTrigger key={tab} value={tab}>{tab}</TabsTrigger>)}</TabsList>
        {tabs.map((tab) => (
          <TabsContent key={tab} value={tab}>
            <Card>
              <CardHeader><CardTitle>{tab}</CardTitle><CardDescription>Production-safe defaults for {tab.toLowerCase()} settings.</CardDescription></CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2"><Label>{tab} Name</Label><Input defaultValue={`Default ${tab}`} /></div>
                <div className="grid gap-2"><Label>Retention Days</Label><Input type="number" defaultValue={90} /></div>
                <div className="flex items-center justify-between rounded-lg border p-3 md:col-span-2"><div><div className="font-medium">Enable {tab} Controls</div><p className="text-sm text-muted-foreground">Apply this policy to new records.</p></div><Switch defaultChecked /></div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
