import { format } from "date-fns";
import { CONTACT_PHONE_DISPLAY } from "@/lib/contact";
import { formatLKR } from "@/lib/utils";
import { PAYMENT_METHOD_LABELS, PAYMENT_TYPE_LABELS } from "./paymentLabels";
import type { PaymentDetail } from "./paymentsTypes";

/**
 * Builds and downloads a one-page A5 receipt for a ledger entry, entirely in
 * the browser (jsPDF, already used for certificate exports) — no server
 * rendering, no storage. Refunds and reversals print as credit notes.
 */
export async function downloadReceiptPdf(payment: PaymentDetail) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a5" });
  const width = doc.internal.pageSize.getWidth();
  const margin = 14;
  const isCredit = payment.type === "REFUND" || payment.type === "REVERSAL";
  let y = 20;

  // Header band
  doc.setFillColor(25, 25, 25);
  doc.rect(0, 0, width, 30, "F");
  doc.setFillColor(233, 23, 23);
  doc.rect(0, 30, 28, 1.2, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text("Foundry Academy", margin, 14);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(isCredit ? "CREDIT NOTE" : "PAYMENT RECEIPT", margin, 21);
  doc.setFont("helvetica", "bold");
  doc.text(payment.receiptNumber, width - margin, 21, { align: "right" });

  y = 44;
  doc.setTextColor(113, 113, 122);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(isCredit ? "AMOUNT RETURNED" : "AMOUNT RECEIVED", margin, y);
  doc.setTextColor(25, 25, 25);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text(formatLKR(Math.abs(payment.amount)), margin, y + 10);

  const rows: [string, string][] = [
    ["Date", format(new Date(payment.paidAt), "MMMM d, yyyy")],
    ["Received from", payment.student?.name ?? "—"],
    ["Email", payment.student?.email ?? "—"],
    ["Course", payment.course.title],
    ["Intake", payment.intake.code],
    ["Payment", PAYMENT_TYPE_LABELS[payment.type]],
    ["Method", payment.method ? PAYMENT_METHOD_LABELS[payment.method] : "Not recorded"],
    ...(payment.discountAmount > 0 ? ([["Discount applied", formatLKR(payment.discountAmount)]] as [string, string][]) : []),
    ...(payment.externalReference ? ([["Reference", payment.externalReference]] as [string, string][]) : []),
    ...(payment.corrects ? ([["Corrects", payment.corrects.receiptNumber]] as [string, string][]) : []),
    ...(isCredit && payment.note ? ([["Reason", payment.note]] as [string, string][]) : []),
  ];

  y += 22;
  doc.setDrawColor(228, 228, 231);
  doc.line(margin, y, width - margin, y);
  y += 7;
  doc.setFontSize(9);
  for (const [label, value] of rows) {
    doc.setFont("helvetica", "normal");
    doc.setTextColor(113, 113, 122);
    doc.text(label, margin, y);
    doc.setTextColor(25, 25, 25);
    const lines = doc.splitTextToSize(value, width - margin * 2 - 38);
    doc.text(lines, margin + 38, y);
    y += 6 * lines.length;
  }

  y += 4;
  doc.line(margin, y, width - margin, y);
  doc.setFontSize(7.5);
  doc.setTextColor(113, 113, 122);
  doc.text(
    `Recorded by ${payment.recordedBy ?? "Foundry Academy"} on ${format(new Date(payment.recordedAt), "MMM d, yyyy")}. Questions? Call or WhatsApp ${CONTACT_PHONE_DISPLAY}.`,
    margin,
    y + 6,
    { maxWidth: width - margin * 2 },
  );

  doc.save(`${payment.receiptNumber}.pdf`);
}
