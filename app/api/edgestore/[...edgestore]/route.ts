import { initEdgeStore } from "@edgestore/server";
import { createEdgeStoreNextHandler } from "@edgestore/server/adapters/next/app";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

// Ensure environment variables are loaded
const accessKey = process.env.EDGE_STORE_ACCESS_KEY;
const secretKey = process.env.EDGE_STORE_SECRET_KEY;

let handler: ReturnType<typeof createEdgeStoreNextHandler> | null = null;
let edgeStoreRouter: ReturnType<ReturnType<typeof initEdgeStore.create>["router"]> | null = null;

if (accessKey && secretKey) {
  try {
    const es = initEdgeStore.create();

    edgeStoreRouter = es.router({
      publicFiles: es
        .fileBucket()
        .beforeUpload(async () => {
          const { userId } = await auth();
          if (!userId) {
            throw new Error("Unauthorized");
          }
          return true;
        })
        .beforeDelete(async () => {
          const { userId } = await auth();
          if (!userId) {
            throw new Error("Unauthorized");
          }
          return true;
        }),
    });

    handler = createEdgeStoreNextHandler({
      router: edgeStoreRouter,
    });
  } catch (error) {
    console.error("EdgeStore initialization error:", error);
  }
}

async function handleRequest(request: NextRequest) {
  if (!handler) {
    return NextResponse.json(
      {
        error:
          "EdgeStore credentials not configured. Please set EDGE_STORE_ACCESS_KEY and EDGE_STORE_SECRET_KEY in your .env.local file. Get them from https://www.edgestore.dev",
      },
      { status: 500 }
    );
  }
  return handler(request);
}

export const GET = handleRequest;
export const POST = handleRequest;

export type EdgeStoreRouter = typeof edgeStoreRouter;
