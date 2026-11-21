"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/components/site";

export default function ProfileRedirect() {
  const { user, loading } = useCurrentUser();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace("/auth?mode=login");
      } else {
        router.replace("/settings");
      }
    }
  }, [user, loading, router]);

  return (
    <div className="page-loading">
      Loading profile...
    </div>
  );
}
