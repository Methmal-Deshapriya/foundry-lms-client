import { colomboYearMonth } from "./dates";

/**
 * LinkedIn's "Add licence or certification" form, pre-filled — just a link,
 * so there's no API, no app review and no cost. The student lands on their
 * own LinkedIn profile with the certificate details filled in.
 */
export function getLinkedInAddCertificationUrl({
  courseName,
  issuedDate,
  certificateCode,
  verifyUrl,
}: {
  courseName: string;
  issuedDate: string;
  certificateCode: string;
  verifyUrl: string;
}) {
  // The Sri Lanka calendar, the same as the certificate (code review M08-12).
  const issued = colomboYearMonth(issuedDate);
  const params = new URLSearchParams({
    startTask: "CERTIFICATION_NAME",
    name: courseName,
    organizationName: "Foundry Academy",
    issueYear: String(issued.year),
    issueMonth: String(issued.month),
    certId: certificateCode,
    certUrl: verifyUrl,
  });
  return `https://www.linkedin.com/profile/add?${params.toString()}`;
}
