"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { StudentLayout } from "../../components/student/student-layout";

export default function RoomRedirectPage() {
  const params = useParams<{ roomId: string }>();
  const router = useRouter();

  useEffect(() => {
    if (params?.roomId) {
      router.replace(`/rooms/${params.roomId}/content`);
    }
  }, [params?.roomId, router]);

  return (
    <StudentLayout>
      <div className="p-10 text-center text-muted">جارٍ التحويل...</div>
    </StudentLayout>
  );
}
