import { NextResponse } from "next/server";

export const dynamic = "force-static";
export const revalidate = 86400; // Cache for 24 hours

export async function GET() {
  const assetLinks = [
    {
      relation: ["delegate_permission/common.handle_all_urls"],
      target: {
        namespace: "android_app",
        package_name: "com.errandshop.app",
        sha256_cert_fingerprints: [
          "E4:2C:86:E7:8A:FC:6D:21:A3:4A:DB:BC:DA:96:45:23:7C:15:3E:06:80:00:7C:69:B8:9F:9A:71:23:9A:BE:11",
          "C6:0B:B7:B5:67:3A:2C:D3:31:A8:3B:F4:91:8D:40:88:D2:38:44:0E:0E:87:8B:8A:CF:C0:EB:FE:67:FE:21:37"
        ]
      }
    }
  ];

  return NextResponse.json(assetLinks, {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
    },
  });
}
