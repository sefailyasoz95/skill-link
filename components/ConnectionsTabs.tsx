// ConnectionsTabs.tsx
import Link from "next/link";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { ConnectionCard } from "./ConnectionCard";
import { ConnectionRequestCard } from "./ConnectionRequestCard";
import { Connection } from "@/lib/types";

interface ConnectionsTabsProps {
  connections: Connection[];
  pendingRequests: Connection[];
  loading: boolean;
  onAcceptRequest: (id: string) => void;
  onDeclineRequest: (id: string) => void;
}

export function ConnectionsTabs({
  connections,
  pendingRequests,
  loading,
  onAcceptRequest,
  onDeclineRequest,
}: ConnectionsTabsProps) {
  return (
    <div>
      <Tabs defaultValue="connections">
        <div className="flex items-center justify-between">
          <TabsList className="mb-4">
            <TabsTrigger value="connections">My Connections</TabsTrigger>
            <TabsTrigger value="requests">
              Connection Requests
              {pendingRequests.length > 0 && (
                <span className="ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-white">
                  {pendingRequests.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>
          <Button asChild variant="outline" size="sm">
            <Link href="/search">
              <UserPlus className="mr-2 h-4 w-4" />
              Find More
            </Link>
          </Button>
        </div>

        <TabsContent value="connections">
          {loading ? (
            <div className="grid gap-4 md:grid-cols-2">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-[140px] w-full" />
              ))}
            </div>
          ) : connections.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {connections.map((connection) => (
                <ConnectionCard key={connection.id} connection={connection} />
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed p-8 text-center">
              <h3 className="font-medium">No connections yet</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Start by searching for collaborators with the skills you need
              </p>
              <Button asChild className="mt-4">
                <Link href="/search">Find Collaborators</Link>
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="requests">
          {loading ? (
            <div className="grid gap-4 md:grid-cols-2">
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-[140px] w-full" />
              ))}
            </div>
          ) : pendingRequests.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {pendingRequests.map((request) => (
                <ConnectionRequestCard
                  key={request.id}
                  connection={request}
                  onAccept={onAcceptRequest}
                  onDecline={onDeclineRequest}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed p-8 text-center">
              <h3 className="font-medium">No pending requests</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                When someone wants to connect with you, you'll see their request
                here
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
