// QuickActionsCard.tsx
import Link from "next/link";
import { MessageSquare, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function QuickActionsCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>Common tasks to help you get started</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Button
            asChild
            variant="outline"
            className="h-auto flex-col items-start p-4"
          >
            <Link href="/search">
              <div className="flex flex-col items-start gap-1">
                <UserPlus className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium">Find Collaborators</span>
                <span className="text-xs text-muted-foreground">
                  Search for skills you need
                </span>
              </div>
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="h-auto flex-col items-start p-4"
          >
            <Link href="/messages">
              <div className="flex flex-col items-start gap-1">
                <MessageSquare className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium">Messages</span>
                <span className="text-xs text-muted-foreground">
                  Chat with connections
                </span>
              </div>
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
