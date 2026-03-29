import { cookies, headers } from "next/headers";
import {
  OWNER_COOKIE_NAME,
  OWNER_HEADER_NAME,
  generateOwnerId,
  normalizeOwnerId,
  resolveOwnerIdForSeason,
} from "@/lib/ownership";

export async function getRequestOwnerId() {
  const requestHeaders = await headers();
  const headerOwnerId = resolveOwnerIdForSeason(normalizeOwnerId(requestHeaders.get(OWNER_HEADER_NAME)));

  if (headerOwnerId) {
    return headerOwnerId;
  }

  const cookieStore = await cookies();
  const cookieOwnerId = resolveOwnerIdForSeason(normalizeOwnerId(cookieStore.get(OWNER_COOKIE_NAME)?.value));

  if (cookieOwnerId) {
    return cookieOwnerId;
  }

  return generateOwnerId();
}
