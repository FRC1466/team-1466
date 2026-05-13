import { ExternalLink, Zap } from "lucide-react";
import { WEBBPOWER_URL } from "@/components/app-layout";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function AppsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Apps</h1>
        <p className="text-muted-foreground mt-2">
          External tools and dashboards connected to the team workspace.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <a href={WEBBPOWER_URL} target="_blank" rel="noopener noreferrer" className="block outline-none group focus-visible:ring-2 focus-visible:ring-ring rounded-xl">
          <Card className="h-full transition-colors hover:border-primary/50 group-hover:bg-muted/50 border-border">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="size-10 rounded-lg bg-warning/10 text-warning flex items-center justify-center mb-4">
                  <Zap className="size-5" />
                </div>
                <ExternalLink className="size-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <CardTitle className="text-xl">WebbPower</CardTitle>
              <CardDescription className="text-balance leading-relaxed">
                FRC robot power diagnostics, battery tracking, and match telemetry analysis.
              </CardDescription>
            </CardHeader>
          </Card>
        </a>
      </div>
    </div>
  );
}
