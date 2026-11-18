import { after } from "next/server";
import prisma from "@/lib/db";
import { logError } from "@/lib/safe-log";

const MAILBOX = "info@urlaub-gosch.de";
const GRAPH = "https://graph.microsoft.com";
const UUID = /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;

// This transport takes no inquiry, recipient, subject or reply-to from the caller.
export async function sendInquiryAlert({ tenantId, clientId, clientSecret, mailboxId = MAILBOX }, fetcher = fetch) {
  const tokenResponse = await fetcher(
    `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
    {
      method: "POST",
      redirect: "error",
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: clientId,
        client_secret: clientSecret,
        scope: `${GRAPH}/.default`,
      }),
      signal: AbortSignal.timeout(5000),
    }
  );

  if (!tokenResponse.ok) {
    console.error("Inquiry alert: Microsoft token HTTP status", tokenResponse.status);
    return false;
  }

  const { access_token: token } = await tokenResponse.json();
  if (typeof token !== "string" || !token) return false;

  const response = await fetcher(`${GRAPH}/v1.0/users/${encodeURIComponent(mailboxId)}/sendMail`, {
    method: "POST",
    redirect: "error",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      message: {
        subject: "Neue Anfrage bei Urlaub-GOSCH",
        body: {
          contentType: "Text",
          content: "Eine neue Anfrage ist eingegangen. Bitte öffnen Sie im Adminbereich den Menüpunkt „Anfragen“.",
        },
        toRecipients: [{ emailAddress: { address: MAILBOX } }],
      },
      saveToSentItems: false,
    }),
    signal: AbortSignal.timeout(5000),
  });

  if (response.status === 202) return true;
  console.error("Inquiry alert: Microsoft sendMail HTTP status", response.status);
  return false;
}

export function scheduleInquiryAlert() {
  if (process.env.INQUIRY_ALERT_MAIL_ENABLED !== "true") return;
  const tenantId = process.env.MS365_ALERT_TENANT_ID?.trim() || "";
  const clientId = process.env.MS365_ALERT_CLIENT_ID?.trim() || "";
  const clientSecret = process.env.MS365_ALERT_CLIENT_SECRET;
  const mailboxId = process.env.MS365_ALERT_MAILBOX_ID?.trim() || undefined;
  if (!UUID.test(tenantId) || !UUID.test(clientId) || !clientSecret || (mailboxId && !UUID.test(mailboxId))) {
    console.error("Inquiry alert: Microsoft configuration missing or invalid");
    return;
  }

  try {
    after(async () => {
      try {
        // Share the cooldown across instances and both inquiry forms.
        const claimed = await prisma.$queryRaw`
          INSERT INTO "InquiryMailThrottle" ("id", "lastAttemptAt") VALUES (1, NOW())
          ON CONFLICT ("id") DO UPDATE SET "lastAttemptAt" = EXCLUDED."lastAttemptAt"
          WHERE "InquiryMailThrottle"."lastAttemptAt" <= NOW() - INTERVAL '2 minutes'
          RETURNING "id"
        `;
        if (claimed.length) await sendInquiryAlert({ tenantId, clientId, clientSecret, mailboxId });
      } catch (error) {
        logError("Inquiry alert failed", error);
      }
    });
  } catch (error) {
    logError("Inquiry alert could not be scheduled", error);
  }
}
