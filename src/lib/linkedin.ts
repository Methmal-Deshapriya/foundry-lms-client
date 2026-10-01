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
  const issued = new Date(issuedDate);
  const params = new URLSearchParams({
    startTask: "CERTIFICATION_NAME",
    name: courseName,
    organizationName: "Foundry Academy",
    issueYear: String(issued.getFullYear()),
    issueMonth: String(issued.getMonth() + 1),
    certId: certificateCode,
    certUrl: verifyUrl,
  });
  return `https://www.linkedin.com/profile/add?${params.toString()}`;
}
