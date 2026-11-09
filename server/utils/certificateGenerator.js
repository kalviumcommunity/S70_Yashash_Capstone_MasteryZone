const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

const CERTIFICATES_DIR = process.env.CERTIFICATES_STORAGE_PATH || process.env.CERTIFICATES_DIR || path.join(__dirname, "../uploads/certificates");
if (!fs.existsSync(CERTIFICATES_DIR)) {
  fs.mkdirSync(CERTIFICATES_DIR, { recursive: true });
}

const CLEAN_TEMPLATE = path.join(__dirname, "../assets/certificate_clean_template.png");
const LEGACY_TEMPLATE = path.join(__dirname, "../assets/certificate_template.png");
const TEMPLATE_IMAGE_PATH = fs.existsSync(CLEAN_TEMPLATE) ? CLEAN_TEMPLATE : LEGACY_TEMPLATE;

/**
 * Generates an official, high-resolution vector PDF certificate based on the
 * clean Mastery Zone Certificate of Completion template.
 * Output size: 842 x 672 (1024 x 818 aspect ratio matching template)
 * Stores in user-scoped path server/uploads/certificates/{userId}/{certificateId}.pdf
 */
function generateCertificatePDF({
  certificateId,
  userId,
  recipientName,
  certificationTitle = "Data Structures & Algorithms (DSA)",
  issueDate = new Date(),
  mcqScore = 20,
  mcqPercentage = 100,
  codingScore = "2/2 Solved (100% Tests Passed)",
  verificationUrl = "",
}) {
  return new Promise((resolve, reject) => {
    try {
      const docWidth = 842;
      const docHeight = 672;

      const doc = new PDFDocument({
        size: [docWidth, docHeight],
        margin: 0,
        info: {
          Title: `${certificationTitle} - ${recipientName}`,
          Author: "Mastery Zone Academy of Computer Science",
          Subject: "Official Verified Certificate of Completion",
          Keywords: "Certificate, Mastery Zone, DSA, Verification, Credential",
        },
      });

      const fileName = `${certificateId}.pdf`;
      const flatFilePath = path.join(CERTIFICATES_DIR, fileName);

      // User-specific scoped path: uploads/certificates/{userId}/{certificateId}.pdf
      let userFilePath = null;
      if (userId) {
        const userDir = path.join(CERTIFICATES_DIR, String(userId));
        if (!fs.existsSync(userDir)) {
          fs.mkdirSync(userDir, { recursive: true });
        }
        userFilePath = path.join(userDir, fileName);
      }

      const writeStream = fs.createWriteStream(flatFilePath);
      const buffers = [];

      doc.on("data", (chunk) => buffers.push(chunk));
      doc.pipe(writeStream);

      writeStream.on("finish", () => {
        if (userFilePath) {
          try {
            fs.copyFileSync(flatFilePath, userFilePath);
          } catch (copyErr) {
            console.warn("User cert copy note:", copyErr.message);
          }
        }
        resolve({
          filePath: userFilePath || flatFilePath,
          flatFilePath,
          buffer: Buffer.concat(buffers),
        });
      });
      writeStream.on("error", reject);
      doc.on("error", reject);

      // High-Resolution Pure Vector Certificate Rendering (Zero Image Distortion / Zero Overlapping Text)
      doc.rect(0, 0, docWidth, docHeight).fill("#fdfbf7");

      // Outer Gold Double Border
      doc.lineWidth(5).strokeColor("#d4af37").rect(22, 22, docWidth - 44, docHeight - 44).stroke();
      doc.lineWidth(1.2).strokeColor("#1e3a8a").rect(30, 30, docWidth - 60, docHeight - 60).stroke();

      // Corner Accents
      const drawCorner = (x, y, flipX, flipY) => {
        doc.save();
        doc.lineWidth(1.5).strokeColor("#d4af37");
        doc.moveTo(x, y + (flipY ? -18 : 18)).lineTo(x, y).lineTo(x + (flipX ? -18 : 18), y).stroke();
        doc.circle(x + (flipX ? -8 : 8), y + (flipY ? -8 : 8), 2.5).fill("#d4af37");
        doc.restore();
      };
      drawCorner(34, 34, false, false);
      drawCorner(docWidth - 34, 34, true, false);
      drawCorner(34, docHeight - 34, false, true);
      drawCorner(docWidth - 34, docHeight - 34, true, true);

      // 1. Institution Header
      doc
        .font("Times-Bold")
        .fontSize(14)
        .fillColor("#0f172a")
        .text("MASTERY ZONE ACADEMY OF COMPUTER SCIENCE", 0, 75, {
          align: "center",
          characterSpacing: 2.2,
        });

      // 2. Main Title
      doc
        .font("Times-Bold")
        .fontSize(28)
        .fillColor("#1e3a8a")
        .text("CERTIFICATE OF COMPLETION", 0, 112, {
          align: "center",
          characterSpacing: 2,
        });

      // Decorative divider
      doc.lineWidth(1).strokeColor("#d4af37").moveTo(320, 155).lineTo(522, 155).stroke();
      doc.circle(421, 155, 3).fill("#d4af37");

      // 3. Sub-heading
      doc
        .font("Helvetica")
        .fontSize(11)
        .fillColor("#64748b")
        .text("THIS IS PROUDLY PRESENTED TO", 0, 178, {
          align: "center",
          characterSpacing: 1.5,
        });

      // 4. Recipient Name
      const nameLen = (recipientName || "").length;
      const nameSize = nameLen > 25 ? 26 : nameLen > 18 ? 30 : 34;
      doc
        .font("Times-BoldItalic")
        .fontSize(nameSize)
        .fillColor("#0f172a")
        .text(recipientName || "Candidate Name", 0, 215, {
          align: "center",
        });

      // Underline
      doc.lineWidth(1.2).strokeColor("#d4af37").moveTo(240, 260).lineTo(602, 260).stroke();

      // 5. Achievement Description
      doc
        .font("Helvetica")
        .fontSize(11)
        .fillColor("#64748b")
        .text("FOR SUCCESSFULLY PASSING THE PROCTORED COMPREHENSIVE EXAMINATION IN", 0, 280, {
          align: "center",
          characterSpacing: 1,
        });

      // 6. Course Title
      const courseTitle = (certificationTitle || "Data Structures & Algorithms (DSA)").toUpperCase();
      doc
        .font("Helvetica-Bold")
        .fontSize(19)
        .fillColor("#1e3a8a")
        .text(courseTitle, 0, 312, {
          align: "center",
          characterSpacing: 1.2,
        });

      // 7. Date of Issuance (Bottom Left)
      const formattedDate =
        issueDate instanceof Date
          ? issueDate.toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })
          : String(issueDate);

      doc
        .font("Times-Roman")
        .fontSize(14)
        .fillColor("#0f172a")
        .text(formattedDate, 100, 485, { width: 180, align: "center" });
      doc.lineWidth(0.8).strokeColor("#cbd5e1").moveTo(100, 505).lineTo(280, 505).stroke();
      doc
        .font("Helvetica-Bold")
        .fontSize(8.5)
        .fillColor("#64748b")
        .text("DATE OF ISSUANCE", 100, 512, { width: 180, align: "center", characterSpacing: 1 });

      // 8. Official Central Seal
      doc.circle(421, 500, 38).fillAndStroke("#fef08a", "#d4af37");
      doc.circle(421, 500, 34).lineWidth(1).stroke("#926619");
      doc
        .font("Helvetica-Bold")
        .fontSize(8)
        .fillColor("#78350f")
        .text("MASTERY ZONE", 371, 488, { width: 100, align: "center" });
      doc
        .font("Helvetica-Bold")
        .fontSize(7)
        .fillColor("#0f172a")
        .text("★ VERIFIED ★", 371, 499, { width: 100, align: "center" });
      doc
        .font("Helvetica")
        .fontSize(6)
        .fillColor("#78350f")
        .text("ACADEMY", 371, 509, { width: 100, align: "center" });

      // 9. Signature (Bottom Right)
      doc
        .font("Times-BoldItalic")
        .fontSize(18)
        .fillColor("#0f172a")
        .text("Yashash", 562, 483, { width: 180, align: "center" });
      doc.lineWidth(0.8).strokeColor("#cbd5e1").moveTo(562, 505).lineTo(742, 505).stroke();
      doc
        .font("Helvetica-Bold")
        .fontSize(8.5)
        .fillColor("#64748b")
        .text("FOUNDER & DIRECTOR", 562, 512, { width: 180, align: "center", characterSpacing: 1 });

      // 10. Security & Credential Footer
      const vUrl = verificationUrl || `https://masteryzone.com/verify/${certificateId}`;
      doc
        .font("Courier-Bold")
        .fontSize(8)
        .fillColor("#64748b")
        .text(
          `Credential ID: ${certificateId} • Verified Academic Record • Authenticate at: ${vUrl}`,
          0,
          632,
          { align: "center" }
        );

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = {
  generateCertificatePDF,
  CERTIFICATES_DIR,
};
