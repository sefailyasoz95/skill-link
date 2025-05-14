"use client";

import ProfileCard from "../../components/ProfileCard";
import { useParams } from "next/navigation";

export default function UserProfilePage() {
  const params = useParams();
  const userId = params.id as string;

  return (
    <div className="container py-8 px-4 md:py-10">
      <div className="mx-auto max-w-4xl">
        <ProfileCard userId={userId} showEditButton={false} />
      </div>
    </div>
  );
}
