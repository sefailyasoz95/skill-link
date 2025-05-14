"use client";

import ProfileCard from "../components/ProfileCard";

export default function ProfilePage() {
  return (
    <div className="container py-8 px-4 md:py-10">
      <div className="mx-auto max-w-4xl">
        <ProfileCard showEditButton={true} />
      </div>
    </div>
  );
}
