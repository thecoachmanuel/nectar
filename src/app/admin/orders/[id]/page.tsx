"use client";

import React, { use } from "react";
import OrderDetailsModal from "@/components/admin/OrderDetailsModal";
import { useRouter } from "next/navigation";

export default function AdminOrderDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();

  return (
    <div className="p-6">
      <OrderDetailsModal
        isOpen={true}
        onClose={() => router.back()}
        orderId={resolvedParams.id}
      />
    </div>
  );
}
